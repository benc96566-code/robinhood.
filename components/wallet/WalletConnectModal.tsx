import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { allWallets, getWalletImage } from "./walletData";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (wallet: string) => void;
}

export const WalletConnectModal = ({ isOpen, onClose, onSelectWallet }: WalletConnectModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWallets = useMemo(() => {
    if (!searchQuery.trim()) return allWallets;
    return allWallets.filter(wallet =>
      wallet.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border/50 w-[95vw] max-w-2xl p-0 gap-0 max-h-[80vh] mx-auto overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 pr-12 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground">Select Wallet</DialogTitle>
              <DialogDescription className="sr-only">Choose a wallet to connect.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {/* Search Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-border/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search wallets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
        </div>
        
        <div
          className="max-h-[50vh] overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
        >
          {filteredWallets.length > 0 ? (
            <div className="p-4 sm:p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 w-full max-w-full overflow-x-hidden">
              {filteredWallets.map((wallet, index) => (
                <motion.button
                  key={wallet}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => onSelectWallet(wallet)}
                  className="min-w-0 flex flex-col items-center p-2 sm:p-3 rounded-xl hover:bg-accent/20 transition-all duration-200 text-center group"
                >
                  <img
                    src={getWalletImage(wallet)}
                    alt={wallet}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted object-cover mb-1 sm:mb-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/48?text=W";
                    }}
                  />
                  <span className="text-[10px] sm:text-xs font-medium text-foreground truncate w-full">{wallet}</span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No wallets found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
