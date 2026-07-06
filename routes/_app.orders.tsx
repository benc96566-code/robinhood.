import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { money } from "@/lib/format";
import { useOrders } from "@/lib/api";

export const Route = createFileRoute("/_app/orders")({
  component: Orders,
});

function Orders() {
  const [tab, setTab] = useState<"pending" | "filled" | "cancelled">("pending");
  const { data: orders = [], isLoading } = useOrders();
  const list = orders.filter((o) => (tab === "pending" ? o.status === "pending" || o.status === "open" : o.status === tab));
  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-24">
      <div className="flex items-center gap-2">
        <Link to="/profile" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Orders</h1>
      </div>
      <div className="mt-5 rounded-full bg-surface p-1 flex">
        {(["pending", "filled", "cancelled"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize ${tab === t ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : (
        <ul className="mt-4 space-y-2">
          {list.map((o) => (
            <li key={o.id} className="card-elevated flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="font-semibold">
                  <span className={o.side === "buy" ? "text-primary" : "text-destructive"}>{o.side.toUpperCase()}</span>{" "}
                  {o.symbol}
                </div>
                <div className="text-xs text-muted-foreground">{Number(o.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })} @ {money(o.price)}</div>
                {o.status === "pending" && o.fill_at && (
                  <div className="mt-0.5 text-[11px] font-medium text-primary">Fills {new Date(o.fill_at).toLocaleString()}</div>
                )}
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">{money(Number(o.quantity) * Number(o.price))}</div>
                <div>{new Date(o.created_at).toLocaleDateString()}</div>
              </div>
            </li>
          ))}
          {list.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No {tab} orders yet.</div>}
        </ul>
      )}
    </div>
  );
}
