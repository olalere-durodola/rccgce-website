import { describe, it, expect, vi, beforeEach } from "vitest";

// --- mock paypal lib: real mapWebhookEvent, mocked verifyWebhookSignature ---
const verifyWebhookSignature = vi.fn();
vi.mock("@/lib/paypal", async () => {
  const actual = await vi.importActual<typeof import("@/lib/paypal")>(
    "@/lib/paypal",
  );
  return {
    ...actual,
    verifyWebhookSignature: (...a: unknown[]) => verifyWebhookSignature(...a),
  };
});

// --- mock prisma ---
const donationUpsert = vi.fn();
const subscriptionUpsert = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    donation: { upsert: (...a: unknown[]) => donationUpsert(...a) },
    subscription: { upsert: (...a: unknown[]) => subscriptionUpsert(...a) },
  },
}));

import { POST } from "@/app/api/paypal/webhook/route";
import { encodeFundCustomId } from "@/lib/paypal";

function webhookRequest(event: unknown): Request {
  return new Request("http://localhost/api/paypal/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "paypal-transmission-id": "tid",
      "paypal-transmission-time": "ttime",
      "paypal-cert-url": "curl",
      "paypal-auth-algo": "algo",
      "paypal-transmission-sig": "sig",
    },
    body: JSON.stringify(event),
  });
}

const captureEvent = {
  event_type: "PAYMENT.CAPTURE.COMPLETED",
  resource: {
    id: "CAP1",
    custom_id: encodeFundCustomId("Building"),
    amount: { value: "150.00", currency_code: "USD" },
    supplementary_data: { related_ids: { order_id: "ORDER1" } },
  },
};

beforeEach(() => {
  verifyWebhookSignature.mockReset();
  donationUpsert.mockReset();
  subscriptionUpsert.mockReset();
  donationUpsert.mockResolvedValue({ id: "d1" });
  subscriptionUpsert.mockResolvedValue({ id: "s1" });
});

describe("POST /api/paypal/webhook", () => {
  it("returns 401 on a bad signature without writing to the DB", async () => {
    verifyWebhookSignature.mockResolvedValue(false);
    const res = await POST(webhookRequest(captureEvent));
    expect(res.status).toBe(401);
    expect(donationUpsert).not.toHaveBeenCalled();
  });

  it("creates exactly one Donation for a valid CAPTURE.COMPLETED", async () => {
    verifyWebhookSignature.mockResolvedValue(true);
    const res = await POST(webhookRequest(captureEvent));
    expect(res.status).toBe(200);
    expect(donationUpsert).toHaveBeenCalledTimes(1);
    const arg = donationUpsert.mock.calls[0][0] as {
      where: { paypalOrderId: string };
      create: Record<string, unknown>;
    };
    expect(arg.where).toEqual({ paypalOrderId: "ORDER1" });
    expect(arg.create).toMatchObject({
      paypalOrderId: "ORDER1",
      amount: 15000,
      currency: "USD",
      fund: "Building",
      status: "COMPLETED",
    });
  });

  it("does not duplicate on re-delivery of the same order (upsert by unique key)", async () => {
    verifyWebhookSignature.mockResolvedValue(true);
    await POST(webhookRequest(captureEvent));
    await POST(webhookRequest(captureEvent));
    expect(donationUpsert).toHaveBeenCalledTimes(2);
    for (const call of donationUpsert.mock.calls) {
      expect((call[0] as { where: unknown }).where).toEqual({
        paypalOrderId: "ORDER1",
      });
    }
  });

  it("upserts a Subscription for a BILLING.SUBSCRIPTION.* event", async () => {
    verifyWebhookSignature.mockResolvedValue(true);
    const res = await POST(
      webhookRequest({
        event_type: "BILLING.SUBSCRIPTION.CANCELLED",
        resource: { id: "SUB1", status: "CANCELLED" },
      }),
    );
    expect(res.status).toBe(200);
    expect(subscriptionUpsert).toHaveBeenCalledTimes(1);
    const arg = subscriptionUpsert.mock.calls[0][0] as {
      where: { paypalSubscriptionId: string };
      update: Record<string, unknown>;
    };
    expect(arg.where).toEqual({ paypalSubscriptionId: "SUB1" });
    expect(arg.update).toMatchObject({ status: "CANCELLED" });
  });

  it("returns 200 and writes nothing for an unknown event type", async () => {
    verifyWebhookSignature.mockResolvedValue(true);
    const res = await POST(
      webhookRequest({ event_type: "SOMETHING.ELSE", resource: {} }),
    );
    expect(res.status).toBe(200);
    expect(donationUpsert).not.toHaveBeenCalled();
    expect(subscriptionUpsert).not.toHaveBeenCalled();
  });
});
