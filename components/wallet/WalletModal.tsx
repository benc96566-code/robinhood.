import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (wallet: string) => void;
  onOpenWalletConnect: () => void;
}

const mainWallets = [
  { name: "Tangem Wallet", isWalletConnect: false },
  { name: "Coinbase Wallet", isWalletConnect: false },
  { name: "Ledger Wallet", isWalletConnect: false },
  { name: "WalletConnect", isWalletConnect: true },
];

export const WalletModal = ({ isOpen, onClose, onSelectWallet, onOpenWalletConnect }: WalletModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/50 w-[92vw] max-w-md p-0 gap-0 mx-auto overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 pr-12">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground">Connect Wallet</DialogTitle>
          <DialogDescription className="sr-only">Choose a connection method.</DialogDescription>
        </DialogHeader>
        
        <div className="p-4 sm:p-6 pt-2 space-y-3">
          {mainWallets.map((wallet, index) => (
            <motion.button
              key={wallet.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                if (wallet.isWalletConnect) {
                  onOpenWalletConnect();
                } else {
                  onSelectWallet(wallet.name);
                }
              }}
              className={`w-full py-4 px-5 rounded-xl font-medium transition-all duration-200 text-left ${
                wallet.name === "WalletConnect"
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {wallet.name}
            </motion.button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
