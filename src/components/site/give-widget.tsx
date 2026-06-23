"use client";

import * as React from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
} from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FUNDS, type Fund } from "@/lib/validation";
import {
  ONE_TIME_PRESETS,
  RECURRING_AMOUNTS,
} from "@/lib/giving-config";

type Mode = "once" | "monthly";
type Status =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

/**
 * GiveWidget — accessible one-time / recurring giving with PayPal.
 *
 * Renders a fund selector, a once/monthly toggle, amount presets + custom input
 * (one-time only), and the PayPal buttons wired to our API routes. When the
 * public client id is missing/blank it shows a branded fallback so the page
 * still builds and renders without real PayPal keys.
 */
export function GiveWidget() {
  const [fund, setFund] = React.useState<Fund>("Tithe");
  const [mode, setMode] = React.useState<Mode>("once");
  const [amount, setAmount] = React.useState<number>(50);
  const [customAmount, setCustomAmount] = React.useState<string>("");
  const [status, setStatus] = React.useState<Status>({ kind: "idle" });

  // The effective one-time amount: custom input wins when it is a valid number.
  const customNum = Number(customAmount);
  const oneTimeAmount =
    customAmount.trim() !== "" && customNum > 0 ? customNum : amount;

  if (!CLIENT_ID) {
    return <ConfiguringFallback />;
  }

  return (
    <div className="rounded-2xl border border-gold/30 bg-white/70 p-6 shadow-sm shadow-navy/5 sm:p-8">
      {/* Fund selector */}
      <fieldset className="border-0 p-0">
        <legend className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep">
          Choose a fund
        </legend>
        <div
          role="radiogroup"
          aria-label="Giving fund"
          className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {FUNDS.map((f) => (
            <SegmentButton
              key={f}
              selected={fund === f}
              onClick={() => setFund(f)}
              role="radio"
              ariaChecked={fund === f}
            >
              {f}
            </SegmentButton>
          ))}
        </div>
      </fieldset>

      {/* Mode toggle */}
      <fieldset className="mt-6 border-0 p-0">
        <legend className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep">
          Frequency
        </legend>
        <div
          role="radiogroup"
          aria-label="Giving frequency"
          className="mt-3 grid grid-cols-2 gap-2"
        >
          <SegmentButton
            selected={mode === "once"}
            onClick={() => {
              setMode("once");
              setStatus({ kind: "idle" });
            }}
            role="radio"
            ariaChecked={mode === "once"}
          >
            One-time
          </SegmentButton>
          <SegmentButton
            selected={mode === "monthly"}
            onClick={() => {
              setMode("monthly");
              setAmount(RECURRING_AMOUNTS[1]);
              setCustomAmount("");
              setStatus({ kind: "idle" });
            }}
            role="radio"
            ariaChecked={mode === "monthly"}
          >
            Monthly
          </SegmentButton>
        </div>
      </fieldset>

      {/* Amount */}
      <fieldset className="mt-6 border-0 p-0">
        <legend className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep">
          {mode === "monthly" ? "Monthly amount" : "Amount"}
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(mode === "monthly" ? RECURRING_AMOUNTS : ONE_TIME_PRESETS).map(
            (preset) => (
              <SegmentButton
                key={preset}
                selected={
                  amount === preset &&
                  (mode === "monthly" || customAmount.trim() === "")
                }
                onClick={() => {
                  setAmount(preset);
                  setCustomAmount("");
                }}
                role="radio"
                ariaChecked={
                  amount === preset &&
                  (mode === "monthly" || customAmount.trim() === "")
                }
              >
                ${preset}
              </SegmentButton>
            ),
          )}
        </div>

        {mode === "once" ? (
          <div className="mt-4">
            <Label htmlFor="custom-amount">Or enter a custom amount</Label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/60"
              >
                $
              </span>
              <Input
                id="custom-amount"
                inputMode="decimal"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="pl-7"
                aria-describedby="amount-help"
              />
            </div>
            <p id="amount-help" className="mt-1.5 text-xs text-ink/60">
              Give any amount you feel led to give.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-ink/60">
            Monthly gifts use the preset amounts above.
          </p>
        )}
      </fieldset>

      {/* PayPal */}
      <div className="mt-7">
        <PayPalScriptProvider
          options={{
            clientId: CLIENT_ID,
            currency: "USD",
            intent: mode === "monthly" ? "subscription" : "capture",
            vault: mode === "monthly",
            // Re-render the SDK when switching between one-time and recurring.
            components: "buttons",
          }}
        >
          {mode === "once" ? (
            <OneTimeButtons
              key={`once-${fund}-${oneTimeAmount}`}
              fund={fund}
              amount={oneTimeAmount}
              onStatus={setStatus}
            />
          ) : (
            <RecurringButtons
              key={`monthly-${fund}-${amount}`}
              fund={fund}
              amount={amount}
              onStatus={setStatus}
            />
          )}
        </PayPalScriptProvider>
      </div>

      {/* Live region for outcomes */}
      <StatusMessage status={status} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// PayPal button wrappers
// ---------------------------------------------------------------------------

function OneTimeButtons({
  fund,
  amount,
  onStatus,
}: {
  fund: Fund;
  amount: number;
  onStatus: (s: Status) => void;
}) {
  return (
    <PayPalButtons
      style={{ layout: "vertical", color: "gold", shape: "pill", label: "donate" }}
      disabled={!(amount > 0)}
      forceReRender={[fund, amount]}
      createOrder={async () => {
        const res = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ amount, fund, currency: "USD" }),
        });
        if (!res.ok) throw new Error("create-order failed");
        const data = (await res.json()) as { id: string };
        return data.id;
      }}
      onApprove={async (data) => {
        const res = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderId: data.orderID, fund, amount }),
        });
        if (!res.ok) {
          onStatus({
            kind: "error",
            message: "We couldn't confirm your gift. Please contact us.",
          });
          return;
        }
        onStatus({
          kind: "success",
          message: `Thank you for your ${fund.toLowerCase()} gift of $${amount.toFixed(
            2,
          )}.`,
        });
      }}
      onCancel={() => onStatus({ kind: "cancelled" })}
      onError={() =>
        onStatus({
          kind: "error",
          message: "Something went wrong with PayPal. Please try again.",
        })
      }
    />
  );
}

function RecurringButtons({
  fund,
  amount,
  onStatus,
}: {
  fund: Fund;
  amount: number;
  onStatus: (s: Status) => void;
}) {
  return (
    <PayPalButtons
      style={{ layout: "vertical", color: "gold", shape: "pill", label: "subscribe" }}
      forceReRender={[fund, amount]}
      createSubscription={async () => {
        const res = await fetch("/api/paypal/create-subscription", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            planName: `Monthly ${fund} — $${amount}`,
            amount,
            fund,
          }),
        });
        if (!res.ok) {
          onStatus({
            kind: "error",
            message:
              "Recurring giving is being configured. Please try a one-time gift.",
          });
          throw new Error("create-subscription failed");
        }
        const result = (await res.json()) as { id: string };
        return result.id;
      }}
      onApprove={async () => {
        onStatus({
          kind: "success",
          message: `Thank you for setting up a monthly ${fund.toLowerCase()} gift of $${amount.toFixed(
            2,
          )}.`,
        });
      }}
      onCancel={() => onStatus({ kind: "cancelled" })}
      onError={() =>
        onStatus({
          kind: "error",
          message: "Something went wrong with PayPal. Please try again.",
        })
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Presentational bits
// ---------------------------------------------------------------------------

function SegmentButton({
  selected,
  onClick,
  children,
  role,
  ariaChecked,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  role?: string;
  ariaChecked?: boolean;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={ariaChecked}
      onClick={onClick}
      className={cn(
        "h-11 rounded-full border px-3 font-body text-sm font-medium transition-colors focus-ring-gold",
        selected
          ? "border-gold bg-gold text-navy"
          : "border-navy/20 bg-cream text-ink hover:border-gold/60",
      )}
    >
      {children}
    </button>
  );
}

function StatusMessage({ status }: { status: Status }) {
  const isError = status.kind === "error";
  const message =
    status.kind === "success"
      ? status.message
      : status.kind === "cancelled"
        ? "Your gift was cancelled — no charge was made."
        : isError
          ? status.message
          : "";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "mt-5 min-h-[1.5rem] rounded-lg text-sm",
        status.kind === "idle"
          ? "sr-only"
          : "px-4 py-3 " +
              (status.kind === "success"
                ? "bg-gold/15 text-gold-deep"
                : isError
                  ? "bg-red-50 text-red-700"
                  : "bg-navy/5 text-ink/70"),
      )}
    >
      {status.kind === "success" ? (
        <span className="font-medium">{message}</span>
      ) : (
        message
      )}
    </div>
  );
}

function ConfiguringFallback() {
  return (
    <div className="rounded-2xl border border-gold/30 bg-white/70 p-8 text-center shadow-sm shadow-navy/5">
      {/* TODO: set NEXT_PUBLIC_PAYPAL_CLIENT_ID */}
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep">
        Online Giving
      </p>
      <h3 className="mt-3 font-display text-2xl font-bold text-navy">
        Being Configured
      </h3>
      <p className="mx-auto mt-3 max-w-md text-ink/75">
        Online giving is being configured — please check back soon, or give in
        person at any service. Thank you for your generosity.
      </p>
      <div className="mt-6">
        <Button href="/visit" variant="navy">
          Plan a Visit
        </Button>
      </div>
    </div>
  );
}
