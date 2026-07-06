import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, Coins, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_app/deposit/")({
  component: Deposit,
});

function Deposit() {
  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <div className="flex items-center gap-2">
        <Link to="/dashboard" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Fund your account</h1>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">Choose a funding method to add money to your account.</p>

      <div className="mt-4 space-y-3">
        <Link to="/deposit/card" className="card-elevated flex items-center gap-4 p-5 hover:bg-surface">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Debit or credit card</div>
            <div className="text-xs text-muted-foreground">Instant · Visa, Mastercard, Verve, AmEx</div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>

        <Link to="/deposit/crypto" className="card-elevated flex items-center gap-4 p-5 hover:bg-surface">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Coins className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Crypto deposit</div>
            <div className="text-xs text-muted-foreground">USDT, BTC, ETH, BNB, SOL and more</div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        Deposits are protected with bank-grade encryption.
      </div>
    </div>
  );
}
