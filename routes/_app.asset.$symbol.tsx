import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PriceChart } from "@/components/PriceChart";
import { AssetIcon } from "@/components/AssetIcon";
import { findAsset, seriesFor } from "@/lib/market-data";
import { money, pct, compact } from "@/lib/format";
import { useMemo, useState } from "react";
import { useLivePriceTick } from "@/lib/live-prices";
import { ArrowLeft, Star } from "lucide-react";

export const Route = createFileRoute("/_app/asset/$symbol")({
  component: Detail,
  notFoundComponent: () => <div className="p-10 text-center">Asset not found.</div>,
  loader: ({ params }) => {
    const a = findAsset(params.symbol);
    if (!a) throw notFound();
    return { symbol: params.symbol.toUpperCase() };
  },
});

const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const;
const RANGE_LABEL: Record<(typeof RANGES)[number], string> = {
  "1D": "Today",
  "1W": "Past week",
  "1M": "Past month",
  "3M": "Past 3 months",
  "1Y": "Past year",
  "ALL": "All time",
};

function Detail() {
  const { symbol } = Route.useLoaderData();
  const a = findAsset(symbol)!;
  const tick = useLivePriceTick();
  const [range, setRange] = useState<(typeof RANGES)[number]>("1D");
  const rangeSeed = RANGES.indexOf(range) + 1;
  const data = useMemo(() => seriesFor(a.symbol, 60, rangeSeed), [a.symbol, rangeSeed, tick]);
  const endPrice = data[data.length - 1] ?? a.price;
  const startPrice = data[0] ?? a.price;
  const rangeChange = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;
  const rangeDelta = endPrice - startPrice;

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <div className="flex items-center justify-between">
        <Link to="/markets" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface" aria-label="Add to watchlist">
          <Star className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <AssetIcon symbol={a.symbol} size={44} />
        <div>
          <div className="text-2xl font-extrabold tracking-tight">{a.name}</div>
          <div className="text-xs font-medium text-muted-foreground">{a.symbol} · {a.kind.toUpperCase()}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-3xl font-extrabold tracking-tight">{money(endPrice)}</div>
        <div className={`mt-1 text-sm font-semibold ${rangeChange >= 0 ? "text-primary" : "text-destructive"}`}>
          {rangeChange >= 0 ? "▲" : "▼"} {money(Math.abs(rangeDelta))} ({pct(rangeChange)}) {RANGE_LABEL[range]}
        </div>
      </div>

      <div className="mt-4">
        <PriceChart data={data} height={220} color={rangeChange >= 0 ? "var(--color-primary)" : "var(--color-destructive)"} />
        <div className="mt-3 flex justify-between text-xs font-semibold">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1 transition ${
                range === r ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-bold tracking-tight">About</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.about}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-bold tracking-tight">Statistics</h2>
        <div className="card-elevated mt-3 grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
          <Stat label="Market Cap" value={a.marketCap ? "$" + compact(a.marketCap) : "—"} />
          <Stat label="Day High" value={money(a.price * 1.02)} />
          <Stat label="Day Low" value={money(a.price * 0.98)} />
          <Stat label="52-wk High" value={money(a.price * 1.35)} />
          <Stat label="52-wk Low" value={money(a.price * 0.7)} />
          <Stat label="Volume" value={compact(1_200_000)} />
        </div>
      </div>

      <div className="sticky bottom-24 mt-8 grid grid-cols-2 gap-3">
        <Link to="/sell/$symbol" params={{ symbol: a.symbol }} className="flex h-14 items-center justify-center rounded-2xl border border-border bg-card font-semibold hover:bg-surface">
          Sell
        </Link>
        <Link to="/buy/$symbol" params={{ symbol: a.symbol }} className="btn-primary-glow flex h-14 items-center justify-center rounded-2xl font-semibold">
          Buy
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
