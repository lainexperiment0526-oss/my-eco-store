import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift as GiftIcon, Droplets } from "lucide-react";
import StorefrontWalletQR from "./StorefrontWalletQR";

interface Gift {
  id: string;
  name: string;
  icon: string;
  drop_token_cost: number;
  pi_amount?: number;
}


interface GiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiverProfileId: string;
  receiverName: string;
  senderProfileId?: string;
  walletAddress?: string;
  tipText?: string;
}

export const GiftDialog = ({
  open,
  onOpenChange,
  receiverProfileId,
  receiverName,
  senderProfileId,
  walletAddress,
  tipText,
}: GiftDialogProps) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const ensureWalletRow = async () => {
    if (!senderProfileId) return null;
    const { data: wallet } = await supabase
      .from("user_wallets")
      .select("drop_tokens")
      .eq("profile_id", senderProfileId)
      .maybeSingle();

    if (!wallet) {
      const { error: createError } = await supabase
        .from("user_wallets")
        .upsert(
          {
            profile_id: senderProfileId,
            drop_tokens: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "profile_id" }
        );
      if (createError) {
        console.error("Error creating wallet:", createError);
        return null;
      }
      return { drop_tokens: 0 };
    }

    return wallet;
  };

  useEffect(() => {
    if (open) {
      loadGifts();
      loadBalance();
    }
  }, [open, senderProfileId]);

  const loadGifts = async () => {
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .order("pi_amount", { ascending: true });

    if (error) {
      console.error("Error loading gifts:", error);
      return;
    }

    setGifts(data || []);
  };

  const loadBalance = async () => {
    if (!senderProfileId) return;

    const wallet = await ensureWalletRow();
    setBalance(wallet?.drop_tokens || 0);
  };

  const sendGift = async (gift: Gift) => {
    if (!senderProfileId) {
      toast.error("Please login to send gifts");
      return;
    }

    const giftPrice = gift.pi_amount ?? gift.drop_token_cost;

    if (balance < giftPrice) {
      toast.error("Insufficient balance. Please buy more stickers!");
      return;
    }

    setLoading(true);
    try {
      // Ensure wallet row exists for sender
      const wallet = await ensureWalletRow();
      const currentBalance = wallet?.drop_tokens ?? balance;
      if (currentBalance < giftPrice) {
        toast.error("Insufficient balance. Please buy more stickers!");
        setLoading(false);
        return;
      }

      // Deduct tokens from sender
      const { error: walletError } = await supabase
        .from("user_wallets")
        .update({ drop_tokens: currentBalance - giftPrice, updated_at: new Date().toISOString() })
        .eq("profile_id", senderProfileId);

      if (walletError) throw walletError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from("gift_transactions")
        .insert({
          sender_profile_id: senderProfileId,
          receiver_profile_id: receiverProfileId,
          gift_id: gift.id,
          drop_tokens_spent: giftPrice,
          pi_amount: giftPrice,
        });

      if (transactionError) throw transactionError;

      toast.success(`Sent ${gift.icon} ${gift.name} to ${receiverName}!`);
      setBalance(currentBalance - giftPrice);
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending gift:", error);
      toast.error("Failed to send gift");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GiftIcon className="w-5 h-5" />
            Send Gift to {receiverName}
          </DialogTitle>
        </DialogHeader>

        {/* Show QR code and wallet address for tips */}
        {walletAddress && (
          <div className="mb-4">
            <StorefrontWalletQR walletAddress={walletAddress} tipText={tipText} />
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4">
          <span className="text-sm font-medium">Sticker Balance</span>
          <span className="flex items-center gap-1 font-bold">
            <Droplets className="w-4 h-4" />
            {balance} Pi
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {gifts.map((gift) => {
            const giftPrice = gift.pi_amount ?? gift.drop_token_cost;
            return (
              <Button
                key={gift.id}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => sendGift(gift)}
                disabled={loading || balance < giftPrice}
              >
                <span className="text-3xl">{gift.icon}</span>
                <span className="text-xs font-medium">{gift.name}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Droplets className="w-3 h-3" />
                  {giftPrice} Pi
                </span>
              </Button>
            );
          })}
        </div>

        <Button
          variant="link"
          className="w-full mt-2"
          onClick={() => {
            onOpenChange(false);
            window.location.href = "/wallet";
          }}
        >
          Buy Stickers
        </Button>
      </DialogContent>
    </Dialog>
  );
};
