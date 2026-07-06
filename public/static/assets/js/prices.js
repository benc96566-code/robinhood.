// Fetch live prices from the running TanStack /api/public/prices endpoint (same origin).
async function fetchPrices(symbols, kind = "stock") {
  try {
    const r = await fetch(`/api/public/prices?kind=${kind}&symbols=${symbols.join(",")}`);
    if (!r.ok) throw 0;
    return await r.json();
  } catch { return {}; }
}
window.fetchPrices = fetchPrices;

const DEFAULT_STOCKS = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "AMD"];
const DEFAULT_CRYPTO = ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA"];
window.DEFAULT_STOCKS = DEFAULT_STOCKS; window.DEFAULT_CRYPTO = DEFAULT_CRYPTO;

async function renderTicker(el) {
  const [s, c] = await Promise.all([fetchPrices(DEFAULT_STOCKS, "stock"), fetchPrices(DEFAULT_CRYPTO, "crypto")]);
  const all = { ...s, ...c };
  el.innerHTML = Object.entries(all).map(([sym, d]) => {
    const p = d.price ?? 0, ch = d.change_percent ?? 0;
    return `<div class="ticker-item"><span class="sym">${sym}</span> ${money(p)} <span class="${ch>=0?'green':'red'}">${pct(ch)}</span></div>`;
  }).join("");
}
window.renderTicker = renderTicker;