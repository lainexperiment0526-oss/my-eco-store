import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, CreditCard, CheckCircle, AlertCircle, Droplets, User, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";

interface PiAccount {
  user_id: string;
  pi_username: string;
  display_name: string;
  plan_type: string;
  subscription_status: string;
  wallet_address?: string;
  created_at: string;
  is_primary: boolean;
}

interface MultipleAccountManagerProps {
  currentUser: any;
  onAccountSwitch: (account: PiAccount) => void;
}

export const MultipleAccountManager: React.FC<MultipleAccountManagerProps> = ({ 
  currentUser, 
  onAccountSwitch 
}) => {
  const [accounts, setAccounts] = useState<PiAccount[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUsernameChecking, setIsUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { toast } = useToast();
  const { piUser, createAccount, loadUserAccounts, switchAccount, checkUsernameAvailability: checkUsername, createPayment, availableAccounts } = usePi();

  const ACCOUNT_CREATION_FEE = 10; // 10 PI

  useEffect(() => {
    loadAccounts();
  }, [piUser?.uid]);

  const loadAccounts = async () => {
    try {
      const accounts = await loadUserAccounts();
      if (accounts && accounts.length > 0) {
        setAccounts(accounts);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
      toast({
        title: "Error Loading Accounts",
        description: "Failed to load your accounts. Please try again.",
        variant: "destructive"
      });
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim() || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsUsernameChecking(true);
    
    try {
      const available = await checkUsername(username.trim());
      setUsernameAvailable(available);
    } catch (error) {
      console.error('Username check failed:', error);
      setUsernameAvailable(false);
    } finally {
      setIsUsernameChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Clean username: only allow letters, numbers, underscores
    const cleanedValue = value.replace(/[^a-zA-Z0-9_]/g, '');
    setNewUsername(cleanedValue);
    
    // Debounce username check
    if (cleanedValue !== value) return; // Don't check if we had to clean it
    
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(cleanedValue);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const createAdditionalAccount = async () => {
    if (!newUsername.trim() || !usernameAvailable) {
      toast({
        title: "Invalid Username",
        description: "Please choose a valid and available username.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // For additional accounts, process payment first
      if (accounts.length > 0) {
        setPaymentProcessing(true);
        
        const paymentData = {
          amount: ACCOUNT_CREATION_FEE,
          memo: `Additional DropLink account: ${newUsername}`,
          metadata: {
            type: 'account_creation',
            username: newUsername,
            pi_user_id: piUser?.uid
          }
        };

        const payment = await createPayment(ACCOUNT_CREATION_FEE, `Additional DropLink account: ${newUsername}`, paymentData.metadata);
        
        if (!payment) {
          throw new Error('Payment failed or was not completed');
        }
        
        setPaymentProcessing(false);
      }

      // Create the account
      const newAccount = await createAccount(newUsername.trim(), displayName.trim() || newUsername.trim());
      
      if (!newAccount) {
        throw new Error('Failed to create account - no account data returned');
      }

      toast({
        title: "Account Created Successfully!",
        description: `Your new account "${newUsername}" has been created. You can now switch to it.`,
        duration: 5000
      });

      // Reset form
      setNewUsername('');
      setDisplayName('');
      setUsernameAvailable(null);
      setIsCreateDialogOpen(false);

      // Reload accounts
      await loadAccounts();

    } catch (error) {
      console.error('Account creation failed:', error);
      toast({
        title: "Account Creation Failed",
        description: error.message || "Failed to create additional account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
      setPaymentProcessing(false);
    }
  };

  const switchToAccount = async (account: PiAccount) => {
    try {
      await switchAccount(account);

      toast({
        title: "Account Switched",
        description: `Switched to account: ${account.display_name}`,
      });

      onAccountSwitch(account);

    } catch (error) {
      console.error('Account switch failed:', error);
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch account. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getUsernameStatus = () => {
    if (!newUsername) return null;
    if (isUsernameChecking) return 'checking';
    if (usernameAvailable === true) return 'available';
    if (usernameAvailable === false) return 'taken';
    return null;
  };

  const canCreateAccount = newUsername.trim().length >= 3 && usernameAvailable === true && !isCreating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Multiple Accounts
        </CardTitle>
        <CardDescription>
          Manage multiple DropLink accounts with your Pi Network identity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Current Accounts */}
        <div>
          <h3 className="font-medium mb-3">Your Accounts ({accounts.length})</h3>
          <div className="space-y-2">
            {accounts.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No additional accounts found. Your primary account is managed through Pi Network authentication.
                </AlertDescription>
              </Alert>
            ) : (
              accounts.map((account) => (
                <div key={account.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {account.is_primary ? (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <User className="h-4 w-4 text-gray-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{account.display_name}</span>
                        {account.is_primary && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">@{account.pi_username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={account.plan_type === 'pro' ? 'default' : 'outline'} 
                          className="text-xs"
                        >
                          {account.plan_type}
                        </Badge>
                        <Badge 
                          variant={account.subscription_status === 'active' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {account.subscription_status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser?.pi_username === account.pi_username ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Current
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => switchToAccount(account)}
                      >
                        Switch
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Additional Account */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Create Additional Account</h3>
              <p className="text-sm text-gray-500">Each additional account costs {ACCOUNT_CREATION_FEE} PI</p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-yellow-500" />
                    Create Additional Account
                  </DialogTitle>
                  <DialogDescription>
                    Create a new DropLink account linked to your Pi Network identity.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <CreditCard className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      {accounts.length > 0 ? (
                        <>
                          <strong>Cost: {ACCOUNT_CREATION_FEE} PI</strong>
                          <br />
                          Payment will be processed through Pi Network.
                        </>
                      ) : (
                        <>
                          <strong>Your first account is FREE!</strong>
                          <br />
                          Additional accounts will cost {ACCOUNT_CREATION_FEE} PI each.
                        </>
                      )}
                    </AlertDescription>
                  </Alert>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Username *
                    </label>
                    <Input
                      value={newUsername}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="Enter unique username"
                      disabled={isCreating || paymentProcessing}
                      className={
                        getUsernameStatus() === 'taken' ? "border-red-300" :
                        getUsernameStatus() === 'available' ? "border-green-300" : ""
                      }
                    />
                    <div className="mt-1 text-xs">
                      {isUsernameChecking && (
                        <span className="text-gray-500">Checking availability...</span>
                      )}
                      {getUsernameStatus() === 'available' && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Username available
                        </span>
                      )}
                      {getUsernameStatus() === 'taken' && (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Username already taken
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Display Name (Optional)
                    </label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter display name"
                      disabled={isCreating || paymentProcessing}
                    />
                  </div>

                  {paymentProcessing && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-700">
                        Processing payment through Pi Network...
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <DialogFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setNewUsername('');
                      setDisplayName('');
                      setUsernameAvailable(null);
                    }}
                    disabled={isCreating || paymentProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createAdditionalAccount}
                    disabled={!canCreateAccount || paymentProcessing}
                  >
                    {paymentProcessing ? (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Processing Payment...
                      </>
                    ) : isCreating ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Creating...
                      </>
                    ) : accounts.length > 0 ? (
                      <>
                        <Droplets className="h-4 w-4 mr-2" />
                        Pay {ACCOUNT_CREATION_FEE} PI & Create
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Free Account
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>About Multiple Accounts:</strong>
              <br />
              • Each account has its own data, settings, and subscriptions
              <br />
              • You can switch between accounts anytime
              <br />
              • All accounts use your Pi Network identity for authentication
              <br />
              • The first account is free, additional ones cost {ACCOUNT_CREATION_FEE} PI each
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};