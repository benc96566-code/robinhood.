import { createFileRoute, Link } from "@tanstack/react-router";
import { PriceChart } from "@/components/PriceChart";
import { AssetIcon } from "@/components/AssetIcon";
import { ASSETS, seriesFor } from "@/lib/market-data";
import { money, pct } from "@/lib/format";
import { useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Search, Plus } from "lucide-react";
import { useAccount, useTransactions } from "@/lib/api";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const;

function Dashboard() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("1D");
  const { data: account, isLoading } = useAccount();
  const { data: txs } = useTransactions();

  const balance = Number(account?.balance ?? 0);
  const buyingPower = Number(account?.buying_power ?? 0);

  // Today's change = sum of today's transactions
  const todayChange = useMemo(() => {
    if (!txs) return 0;
    const today = new Date().toDateString();
    return txs
      .filter((t) => new Date(t.created_at).toDateString() === today)
      .reduce((s, t) => s + t.amount, 0);
  }, [txs]);
  const todayPct = balance > 0 ? (todayChange / balance) * 100 : 0;

  const chart = useMemo(() => seriesFor("PORTFOLIO_" + range, 60), [range]);
  const watchlist = ASSETS.slice(0, 5);

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={BRAND.logo} alt="" className="h-8 w-8 rounded-lg" />
          <span className="font-bold">Robinhood</span>
        </div>
        <Link to="/search" className="grid h-10 w-10 place-items-center rounded-full bg-surface hover:bg-muted">
          <Search className="h-5 w-5" />
        </Link>
      </div>

      <div className="mt-6">
        <div className="text-xs font-medium text-muted-foreground">Investing</div>
        {isLoading ? (
          <div className="mt-1 h-9 w-40 animate-pulse rounded bg-muted" />
        ) : (
          <div className="mt-0.5 text-3xl font-extrabold tracking-tight">{money(balance)}</div>
        )}
        <div className={`mt-1 text-sm font-semibold ${todayChange >= 0 ? "text-primary" : "text-destructive"}`}>
          {todayChange >= 0 ? "▲" : "▼"} {money(Math.abs(todayChange))} ({pct(todayPct)}) Today
        </div>
      </div>

      <div className="mt-6">
        <PriceChart data={chart} height={220} />
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

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat label="Buying Power" value={money(buyingPower)} />
        <Stat label="Today's Change" value={money(todayChange)} accent={todayChange >= 0} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link to="/deposit" className="btn-primary-glow flex h-14 items-center justify-center gap-2 rounded-2xl font-semibold">
          <Plus className="h-4 w-4" /> Deposit
        </Link>
        <Link to="/withdraw" className="flex h-14 items-center justify-center rounded-2xl border border-border bg-card font-semibold hover:bg-surface">
          Withdraw
        </Link>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Watchlist</h2>
        <Link to="/watchlist" className="text-sm font-semibold text-primary">See all</Link>
      </div>

      <ul className="mt-3 space-y-2">
        {watchlist.map((a) => (
          <li key={a.symbol}>
            <Link
              to="/asset/$symbol"
              params={{ symbol: a.symbol }}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 transition hover:bg-surface"
            >
              <AssetIcon symbol={a.symbol} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.symbol}</div>
              </div>
              <div className="hidden h-8 w-24 sm:block">
                <PriceChart data={seriesFor(a.symbol, 20)} height={32} fill={false} strokeWidth={1.5} color={a.change >= 0 ? "var(--color-primary)" : "var(--color-destructive)"} />
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{money(a.price)}</div>
                <div className={`flex items-center justify-end gap-0.5 text-xs font-semibold ${a.change >= 0 ? "text-primary" : "text-destructive"}`}>
                  {a.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {pct(a.change)}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-elevated p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
