import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Wallet, ArrowUpFromLine, Users } from "lucide-react";
import { useIsAdmin } from "@/lib/use-is-admin";

export const Route = createFileRoute("/_app/admin")({
  component: Admin,
});

function Admin() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8 text-center text-sm">Not found.</div>;

  const links = [
    { to: "/admin/deposits" as const, icon: Wallet, label: "Pending deposits" },
    { to: "/admin/withdrawals" as const, icon: ArrowUpFromLine, label: "Pending withdrawals" },
    { to: "/admin/users" as const, icon: Users, label: "Users & balances" },
  ];

  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-24">
      <div className="flex items-center gap-2">
        <Link to="/profile" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Admin</h1>
      </div>
      <ul className="card-elevated mt-6 divide-y divide-border overflow-hidden">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="flex items-center gap-3 px-4 py-4 hover:bg-surface">
              <l.icon className="h-5 w-5 text-primary" />
              <span className="flex-1 font-medium">{l.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}