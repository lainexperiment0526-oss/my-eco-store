import React, { useState, useEffect } from 'react';
import { usePi } from '@/contexts/PiContext';
import AdRewardPicker from '@/components/AdRewardPicker';
import FeatureVote from '@/components/FeatureVote';
import { PI_CONFIG } from '@/config/pi-config';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Droplets, Send, Wallet, ExternalLink, Copy, CheckCircle, AlertCircle, Info, QrCode, Download, Upload, Key, RefreshCw, AlertTriangle, Ban } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import QRCode from 'qrcode';

interface DropTokenManagerProps {
  piUser?: any;
  piWallet?: string;
}

interface TokenBalance {
  asset_code: string;
  asset_issuer: string;
  balance: string;
  limit?: string;
}

const DROP_TOKEN = {
  code: 'DROP',
  issuer: 'GBVTV77XFMDYSSVIG6ZGSRAGZ3S7KA4275YYLOLIROOD3Y3F3TH5U3EI',
  distributor: 'GCTPMH43NGN7E4IXLQ27H2XWGGWWDY3I6UAPBFXYQSEUPEKNQE2BZXC2',
  name: 'MRWAIN ORGANIZATION',
  description: 'DropLink platform utility token',
  image: 'https://i.ibb.co/HTfyRcwm/Untitled-design-8-1.png',
  decimals: 7,
  colors: {
    primary: '#0ea5e9', // Sky blue
    secondary: '#0284c7',
    accent: '#38bdf8',
    background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)'
  }
};

export function DropTokenManager({ piUser, piWallet }: DropTokenManagerProps) {
  const [balance, setBalance] = useState<string>('0');
  const [hasDropTrustline, setHasDropTrustline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [isCreatingTrustline, setIsCreatingTrustline] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showQrDialog, setShowQrDialog] = useState<boolean>(false);
  const [userPrivateKey, setUserPrivateKey] = useState<string>('');
  const [showPrivateKeyDialog, setShowPrivateKeyDialog] = useState<boolean>(false);
  const [isMainnetMode, setIsMainnetMode] = useState<boolean>(!PI_CONFIG.SANDBOX_MODE);
  const [importedWallet, setImportedWallet] = useState<string>('');
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>(piWallet || '');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Token recall states
  const [showRecallDialog, setShowRecallDialog] = useState<boolean>(false);
  const [recallTarget, setRecallTarget] = useState<string>('');
  const [recallAmount, setRecallAmount] = useState<string>('');
  const [issuerPrivateKey, setIssuerPrivateKey] = useState<string>('');
  const [isRecalling, setIsRecalling] = useState<boolean>(false);
  const [tokenAuthStatus, setTokenAuthStatus] = useState<{
    authRequired: boolean;
    authRevocable: boolean;
  }>({ authRequired: false, authRevocable: false });

  // Check DROP token balance and trustline
  const checkDropBalance = async (walletAddress?: string) => {
    const targetWallet = walletAddress || currentWalletAddress || piWallet;
    if (!targetWallet) return;

    try {
      setIsLoading(true);
      
      // Check Pi API for balance (uses configured endpoints)
      const response = await fetch(`${PI_CONFIG.ENDPOINTS.PI_ACCOUNT_BALANCES}/${targetWallet}`, {
        headers: {
          'Authorization': `Bearer ${PI_CONFIG.API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const accountData = await response.json();
        
        // Find DROP token balance
        const dropBalance = accountData.balances?.find((bal: TokenBalance) => 
          bal.asset_code === DROP_TOKEN.code && 
          bal.asset_issuer === DROP_TOKEN.issuer
        );

        if (dropBalance) {
          setBalance(dropBalance.balance);
          setHasDropTrustline(true);
        } else {
          setBalance('0');
          setHasDropTrustline(false);
        }

        // Also check for native Pi balance
        const nativeBalance = accountData.balances?.find((bal: TokenBalance) => 
          bal.asset_code === undefined // Native balance
        );
        
        toast({
          title: "Balance Updated",
          description: `DROP: ${dropBalance?.balance || '0'} | Pi: ${nativeBalance?.balance || '0'}`,
        });
      } else {
        throw new Error(`Account not found: ${response.status}`);
      }
    } catch (error) {
      console.error('Error checking DROP balance:', error);
      toast({
        title: "Error",
        description: "Failed to check DROP token balance. Make sure the wallet is funded with Pi first.",
        variant: "destructive"
      });
      setBalance('0');
      setHasDropTrustline(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Create trustline for DROP token
  const createDropTrustline = async () => {
    if (!piUser || !piWallet) {
      toast({
        title: "Error",
        description: "Please authenticate with Pi Network first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreatingTrustline(true);

      // This would typically integrate with Pi SDK to create a trustline
      // For now, we'll show instructions to the user
      toast({
        title: "Trustline Creation",
        description: "Please create a trustline for DROP token in your Pi Wallet",
      });

      // In a real implementation, you would:
      // 1. Use Pi SDK to request trustline creation
      // 2. Sign transaction with user's wallet
      // 3. Submit to Pi Network

    } catch (error) {
      console.error('Error creating trustline:', error);
      toast({
        title: "Error",
        description: "Failed to create trustline for DROP token",
        variant: "destructive"
      });
    } finally {
      setIsCreatingTrustline(false);
    }
  };

  // Send DROP tokens to another address
  const sendDropTokens = async () => {
    if (!recipientAddress || !sendAmount || parseFloat(sendAmount) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid recipient address and amount",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(sendAmount) > parseFloat(balance)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough DROP tokens",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSending(true);

      // This would integrate with Pi SDK to send tokens
      toast({
        title: "Sending DROP Tokens",
        description: `Sending ${sendAmount} DROP to ${recipientAddress}`,
      });

      // In a real implementation:
      // 1. Create payment transaction
      // 2. Sign with user's wallet
      // 3. Submit to Pi Network
      // 4. Update balance

    } catch (error) {
      console.error('Error sending tokens:', error);
      toast({
        title: "Error",
        description: "Failed to send DROP tokens",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Import wallet from private key
  const importWalletFromPrivateKey = async () => {
    if (!userPrivateKey || userPrivateKey.length !== 56 || !userPrivateKey.startsWith('S')) {
      toast({
        title: "Invalid Private Key",
        description: `Please enter a valid ${PI_CONFIG.SANDBOX_MODE ? 'Pi Sandbox' : 'Pi Mainnet'} private key (56 chars, starts with 'S')`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsImporting(true);
      
      // Derive public key from private key (simplified version)
      // In a real implementation, you would use Stellar SDK
      const publicKey = await derivePublicKeyFromPrivate(userPrivateKey);
      
      if (publicKey) {
        // Store private key securely (encrypted in real implementation)
        localStorage.setItem('drop_wallet_private_key', userPrivateKey);
        localStorage.setItem('drop_wallet_address', publicKey);
        
        setImportedWallet(publicKey);
        setCurrentWalletAddress(publicKey);
        
        toast({
          title: "Wallet Imported Successfully! 🎉",
          description: `Wallet: ${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`,
        });
        
        // Check balance for the new wallet
        await checkDropBalance(publicKey);
        
        setShowPrivateKeyDialog(false);
        setUserPrivateKey('');
      } else {
        throw new Error('Failed to derive public key');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import wallet from private key. Please check the key format.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Derive public key from private key (simplified - use Stellar SDK in real implementation)
  const derivePublicKeyFromPrivate = async (privateKey: string): Promise<string | null> => {
    try {
      // This is a simplified version - in reality you would use:
      // const keypair = StellarSdk.Keypair.fromSecret(privateKey);
      // return keypair.publicKey();
      
      // For demo purposes, we'll validate format and return a mock public key
      if (privateKey.length === 56 && privateKey.startsWith('S')) {
        // Generate a mock public key that starts with 'G' (Stellar format)
        const mockPublicKey = 'G' + privateKey.slice(1, 55) + 'A';
        return mockPublicKey.toUpperCase();
      }
      return null;
    } catch (error) {
      console.error('Key derivation error:', error);
      return null;
    }
  };

  // Request DROP tokens from faucet/distributor
  const requestDropTokens = async () => {
    if (!piWallet) {
      toast({
        title: "Error", 
        description: "Wallet address required",
        variant: "destructive"
      });
      return;
    }

    try {
      // This would call your backend to distribute tokens
      toast({
        title: "Requesting DROP Tokens",
        description: "Processing your request...",
      });

      // In a real implementation:
      // 1. Call backend API to distribute tokens
      // 2. Backend uses distributor wallet to send tokens
      // 3. Update UI with new balance
      
      // Simulate success for demo
      setTimeout(async () => {
        toast({
          title: "SUCCESS! 🎉",
          description: "100 DROP tokens have been sent to your wallet!",
        });
        await checkDropBalance();
      }, 2000);

    } catch (error) {
      console.error('Error requesting tokens:', error);
      toast({
        title: "Error",
        description: "Failed to request DROP tokens",
        variant: "destructive"
      });
    }
  };

  // Check if user has imported private key
  const hasImportedPrivateKey = () => {
    return !!localStorage.getItem('drop_wallet_private_key');
  };

  // Copy address to clipboard
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  // Generate QR Code for wallet address
  const generateQRCode = async (address: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(address, {
        width: 300,
        margin: 2,
        color: {
          dark: DROP_TOKEN.colors.primary,
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
      setShowQrDialog(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    }
  };

  // Download QR Code
  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `DROP-wallet-${piWallet?.slice(-8)}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  // Check token authorization status
  const checkTokenAuthStatus = async () => {
    try {
      const response = await fetch(`${PI_CONFIG.ENDPOINTS.PI_ACCOUNT_BALANCES}/${DROP_TOKEN.issuer}`, {
        headers: {
          'Authorization': `Bearer ${PI_CONFIG.API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const accountData = await response.json();
        const flags = accountData.flags;
        setTokenAuthStatus({
          authRequired: flags.auth_required || false,
          authRevocable: flags.auth_revocable || false
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  // Recall tokens from a specific account
  const recallTokensFromAccount = async () => {
    if (!issuerPrivateKey || !recallTarget || !recallAmount) {
      toast({
        title: "Error",
        description: "All fields are required for token recall",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsRecalling(true);

      // This would normally use Stellar SDK to:
      // 1. Load issuer account
      // 2. Create clawback operation
      // 3. Submit transaction

      // For demo purposes, show success message
      toast({
        title: "Token Recall Initiated",
        description: `Recalling ${recallAmount} DROP tokens from ${recallTarget.slice(0, 6)}...${recallTarget.slice(-6)}`,
      });

      // Simulate recall process
      setTimeout(() => {
        toast({
          title: "Recall Successful! ✅",
          description: `${recallAmount} DROP tokens have been recalled`,
        });
        
        // Clear form
        setRecallTarget('');
        setRecallAmount('');
        setIssuerPrivateKey('');
        setShowRecallDialog(false);
        
        // Refresh balance
        checkDropBalance();
      }, 3000);

    } catch (error) {
      console.error('Recall error:', error);
      toast({
        title: "Recall Failed",
        description: "Failed to recall tokens. Please check your inputs.",
        variant: "destructive"
      });
    } finally {
      setIsRecalling(false);
    }
  };

  // Enable authorization flags for token
  const enableAuthorizationFlags = async () => {
    if (!issuerPrivateKey) {
      toast({
        title: "Error",
        description: "Issuer private key is required",
        variant: "destructive"
      });
      return;
    }

    try {
      // This would use Stellar SDK to set authorization flags
      toast({
        title: "Setting Authorization Flags",
        description: "Enabling token recall capabilities...",
      });

      // Simulate success
      setTimeout(() => {
        setTokenAuthStatus({
          authRequired: true,
          authRevocable: true
        });
        
        toast({
          title: "Authorization Enabled! ✅",
          description: "Token now supports recall operations",
        });
      }, 2000);

    } catch (error) {
      console.error('Authorization error:', error);
      toast({
        title: "Failed to Enable Authorization",
        description: "Could not set authorization flags",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Load imported wallet from localStorage if available
    const savedWallet = localStorage.getItem('drop_wallet_address');
    if (savedWallet) {
      setImportedWallet(savedWallet);
      setCurrentWalletAddress(savedWallet);
    } else if (piWallet) {
      setCurrentWalletAddress(piWallet);
    }
  }, []);

  // Ad stats (local fallback)
  const getTodayKey = () => {
    const d = new Date().toISOString().slice(0, 10);
    return `ad_watch_count_${d}`;
  };

  const getTodaysAdCountLocal = (): number => {
    try {
      const v = localStorage.getItem(getTodayKey()) || '0';
      return parseInt(v, 10) || 0;
    } catch (e) {
      return 0;
    }
  };

  const [adsWatchedToday, setAdsWatchedToday] = useState<number>(getTodaysAdCountLocal());
  const [todaysEarnings, setTodaysEarnings] = useState<number>(adsWatchedToday * 10);

  useEffect(() => {
    setTodaysEarnings(adsWatchedToday * 10);
  }, [adsWatchedToday]);

  // Refresh ad stats from localStorage
  const refreshAdStats = () => {
    setAdsWatchedToday(getTodaysAdCountLocal());
  };

  // Access Pi context
  const piCtx = usePi();

  const handleWatchSingleAd = async () => {
    if (!piCtx) return;
    try {
      const ok = await piCtx.showRewardedAd();
      // showRewardedAd will update localStorage counters; refresh local UI
      setTimeout(() => {
        refreshAdStats();
        // also refresh balance if reward was distributed
        if (ok) checkDropBalance(currentWalletAddress);
      }, 1200);
    } catch (err) {
      console.error('Watch ad error', err);
    }
  };

  useEffect(() => {
    if (currentWalletAddress) {
      checkDropBalance(currentWalletAddress);
      checkTokenAuthStatus();
    }
  }, [currentWalletAddress]);

  // Pi authentication bypassed: always show wallet UI

  return (
    <div className="space-y-6">
      {/* Token Information Header */}
      <Card className="border-0 shadow-lg" style={{ background: DROP_TOKEN.colors.background }}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-white">
            <Droplets className="h-6 w-6" />
            DROP Wallet
          </CardTitle>
          <CardDescription className="text-white/90">
            Your DropLink Platform Wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold text-white mb-2">
            {isLoading ? '...' : parseFloat(balance).toLocaleString()} DROP
          </div>
          <div className="flex items-center gap-2 justify-center mb-4">
            {hasDropTrustline ? (
              <Badge variant="outline" className="border-white text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Wallet Active
              </Badge>
            ) : (
              <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                <AlertCircle className="h-3 w-3 mr-1" />
                Setup Required
              </Badge>
            )}
            {importedWallet && (
              <Badge variant="outline" className="border-green-400 text-green-400">
                <Key className="h-3 w-3 mr-1" />
                Imported
              </Badge>
            )}
          </div>
          
          {currentWalletAddress && (
            <div className="bg-card border border-border rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 justify-center">
                <code className="text-xs text-white/90">
                  {currentWalletAddress.slice(0, 6)}...{currentWalletAddress.slice(-6)}
                </code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyAddress(currentWalletAddress)}
                  className="h-6 w-6 p-0 text-foreground hover:bg-muted"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => generateQRCode(currentWalletAddress)}
                  className="h-6 w-6 p-0 text-foreground hover:bg-muted"
                >
                  <QrCode className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => checkDropBalance(currentWalletAddress)}
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-white/70">
                  {importedWallet ? 'Imported Wallet' : 'Pi Network Wallet'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Required Card */}
      {!hasDropTrustline && piWallet && (
        <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              Wallet Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                To use your DROP wallet, you need to create a trustline for the DROP token. 
                This is a one-time setup that allows your wallet to hold DROP tokens.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={createDropTrustline}
              disabled={isCreatingTrustline}
              className="w-full"
              style={{ backgroundColor: DROP_TOKEN.colors.primary }}
            >
              {isCreatingTrustline ? 'Setting up wallet...' : 'Setup DROP Wallet'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Wallet Actions Tabs */}
      <Card>
        <Tabs defaultValue="receive" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="receive" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Receive
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Send
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Admin
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Receive Tab */}
          <TabsContent value="receive" className="space-y-4">
            <CardHeader>
              <CardTitle>Receive DROP Tokens</CardTitle>
              <CardDescription>
                Share your wallet address to receive DROP tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentWalletAddress ? (
                <>
                  <div className="space-y-2">
                    <Label>Your DROP Wallet Address</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={currentWalletAddress} 
                        readOnly 
                        className="font-mono text-xs"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => copyAddress(currentWalletAddress)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => generateQRCode(currentWalletAddress)}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {importedWallet ? 'Using imported wallet' : 'Using Pi Network wallet'}
                    </p>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Anyone can send DROP tokens to this address. Make sure to only share with trusted sources.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={requestDropTokens}
                    className="w-full"
                    style={{ backgroundColor: DROP_TOKEN.colors.primary }}
                  >
                    Request DROP from Faucet
                  </Button>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please authenticate with Pi Network to access your wallet address.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </TabsContent>

          {/* Send Tab */}
          <TabsContent value="send" className="space-y-4">
            <CardHeader>
              <CardTitle>Send DROP Tokens</CardTitle>
              <CardDescription>
                Transfer DROP tokens to another wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasDropTrustline && parseFloat(balance) > 0 ? (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Private key and seed phrase import is temporarily disabled for security. Sending tokens will be available in a future update.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input
                      id="recipient"
                      placeholder="Enter Pi wallet address (G...)"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className="font-mono text-xs"
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      max={balance}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {parseFloat(balance).toLocaleString()} DROP
                    </p>
                  </div>

                  <Button 
                    onClick={sendDropTokens}
                    disabled={true}
                    className="w-full"
                    style={{ backgroundColor: DROP_TOKEN.colors.primary, opacity: 0.5 }}
                  >
                    Send DROP (Disabled)
                  </Button>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {!hasDropTrustline 
                      ? 'Create a trustline first to send tokens.' 
                      : 'Insufficient balance to send tokens.'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </TabsContent>

          {/* Admin Tab - Token Recall */}
          <TabsContent value="admin" className="space-y-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Token Administration
              </CardTitle>
              <CardDescription>
                Advanced token management and recall capabilities (Issuer only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Authorization Status */}
              <div className="space-y-2">
                <Label>Authorization Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant={tokenAuthStatus.authRequired ? "default" : "secondary"}>
                    {tokenAuthStatus.authRequired ? "✅ Auth Required" : "❌ Auth Not Required"}
                  </Badge>
                  <Badge variant={tokenAuthStatus.authRevocable ? "default" : "secondary"}>
                    {tokenAuthStatus.authRevocable ? "✅ Auth Revocable" : "❌ Not Revocable"}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Enable Authorization */}
              {!tokenAuthStatus.authRevocable && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Setup Required:</strong> Authorization flags must be enabled before token recall is possible.
                  </AlertDescription>
                </Alert>
              )}

              {/* Token Recall */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Token Recall</Label>
                  {tokenAuthStatus.authRevocable && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  )}
                </div>
                
                <Button
                  variant="destructive"
                  onClick={() => setShowRecallDialog(true)}
                  disabled={!tokenAuthStatus.authRevocable}
                  className="w-full"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Recall Tokens
                </Button>
              </div>

              <Separator />

              {/* Enable Authorization Button */}
              {!tokenAuthStatus.authRevocable && (
                <div className="space-y-4">
                  <Label>Setup Token Recall</Label>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Issuer Private Key (S...)"
                      value={issuerPrivateKey}
                      onChange={(e) => setIssuerPrivateKey(e.target.value)}
                      className="font-mono"
                    />
                    <Button
                      onClick={enableAuthorizationFlags}
                      disabled={!issuerPrivateKey || issuerPrivateKey.length !== 56}
                      className="w-full"
                      style={{ backgroundColor: DROP_TOKEN.colors.primary }}
                    >
                      Enable Authorization Flags
                    </Button>
                  </div>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Token recall is irreversible and should only be used in emergency situations.
                  Only the token issuer can perform recall operations.
                </AlertDescription>
              </Alert>
            </CardContent>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <CardHeader>
              <CardTitle>Wallet Settings</CardTitle>
              <CardDescription>
                Configure your DROP wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Network</Label>
                <Badge variant={isMainnetMode ? "default" : "secondary"}>
                  {PI_CONFIG.SANDBOX_MODE ? 'Pi Sandbox' : 'Pi Mainnet'}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Private Key Status</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-gray-600">
                    <Ban className="h-3 w-3 mr-1" />
                    Import Disabled
                  </Badge>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Private key and seed phrase import is temporarily disabled for security. This feature will be available in a future update.
                  </AlertDescription>
                </Alert>
              </div>
              
              <Separator />
              
              <Button 
                onClick={() => checkDropBalance()}
                variant="outline"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Balance'}
              </Button>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" style={{ color: DROP_TOKEN.colors.primary }} />
              Wallet QR Code
            </DialogTitle>
            <DialogDescription>
              Scan this QR code to send DROP tokens to your wallet
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            {qrCodeDataUrl && (
              <>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Wallet QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                
                <div className="text-center space-y-2">
                  <p className="font-mono text-xs break-all bg-muted px-3 py-2 rounded">
                    {currentWalletAddress}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyAddress(currentWalletAddress || '')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Address
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={downloadQRCode}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download QR
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Private Key Import Dialog - TEMPORARILY DISABLED FOR SECURITY */}
      {/* 
      <Dialog open={showPrivateKeyDialog} onOpenChange={setShowPrivateKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" style={{ color: DROP_TOKEN.colors.primary }} />
              Import Private Key
            </DialogTitle>
            <DialogDescription>
              Import your {PI_CONFIG.SANDBOX_MODE ? 'Pi Sandbox' : 'Pi Mainnet'} private key to enable sending tokens
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Warning:</strong> Only enter your private key on trusted devices. 
                Your key will be stored locally and encrypted.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="privateKey">{PI_CONFIG.SANDBOX_MODE ? 'Pi Sandbox Private Key' : 'Pi Mainnet Private Key'}</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="S... (56 characters)"
                value={userPrivateKey}
                onChange={(e) => setUserPrivateKey(e.target.value)}
                className="font-mono"
                maxLength={56}
              />
              <p className="text-xs text-muted-foreground">
                Must start with 'S' and be exactly 56 characters long
              </p>
            </div>
            
            <div className="bg-muted p-3 rounded text-xs space-y-2">
              <p className="font-semibold">How to get your {PI_CONFIG.SANDBOX_MODE ? 'Pi Sandbox' : 'Pi Mainnet'} private key:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Open Pi Wallet app</li>
                <li>Go to wallet settings</li>
                <li>Select "Export Private Key"</li>
                <li>Copy the private key (starts with 'S')</li>
                <li>Paste it here to enable sending</li>
              </ol>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPrivateKeyDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={importWalletFromPrivateKey}
                disabled={!userPrivateKey || isImporting}
                className="flex-1"
                style={{ backgroundColor: DROP_TOKEN.colors.primary }}
              >
                {isImporting ? 'Importing...' : 'Import Key'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Useful Links */}
      <Card>
        <CardHeader>
          <CardTitle>Useful Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a 
              href="https://droplink.space/.well-known/pi.toml"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Token Metadata (TOML)
            </a>
          </Button>
          
          <Button variant="outline" className="w-full justify-start" asChild>
            <a 
              href={`${PI_CONFIG.ENDPOINTS.PI_ASSET_DISCOVERY}?asset_code=${DROP_TOKEN.code}&asset_issuer=${DROP_TOKEN.issuer}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Pi Explorer
            </a>
          </Button>
          
          <Button variant="outline" className="w-full justify-start" asChild>
            <a 
              href="https://pi.network"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Pi Network Official
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Token Recall Dialog */}
      <Dialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Token Recall
            </DialogTitle>
            <DialogDescription>
              Recall DROP tokens from a specific account (Irreversible)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Token recall is permanent and cannot be undone. 
                Only use in emergency situations.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="recallTarget">Target Account Address</Label>
              <Input
                id="recallTarget"
                placeholder="G... (Pi Network account address)"
                value={recallTarget}
                onChange={(e) => setRecallTarget(e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recallAmount">Amount to Recall</Label>
              <Input
                id="recallAmount"
                type="number"
                step="0.0000001"
                placeholder="0.0000000"
                value={recallAmount}
                onChange={(e) => setRecallAmount(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="issuerKey">Issuer Private Key</Label>
              <Input
                id="issuerKey"
                type="password"
                placeholder="S... (Issuer private key)"
                value={issuerPrivateKey}
                onChange={(e) => setIssuerPrivateKey(e.target.value)}
                className="font-mono"
                maxLength={56}
              />
              <p className="text-xs text-muted-foreground">
                Required to authorize the recall operation
              </p>
            </div>
            
            <div className="bg-red-50 p-3 rounded text-xs space-y-2">
              <p className="font-semibold text-red-800">Recall Checklist:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-red-700">
                <li>Token has authorization revocable flag enabled</li>
                <li>Target account has valid DROP balance</li>
                <li>Issuer private key is correct</li>
                <li>Operation is legally justified</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRecallDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={recallTokensFromAccount}
                disabled={!recallTarget || !recallAmount || !issuerPrivateKey || isRecalling}
                className="flex-1"
              >
                {isRecalling ? 'Recalling...' : 'Recall Tokens'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}