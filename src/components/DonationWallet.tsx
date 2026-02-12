import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Bitcoin, DollarSign, Plus, Trash2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface WalletData {
  crypto: Array<{ name: string; address: string; id: string }>;
  bank: Array<{ name: string; details: string; id: string }>;
}

interface DonationWalletProps {
  wallets: WalletData;
  onChange: (wallets: WalletData) => void;
}

export const DonationWallet = ({ wallets, onChange }: DonationWalletProps) => {
  const [newCrypto, setNewCrypto] = useState({ name: "", address: "" });
  const [newBank, setNewBank] = useState({ name: "", details: "" });
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<{ name: string; value: string } | null>(null);

  const addCryptoWallet = () => {
    if (!newCrypto.name || !newCrypto.address) {
      toast.error("Please fill in all fields");
      return;
    }

    onChange({
      ...wallets,
      crypto: [
        ...wallets.crypto,
        { ...newCrypto, id: Date.now().toString() },
      ],
    });
    setNewCrypto({ name: "", address: "" });
    toast.success("Crypto wallet added");
  };

  const removeCryptoWallet = (id: string) => {
    onChange({
      ...wallets,
      crypto: wallets.crypto.filter((w) => w.id !== id),
    });
    toast.success("Crypto wallet removed");
  };

  const addBankAccount = () => {
    if (!newBank.name || !newBank.details) {
      toast.error("Please fill in all fields");
      return;
    }

    onChange({
      ...wallets,
      bank: [
        ...wallets.bank,
        { ...newBank, id: Date.now().toString() },
      ],
    });
    setNewBank({ name: "", details: "" });
    toast.success("Bank account added");
  };

  const removeBankAccount = (id: string) => {
    onChange({
      ...wallets,
      bank: wallets.bank.filter((w) => w.id !== id),
    });
    toast.success("Bank account removed");
  };

  const showQRCode = (name: string, value: string) => {
    setSelectedWallet({ name, value });
    setShowQRDialog(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Donation & Tip Wallets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="crypto" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="crypto">
              <Bitcoin className="w-4 h-4 mr-2" />
              Crypto
            </TabsTrigger>
            <TabsTrigger value="bank">
              <DollarSign className="w-4 h-4 mr-2" />
              Bank
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crypto" className="space-y-4 mt-4">
            {/* Existing Crypto Wallets */}
            {wallets.crypto.length > 0 && (
              <div className="space-y-2">
                {wallets.crypto.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{wallet.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {wallet.address}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showQRCode(wallet.name, wallet.address)}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCryptoWallet(wallet.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Crypto Wallet */}
            <div className="space-y-3 pt-4 border-t">
              <Label>Add Crypto Wallet</Label>
              <Input
                placeholder="Wallet Name (e.g., Bitcoin, Ethereum)"
                value={newCrypto.name}
                onChange={(e) =>
                  setNewCrypto({ ...newCrypto, name: e.target.value })
                }
              />
              <Input
                placeholder="Wallet Address"
                value={newCrypto.address}
                onChange={(e) =>
                  setNewCrypto({ ...newCrypto, address: e.target.value })
                }
              />
              <Button onClick={addCryptoWallet} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Crypto Wallet
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="bank" className="space-y-4 mt-4">
            {/* Existing Bank Accounts */}
            {wallets.bank.length > 0 && (
              <div className="space-y-2">
                {wallets.bank.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {account.details}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showQRCode(account.name, account.details)}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBankAccount(account.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Bank Account */}
            <div className="space-y-3 pt-4 border-t">
              <Label>Add Bank Account</Label>
              <Input
                placeholder="Bank Name / Payment Service"
                value={newBank.name}
                onChange={(e) =>
                  setNewBank({ ...newBank, name: e.target.value })
                }
              />
              <Input
                placeholder="Account Details / Payment Link"
                value={newBank.details}
                onChange={(e) =>
                  setNewBank({ ...newBank, details: e.target.value })
                }
              />
              <Button onClick={addBankAccount} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Bank Account
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedWallet?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-4">
            {selectedWallet && (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={selectedWallet.value} size={200} />
                </div>
                <p className="text-sm text-muted-foreground text-center break-all">
                  {selectedWallet.value}
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
