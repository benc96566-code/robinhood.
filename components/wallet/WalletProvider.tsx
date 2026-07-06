import { createContext, useContext, useState, ReactNode } from "react";
import { WalletModal } from "./WalletModal";
import { WalletConnectModal } from "./WalletConnectModal";
import { ConnectingModal } from "./ConnectingModal";
import { ManualConnectModal } from "./ManualConnectModal";

interface WalletContextType {
  openWalletModal: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWalletConnectModalOpen, setIsWalletConnectModalOpen] = useState(false);
  const [isConnectingModalOpen, setIsConnectingModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState("");

  const openWalletModal = () => {
    setIsWalletModalOpen(true);
  };

  const handleSelectWallet = (wallet: string) => {
    setSelectedWallet(wallet);
    setIsWalletModalOpen(false);
    setIsWalletConnectModalOpen(false);
    setIsConnectingModalOpen(true);
  };

  const handleOpenWalletConnect = () => {
    setIsWalletModalOpen(false);
    // Use setTimeout to ensure the first modal is fully closed before opening the second
    setTimeout(() => {
      setIsWalletConnectModalOpen(true);
    }, 100);
  };

  const handleTryManual = () => {
    setIsConnectingModalOpen(false);
    setIsManualModalOpen(true);
  };

  return (
    <WalletContext.Provider value={{ openWalletModal }}>
      {children}
      
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectWallet={handleSelectWallet}
        onOpenWalletConnect={handleOpenWalletConnect}
      />
      
      <WalletConnectModal
        isOpen={isWalletConnectModalOpen}
        onClose={() => setIsWalletConnectModalOpen(false)}
        onSelectWallet={handleSelectWallet}
      />
      
      <ConnectingModal
        isOpen={isConnectingModalOpen}
        onClose={() => setIsConnectingModalOpen(false)}
        walletName={selectedWallet}
        onTryManual={handleTryManual}
      />
      
      <ManualConnectModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        walletName={selectedWallet}
      />
    </WalletContext.Provider>
  );
};
