import { useState } from "react";
import { findAsset } from "@/lib/market-data";

const CRYPTO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binance-coin",
  USDT: "tether",
  USDC: "usd-coin",
  XRP: "xrp",
  DOGE: "dogecoin",
};

function logoUrl(symbol: string, kind?: string): string | null {
  const s = symbol.toUpperCase();
  if (kind === "crypto") {
    const id = CRYPTO_ID[s] ?? s.toLowerCase();
    return `https://assets.coincap.io/assets/icons/${id === "binance-coin" ? "bnb" : s.toLowerCase()}@2x.png`;
  }
  // stocks + etfs
  return `https://financialmodelingprep.com/image-stock/${s}.png`;
}

export function AssetIcon({ symbol, size = 40 }: { symbol: string; size?: number }) {
  const a = findAsset(symbol);
  const bg = a?.color ?? "#111";
  const letter = symbol.slice(0, 1);
  const url = logoUrl(symbol, a?.kind);
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={`${symbol} logo`}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full bg-white object-contain"
        style={{ width: size, height: size, padding: size * 0.06 }}
      />
    );
  }
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}
      aria-hidden
    >
      {letter}
    </div>
  );
}
