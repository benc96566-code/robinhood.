import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Building2, Trash2, CreditCard } from "lucide-react";
import { usePaymentMethods, useAddPaymentMethod, useDeletePaymentMethod } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/banks")({
  component: Banks,
});

function Banks() {
  const { data: methods = [], isLoading } = usePaymentMethods();
  const add = useAddPaymentMethod();
  const del = useDeletePaymentMethod();
  const [mode, setMode] = useState<null | "card" | "bank">(null);
  const [form, setForm] = useState({ label: "", last4: "", holder: "", brand: "Visa", exp_month: "", exp_year: "" });

  const cards = methods.filter((m) => m.kind === "card");
  const banks = methods.filter((m) => m.kind === "bank");

  const submit = async () => {
    if (!form.label || !form.last4) return toast.error("Fill required fields");
    await add.mutateAsync({
      kind: mode!,
      label: form.label,
      last4: form.last4.slice(-4),
      brand: mode === "card" ? form.brand : null,
      holder: form.holder || null,
      exp_month: form.exp_month ? Number(form.exp_month) : null,
      exp_year: form.exp_year ? Number(form.exp_year) : null,
    });
    toast.success(mode === "card" ? "Card added" : "Bank linked");
    setMode(null);
    setForm({ label: "", last4: "", holder: "", brand: "Visa", exp_month: "", exp_year: "" });
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-24">
      <div className="flex items-center gap-2">
        <Link to="/profile" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Banks & Cards</h1>
      </div>

      <div className="mt-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cards</div>
        {isLoading ? null : cards.length === 0 ? (
          <div className="mt-3 card-elevated p-6 text-center text-sm text-muted-foreground">
            <CreditCard className="mx-auto h-6 w-6" /><div className="mt-2">No cards linked</div>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {cards.map((c) => (
              <li key={c.id} className="rounded-3xl bg-gradient-to-br from-[oklch(0.35_0.12_260)] to-[oklch(0.2_0.1_270)] p-5 text-white">
                <div className="flex items-start justify-between">
                  <div className="text-sm opacity-70">{c.brand}</div>
                  <button onClick={() => del.mutate(c.id)} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-6 text-xl tracking-widest">•••• {c.last4}</div>
                <div className="mt-3 flex items-end justify-between text-sm">
                  <div><div className="text-[10px] opacity-60">Cardholder</div><div className="font-semibold">{c.holder ?? c.label}</div></div>
                  {c.exp_month && c.exp_year && <div><div className="text-[10px] opacity-60">Exp</div><div className="font-semibold">{String(c.exp_month).padStart(2, "0")}/{String(c.exp_year).slice(-2)}</div></div>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => setMode("card")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-surface">
          <Plus className="h-4 w-4" /> Add new card
        </button>
      </div>

      <div className="mt-8">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bank accounts</div>
        {banks.length === 0 ? (
          <div className="mt-3 card-elevated p-6 text-center text-sm text-muted-foreground">
            <Building2 className="mx-auto h-6 w-6" /><div className="mt-2">No banks linked</div>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {banks.map((b) => (
              <li key={b.id} className="card-elevated flex items-center gap-3 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
                <div className="flex-1"><div className="font-semibold">{b.label}</div><div className="text-xs text-muted-foreground">••••{b.last4}</div></div>
                <button onClick={() => del.mutate(b.id)} className="grid h-9 w-9 place-items-center rounded-full text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => setMode("bank")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-surface">
          <Plus className="h-4 w-4" /> Link new bank
        </button>
      </div>

      {mode && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center" onClick={() => setMode(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{mode === "card" ? "Add card" : "Link bank"}</h3>
            <div className="mt-4 space-y-3">
              <Field label={mode === "card" ? "Name on card" : "Bank name"} value={form.label} onChange={(v) => setForm({ ...form, label: v })} />
              <Field label={mode === "card" ? "Card number" : "Account number"} value={form.last4} onChange={(v) => setForm({ ...form, last4: v.replace(/\D/g, "") })} />
              {mode === "card" && (
                <>
                  <Field label="Cardholder" value={form.holder} onChange={(v) => setForm({ ...form, holder: v })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Exp month" value={form.exp_month} onChange={(v) => setForm({ ...form, exp_month: v.replace(/\D/g, "").slice(0, 2) })} />
                    <Field label="Exp year" value={form.exp_year} onChange={(v) => setForm({ ...form, exp_year: v.replace(/\D/g, "").slice(0, 4) })} />
                  </div>
                </>
              )}
            </div>
            <button onClick={submit} disabled={add.isPending} className="btn-primary-glow mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl font-semibold">
              {add.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary" />
    </label>
  );
}
