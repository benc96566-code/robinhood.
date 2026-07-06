import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { findAsset } from "@/lib/market-data";
import { money } from "@/lib/format";
import { useState } from "react";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";
import { AssetIcon } from "@/components/AssetIcon";
import { toast } from "sonner";
import { useAccount, usePlaceBuyOrder } from "@/lib/api";

export const Route = createFileRoute("/_app/buy/$symbol")({
  component: Buy,
  loader: ({ params }) => {
    const a = findAsset(params.symbol);
    if (!a) throw notFound();
    return { symbol: params.symbol.toUpperCase() };
  },
});

function Buy() {
  const { symbol } = Route.useLoaderData();
  const a = findAsset(symbol)!;
  const [amount, setAmount] = useState("0");
  const nav = useNavigate();
  const value = Number(amount) || 0;
  const shares = value / a.price;
  const fee = value * 0.001;
  const total = value + fee;

  const { data: account } = useAccount();
  const buyingPower = Number(account?.buying_power ?? 0);
  const insufficient = total > buyingPower;

  const place = usePlaceBuyOrder();

  const submit = async () => {
    if (value <= 0) return toast.error("Enter an amount");
    if (insufficient) return toast.error(`Insufficient balance — you have ${money(buyingPower)}`);
    try {
      await place.mutateAsync({ symbol: a.symbol, quantity: shares, price: a.price });
      toast.success(`Bought ${shares.toFixed(6)} ${a.symbol}`);
      nav({ to: "/portfolio" });
    } catch (e: any) {
      toast.error(e?.message ?? "Order failed");
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <div className="flex items-center gap-2">
        <Link to="/asset/$symbol" params={{ symbol }} className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <AssetIcon symbol={symbol} size={28} />
          <span className="text-lg font-bold">Buy {a.name}</span>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="text-xs font-medium text-muted-foreground">Amount in USD</div>
        <div className="mt-2 flex items-center justify-center gap-1">
          <span className="text-4xl font-extrabold">$</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            className="w-40 bg-transparent text-center text-5xl font-extrabold tracking-tight outline-none"
          />
        </div>
        <div className="mt-2 text-sm text-muted-foreground">≈ {shares.toFixed(6)} {a.symbol}</div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2">
        {[50, 100, 250, 500].map((v) => (
          <button
            key={v}
            onClick={() => setAmount(String(v))}
            className="h-11 rounded-2xl bg-surface text-sm font-semibold hover:bg-muted"
          >
            ${v}
          </button>
        ))}
      </div>

      <div className="card-elevated mt-6 p-4 text-sm">
        <Row label="Est. price" value={money(a.price)} />
        <Row label="Est. shares" value={shares.toFixed(6)} />
        <Row label="Fee" value={money(fee)} />
        <div className="my-2 border-t border-border" />
        <Row label="Total" value={money(total)} bold />
        <Row label="Available balance" value={money(buyingPower)} />
      </div>

      {value > 0 && insufficient && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
          <div className="text-xs text-destructive">
            Your balance ({money(buyingPower)}) isn't enough for this order. <Link to="/deposit" className="font-semibold underline">Deposit funds</Link> to continue.
          </div>
        </div>
      )}

      <button
        onClick={submit}
        disabled={place.isPending || insufficient || value <= 0}
        className="btn-primary-glow mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-semibold disabled:opacity-70"
      >
        {place.isPending ? <><Check className="h-5 w-5" /> Placing order…</> : insufficient ? "Insufficient balance" : "Place order"}
      </button>
    </div>
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
