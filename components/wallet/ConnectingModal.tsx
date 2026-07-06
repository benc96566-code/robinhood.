import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getWalletImage } from "./walletData";

interface ConnectingModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletName: string;
  onTryManual: () => void;
}

export const ConnectingModal = ({ isOpen, onClose, walletName, onTryManual }: ConnectingModalProps) => {
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "failed">("connecting");
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (isOpen) {
      setConnectionStatus("connecting");
      setDots("");
      
      // Animate dots
      const dotsInterval = setInterval(() => {
        setDots(prev => {
          if (prev.length >= 3) return "";
          return prev + ".";
        });
      }, 400);

      // Simulate connection failure after 2 seconds
      const timeout = setTimeout(() => {
        clearInterval(dotsInterval);
        setConnectionStatus("failed");
      }, 2000);

      return () => {
        clearInterval(dotsInterval);
        clearTimeout(timeout);
      };
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/50 w-[90vw] max-w-md p-0 gap-0 mx-auto overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 pr-12">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground">{walletName}</DialogTitle>
          <DialogDescription className="sr-only">Connection status.</DialogDescription>
        </DialogHeader>
        
        <div className="p-4 sm:p-6 pt-2 flex flex-col items-center">
          <motion.div
            animate={{ rotate: connectionStatus === "connecting" ? 360 : 0 }}
            transition={{ duration: 1, repeat: connectionStatus === "connecting" ? Infinity : 0, ease: "linear" }}
            className="relative mb-4 sm:mb-6"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-muted border-t-primary" />
            <img
              src={getWalletImage(walletName)}
              alt={walletName}
              className="absolute inset-1.5 sm:inset-2 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/64?text=W";
              }}
            />
          </motion.div>

          <div className={`w-full p-3 sm:p-4 rounded-xl text-center ${
            connectionStatus === "failed" 
              ? "border-2 border-destructive bg-destructive/10" 
              : "bg-secondary"
          }`}>
            {connectionStatus === "connecting" ? (
              <p className="text-foreground text-sm sm:text-base">Connecting{dots}</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <p className="text-destructive text-sm sm:text-base">Auto connect failed</p>
                <button
                  onClick={onTryManual}
                  className="px-4 sm:px-6 py-2 rounded-full border border-border text-foreground hover:bg-muted transition-all text-sm sm:text-base"
                >
                  Connect Manually
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
