import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import droplinkLogo from "@/assets/droplink-logo.png";

const EmailAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [refInput, setRefInput] = useState("");

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      localStorage.setItem("referral_code", refCode);
      setRefInput(refCode);
    }
  }, [searchParams]);



  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!isLogin && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.user) {
          const { isNew } = await ensureProfileTracked(data.user);
          toast.success(isNew ? "Welcome! Your profile is ready." : "Welcome back!");
        } else {
          toast.success("Welcome back!");
        }
        navigate("/auth");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              auth_method: 'email'
            }
          }
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please log in instead.");
            setIsLogin(true);
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.user) {
          const { isNew } = await ensureProfileTracked(data.user);
          toast.success(isNew ? "Account created successfully! Welcome!" : "Welcome back!" );
          navigate("/auth");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const ensureProfileTracked = async (user: any) => {
    try {
      const emailUsername = user.email?.split("@")[0] || `user-${user.id.slice(0, 8)}`;
      const sanitizedUsername = emailUsername.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Look up existing profile by multiple stable identifiers
      const { data: existingProfile, error: selectError } = await supabase
        .from("profiles")
        .select("id,user_id,username,business_name")
        .or(`user_id.eq.${user.id},username.eq.${sanitizedUsername},business_name.eq.${sanitizedUsername}`)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error("Profile lookup error:", selectError);
      }

      if (existingProfile) {
        // Attach user_id if missing, preserve existing names when present
        const needsUserId = !existingProfile.user_id;
        const needsNames = !existingProfile.username || !existingProfile.business_name;

        if (needsUserId || needsNames) {
          const { data: updated, error: updateError } = await supabase
            .from("profiles")
            .update({
              user_id: existingProfile.user_id || user.id,
              username: existingProfile.username || sanitizedUsername,
              business_name: existingProfile.business_name || sanitizedUsername,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingProfile.id)
            .select("id,user_id,username,business_name")
            .single();

          if (updateError) {
            console.error("Profile update error:", updateError);
            return { profile: existingProfile, isNew: false };
          }

          return { profile: updated, isNew: false };
        }

        return { profile: existingProfile, isNew: false };
      }

      // Create profile if none exists
      
      // Resolve referral code if present
      let referredBy = null;
      let referralCodeId = null;
      let referredByUsername = null;
      let referredByCode = null;
      const savedRefCode = localStorage.getItem("referral_code");
      if (savedRefCode) {
        try {
          const { data: refData } = await supabase
            .from("referral_codes")
            .select("profile_id, uses_count, max_uses, id")
            .eq("code", savedRefCode)
            .maybeSingle();

          if (refData && (!refData.max_uses || refData.uses_count < refData.max_uses)) {
            referredBy = refData.profile_id;
            referralCodeId = refData.id;
            referredByCode = savedRefCode;
          } else {
            const { data: profileRef } = await supabase
              .from("profiles")
              .select("id, username")
              .eq("username", savedRefCode)
              .maybeSingle();
            if (profileRef?.id) {
              referredBy = profileRef.id;
              referredByUsername = profileRef.username;
              referredByCode = savedRefCode;
            }
          }
        } catch (e) {
          console.error("Error resolving referral code:", e);
        }
      }

      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          username: sanitizedUsername,
          business_name: sanitizedUsername,
          description: "",
          referred_by: referredBy,
          referred_by_code_id: referralCodeId,
          referred_by_username: referredByUsername,
          referred_by_code: referredByCode,
        })
        .select("id,user_id,username,business_name")
        .single();

      if (insertError) {
        console.error("Profile creation error:", insertError);
        return { profile: null, isNew: true };
      }

      // Update referral stats
      if (newProfile && referralCodeId) {
        try {
          await supabase.rpc('increment_referral_uses', { code_id: referralCodeId });
          localStorage.removeItem("referral_code");
        } catch (e) {
          console.error("Error updating referral stats:", e);
        }
      }

      // Track affiliate invite (pending) on signup
      if (newProfile?.id && referredBy) {
        try {
          await supabase
            .from("affiliate_invites")
            .insert({
              referral_code_id: referralCodeId,
              referrer_profile_id: referredBy,
              referred_profile_id: newProfile.id,
              referred_username: newProfile.username || null,
              plan_type: "free",
              reward_pi: 0,
              status: "pending"
            });
        } catch (e) {
          console.warn("Affiliate invite insert failed:", e);
        }
      }

      return { profile: newProfile, isNew: true };
    } catch (error) {
      console.error("Error ensuring profile tracking:", error);
      return { profile: null, isNew: false };
    }
  };

  return (
    <div className="min-h-screen bg-sky-400 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={droplinkLogo} 
              alt="Droplink" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <CardTitle className="text-2xl">{isLogin ? 'Sign In with Email' : 'Sign Up with Email'}</CardTitle>
          <CardDescription className="mt-2">Sign in or sign up with your Gmail/Email account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="referral">Referral code or username (optional)</Label>
              <Input
                id="referral"
                type="text"
                value={refInput}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  setRefInput(value);
                  if (value) {
                    localStorage.setItem("referral_code", value);
                  }
                }}
                placeholder="Enter referral code or Pi username"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Signing Up...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </Button>
            <div className="flex justify-between mt-2">
              <button
                type="button"
                className="text-primary hover:underline text-xs"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
              >
                {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
              </button>
              <button
                type="button"
                className="text-primary hover:underline text-xs"
                onClick={() => navigate('/auth')}
                disabled={loading}
              >
                Use Pi Network
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAuth;

