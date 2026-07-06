import { createFileRoute } from "@tanstack/react-router";

// Server-side proxy to Finnhub for real stock/ETF quotes.
// Requires FINNHUB_API_KEY (free tier: 60 req/min at finnhub.io).
async function fetchQuote(symbol: string, apiKey: string) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data: any = await res.json();
  const price = Number(data?.c ?? 0);
  if (!price) return null;
  const prev = Number(data?.pc ?? price);
  const change = prev ? ((price - prev) / prev) * 100 : 0;
  return { symbol, price, change };
}

export const Route = createFileRoute("/api/public/prices")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const symbols = (url.searchParams.get("symbols") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        if (symbols.length === 0) return Response.json({ quotes: [] });
        const apiKey = process.env.FINNHUB_API_KEY;
        if (!apiKey) {
          return Response.json({ quotes: [], error: "FINNHUB_API_KEY not set" }, { status: 200 });
        }
        try {
          const results = await Promise.all(symbols.map((s) => fetchQuote(s, apiKey).catch(() => null)));
          const quotes = results.filter(Boolean);
          return new Response(JSON.stringify({ quotes }), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "public, max-age=30",
            },
          });
        } catch (err) {
          return Response.json({ quotes: [], error: String(err) }, { status: 200 });
        }
      },
    },
  },
});