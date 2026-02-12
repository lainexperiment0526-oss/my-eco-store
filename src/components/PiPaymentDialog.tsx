import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface PiPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  onSubmit: (amount: string, message: string) => void;
  loading?: boolean;
}

export function PiPaymentDialog({ open, onOpenChange, walletAddress, onSubmit, loading }: PiPaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setError("");
    onSubmit(amount, message);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay with Pi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (Pi)</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="message">Message (optional)</Label>
            <Input
              id="message"
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add a note (optional)"
              disabled={loading}
            />
          </div>
          <div>
            <Label>Recipient Wallet</Label>
            <Input value={walletAddress} readOnly className="font-mono" />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Send Pi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
