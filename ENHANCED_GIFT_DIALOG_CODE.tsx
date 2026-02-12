// Enhanced GiftDialog Component with Personal Message Support
// File: src/components/GiftDialog.tsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./src/components/ui/dialog";
import { Button } from "./src/components/ui/button";
import { supabase } from "./src/integrations/supabase/client";
import { toast } from "sonner";
import { Gift as GiftIcon, Droplets, Send } from "lucide-react";
import { Textarea } from "./src/components/ui/textarea";
import { QRCodeSVG } from "qrcode.react";

interface Gift {
  id: string;
  name: string;
  icon: string;
  drop_token_cost: number;
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
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [personalMessage, setPersonalMessage] = useState("");
  const [giftStats, setGiftStats] = useState({ totalGifts: 0, lastGift: null as any });

  useEffect(() => {
    if (open) {
      loadGifts();
      loadBalance();
      loadGiftStats();
    }
  }, [open, senderProfileId]);

  const loadGifts = async () => {
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .order("drop_token_cost", { ascending: true });

    if (error) {
      console.error("Error loading gifts:", error);
      return;
    }

    setGifts(data || []);
  };

  const loadBalance = async () => {
    if (!senderProfileId) return;

    const { data, error } = await supabase
      .from("user_wallets")
      .select("drop_tokens")
      .eq("profile_id", senderProfileId)
      .single();

    if (error) {
      console.error("Error loading balance:", error);
      return;
    }

    setBalance(data?.drop_tokens || 0);
  };

  // Load gift statistics for this receiver
  const loadGiftStats = async () => {
    try {
      // Total gifts received
      const { count: totalCount } = await supabase
        .from("gift_transactions")
        .select("id", { count: "exact" })
        .eq("receiver_profile_id", receiverProfileId);

      // Last gift received
      const { data: lastGiftData } = await supabase
        .from("gift_transactions")
        .select("created_at, sender_profile_id, gift_id")
        .eq("receiver_profile_id", receiverProfileId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setGiftStats({
        totalGifts: totalCount || 0,
        lastGift: lastGiftData
      });
    } catch (error) {
      console.error("Error loading gift stats:", error);
    }
  };

  const sendGift = async (gift: Gift) => {
    if (!senderProfileId) {
      toast.error("Please login to send gifts");
      return;
    }

    if (balance < gift.drop_token_cost) {
      toast.error("Insufficient DropTokens. Please buy more!");
      return;
    }

    setLoading(true);
    try {
      // Deduct tokens from sender
      const { error: walletError } = await supabase
        .from("user_wallets")
        .update({ drop_tokens: balance - gift.drop_token_cost })
        .eq("profile_id", senderProfileId);

      if (walletError) throw walletError;

      // Record transaction with optional message
      const { error: transactionError } = await supabase
        .from("gift_transactions")
        .insert({
          sender_profile_id: senderProfileId,
          receiver_profile_id: receiverProfileId,
          gift_id: gift.id,
          drop_tokens_spent: gift.drop_token_cost,
          message: personalMessage || null,
          created_at: new Date().toISOString(),
        });

      if (transactionError) throw transactionError;

      toast.success(`Sent ${gift.icon} ${gift.name} to ${receiverName}!`);
      setBalance(balance - gift.drop_token_cost);
      setPersonalMessage("");
      setSelectedGift(null);
      
      // Reload stats
      loadGiftStats();
      
      setTimeout(() => onOpenChange(false), 1000);
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
            <GiftIcon className="w-5 h-5 text-rose-500" />
            Send Gift to {receiverName}
          </DialogTitle>
        </DialogHeader>

        {/* Show QR code and wallet address for tips */}
        {walletAddress && (
          <div className="mb-4 p-3 border border-border rounded-lg bg-muted/40 flex items-center gap-3">
            <QRCodeSVG value={walletAddress} size={88} />
            <div className="text-xs">
              <div className="font-medium">Tip via Pi Wallet</div>
              <div className="break-all opacity-80">{walletAddress}</div>
              {tipText && (
                <div className="mt-1 text-muted-foreground">{tipText}</div>
              )}
            </div>
          </div>
        )}

        {/* Balance Display */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4 border border-border">
          <span className="text-sm font-medium">Your Balance</span>
          <span className="flex items-center gap-1 font-bold text-blue-600">
            <Droplets className="w-4 h-4" />
            {balance} Tokens
          </span>
        </div>

        {/* Gift Stats */}
        <div className="text-xs text-muted-foreground text-center mb-4 p-2 bg-slate-50 dark:bg-slate-950 rounded">
          <p>✨ {receiverName} has received <strong>{giftStats.totalGifts}</strong> gifts</p>
        </div>

        {/* Gift Selection Grid */}
        {!selectedGift ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose a gift:</p>
            <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto">
              {gifts.map((gift: Gift) => (
                <Button
                  key={gift.id}
                  variant={selectedGift === gift ? "default" : "outline"}
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:border-rose-500 transition-colors"
                  onClick={() => setSelectedGift(gift)}
                  disabled={loading || balance < gift.drop_token_cost}
                  title={balance < gift.drop_token_cost ? "Insufficient tokens" : gift.name}
                >
                  <span className="text-3xl">{gift.icon}</span>
                  <span className="text-xs font-medium text-center line-clamp-1">{gift.name}</span>
                  <span className={`text-xs flex items-center gap-1 ${balance < gift.drop_token_cost ? 'text-red-500' : 'text-blue-600'}`}>
                    <Droplets className="w-3 h-3" />
                    {gift.drop_token_cost}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          // Gift Confirmation Screen
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-800">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedGift.icon}</span>
                <div>
                  <p className="font-semibold">{selectedGift.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedGift.drop_token_cost} DropTokens</p>
                </div>
              </div>
            </div>

            {/* Optional Personal Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add a personal message (optional)</label>
              <Textarea
                placeholder="Write a special message for the creator..."
                value={personalMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPersonalMessage(e.target.value.slice(0, 200))}
                className="resize-none h-20"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {personalMessage.length} / 200
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedGift(null)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={() => sendGift(selectedGift)}
                disabled={loading || balance < selectedGift.drop_token_cost}
                className="flex-1"
              >
                {loading ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Gift
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Buy More Button */}
        <Button
          variant="link"
          className="w-full mt-2 text-blue-600"
          onClick={() => {
            onOpenChange(false);
            window.location.href = "/wallet";
          }}
        >
          Need More? Buy DropTokens →
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default GiftDialog;
