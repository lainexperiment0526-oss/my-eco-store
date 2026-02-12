
import React, { useState } from "react";
import { GiftDialog } from "./GiftDialog";
import { Button } from "./ui/button";
import { useStoreWalletInfo } from "../hooks/useStoreWalletInfo";

interface StorefrontGiftButtonProps {
  receiverProfileId: string;
  receiverName: string;
  senderProfileId?: string;
}


const StorefrontGiftButton: React.FC<StorefrontGiftButtonProps> = ({ receiverProfileId, receiverName, senderProfileId }) => {
  const [open, setOpen] = useState(false);
  // Fetch wallet info for the receiver
  const { walletAddress, tipText } = useStoreWalletInfo(receiverProfileId);
  return (
    <>
      <Button variant="outline" className="mt-2" onClick={() => setOpen(true)}>
        Send Gift / Drop
      </Button>
      <GiftDialog
        open={open}
        onOpenChange={setOpen}
        receiverProfileId={receiverProfileId}
        receiverName={receiverName}
        senderProfileId={senderProfileId}
        walletAddress={walletAddress}
        tipText={tipText}
      />
    </>
  );
};

export default StorefrontGiftButton;
