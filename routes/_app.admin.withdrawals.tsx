import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, X } from "lucide-react";
import { supabase } from "@/lib/external-supabase";
import { useIsAdmin } from "@/lib/use-is-admin";
import { toast } from "sonner";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_app/admin/withdrawals")({
  component: AdminWithdrawals,
});

function AdminWithdrawals() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    enabled: !!isAdmin,
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (adminLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8 text-center">Not found.</div>;

  const doConfirm = async (id: string) => {
    try {
      const { error } = await supabase.rpc("confirm_withdrawal", { _request_id: id });
      if (error) throw error;
      toast.success("Confirmed"); qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };
  const doReject = async (id: string) => {
    try {
      const { error } = await supabase.rpc("reject_withdrawal", { _request_id: id, _reason: "Rejected by admin" });
      if (error) throw error;
      toast.success("Rejected"); qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pt-6 pb-24">
      <div className="flex items-center gap-2">
        <Link to="/admin" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Withdrawals</h1>
      </div>
      {isLoading ? <div className="mt-8 text-center text-sm text-muted-foreground">Loading…</div> : (
        <ul className="mt-6 space-y-3">
          {rows.length === 0 && <li className="text-center text-sm text-muted-foreground">No requests.</li>}
          {rows.map((r: any) => (
            <li key={r.id} className="card-elevated p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{money(Number(r.amount_usd))} · {r.method}</div>
                  <div className="mt-1 text-xs text-muted-foreground">To {r.destination}</div>
                  <div className="mt-1 text-xs text-muted-foreground">User {r.user_id.slice(0, 8)} · {new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="text-xs uppercase font-semibold text-primary">{r.status}</div>
              </div>
              {r.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => doConfirm(r.id)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground"><Check className="h-4 w-4" /> Confirm</button>
                  <button onClick={() => doReject(r.id)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-destructive py-2 text-sm font-semibold text-destructive-foreground"><X className="h-4 w-4" /> Reject</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}