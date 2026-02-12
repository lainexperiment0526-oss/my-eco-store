import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, UserPlus, ExternalLink, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";

interface FollowerProfile {
  id: string;
  username: string;
  business_name: string;
  logo: string | null;
  description: string | null;
}

interface FollowerData {
  id: string;
  created_at: string;
  follower_profile: FollowerProfile;
  following_profile: FollowerProfile;
}

const Followers = () => {
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<FollowerData[]>([]);
  const [following, setFollowing] = useState<FollowerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  const findCachedProfile = () => {
    if (typeof window === "undefined") return null;
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("profile_")
      );
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const id = parsed?.profileId || parsed?.id;
        const username = parsed?.username;
        if (id && username) {
          return { id, username } as { id: string; username: string };
        }
      }
    } catch (error) {
      console.error("[FOLLOWERS PAGE] Failed to read cached profile:", error);
    }
    return null;
  };

  useEffect(() => {
    loadFollowData();
  }, []);

  const loadFollowData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fallback for mobile where Supabase session might not hydrate in time
      const cachedProfile = findCachedProfile();

      if (!user && !cachedProfile?.id) {
        toast.error("Please sign in to view followers");
        navigate("/auth");
        return;
      }

      const profileLookupUserId = user?.id;
      let profile = null as any;

      if (profileLookupUserId) {
        const { data: foundProfile } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("user_id", profileLookupUserId)
          .single();
        profile = foundProfile;
      }

      if (!profile && cachedProfile?.id && cachedProfile?.username) {
        // Use cached profile when auth session is missing
        profile = { id: cachedProfile.id, username: cachedProfile.username };
      }

      if (!profile) {
        toast.error("Profile not found");
        navigate("/auth");
        return;
      }

      setCurrentProfileId(profile.id);
      setCurrentUsername(profile.username);

      // Load followers
      const followersQuery: any = (supabase as any)
        .from("followers")
        .select(`
          id,
          created_at,
          follower_profile:profiles!followers_follower_profile_id_fkey (
            id,
            username,
            business_name,
            logo,
            description
          )
        `)
        .eq("following_profile_id", profile.id);
      
      const { data: followersData, error: followersError } = (await followersQuery) as any;

      if (followersError) throw followersError;
      setFollowers(followersData as any || []);

      // Load following
      const followingQuery: any = (supabase as any)
        .from("followers")
        .select(`
          id,
          created_at,
          following_profile:profiles!followers_following_profile_id_fkey (
            id,
            username,
            business_name,
            logo,
            description
          )
        `)
        .eq("follower_profile_id", profile.id);
      
      const { data: followingData, error: followingError } = (await followingQuery) as any;

      if (followingError) throw followingError;
      setFollowing(followingData as any || []);
    } catch (error) {
      console.error("Error loading follow data:", error);
      toast.error("Failed to load followers data");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (followId: string) => {
    console.log('[FOLLOWERS PAGE] Unfollow:', { followId });
    
    try {
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("id", followId);

      if (error) {
        console.error('[FOLLOWERS PAGE] Unfollow error:', error);
        throw error;
      }

      console.log('[FOLLOWERS PAGE] Unfollow successful');
      setFollowing((prev) => prev.filter((f) => f.id !== followId));
      toast.success("Unfollowed successfully");
    } catch (error: any) {
      console.error("[FOLLOWERS PAGE] Error unfollowing:", error);
      const errorMsg = error?.message || error?.error_description || 'Failed to unfollow';
      toast.error(errorMsg);
    }
  };

  const handleFollowUser = async (targetProfileId: string) => {
    console.log('[FOLLOWERS PAGE] Follow user:', { currentProfileId, targetProfileId });
    
    if (!currentProfileId || !targetProfileId) {
      console.error('[FOLLOWERS PAGE] Missing IDs:', { currentProfileId, targetProfileId });
      toast.error("Please sign in to follow users");
      return;
    }
    
    if (currentProfileId === targetProfileId) {
      toast.error("You cannot follow yourself");
      return;
    }
    
    try {
      // Check if already following
      const { data: existing } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_profile_id", currentProfileId)
        .eq("following_profile_id", targetProfileId)
        .maybeSingle();
      
      if (existing) {
        console.log('[FOLLOWERS PAGE] Already following');
        toast.info("Already following this user");
        return;
      }
      
      console.log('[FOLLOWERS PAGE] Inserting follow record...');
      const { error } = await supabase
        .from("followers")
        .insert({
          follower_profile_id: currentProfileId,
          following_profile_id: targetProfileId,
        } as any);
      
      if (error) {
        console.error('[FOLLOWERS PAGE] Insert error:', error);
        throw error;
      }
      
      console.log('[FOLLOWERS PAGE] Follow successful');
      toast.success("Started following!");
      loadFollowData(); // Refresh data
    } catch (error: any) {
      console.error("[FOLLOWERS PAGE] Follow error:", error);
      const errorMsg = error?.message || error?.error_description || 'Failed to follow user';
      toast.error(errorMsg);
    }
  };

  const isCurrentlyFollowing = (profileId: string) => {
    return following.some(f => f.following_profile.id === profileId);
  };

  const renderProfileCard = (
    profile: FollowerProfile,
    showUnfollow?: string,
    isFollowerCard?: boolean,
    showChat?: boolean
  ) => (
    <Card key={profile.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {profile.logo ? (
              <img
                src={profile.logo}
                alt={profile.business_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-300">
                {profile.business_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate text-gray-900 dark:text-white">
              {profile.business_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">@{profile.username}</p>
            {profile.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                {profile.description}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/u/${profile.username}`, "_blank")}
              title="Visit Store"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>

            {showChat && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/chat/${profile.username}`)}
                title="Chat"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            )}
            
            {isFollowerCard && !isCurrentlyFollowing(profile.id) && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleFollowUser(profile.id)}
                title="Follow Back"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            )}
            
            {showUnfollow && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleUnfollow(showUnfollow)}
                title="Unfollow"
              >
                <UserCheck className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );



  return (
    <div className="min-h-screen bg-sky-400">
      <PageHeader 
        title="Community" 
        description="Manage your followers and following"
        icon={<Users className="w-6 h-6" />}
      />
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 max-w-4xl pb-24">
        <div className="p-3 sm:p-4 md:p-6 rounded-3xl bg-card border border-border">
          <Tabs defaultValue="followers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="followers">
                <UserCheck className="w-4 h-4 mr-2" />
                Followers ({followers.length})
              </TabsTrigger>
              <TabsTrigger value="following">
                <UserPlus className="w-4 h-4 mr-2" />
                Following ({following.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="followers" className="space-y-4 mt-4">
              {followers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No followers yet</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Share your store URL to get followers:</p>
                  {currentUsername && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="font-mono text-sm break-all text-gray-900 dark:text-white">
                        {window.location.origin}/u/{currentUsername}
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/u/${currentUsername}`);
                          toast.success("Store URL copied!");
                        }}
                      >
                        Copy Store URL
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-center mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Your Store URL:</p>
                    {currentUsername && (
                      <>
                        <p className="font-mono text-sm break-all mb-2 text-gray-900 dark:text-white">
                          {window.location.origin}/u/{currentUsername}
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/u/${currentUsername}`);
                            toast.success("Store URL copied!");
                          }}
                        >
                          Copy Store URL
                        </Button>
                      </>
                    )}
                  </div>
                  {followers.map((follower) =>
                    renderProfileCard(follower.follower_profile as FollowerProfile, undefined, true)
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="following" className="space-y-4 mt-4">
              {following.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Not following anyone yet</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Visit other stores and click the follow button to connect with creators!</p>
                </div>
              ) : (
                following.map((follow) =>
                  renderProfileCard(
                    follow.following_profile as FollowerProfile,
                    follow.id,
                    false,
                    true
                  )
                )
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
      <FooterNav />
    </div>
  );
};

export default Followers;
