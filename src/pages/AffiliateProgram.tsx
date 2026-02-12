import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Copy, Award, TrendingUp, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";

interface ReferralCode {
  id: string;
  code: string;
  uses_count: number;
  max_uses: number;
  reward_type: string;
  reward_value: number;
  is_active: boolean;
}

interface AffiliateInvite {
  id: string;
  referred_username?: string | null;
  plan_type: string;
  reward_pi: number;
  status: string;
  created_at: string;
}

const AffiliateProgram: React.FC = () => {
  const { piUser, isAuthenticated, signIn, loading: piLoading } = usePi();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [newCode, setNewCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [invites, setInvites] = useState<AffiliateInvite[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handlePiAuth = async () => {
    try {
      await signIn(["username", "payments", "wallet_address"]);
    } catch (error) {
      console.error("Pi authentication failed:", error);
      toast.error("Failed to authenticate with Pi Network");
    }
  };

  const fetchAffiliateData = async () => {
    if (!piUser?.username) return;

    try {
      setLoading(true);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", piUser.username)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile for affiliate:", profileError);
        return;
      }

      if (!profile?.id) {
        return;
      }

      setProfileId(profile.id);

      const { data: code, error: codeError } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (codeError) {
        console.error("Error fetching referral code:", codeError);
      }

      if (code) {
        setReferralCode(code as ReferralCode);
      }

      const { data: inviteData, error: inviteError } = await supabase
        .from("affiliate_invites")
        .select("id, referred_username, plan_type, reward_pi, status, created_at")
        .eq("referrer_profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (inviteError) {
        console.error("Error fetching affiliate invites:", inviteError);
      } else {
        setInvites(inviteData || []);
      }
    } catch (error) {
      console.error("Error fetching affiliate data:", error);
      toast.error("Failed to load affiliate data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && piUser?.username) {
      fetchAffiliateData();
      if (!newCode) {
        setNewCode(piUser.username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15));
      }
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, piUser]);

  const handleCreateCode = async () => {
    if (!newCode.trim()) {
      toast.error("Please enter a code");
      return;
    }
    
    if (!piUser?.username) {
        toast.error("User profile not loaded");
        return;
    }

    try {
      setIsCreating(true);
      const profileIdToUse = profileId;
      if (!profileIdToUse) {
        throw new Error("Profile not found");
      }

      const { error } = await supabase
        .from("referral_codes")
        .insert({
          profile_id: profileIdToUse,
          code: newCode.trim().toUpperCase(),
          reward_type: "pi_coins", // Default reward
          reward_value: 1, // Default value
          max_uses: 1000,
          is_active: true
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.error("This code is already taken. Please try another one.");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Referral code created successfully!");
      await fetchAffiliateData();
    } catch (error) {
      console.error("Error creating code:", error);
      toast.error("Failed to create referral code");
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = () => {
    if (referralCode) {
      navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${referralCode.code}`);
      toast.success("Referral link copied to clipboard!");
    }
  };

  const totals = invites.reduce(
    (acc, invite) => {
      const reward = Number(invite.reward_pi || 0);
      if (invite.status === "paid") {
        acc.paid += reward;
        acc.earned += reward;
      } else if (invite.status === "earned") {
        acc.earned += reward;
      }
      return acc;
    },
    { earned: 0, paid: 0 }
  );

  const available = Math.max(0, totals.earned - totals.paid);

  const handleWithdraw = async () => {
    if (!profileId) {
      toast.error("Profile not loaded");
      return;
    }
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > available) {
      toast.error("Withdrawal amount exceeds available earnings");
      return;
    }

    try {
      setIsWithdrawing(true);
      const { error } = await supabase
        .from("withdrawals")
        .insert({
          profile_id: profileId,
          amount,
          status: "pending",
          withdrawal_type: "affiliate"
        });

      if (error) {
        throw error;
      }

      toast.success("Withdrawal request submitted");
      setWithdrawAmount("");
    } catch (error) {
      console.error("Withdrawal request failed:", error);
      toast.error("Failed to request withdrawal");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-sky-400 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-center text-slate-900">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-slate-600">
              Please sign in with Pi Network to access the Affiliate Program.
            </p>
            <Button 
              onClick={handlePiAuth} 
              disabled={piLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {piLoading ? "Connecting..." : "Sign in with Pi Network"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Affiliate Program" 
        description="Earn rewards by inviting friends"
        icon={<Users />}
      />
      <div className="min-h-screen bg-sky-400 p-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Referrals</p>
                    <h3 className="text-2xl font-bold text-slate-900">{invites.length}</h3>
                  </div>
                  <Users className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Earned Rewards</p>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {totals.earned.toFixed(2)}
                    </h3>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Conversion Rate</p>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {invites.length ? "100%" : "0%"}
                    </h3>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Available Earnings</CardTitle>
              <CardDescription className="text-slate-600">Request a payout of your earned Pi rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-600">
                Available: <span className="font-semibold text-slate-900">{available.toFixed(2)} Pi</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                />
                <Button onClick={handleWithdraw} disabled={isWithdrawing}>
                  {isWithdrawing ? "Submitting..." : "Request Withdraw"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Code Management */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Your Referral Code</CardTitle>
              <CardDescription className="text-slate-600">Share this code to earn rewards when new users sign up.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4 text-slate-600">Loading...</div>
              ) : referralCode ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg border border-dashed border-blue-300">
                    <Award className="h-6 w-6 text-blue-600" />
                    <span className="text-2xl font-mono font-bold tracking-wider flex-1 text-center text-slate-900">
                      {referralCode.code}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => {
                        navigator.clipboard.writeText(referralCode.code);
                        toast.success("Code copied!");
                    }}>
                      <Copy className="h-4 w-4 text-slate-600" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-slate-700">Referral Link</p>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={`${window.location.origin}/auth?ref=${referralCode.code}`} 
                        className="bg-slate-50 border-slate-200"
                      />
                      <Button onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${referralCode.code}`);
                        toast.success("Link copied!");
                      }} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Copy Link
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100">
                    <p className="font-semibold mb-1">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li>Share your unique code or link with friends</li>
                      <li>They get a welcome bonus when they sign up</li>
                      <li>You earn {referralCode.reward_value} {referralCode.reward_type.replace('_', ' ')} for every qualified referral</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">You don't have a referral code yet. Create one to start earning!</p>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter your custom code (e.g. MYBRAND2025)" 
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      maxLength={15}
                      className="bg-slate-50 border-slate-200"
                    />
                    <Button onClick={handleCreateCode} disabled={isCreating || !newCode} className="bg-blue-600 hover:bg-blue-700 text-white">
                      {isCreating ? "Creating..." : "Create Code"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Your Invites</CardTitle>
              <CardDescription className="text-slate-600">See who joined and how much you earned</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-slate-600">Loading...</div>
              ) : invites.length === 0 ? (
                <div className="text-sm text-slate-600">No invites yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">User</th>
                        <th className="text-left py-2">Plan</th>
                        <th className="text-left py-2">Reward</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((invite) => (
                        <tr key={invite.id} className="border-b last:border-0">
                          <td className="py-2">@{invite.referred_username || "unknown"}</td>
                          <td className="py-2 capitalize">{invite.plan_type}</td>
                          <td className="py-2">{Number(invite.reward_pi || 0).toFixed(2)} Pi</td>
                          <td className="py-2 capitalize">{invite.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
      <FooterNav />
    </>
  );
};

export default AffiliateProgram;
