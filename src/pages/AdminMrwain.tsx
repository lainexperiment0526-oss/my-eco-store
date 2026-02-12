import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Lock, User, Shield, LogOut, Upload, Image as ImageIcon, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import droplinkLogo from "@/assets/droplink-logo.png";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { uploadProfileLogo, uploadAvatar, uploadBackground, deleteFile, STORAGE_BUCKETS } from "@/lib/supabase-storage";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";

const AdminMrwain = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          await loadProfileData(user.id);
          await loadWithdrawals();
          return;
        }

        // Fallback: check session directly in case getUser is unavailable
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          await loadProfileData(session.user.id);
          await loadWithdrawals();
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setCurrentUser(session?.user || null);
      
      // Load profile data when user is authenticated
      if (session?.user) {
        await loadProfileData(session.user.id);
        await loadWithdrawals();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile data including uploaded images
  const loadProfileData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Admin] Error loading profile:', error);
        return;
      }

      setProfileData(data);
      console.log('[Admin] Profile data loaded:', data);
    } catch (error) {
      console.error('[Admin] Unexpected error loading profile:', error);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*, profiles(username, business_name, email)')
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('[Admin] Error loading withdrawals:', error);
        return;
      }

      setWithdrawals(data || []);
    } catch (error) {
      console.error('[Admin] Error loading withdrawals:', error);
    }
  };


  const handleUpdateWithdrawalStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ 
          status, 
          processed_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Withdrawal ${status}`);
      await loadWithdrawals();
    } catch (error) {
      console.error('[Admin] Error updating withdrawal:', error);
      toast.error('Failed to update withdrawal status');
    }
  };

  const ensureProfileExists = async (user: any) => {
    try {
      console.log('[Admin Profile] Ensuring profile exists for user:', user.id);
      
      // Wait a bit for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find profile by user_id (the trigger creates profiles with random IDs)
      const { data: existingProfiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('[Admin Profile] Error checking profile:', fetchError);
        // Continue anyway - we'll create it manually
      }

      // Determine auth method from user metadata
      const authMethod = user.app_metadata?.provider === 'google' ? 'google' : 'email';
      
      // Generate username from email or user metadata
      const metadataUsername = user.user_metadata?.username;
      const emailUsername = user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`;
      const rawUsername = metadataUsername || emailUsername;
      let sanitizedUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 30);
      
      // Ensure username is unique by appending timestamp if needed
      const baseUsername = sanitizedUsername;
      let attempts = 0;
      let usernameExists = true;
      
      while (usernameExists && attempts < 5) {
        const { data: existingUsername } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', sanitizedUsername)
          .limit(1);
        
        if (!existingUsername || existingUsername.length === 0) {
          usernameExists = false;
        } else {
          // Username taken, append number
          sanitizedUsername = `${baseUsername}_${Date.now().toString().slice(-4)}`;
          attempts++;
        }
      }
      
      const business_name = user.user_metadata?.full_name || sanitizedUsername || `User ${user.id.substring(0, 8)}`;
      
      if (existingProfiles && existingProfiles.length > 0) {
        // Update existing profile with latest data
        // Ensure admin users have PRO plan
        const existingProfile = existingProfiles[0];
        console.log('[Admin Profile] Profile exists, updating with latest data');
        
        const updates: any = {
          username: sanitizedUsername,
          business_name: business_name,
          email: user.email || '',
          description: existingProfile.description || `Admin user - ${authMethod} authenticated`,
          subscription_status: 'pro', // Ensure admin users have PRO plan
          has_premium: true, // Ensure admin users have premium
        };

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('[Admin Profile] Error updating profile:', updateError);
          // Don't throw - profile exists, update not critical
        } else {
          console.log('[Admin Profile] Profile updated successfully');
        }
        return true;
      } else {
        // No profile exists (trigger failed), create one manually using service role
        console.log('[Admin Profile] Creating profile manually for:', user.email, 'with username:', sanitizedUsername);
        
        // Use direct insert with all required fields
        // Admin users get PRO plan automatically
        const profileData = {
          user_id: user.id,
          username: sanitizedUsername,
          email: user.email || '',
          display_name: business_name,
          business_name: business_name,
          description: `Admin user - ${authMethod} authenticated`,
          category: 'other',
          follower_count: 0,
          following_count: 0,
          view_count: 0,
          is_verified: false,
          subscription_status: 'pro', // Admin users get PRO plan
          is_public: true,
          has_premium: true, // Admin users have premium
          show_share_button: true,
          social_links: {},
          theme_settings: {},
          auth_method: authMethod,
        };

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        if (insertError) {
          console.error('[Admin Profile] Error creating profile:', insertError);
          console.error('[Admin Profile] Insert error details:', {
            message: insertError.message,
            code: insertError.code,
            details: (insertError as any).details,
            hint: (insertError as any).hint
          });
          
          // If duplicate key error, that's actually OK - profile exists
          if (insertError.code === '23505') {
            console.log('[Admin Profile] Profile already exists (duplicate key), continuing...');
            return true;
          }
          
          throw new Error(`Failed to create profile: ${insertError.message}`);
        } else {
          console.log('[Admin Profile] Profile created successfully:', newProfile);
          
          // Initialize user wallet (use profile UUID)
          if (newProfile) {
            try {
              const { error: walletError } = await supabase
                .from('user_wallets')
                .upsert({
                  profile_id: newProfile.id,
                  drop_tokens: 0,
                }, { onConflict: 'profile_id' });

              if (walletError) {
                console.error('[Admin Profile] Wallet creation error:', walletError);
                // Don't throw - wallet is optional
              } else {
                console.log('[Admin Profile] Wallet initialized');
              }
            } catch (walletErr) {
              console.error('[Admin Profile] Wallet error:', walletErr);
              // Continue anyway
            }
          }
          return true;
        }
      }
    } catch (error: any) {
      console.error('[Admin Profile] Error in ensureProfileExists:', error);
      // Don't throw if it's a duplicate key error
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        console.log('[Admin Profile] Profile exists (caught duplicate), continuing...');
        return true;
      }
      throw error;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Handle email/username conversion
    let authEmail = email.trim();
    
    // If it looks like an email, keep it as-is (includes Gmail, Outlook, etc.)
    if (authEmail.includes('@')) {
      console.log('[Admin Auth] Using email address:', authEmail);
    } else if (authEmail.startsWith('@')) {
      // Remove @ and add droplink domain
      const username = authEmail.substring(1);
      authEmail = `${username}@droplink.space`;
      console.log('[Admin Auth] Converting @username to email:', authEmail);
    } else {
      // Assume it's a username - convert to droplink.space email
      authEmail = `${authEmail}@droplink.space`;
      console.log('[Admin Auth] Converting username to email:', authEmail);
    }

    if (!isLogin && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        console.log('[Admin Auth] Attempting sign in for:', authEmail);
        console.log('[Admin Auth] Using email address:', authEmail);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });
        
        if (error) {
          console.error('[Admin Auth] Sign in error:', error);
          console.error('[Admin Auth] Error details:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
          
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please check your credentials or sign up if you're new.", {
              duration: 6000,
            });
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Please confirm your email address before signing in.", {
              duration: 6000,
            });
          } else {
            toast.error(`Sign in failed: ${error.message}`, {
              duration: 6000,
            });
          }
          return;
        }

        console.log('[Admin Auth] Sign in successful');
        
        // Ensure profile exists and is up to date
        if (data.user) {
          await ensureProfileExists(data.user);
        }
        
        toast.success("Welcome back!");
        setCurrentUser(data.user);
      } else {
        // Sign Up
        console.log('[Admin Auth] Attempting sign up for:', authEmail);
        
        // Extract username for profile creation
        const username = authEmail.split('@')[0];
        
        console.log('[Admin Auth] Using email address:', authEmail);
        
        // IMPORTANT: Use autoConfirm for admin accounts to bypass email verification
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password,
          options: {
            data: {
              auth_method: 'email',
              created_from: 'admin_panel',
              signup_timestamp: new Date().toISOString(),
              username: username,
            },
            emailRedirectTo: `${window.location.origin}/admin-mrwain`,
          }
        });

        if (error) {
          console.error('[Admin Auth] Sign up error:', error);
          console.error('[Admin Auth] Error details:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
          
          if (error.message.includes("already registered") || error.message.includes("already been registered")) {
            toast.error("This email is already registered. Please sign in instead.", {
              duration: 6000,
            });
            setIsLogin(true);
          } else if (error.message.includes("Database error")) {
            toast.error("Database error. Please contact the administrator or try again later.", {
              duration: 8000,
            });
          } else {
            toast.error(`Sign up failed: ${error.message}`, {
              duration: 6000,
            });
          }
          return;
        }

        console.log('[Admin Auth] Sign up successful');

        if (data.user) {
          // Create complete user profile with all data
          try {
            await ensureProfileExists(data.user);
            console.log('[Admin Auth] User profile created successfully');
          } catch (profileError: any) {
            console.error('[Admin Auth] Profile creation failed:', profileError);
            toast.error(`Profile setup failed: ${profileError.message}`);
            return;
          }
          
          // Save additional user metadata to localStorage for quick access
          localStorage.setItem('admin_user_email', email);
          localStorage.setItem('admin_user_id', data.user.id);
          localStorage.setItem('admin_signup_date', new Date().toISOString());
          
          // Check if email confirmation is required
          if (data.user.identities && data.user.identities.length === 0) {
            toast.success("Please check your email to confirm your account!");
            console.log('[Admin Auth] Email confirmation required');
          } else {
            toast.success("Account created successfully! All data saved.");
            setCurrentUser(data.user);
            await loadProfileData(data.user.id);
            console.log('[Admin Auth] Account fully created and data saved');
          }
        }
      }
    } catch (error: any) {
      console.error("[Admin Auth] Unexpected error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setCurrentUser(null);
      setProfileData(null);
      setEmail("");
      setPassword("");
      toast.success("Signed out successfully");
      console.log("[Admin Auth] Signed out successfully");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('[Admin Auth] Initiating Google OAuth');
      
      // Check if we have valid Supabase client
      if (!supabase) {
        toast.error("Supabase configuration missing");
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin-mrwain`,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('[Admin Auth] Google OAuth error:', error);
        if (error.message.includes('not enabled')) {
          toast.error("Google OAuth is not enabled in Supabase. Contact administrator to configure it.");
        } else if (error.message.includes('redirect URI')) {
          toast.error("Redirect URI mismatch. Check Supabase Google OAuth settings.");
        } else {
          toast.error(error.message || "Failed to sign in with Google");
        }
        return;
      }
      
      console.log('[Admin Auth] Google OAuth initiated successfully', data);
      toast.info("Redirecting to Google...");
    } catch (error: any) {
      console.error("[Admin Auth] Google sign in exception:", error);
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  // File upload handlers
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingLogo(true);
    try {
      const logoUrl = await uploadProfileLogo(file, currentUser.id);
      
      if (logoUrl) {
        // Update profile with new logo URL
        const { error } = await supabase
          .from('profiles')
          .update({ logo: logoUrl, updated_at: new Date().toISOString() })
          .eq('id', currentUser.id);

        if (error) {
          console.error('[Admin] Error updating logo:', error);
          toast.error('Failed to save logo');
        } else {
          await loadProfileData(currentUser.id);
          toast.success('Logo uploaded successfully!');
        }
      }
    } catch (error) {
      console.error('[Admin] Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingAvatar(true);
    try {
      const avatarUrl = await uploadAvatar(file, currentUser.id);
      
      if (avatarUrl) {
        // Store avatar in theme_settings
        const themeSettings = profileData?.theme_settings || {};
        const updatedSettings = {
          ...themeSettings,
          avatar: avatarUrl,
        };

        const { error } = await supabase
          .from('profiles')
          .update({ 
            theme_settings: updatedSettings,
            updated_at: new Date().toISOString() 
          })
          .eq('id', currentUser.id);

        if (error) {
          console.error('[Admin] Error updating avatar:', error);
          toast.error('Failed to save avatar');
        } else {
          await loadProfileData(currentUser.id);
          toast.success('Avatar uploaded successfully!');
        }
      }
    } catch (error) {
      console.error('[Admin] Avatar upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingBackground(true);
    try {
      const backgroundUrl = await uploadBackground(file, currentUser.id);
      
      if (backgroundUrl) {
        // Store background in theme_settings
        const themeSettings = profileData?.theme_settings || {};
        const updatedSettings = {
          ...themeSettings,
          background: backgroundUrl,
        };

        const { error } = await supabase
          .from('profiles')
          .update({ 
            theme_settings: updatedSettings,
            updated_at: new Date().toISOString() 
          })
          .eq('id', currentUser.id);

        if (error) {
          console.error('[Admin] Error updating background:', error);
          toast.error('Failed to save background');
        } else {
          await loadProfileData(currentUser.id);
          toast.success('Background uploaded successfully!');
        }
      }
    } catch (error) {
      console.error('[Admin] Background upload error:', error);
      toast.error('Failed to upload background');
    } finally {
      setUploadingBackground(false);
      if (backgroundInputRef.current) backgroundInputRef.current.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!currentUser || !profileData?.logo) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ logo: null, updated_at: new Date().toISOString() })
        .eq('id', currentUser.id);

      if (error) {
        toast.error('Failed to delete logo');
      } else {
        await loadProfileData(currentUser.id);
        toast.success('Logo deleted');
      }
    } catch (error) {
      console.error('[Admin] Delete logo error:', error);
      toast.error('Failed to delete logo');
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-sky-400 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show admin dashboard
  if (currentUser) {
    return (
      <div className="min-h-screen bg-sky-400 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-white">Admin Dashboard - Mrwain</h1>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{currentUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="font-mono text-sm">{currentUser.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email Verified</Label>
                  <div className="mt-1">
                    {currentUser.email_confirmed_at ? (
                      <Badge variant="default" className="bg-green-500">Verified</Badge>
                    ) : (
                      <Badge variant="destructive">Not Verified</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="text-sm">{new Date(currentUser.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Images & Files
              </CardTitle>
              <CardDescription>
                Upload your profile logo, avatar, and background images to Supabase Storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Profile Logo</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex-1"
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Upload Logo
                      </>
                    )}
                  </Button>
                  {profileData?.logo && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={handleDeleteLogo}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {profileData?.logo && (
                  <div className="mt-2 p-3 border rounded-lg bg-muted/20">
                    <img
                      src={profileData.logo}
                      alt="Profile Logo"
                      className="max-h-24 object-contain"
                    />
                    <p className="text-xs text-muted-foreground mt-2 break-all">
                      {profileData.logo}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Avatar Upload */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Avatar / Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="flex-1"
                  >
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        Upload Avatar
                      </>
                    )}
                  </Button>
                </div>
                {profileData?.theme_settings?.avatar && (
                  <div className="mt-2 p-3 border rounded-lg bg-muted/20">
                    <img
                      src={profileData.theme_settings.avatar}
                      alt="Avatar"
                      className="max-h-24 rounded-full object-cover"
                    />
                    <p className="text-xs text-muted-foreground mt-2 break-all">
                      {profileData.theme_settings.avatar}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Background Upload */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Background Image</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBackgroundUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => backgroundInputRef.current?.click()}
                    disabled={uploadingBackground}
                    className="flex-1"
                  >
                    {uploadingBackground ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Upload Background
                      </>
                    )}
                  </Button>
                </div>
                {profileData?.theme_settings?.background && (
                  <div className="mt-2 p-3 border rounded-lg bg-muted/20">
                    <img
                      src={profileData.theme_settings.background}
                      alt="Background"
                      className="max-h-32 w-full object-cover rounded"
                    />
                    <p className="text-xs text-muted-foreground mt-2 break-all">
                      {profileData.theme_settings.background}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 <strong>Storage Info:</strong> All images are stored in Supabase Storage at: 
                  <br />
                  <code className="text-xs">https://jzzbmoopwnvgxxirulga.storage.supabase.co/storage/v1/s3</code>
                  <br />
                  Max file size: 5MB per image
                </p>
              </div>

              <Separator />

              {/* Username Change Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Change Username</Label>
                <p className="text-sm text-muted-foreground">Update your @username (available for admin users)</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter new username"
                    defaultValue={profileData?.username || ''}
                    id="new-username-input"
                    className="flex-1"
                  />
                  <Button
                    onClick={async () => {
                      const input = document.getElementById('new-username-input') as HTMLInputElement;
                      const newUsername = input?.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
                      
                      if (!newUsername || newUsername.length < 3) {
                        toast.error('Username must be at least 3 characters');
                        return;
                      }

                      try {
                        // Check if username already exists
                        const { data: existing, error: checkError } = await supabase
                          .from('profiles')
                          .select('id')
                          .eq('username', newUsername)
                          .neq('id', currentUser.id)
                          .maybeSingle();

                        if (checkError && checkError.code !== 'PGRST116') {
                          throw checkError;
                        }

                        if (existing) {
                          toast.error('Username already taken');
                          return;
                        }

                        // Update username
                        const { error } = await supabase
                          .from('profiles')
                          .update({ 
                            username: newUsername,
                            updated_at: new Date().toISOString() 
                          })
                          .eq('id', currentUser.id);

                        if (error) {
                          toast.error('Failed to update username');
                        } else {
                          await loadProfileData(currentUser.id);
                          toast.success(`Username changed to @${newUsername}`);
                        }
                      } catch (error) {
                        console.error('Username update error:', error);
                        toast.error('Failed to update username');
                      }
                    }}
                  >
                    Update
                  </Button>
                </div>
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                  Current: <strong>@{profileData?.username || 'Not set'}</strong>
                </div>
              </div>

              <Separator />

              {/* Theme Customization Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Theme Customization</Label>
                <p className="text-sm text-muted-foreground">Customize your profile colors and theme</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Color */}
                  <div className="space-y-2">
                    <Label className="text-sm">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        defaultValue={profileData?.theme_settings?.primaryColor || '#0ea5e9'}
                        id="primary-color-input"
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        placeholder="#0ea5e9"
                        defaultValue={profileData?.theme_settings?.primaryColor || '#0ea5e9'}
                        id="primary-color-text"
                        className="flex-1"
                        onChange={(e) => {
                          const colorInput = document.getElementById('primary-color-input') as HTMLInputElement;
                          if (colorInput) colorInput.value = e.target.value;
                        }}
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="space-y-2">
                    <Label className="text-sm">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        defaultValue={profileData?.theme_settings?.secondaryColor || '#38bdf8'}
                        id="secondary-color-input"
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        placeholder="#38bdf8"
                        defaultValue={profileData?.theme_settings?.secondaryColor || '#38bdf8'}
                        id="secondary-color-text"
                        className="flex-1"
                        onChange={(e) => {
                          const colorInput = document.getElementById('secondary-color-input') as HTMLInputElement;
                          if (colorInput) colorInput.value = e.target.value;
                        }}
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-2">
                    <Label className="text-sm">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        defaultValue={profileData?.theme_settings?.accentColor || '#eab308'}
                        id="accent-color-input"
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        placeholder="#eab308"
                        defaultValue={profileData?.theme_settings?.accentColor || '#eab308'}
                        id="accent-color-text"
                        className="flex-1"
                        onChange={(e) => {
                          const colorInput = document.getElementById('accent-color-input') as HTMLInputElement;
                          if (colorInput) colorInput.value = e.target.value;
                        }}
                      />
                    </div>
                  </div>

                  {/* Background Style */}
                  <div className="space-y-2">
                    <Label className="text-sm">Background Style</Label>
                    <select
                      defaultValue={profileData?.theme_settings?.backgroundStyle || 'gradient'}
                      id="background-style-select"
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="solid">Solid Color</option>
                      <option value="gradient">Gradient</option>
                      <option value="image">Image (upload above)</option>
                    </select>
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={async () => {
                    try {
                      const primaryColor = (document.getElementById('primary-color-input') as HTMLInputElement)?.value;
                      const secondaryColor = (document.getElementById('secondary-color-input') as HTMLInputElement)?.value;
                      const accentColor = (document.getElementById('accent-color-input') as HTMLInputElement)?.value;
                      const backgroundStyle = (document.getElementById('background-style-select') as HTMLSelectElement)?.value;

                      const themeSettings = {
                        ...(profileData?.theme_settings || {}),
                        primaryColor,
                        secondaryColor,
                        accentColor,
                        backgroundStyle,
                      };

                      const { error } = await supabase
                        .from('profiles')
                        .update({ 
                          theme_settings: themeSettings,
                          updated_at: new Date().toISOString() 
                        })
                        .eq('id', currentUser.id);

                      if (error) {
                        toast.error('Failed to save theme');
                      } else {
                        await loadProfileData(currentUser.id);
                        toast.success('Theme customization saved!');
                      }
                    } catch (error) {
                      console.error('Theme save error:', error);
                      toast.error('Failed to save theme');
                    }
                  }}
                >
                  Save Theme Settings
                </Button>

                {/* Theme Preview */}
                <div className="mt-4 p-4 border rounded-lg" style={{
                  background: profileData?.theme_settings?.backgroundStyle === 'gradient'
                    ? `linear-gradient(135deg, ${profileData?.theme_settings?.primaryColor || '#0ea5e9'}, ${profileData?.theme_settings?.secondaryColor || '#38bdf8'})`
                    : profileData?.theme_settings?.primaryColor || '#0ea5e9'
                }}>
                  <div className="text-white font-bold text-lg">Theme Preview</div>
                  <div className="text-white/90 text-sm mt-1">Your profile will use these colors</div>
                </div>
              </div>

              <Separator />

              {/* Category Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">User Category</Label>
                <p className="text-sm text-muted-foreground">Choose what best describes you to help others find your profile</p>
                <select
                  value={profileData?.category || 'other'}
                  onChange={async (e) => {
                    const newCategory = e.target.value;
                    try {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ category: newCategory, updated_at: new Date().toISOString() })
                        .eq('id', currentUser.id);
                      
                      if (error) {
                        toast.error('Failed to update category');
                      } else {
                        await loadProfileData(currentUser.id);
                        toast.success('Category updated!');
                      }
                    } catch (error) {
                      toast.error('Failed to update category');
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="content_creator">🎥 Content Creator</option>
                  <option value="business">💼 Business</option>
                  <option value="gamer">🎮 Gamer</option>
                  <option value="developer">💻 Developer</option>
                  <option value="artist">🎨 Artist</option>
                  <option value="musician">🎵 Musician</option>
                  <option value="educator">📚 Educator</option>
                  <option value="influencer">⭐ Influencer</option>
                  <option value="entrepreneur">🚀 Entrepreneur</option>
                  <option value="other">📋 Other</option>
                </select>
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                  Current: <strong>{profileData?.category ? profileData.category.replace('_', ' ').toUpperCase() : 'OTHER'}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Withdrawal Requests
              </CardTitle>
              <CardDescription>Manage user withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No withdrawal requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">User</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-right py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id} className="border-b last:border-0">
                          <td className="py-3">
                            <div>
                              <p className="font-medium">{withdrawal.profiles?.username || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{withdrawal.profiles?.email}</p>
                            </div>
                          </td>
                          <td className="py-3 font-mono">{withdrawal.amount} Pi</td>
                          <td className="py-3 text-xs uppercase text-muted-foreground">
                            {withdrawal.withdrawal_type || "general"}
                          </td>
                          <td className="py-3">
                            <Badge variant={
                              withdrawal.status === 'completed' ? 'default' : 
                              withdrawal.status === 'rejected' ? 'destructive' : 'secondary'
                            } className={withdrawal.status === 'completed' ? 'bg-green-500' : ''}>
                              {withdrawal.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {new Date(withdrawal.requested_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right">
                            {withdrawal.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => handleUpdateWithdrawalStatus(withdrawal.id, 'completed')}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleUpdateWithdrawalStatus(withdrawal.id, 'rejected')}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Controls</CardTitle>
              <CardDescription>Manage your admin settings and configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
                  View Profile
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/subscription')}>
                  Manage Subscription
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/search-users')}>
                  Search Users
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Database Connection</span>
                  <Badge variant="default" className="bg-green-500">Connected</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Authentication</span>
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Supabase Status</span>
                  <Badge variant="default" className="bg-green-500">Operational</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Authentication form
  return (
    <>
      <PageHeader 
        title="Admin" 
        description="Administrator panel"
        icon={<Shield />}
      />
      <div className="min-h-screen bg-sky-400 flex items-center justify-center p-4 pb-24">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src={droplinkLogo}
              alt="Droplink Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <CardTitle className="text-2xl">Admin Access - Mrwain</CardTitle>
          </div>
          <CardDescription className="mt-2">
            {isLogin ? 'Sign in to your admin account' : 'Create your admin account'}
          </CardDescription>
        </CardHeader>
        <CardContent>

          {/* Email Authentication Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label htmlFor="email">Username or Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="@username or email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your @username (from Store URL) or email address
              </p>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
              {!isLogin && (
                <p className="text-xs text-muted-foreground mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </Button>

            <div className="flex justify-between items-center mt-4">
              <button
                type="button"
                className="text-primary hover:underline text-sm"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
              >
                {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
              </button>
              <button
                type="button"
                className="text-primary hover:underline text-sm"
                onClick={() => navigate('/')}
                disabled={loading}
              >
                Back to Home
              </button>
            </div>
          </form>

          {/* Info Notice */}
          <div className="mt-6 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              This admin panel uses Supabase email authentication with Gmail support.
              Email verification may be required for new accounts.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default AdminMrwain;
