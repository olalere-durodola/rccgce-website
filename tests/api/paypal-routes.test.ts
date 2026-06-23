import { describe, it, expect, vi, beforeEach } from "vitest";

// --- mock the paypal lib ---
const createOrder = vi.fn();
const captureOrder = vi.fn();
const createSubscription = vi.fn();
vi.mock("@/lib/paypal", () => ({
  createOrder: (...a: unknown[]) => createOrder(...a),
  captureOrder: (...a: unknown[]) => captureOrder(...a),
  createSubscription: (...a: unknown[]) => createSubscription(...a),
  parseFundFromCustomId: (v: string) =>
    v?.startsWith("fund:") ? v.slice(5) : v,
}));

// --- mock prisma ---
const donationUpsert = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    donation: { upsert: (...a: unknown[]) => donationUpsert(...a) },
  },
}));

// --- mock auth (guest by default) ---
const authFn = vi.fn(async () => null);
vi.mock("@/lib/auth", () => ({ auth: (...a: unknown[]) => authFn(...a) }));

import { POST as createOrderPOST } from "@/app/api/paypal/create-order/route";
import { POST as captureOrderPOST } from "@/app/api/paypal/capture-order/route";
import { POST as createSubscriptionPOST } from "@/app/api/paypal/create-subscription/route";

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  createOrder.mockReset();
  captureOrder.mockReset();
  createSubscription.mockReset();
  donationUpsert.mockReset();
  authFn.mockReset();
  authFn.mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
// create-order
// ---------------------------------------------------------------------------

describe("POST /api/paypal/create-order", () => {
  it("rejects an amount <= 0 with 400 and does not call PayPal", async () => {
    const res = await createOrderPOST(
      jsonRequest("http://localhost/api/paypal/create-order", {
        amount: 0,
        fund: "Tithe",
      }),
    );
    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("rejects a bad fund with 400", async () => {
    const res = await createOrderPOST(
      jsonRequest("http://localhost/api/paypal/create-order", {
        amount: 10,
        fund: "Yacht",
      }),
    );
    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("creates an order for a valid body and returns the id", async () => {
    createOrder.mockResolvedValue({ id: "ORDER1", status: "CREATED" });
    const res = await createOrderPOST(
      jsonRequest("http://localhost/api/paypal/create-order", {
        amount: 50,
        fund: "Offering",
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ id: "ORDER1" });
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 50, fund: "Offering", currency: "USD" }),
    );
  });
});

// ---------------------------------------------------------------------------
// capture-order
// ---------------------------------------------------------------------------

describe("POST /api/paypal/capture-order", () => {
  it("records a Donation via upsert on COMPLETED", async () => {
    captureOrder.mockResolvedValue({
      id: "ORDER1",
      status: "COMPLETED",
      purchase_units: [
        {
          custom_id: "fund:Building",
          payments: {
            captures: [
              { amount: { value: "100.00", currency_code: "USD" } },
            ],
          },
        },
      ],
    });
    donationUpsert.mockResolvedValue({
      id: "d1",
      paypalOrderId: "ORDER1",
      amount: 100,
      fund: "Building",
      status: "COMPLETED",
    });

    const res = await captureOrderPOST(
      jsonRequest("http://localhost/api/paypal/capture-order", {
        orderId: "ORDER1",
        fund: "Building",
        amount: 100,
      }),
    );

    expect(res.status).toBe(200);
    expect(donationUpsert).toHaveBeenCalledTimes(1);
    const arg = donationUpsert.mock.calls[0][0] as {
      where: { paypalOrderId: string };
      create: Record<string, unknown>;
    };
    expect(arg.where).toEqual({ paypalOrderId: "ORDER1" });
    expect(arg.create).toMatchObject({
      paypalOrderId: "ORDER1",
      amount: 10000,
      fund: "Building",
      status: "COMPLETED",
    });
  });

  it("is idempotent: re-capturing the same order upserts by unique key (no duplicate)", async () => {
    captureOrder.mockResolvedValue({
      id: "ORDER1",
      status: "COMPLETED",
      purchase_units: [
        {
          custom_id: "fund:Tithe",
          payments: {
            captures: [{ amount: { value: "20.00", currency_code: "USD" } }],
          },
        },
      ],
    });
    donationUpsert.mockResolvedValue({ id: "d1", paypalOrderId: "ORDER1" });

    await captureOrderPOST(
      jsonRequest("http://localhost/api/paypal/capture-order", {
        orderId: "ORDER1",
      }),
    );
    await captureOrderPOST(
      jsonRequest("http://localhost/api/paypal/capture-order", {
        orderId: "ORDER1",
      }),
    );

    // Both calls use upsert keyed on the unique paypalOrderId -> one row.
    expect(donationUpsert).toHaveBeenCalledTimes(2);
    for (const call of donationUpsert.mock.calls) {
      expect((call[0] as { where: unknown }).where).toEqual({
        paypalOrderId: "ORDER1",
      });
    }
  });

  it("does not record a Donation when capture is not COMPLETED", async () => {
    captureOrder.mockResolvedValue({ id: "ORDER1", status: "DECLINED" });
    const res = await captureOrderPOST(
      jsonRequest("http://localhost/api/paypal/capture-order", {
        orderId: "ORDER1",
      }),
    );
    expect(donationUpsert).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("attaches userId from the session when present", async () => {
    authFn.mockResolvedValue({ user: { id: "u1" } });
    captureOrder.mockResolvedValue({
      id: "ORDER2",
      status: "COMPLETED",
      purchase_units: [
        {
          custom_id: "fund:Missions",
          payments: {
            captures: [{ amount: { value: "75.00", currency_code: "USD" } }],
          },
        },
      ],
    });
    donationUpsert.mockResolvedValue({ id: "d2" });

    await captureOrderPOST(
      jsonRequest("http://localhost/api/paypal/capture-order", {
        orderId: "ORDER2",
      }),
    );
    const arg = donationUpsert.mock.calls[0][0] as {
      create: { userId: string | null };
    };
    expect(arg.create.userId).toBe("u1");
  });
});

// ---------------------------------------------------------------------------
// create-subscription
// ---------------------------------------------------------------------------

describe("POST /api/paypal/create-subscription", () => {
  it("rejects a non-preset amount with 400", async () => {
    const res = await createSubscriptionPOST(
      jsonRequest("http://localhost/api/paypal/create-subscription", {
        planName: "Monthly Tithe",
        amount: 37,
        fund: "Tithe",
      }),
    );
    expect(res.status).toBe(400);
    expect(createSubscription).not.toHaveBeenCalled();
  });

  it("rejects a bad fund with 400", async () => {
    const res = await createSubscriptionPOST(
      jsonRequest("http://localhost/api/paypal/create-subscription", {
        planName: "Monthly",
        amount: 50,
        fund: "Yacht",
      }),
    );
    expect(res.status).toBe(400);
    expect(createSubscription).not.toHaveBeenCalled();
  });

  it("creates a subscription for a valid preset amount and returns the id", async () => {
    vi.stubEnv("PAYPAL_PLAN_TITHE_50", "P-TITHE-50");
    createSubscription.mockResolvedValue({
      id: "SUB1",
      status: "APPROVAL_PENDING",
    });
    const res = await createSubscriptionPOST(
      jsonRequest("http://localhost/api/paypal/create-subscription", {
        planName: "Monthly Tithe",
        amount: 50,
        fund: "Tithe",
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ id: "SUB1" });
    expect(createSubscription).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });
});
