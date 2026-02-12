import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, UserMinus, Gift } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { GiftDialog } from "./GiftDialog";

interface FollowersSectionProps {
  profileId: string;
  currentUserProfileId?: string;
}

export const FollowersSection = ({ profileId, currentUserProfileId }: FollowersSectionProps) => {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadFollowData();
  }, [profileId, currentUserProfileId]);

  const loadFollowData = async () => {
    // Get profile business name
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("id", profileId)
      .single();

    setBusinessName(profile?.business_name || "User");

    // Get followers count
    const { count: followers } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("following_profile_id", profileId);

    setFollowersCount(followers || 0);

    // Get following count
    const { count: following } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_profile_id", profileId);

    setFollowingCount(following || 0);

    // Check if current user is following this profile
    if (currentUserProfileId && currentUserProfileId !== profileId) {
      const { data } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_profile_id", currentUserProfileId)
        .eq("following_profile_id", profileId)
        .maybeSingle();

      setIsFollowing(!!data);
    }
  };

  const handleFollow = async () => {
    console.log('[FOLLOWERS SECTION] Follow action:', {
      currentUserProfileId,
      profileId,
      isFollowing
    });
    
    if (!currentUserProfileId || !profileId) {
      console.error('[FOLLOWERS SECTION] Missing IDs:', { currentUserProfileId, profileId });
      toast.error("Please sign in to follow");
      return;
    }
    
    if (currentUserProfileId === profileId) {
      toast.error("You cannot follow yourself");
      return;
    }
    
    setLoading(true);
    try {
      if (isFollowing) {
        console.log('[FOLLOWERS SECTION] Unfollowing...');
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_profile_id", currentUserProfileId)
          .eq("following_profile_id", profileId);
        
        if (error) {
          console.error('[FOLLOWERS SECTION] Unfollow error:', error);
          throw error;
        }
        
        console.log('[FOLLOWERS SECTION] Unfollow successful');
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        toast.success("Unfollowed successfully");
      } else {
        console.log('[FOLLOWERS SECTION] Following...');
        // Follow
        const { error } = await supabase
          .from("followers")
          .insert({
            follower_profile_id: currentUserProfileId,
            following_profile_id: profileId,
          });
        
        if (error) {
          console.error('[FOLLOWERS SECTION] Follow error:', error);
          throw error;
        }
        
        console.log('[FOLLOWERS SECTION] Follow successful');
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        toast.success("Following successfully");
      }
      // Refresh counts from database to ensure sync
      const { count: followers } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_profile_id", profileId);
      const { count: following } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_profile_id", profileId);
      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);
    } catch (error: any) {
      console.error("[FOLLOWERS SECTION] Follow error:", error);
      const errorMsg = error?.message || error?.error_description || 'Failed to update follow status';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white/10 dark:bg-white/5 border border-white/15 dark:border-white/10 backdrop-blur-xl shadow-xl shadow-sky-500/10 dark:shadow-sky-900/40 rounded-2xl">
        <CardHeader className="pb-3 border-b border-white/10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Community</span>
            </div>
            {currentUserProfileId && currentUserProfileId !== profileId && (
              <Button
                onClick={handleFollow}
                disabled={loading}
                size="sm"
                variant={isFollowing ? "outline" : "default"}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-5 px-2">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-white">{followersCount}</p>
              <p className="text-xs text-white/70 mt-1">Followers</p>
            </div>
            <div className="h-10 w-px bg-white/10 mx-4"></div>
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-white">{followingCount}</p>
              <p className="text-xs text-white/70 mt-1">Following</p>
            </div>
          </div>
          
          {currentUserProfileId && currentUserProfileId !== profileId && (
            <div className="space-y-2">
              {!isFollowing && (
                <div className="text-center p-3 bg-blue-500/15 rounded-lg border border-blue-400/20">
                  <p className="text-xs text-white/80 mb-2 font-medium">
                    Follow {businessName} to stay updated!
                  </p>
                  <Button
                    onClick={handleFollow}
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0 h-9 text-sm"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Follow
                  </Button>
                </div>
              )}
              <Button
                onClick={() => setGiftDialogOpen(true)}
                className="w-full bg-white/10 hover:bg-white/15 text-white/90 border border-white/10 h-9 text-sm"
                variant="outline"
              >
                <Gift className="w-3 h-3 mr-2" />
                Send Gift
              </Button>
            </div>
          )}

          {!currentUserProfileId && (
            <div className="text-center p-3 bg-blue-500/15 rounded-lg border border-blue-400/20">
              <p className="text-xs text-white/80 mb-2 font-medium">
                Join to follow and connect with creators!
              </p>
              <Button
                onClick={() => window.location.href = "/"}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0 h-9 text-sm"
              >
                Sign Up Free
              </Button>
            </div>
          )}
        </CardContent>
        
        <GiftDialog
          open={giftDialogOpen}
          onOpenChange={setGiftDialogOpen}
          receiverProfileId={profileId}
          receiverName={businessName}
          senderProfileId={currentUserProfileId}
        />
      </Card>
    </div>
  );
};
