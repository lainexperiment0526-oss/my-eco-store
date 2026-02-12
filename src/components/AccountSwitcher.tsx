import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, User, Crown, CheckCircle, UserPlus, Settings } from "lucide-react";
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

interface AccountSwitcherProps {
  currentAccount?: PiAccount;
  onAccountSwitch: (account: PiAccount) => void;
  onOpenAccountManager?: () => void;
  onOpenSettings?: () => void;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  currentAccount,
  onAccountSwitch,
  onOpenAccountManager,
  onOpenSettings
}) => {
  const [accounts, setAccounts] = useState<PiAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { piUser, switchAccount, loadUserAccounts } = usePi();

  useEffect(() => {
    loadAccounts();
  }, [piUser?.uid]);

  const loadAccounts = async () => {
    if (!piUser?.uid) return;

    setIsLoading(true);
    try {
      const accounts = await loadUserAccounts();
      if (accounts && accounts.length > 0) {
        setAccounts(accounts);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSwitch = async (account: PiAccount) => {
    if (account.pi_username === currentAccount?.pi_username) return;

    try {
      await switchAccount(account);

      toast({
        title: "Account Switched",
        description: `Now using account: ${account.display_name}`,
      });

      onAccountSwitch(account);

    } catch (error) {
      console.error('Account switch failed:', error);
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch account",
        variant: "destructive"
      });
    }
  };

  const fetchAvatarFromPollination = async () => {
    const prompt = `Generate a 3D stylized profile avatar character in a warm, friendly Pixar-inspired style mixed with Google Material You softness. Rounded facial features, expressive eyes, clean soft shadows, and pastel color accents. No real humans — entirely animated style. Include random variations such as: [RANDOM GENDER: male / female / nonbinary] [RANDOM AGE: 18–60] [RANDOM OCCUPATION: baker, creator, coder, seller, mompreneur, rider, artist, student, boutique owner] [RANDOM HAIR STYLE: short fade, curly bob, long waves, ponytail, textured curls] [RANDOM HAIR COLOR: brown, black, blonde, pastel pink, purple highlights] [RANDOM SKIN TONE: light, tan, olive, rich brown, deep] [RANDOM OUTFIT: hoodie, apron, jacket, casual shirt, business casual] [RANDOM ACCESSORY: glasses, earrings, headset, cap, scarf] Background: simple pastel gradient (purple, blue, pink, soft teal) with a subtle Material You glow. Lighting: soft Pixar ambient light + gentle rim light. Mood: friendly, warm, welcoming. Camera: clean portrait, centered, head and shoulders. Resolution: crisp 4K.`;

    const response = await fetch("https://api.pollination.com/generate-avatar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer YOUR_API_KEY`, // Replace with your Pollination API key
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch avatar from Pollination API");
    }

    const data = await response.json();
    return data.avatarUrl; // Assuming the API returns the avatar URL in this field
  };

  const AvatarWithPollination: React.FC<{ displayName: string; username: string }> = ({
    displayName,
    username,
  }) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
      const fetchAvatar = async () => {
        try {
          const url = await fetchAvatarFromPollination();
          setAvatarUrl(url);
        } catch (error) {
          console.error("Error fetching avatar:", error);
        }
      };

      fetchAvatar();
    }, []);

    return (
      <Avatar className="h-8 w-8">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={`${displayName}'s avatar`} />
        ) : (
          <div className="bg-gray-300 h-full w-full rounded-full" />
        )}
      </Avatar>
    );
  };

  const getAccountInitials = (displayName: string, username: string) => {
    if (displayName && displayName !== username) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return username.slice(0, 2).toUpperCase();
  };

  const currentDisplayAccount = currentAccount || accounts.find(acc => acc.is_primary);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-auto">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentDisplayAccount?.pi_username || 'unknown'}`}
              alt={`${currentDisplayAccount?.display_name}'s avatar`} 
            />
          </Avatar>
          
          <div className="flex flex-col items-start text-left min-w-0">
            <div className="flex items-center gap-1 max-w-[120px]">
              <span className="font-medium text-sm truncate">
                {currentDisplayAccount?.display_name || 'Unknown'}
              </span>
              {currentDisplayAccount?.is_primary && (
                <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            <span className="text-xs text-gray-500 truncate max-w-[120px]">
              @{currentDisplayAccount?.pi_username || 'unknown'}
            </span>
          </div>
          
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex items-center justify-between">
            <span>Your Accounts</span>
            <Badge variant="outline" className="text-xs">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {/* Account List */}
        <div className="max-h-60 overflow-y-auto">
          {accounts.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-gray-500">
              {isLoading ? 'Loading accounts...' : 'No accounts found'}
            </div>
          ) : (
            accounts.map((account) => (
              <DropdownMenuItem
                key={account.user_id}
                className="px-3 py-3 cursor-pointer focus:bg-gray-50"
                onClick={() => handleAccountSwitch(account)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage className="text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {getAccountInitials(account.display_name, account.pi_username)}
                    </AvatarImage>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {account.display_name}
                      </span>
                      {account.is_primary && (
                        <Crown className="h-3 w-3 text-yellow-500" />
                      )}
                      {currentAccount?.pi_username === account.pi_username && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 truncate mb-1">
                      @{account.pi_username}
                    </p>
                    
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant={account.plan_type === 'pro' ? 'default' : 'outline'} 
                        className="text-xs px-1.5 py-0.5 h-auto"
                      >
                        {account.plan_type}
                      </Badge>
                      <Badge 
                        variant={account.subscription_status === 'active' ? 'default' : 'outline'}
                        className="text-xs px-1.5 py-0.5 h-auto"
                      >
                        {account.subscription_status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    {currentAccount?.pi_username === account.pi_username ? (
                      <Badge variant="default" className="text-xs px-2 py-1">
                        Current
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                        Switch
                      </Button>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {accounts.length > 0 && <DropdownMenuSeparator />}

        {/* Management Options */}
        {onOpenAccountManager && (
          <DropdownMenuItem
            className="px-3 py-2 cursor-pointer"
            onClick={() => onOpenAccountManager()}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            <span>Manage Accounts</span>
          </DropdownMenuItem>
        )}

        {onOpenSettings && (
          <DropdownMenuItem
            className="px-3 py-2 cursor-pointer"
            onClick={() => onOpenSettings()}
          >
            <Settings className="h-4 w-4 mr-2" />
            <span>Account Settings</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Account Info */}
        {currentDisplayAccount && (
          <div className="px-3 py-2 text-xs text-gray-500 border-t">
            <div className="flex items-center justify-between">
              <span>Pi Network ID:</span>
              <code className="bg-gray-100 px-1 rounded text-xs">
                {piUser?.uid?.slice(-8) || 'N/A'}
              </code>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};