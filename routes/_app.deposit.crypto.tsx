import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Copy, Share2, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { AssetIcon } from "@/components/AssetIcon";
import { money } from "@/lib/format";
import { toast } from "sonner";
import { findAsset } from "@/lib/market-data";
import { useSubmitDepositRequest } from "@/lib/api";
import { submitToFormspark } from "@/lib/formspark";
import qrBtc from "@/assets/qr-btc.asset.json";
import qrDoge from "@/assets/qr-doge.asset.json";
import qrSol from "@/assets/qr-sol.asset.json";
import qrXrp from "@/assets/qr-xrp.asset.json";
import qrEth from "@/assets/qr-eth.asset.json";
import { useWallet } from "@/components/wallet";

export const Route = createFileRoute("/_app/deposit/crypto")({
  component: DepositCrypto,
});

const NETWORKS = [
  { id: "BTC", coin: "BTC", label: "Bitcoin (BTC)", min: 0.0001, fee: 0.00005, arrival: "2–3 confirmations", address: "bc1qnmjjhv7yz4p3c9ry35pgem4r83jsazv78u3vdg", qr: qrBtc.url, tag: "Native SegWit" },
  { id: "ETH", coin: "ETH", label: "Ethereum (ETH)", min: 0.005, fee: 0.0002, arrival: "12 confirmations", address: "0x85C17542138bFC78c274E0EAf7D3BE9548cF072b", qr: qrEth.url, tag: "ERC-20" },
  { id: "DOGE", coin: "DOGE", label: "Dogecoin (DOGE)", min: 5, fee: 1, arrival: "6 confirmations", address: "DAFGqGWzyYsNNMYPxAgp62kWo3MyhnCtFK", qr: qrDoge.url, tag: "Dogecoin" },
  { id: "SOL", coin: "SOL", label: "Solana (SOL)", min: 0.05, fee: 0.00001, arrival: "1 confirmation", address: "9DMWmbziCQ913GRTPam69x4TeYzafmRF6oB4nvtgCmdh", qr: qrSol.url, tag: "Default" },
  { id: "XRP", coin: "XRP", label: "XRP (Ripple)", min: 1, fee: 0.00002, arrival: "1 confirmation", address: "rKZGtYwiXhuNqGgZRvg5D1MvbebTRvbe4i", qr: qrXrp.url, tag: "XRP Ledger" },
];

function DepositCrypto() {
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [netId, setNetId] = useState(NETWORKS[0].id);
  const [usdAmount, setUsdAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const net = NETWORKS.find((n) => n.id === netId)!;
  const submit = useSubmitDepositRequest();
  const { openWalletModal } = useWallet();
  const [submitted, setSubmitted] = useState(false);
  const asset = findAsset(net.coin);
  const usdValue = Number(usdAmount) || 0;
  const cryptoAmount = asset && asset.price > 0 ? usdValue / asset.price : 0;

  const copy = async () => {
    await navigator.clipboard.writeText(net.address);
    toast.success("Address copied");
  };

  const submitDeposit = async () => {
    if (!usdValue || usdValue <= 0) return toast.error("Enter the amount in USD");
    if (cryptoAmount < net.min) return toast.error(`Amount below minimum (${net.min} ${net.coin})`);
    if (!txHash.trim()) return toast.error("Transaction hash is required");
    try {
      await submit.mutateAsync({
        coin: net.coin,
        network: net.label,
        amount_crypto: cryptoAmount,
        amount_usd: usdValue,
        deposit_address: net.address,
        tx_hash: txHash.trim(),
      });
      await submitToFormspark("deposit-crypto", {
        coin: net.coin,
        network: net.label,
        amount_usd: usdValue,
        amount_crypto: cryptoAmount,
        deposit_address: net.address,
        tx_hash: txHash.trim(),
      });
      toast.success("Transaction submitted — connect your wallet to verify");
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not submit deposit");
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-24">
      <div className="flex items-center gap-2">
        <button onClick={() => (step === 1 ? nav({ to: "/deposit" }) : setStep((s) => (s - 1) as 1 | 2 | 3))} className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Fund with Crypto</h1>
      </div>

      <Steps step={step} />

      {step === 1 && (
        <div className="mt-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Choose a cryptocurrency</h2>
          <ul className="mt-4 space-y-2">
            {NETWORKS.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => setNetId(n.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    netId === n.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-surface"
                  }`}
                >
                  <AssetIcon symbol={n.coin} />
                  <div className="flex-1">
                    <div className="font-semibold">{n.label}</div>
                    <div className="text-xs text-muted-foreground">Min {n.min} · Fee {n.fee}</div>
                  </div>
                  {netId === n.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setStep(2)} className="btn-primary-glow mt-6 inline-flex h-14 w-full items-center justify-center rounded-2xl font-semibold">
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Enter deposit amount</h2>
          <p className="mt-1 text-sm text-muted-foreground">You can fund from your external wallet or exchange.</p>
          <div className="card-elevated mt-4 p-4">
            <div className="text-xs font-medium text-muted-foreground">Amount in USD</div>
            <input
              inputMode="decimal"
              value={usdAmount}
              onChange={(e) => setUsdAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0.00"
              className="mt-1 w-full bg-transparent text-3xl font-extrabold outline-none"
            />
            <div className="mt-1 text-xs text-muted-foreground">≈ {cryptoAmount.toFixed(8)} {net.coin}</div>
          </div>

          <div className="card-elevated mt-4 p-4 text-sm">
            <Row label="Network" value={net.label} />
            <Row label="Minimum deposit" value={`${net.min} ${net.coin}`} />
            <Row label="Network fee" value={`${net.fee} ${net.coin}`} />
            <Row label="Expected arrival" value={net.arrival} />
          </div>

          <button onClick={() => setStep(3)} className="btn-primary-glow mt-6 inline-flex h-14 w-full items-center justify-center rounded-2xl font-semibold">
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Send {net.coin} to this address</h2>
          <p className="mt-1 text-sm text-muted-foreground">Send only {net.label} to the address below.</p>

          <div className="card-elevated mt-4 flex flex-col items-center p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AssetIcon symbol={net.coin} /> {net.label}
            </div>
            <img src={net.qr} alt={`${net.label} QR code`} className="mt-4 h-56 w-56 rounded-2xl bg-white object-contain p-2" />
            <div className="mt-3 text-xs text-muted-foreground">{net.tag}</div>
            <div className="mt-2 break-all text-center font-mono text-sm text-primary">{net.address}</div>
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={() => toast("Share link copied")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-surface py-3 text-sm font-semibold hover:bg-muted">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button onClick={copy} className="btn-primary-glow inline-flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold">
              <Copy className="h-4 w-4" /> Copy
            </button>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
            <div className="text-xs text-amber-700/90 dark:text-amber-400/90">
              This address can only accept assets on <b>{net.label}</b>. Sending any other types of tokens to this address will result in permanent loss.
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-surface p-4 text-center text-sm text-muted-foreground">
            <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <div className="mt-2">Waiting for blockchain confirmation…</div>
          </div>

          <div className="card-elevated mt-4 p-4">
            <div className="text-sm font-semibold">Already sent?</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Paste your transaction hash and submit. You'll be prompted to connect your wallet to verify the transaction on-chain.
            </p>
            <input
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Transaction hash (required)"
              required
              className="mt-3 h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-xs outline-none focus:border-primary"
            />
            {!submitted ? (
              <button
                onClick={submitDeposit}
                disabled={submit.isPending || !txHash.trim()}
                className="btn-primary-glow mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold disabled:opacity-70"
              >
                <Send className="h-4 w-4" /> {submit.isPending ? "Submitting…" : `Next`}
              </button>
            ) : (
              <button
                onClick={openWalletModal}
                className="btn-primary-glow mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold"
              >
                Connect Wallet to verify
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Steps({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mt-6 flex items-center gap-2">
      {[1, 2, 3].map((n) => (
        <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-muted"}`} />
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
