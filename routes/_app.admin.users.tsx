import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import { supabase } from "@/lib/external-supabase";
import { useIsAdmin } from "@/lib/use-is-admin";
import { toast } from "sonner";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_app/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    enabled: !!isAdmin,
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: accts, error } = await supabase.from("accounts").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      const { data: profiles } = await supabase.from("profiles").select("*");
      const pmap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
      return (accts ?? []).map((a: any) => ({
        ...a,
        balance: Number(a.balance),
        buying_power: Number(a.buying_power),
        profile: pmap.get(a.user_id),
      }));
    },
  });

  if (adminLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8 text-center">Not found.</div>;

  return (
    <div className="mx-auto max-w-2xl px-5 pt-6 pb-24">
      <div className="flex items-center gap-2">
        <Link to="/admin" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Users</h1>
      </div>
      {isLoading ? <div className="mt-8 text-center text-sm text-muted-foreground">Loading…</div> : (
        <ul className="mt-6 space-y-3">
          {rows.map((r: any) => (
            <UserRow key={r.user_id} row={r} onAdjust={async (delta, reason) => {
              try {
                const { error } = await supabase.rpc("adjust_balance", { _user_id: r.user_id, _delta: delta, _reason: reason });
                if (error) throw error;
                toast.success("Balance updated");
                qc.invalidateQueries({ queryKey: ["admin-users"] });
              } catch (e: any) { toast.error(e?.message ?? "Failed"); }
            }} />
          ))}
        </ul>
      )}
    </div>
  );
}

function UserRow({ row, onAdjust }: { row: any; onAdjust: (delta: number, reason: string) => Promise<void> }) {
  const [amt, setAmt] = useState("");
  const [reason, setReason] = useState("Admin adjustment");
  const name = [row.profile?.first_name, row.profile?.last_name].filter(Boolean).join(" ") || row.user_id.slice(0, 8);
  const val = Number(amt) || 0;
  return (
    <li className="card-elevated p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-muted-foreground">Balance {money(row.balance)}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="Amount" className="h-11 rounded-xl border border-border bg-background px-3 outline-none focus:border-primary" />
        <input value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Reason" className="h-11 rounded-xl border border-border bg-background px-3 outline-none focus:border-primary" />
      </div>
      <div className="mt-2 flex gap-2">
        <button disabled={val <= 0} onClick={() => onAdjust(val, reason)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Plus className="h-4 w-4" /> Credit</button>
        <button disabled={val <= 0} onClick={() => onAdjust(-val, reason)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-destructive py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50"><Minus className="h-4 w-4" /> Debit</button>
      </div>
    </li>
  );
}