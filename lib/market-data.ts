export type Asset = {
  symbol: string;
  name: string;
  kind: "stock" | "crypto" | "etf";
  price: number;
  change: number; // percent
  marketCap?: number;
  about: string;
  color: string; // brand tint
};

export const ASSETS: Asset[] = [
  { symbol: "AAPL", name: "Apple", kind: "stock", price: 195.3, change: 1.22, marketCap: 3_020_000_000_000, about: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, and services worldwide.", color: "#111" },
  { symbol: "TSLA", name: "Tesla", kind: "stock", price: 175.6, change: -0.47, marketCap: 560_000_000_000, about: "Tesla designs, develops, manufactures, and sells electric vehicles and energy generation and storage systems.", color: "#e31937" },
  { symbol: "NVDA", name: "NVIDIA", kind: "stock", price: 128.85, change: 2.1, marketCap: 3_100_000_000_000, about: "NVIDIA is a global leader in accelerated computing and AI hardware.", color: "#76b900" },
  { symbol: "AMZN", name: "Amazon", kind: "stock", price: 187.42, change: 0.58, marketCap: 1_950_000_000_000, about: "Amazon.com engages in retail sale of consumer products, advertising, and subscription services.", color: "#ff9900" },
  { symbol: "META", name: "Meta Platforms", kind: "stock", price: 512.11, change: 1.03, marketCap: 1_310_000_000_000, about: "Meta builds technologies that help people connect, find communities, and grow businesses.", color: "#1877f2" },
  { symbol: "GOOGL", name: "Alphabet", kind: "stock", price: 172.9, change: 0.31, marketCap: 2_130_000_000_000, about: "Alphabet is a collection of companies including Google.", color: "#4285f4" },
  { symbol: "MSFT", name: "Microsoft", kind: "stock", price: 421.85, change: 0.74, marketCap: 3_130_000_000_000, about: "Microsoft develops, licenses, and supports software, services, devices, and solutions worldwide.", color: "#00a4ef" },
  { symbol: "SPY", name: "S&P 500 ETF", kind: "etf", price: 525.66, change: 0.05, about: "SPDR S&P 500 ETF tracks the S&P 500 index.", color: "#0f3460" },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", kind: "etf", price: 460.21, change: 0.71, about: "Invesco QQQ tracks the Nasdaq-100 index.", color: "#004b8d" },
  { symbol: "BTC", name: "Bitcoin", kind: "crypto", price: 67_892.11, change: 2.31, marketCap: 1_340_000_000_000, about: "Bitcoin is the world's first decentralized cryptocurrency.", color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", kind: "crypto", price: 3_456.12, change: 1.59, marketCap: 415_000_000_000, about: "Ethereum is a decentralized computing platform that runs smart contracts.", color: "#627eea" },
  { symbol: "SOL", name: "Solana", kind: "crypto", price: 151.36, change: 3.42, marketCap: 70_000_000_000, about: "Solana is a high-performance blockchain supporting builders around the world.", color: "#9945ff" },
  { symbol: "BNB", name: "BNB", kind: "crypto", price: 595.21, change: 0.86, marketCap: 90_000_000_000, about: "BNB powers the BNB Chain ecosystem.", color: "#f3ba2f" },
  { symbol: "USDT", name: "Tether", kind: "crypto", price: 1.0, change: 0.01, marketCap: 120_000_000_000, about: "Tether is a stablecoin pegged to the US dollar.", color: "#26a17b" },
  { symbol: "USDC", name: "USD Coin", kind: "crypto", price: 1.0, change: 0.0, marketCap: 33_000_000_000, about: "USDC is a fully-reserved dollar-backed stablecoin.", color: "#2775ca" },
  { symbol: "DOGE", name: "Dogecoin", kind: "crypto", price: 0.16, change: 1.24, marketCap: 23_000_000_000, about: "Dogecoin is a peer-to-peer, open-source cryptocurrency.", color: "#c2a633" },
  { symbol: "XRP", name: "XRP", kind: "crypto", price: 0.52, change: 0.42, marketCap: 29_000_000_000, about: "XRP is the native digital asset of the XRP Ledger.", color: "#23292f" },
];

export const findAsset = (symbol: string) =>
  ASSETS.find((a) => a.symbol.toLowerCase() === symbol.toLowerCase());

// Deterministic pseudo-random series
export function seriesFor(symbol: string, points = 60, seed = 1): number[] {
  const s = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0) + seed;
  let x = s;
  const rand = () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
  const a = findAsset(symbol);
  const base = a?.price ?? 100;
  const vol = (a?.kind === "crypto" ? 0.06 : 0.02) * base;
  const arr: number[] = [];
  let v = base * 0.92;
  for (let i = 0; i < points; i++) {
    v += (rand() - 0.48) * vol * 0.3;
    arr.push(Math.max(v, base * 0.5));
  }
  // ensure last value roughly matches current price
  const scale = base / arr[arr.length - 1];
  return arr.map((n) => n * scale);
}

export const PORTFOLIO_HOLDINGS = [
  { symbol: "AAPL", shares: 10 },
  { symbol: "TSLA", shares: 5 },
  { symbol: "NVDA", shares: 8 },
  { symbol: "BTC", shares: 0.05 },
  { symbol: "ETH", shares: 0.75 },
];
