import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getAccessToken,
  createOrder,
  captureOrder,
  createSubscription,
  verifyWebhookSignature,
  mapWebhookEvent,
  encodeFundCustomId,
  parseFundFromCustomId,
  toMoneyString,
} from "@/lib/paypal";

// A small helper to build a mock fetch Response-like object.
function mockResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

beforeEach(() => {
  vi.stubEnv("PAYPAL_CLIENT_ID", "test-client-id");
  vi.stubEnv("PAYPAL_CLIENT_SECRET", "test-secret");
  vi.stubEnv("PAYPAL_WEBHOOK_ID", "test-webhook-id");
  vi.stubEnv("PAYPAL_API_BASE", "https://api-m.sandbox.paypal.com");
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe("toMoneyString", () => {
  it("formats numbers as 2-decimal strings", () => {
    expect(toMoneyString(25)).toBe("25.00");
    expect(toMoneyString(9.5)).toBe("9.50");
    expect(toMoneyString(100.999)).toBe("101.00");
  });
});

describe("fund custom_id encoding", () => {
  it("round-trips a fund through custom_id", () => {
    const id = encodeFundCustomId("Missions");
    expect(parseFundFromCustomId(id)).toBe("Missions");
  });

  it("parses a bare fund value", () => {
    expect(parseFundFromCustomId("Tithe")).toBe("Tithe");
  });

  it("returns null for an unknown / missing fund", () => {
    expect(parseFundFromCustomId("Nonsense")).toBeNull();
    expect(parseFundFromCustomId(undefined)).toBeNull();
    expect(parseFundFromCustomId("")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mapWebhookEvent (pure, no network)
// ---------------------------------------------------------------------------

describe("mapWebhookEvent", () => {
  it("maps PAYMENT.CAPTURE.COMPLETED to a donation payload", () => {
    const event = {
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        id: "CAPTURE123",
        custom_id: encodeFundCustomId("Building"),
        amount: { value: "150.00", currency_code: "USD" },
        supplementary_data: {
          related_ids: { order_id: "ORDER123" },
        },
      },
    };

    expect(mapWebhookEvent(event)).toEqual({
      kind: "donation",
      paypalOrderId: "ORDER123",
      amount: 150,
      currency: "USD",
      fund: "Building",
      status: "COMPLETED",
    });
  });

  it("falls back to the capture id when no order id is present", () => {
    const event = {
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        id: "CAPTURE999",
        custom_id: "Tithe",
        amount: { value: "10.00", currency_code: "USD" },
      },
    };
    const mapped = mapWebhookEvent(event);
    expect(mapped).toMatchObject({
      kind: "donation",
      paypalOrderId: "CAPTURE999",
      fund: "Tithe",
    });
  });

  it("maps BILLING.SUBSCRIPTION.ACTIVATED to a subscription payload", () => {
    const event = {
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: {
        id: "SUB123",
        status: "ACTIVE",
      },
    };
    expect(mapWebhookEvent(event)).toMatchObject({
      kind: "subscription",
      paypalSubscriptionId: "SUB123",
      status: "ACTIVE",
    });
  });

  it("maps BILLING.SUBSCRIPTION.CANCELLED to a subscription payload", () => {
    const event = {
      event_type: "BILLING.SUBSCRIPTION.CANCELLED",
      resource: { id: "SUB456", status: "CANCELLED" },
    };
    expect(mapWebhookEvent(event)).toMatchObject({
      kind: "subscription",
      paypalSubscriptionId: "SUB456",
      status: "CANCELLED",
    });
  });

  it("returns null for an unknown event type", () => {
    expect(
      mapWebhookEvent({ event_type: "SOMETHING.ELSE", resource: {} }),
    ).toBeNull();
    expect(mapWebhookEvent(null)).toBeNull();
    expect(mapWebhookEvent({})).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getAccessToken
// ---------------------------------------------------------------------------

describe("getAccessToken", () => {
  it("sends a Basic auth header and client_credentials grant", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(mockResponse({ access_token: "TOKEN" }));

    const token = await getAccessToken();
    expect(token).toBe("TOKEN");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api-m.sandbox.paypal.com/v1/oauth2/token");
    const headers = init.headers as Record<string, string>;
    const expected =
      "Basic " +
      Buffer.from("test-client-id:test-secret").toString("base64");
    expect(headers.Authorization).toBe(expected);
    expect(String(init.body)).toContain("grant_type=client_credentials");
  });

  it("throws when PayPal returns a non-ok response", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(mockResponse({ error: "nope" }, false, 401));
    await expect(getAccessToken()).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// createOrder / captureOrder
// ---------------------------------------------------------------------------

describe("createOrder", () => {
  it("posts a CAPTURE order with a 2-decimal amount and fund custom_id", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(mockResponse({ access_token: "TOKEN" }))
      .mockResolvedValueOnce(
        mockResponse({ id: "ORDER1", status: "CREATED" }),
      );

    const result = await createOrder({
      amount: 50,
      currency: "USD",
      fund: "Offering",
    });
    expect(result).toEqual({ id: "ORDER1", status: "CREATED" });

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
    );
    const body = JSON.parse(String(init.body));
    expect(body.intent).toBe("CAPTURE");
    const unit = body.purchase_units[0];
    expect(unit.amount.value).toBe("50.00");
    expect(unit.amount.currency_code).toBe("USD");
    expect(parseFundFromCustomId(unit.custom_id)).toBe("Offering");
  });
});

describe("captureOrder", () => {
  it("posts to the capture endpoint and returns the result", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(mockResponse({ access_token: "TOKEN" }))
      .mockResolvedValueOnce(
        mockResponse({ id: "ORDER1", status: "COMPLETED" }),
      );

    const result = await captureOrder("ORDER1");
    expect(result.status).toBe("COMPLETED");
    const [url] = fetchMock.mock.calls[1];
    expect(url).toBe(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders/ORDER1/capture",
    );
  });
});

// ---------------------------------------------------------------------------
// createSubscription
// ---------------------------------------------------------------------------

describe("createSubscription", () => {
  it("posts to the billing subscriptions endpoint with the plan id", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(mockResponse({ access_token: "TOKEN" }))
      .mockResolvedValueOnce(
        mockResponse({ id: "SUB1", status: "APPROVAL_PENDING" }),
      );

    const result = await createSubscription({
      planId: "P-123",
      amount: 50,
      fund: "Tithe",
    });
    expect(result).toEqual({ id: "SUB1", status: "APPROVAL_PENDING" });

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(
      "https://api-m.sandbox.paypal.com/v1/billing/subscriptions",
    );
    const body = JSON.parse(String(init.body));
    expect(body.plan_id).toBe("P-123");
  });
});

// ---------------------------------------------------------------------------
// verifyWebhookSignature
// ---------------------------------------------------------------------------

describe("verifyWebhookSignature", () => {
  const headers = {
    "paypal-transmission-id": "tid",
    "paypal-transmission-time": "ttime",
    "paypal-cert-url": "curl",
    "paypal-auth-algo": "algo",
    "paypal-transmission-sig": "sig",
  };

  it("returns true when verification_status is SUCCESS", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(mockResponse({ access_token: "TOKEN" }))
      .mockResolvedValueOnce(
        mockResponse({ verification_status: "SUCCESS" }),
      );

    const ok = await verifyWebhookSignature(headers, '{"event_type":"x"}');
    expect(ok).toBe(true);

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(
      "https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature",
    );
    const body = JSON.parse(String(init.body));
    expect(body.webhook_id).toBe("test-webhook-id");
    expect(body.transmission_id).toBe("tid");
    expect(body.transmission_sig).toBe("sig");
    expect(body.webhook_event).toEqual({ event_type: "x" });
  });

  it("returns false when verification_status is not SUCCESS", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(mockResponse({ access_token: "TOKEN" }))
      .mockResolvedValueOnce(
        mockResponse({ verification_status: "FAILURE" }),
      );

    const ok = await verifyWebhookSignature(headers, '{"event_type":"x"}');
    expect(ok).toBe(false);
  });

  it("reads headers case-insensitively", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(mockResponse({ access_token: "TOKEN" }))
      .mockResolvedValueOnce(
        mockResponse({ verification_status: "SUCCESS" }),
      );

    const upper = {
      "PayPal-Transmission-Id": "tid",
      "PayPal-Transmission-Time": "ttime",
      "PayPal-Cert-Url": "curl",
      "PayPal-Auth-Algo": "algo",
      "PayPal-Transmission-Sig": "sig",
    };
    const ok = await verifyWebhookSignature(upper, '{"a":1}');
    expect(ok).toBe(true);
  });
});
