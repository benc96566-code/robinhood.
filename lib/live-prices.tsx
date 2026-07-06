import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ASSETS } from "@/lib/market-data";

const TickCtx = createContext(0);
export const useLivePriceTick = () => useContext(TickCtx);

// Map our symbols to Yahoo/CoinGecko identifiers
const YAHOO_SYMBOLS: Record<string, string> = {
  AAPL: "AAPL", TSLA: "TSLA", NVDA: "NVDA", AMZN: "AMZN", META: "META",
  GOOGL: "GOOGL", MSFT: "MSFT", SPY: "SPY", QQQ: "QQQ",
};
const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana",
  BNB: "binancecoin", USDT: "tether", USDC: "usd-coin",
  DOGE: "dogecoin", XRP: "ripple",
};

async function fetchLive(): Promise<Record<string, { price: number; change: number }>> {
  const out: Record<string, { price: number; change: number }> = {};
  const stockSyms = Object.values(YAHOO_SYMBOLS).join(",");
  const cgIds = Object.values(COINGECKO_IDS).join(",");

  const [stocksRes, cryptoRes] = await Promise.allSettled([
    fetch(`/api/public/prices?symbols=${stockSyms}`).then((r) => r.json()),
    fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgIds}&vs_currencies=usd&include_24hr_change=true`,
    ).then((r) => r.json()),
  ]);

  if (stocksRes.status === "fulfilled" && stocksRes.value?.quotes) {
    for (const q of stocksRes.value.quotes) {
      const sym = Object.keys(YAHOO_SYMBOLS).find((k) => YAHOO_SYMBOLS[k] === q.symbol);
      if (sym && typeof q.price === "number") {
        out[sym] = { price: q.price, change: q.change ?? 0 };
      }
    }
  }
  if (cryptoRes.status === "fulfilled" && cryptoRes.value) {
    for (const [sym, id] of Object.entries(COINGECKO_IDS)) {
      const row = cryptoRes.value[id];
      if (row?.usd) out[sym] = { price: row.usd, change: row.usd_24h_change ?? 0 };
    }
  }
  return out;
}

export function LivePricesProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const live = await fetchLive();
        if (!alive) return;
        let changed = false;
        for (const asset of ASSETS) {
          const l = live[asset.symbol];
          if (l && (asset.price !== l.price || asset.change !== l.change)) {
            asset.price = l.price;
            asset.change = l.change;
            changed = true;
          }
        }
        if (changed) setTick((t) => t + 1);
      } catch (err) {
        console.warn("[live-prices] fetch failed", err);
      }
    };
    run();
    const id = setInterval(run, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const value = useMemo(() => tick, [tick]);
  return <TickCtx.Provider value={value}>{children}</TickCtx.Provider>;
}