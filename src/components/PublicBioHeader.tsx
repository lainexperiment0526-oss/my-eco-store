/**
 * Public Bio Header Component
 * Organized header section with profile info, stats, and actions
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  UserMinus,
  Gift,
  Share2,
  Verified,
  Crown,
  Star,
  Eye,
  Users
} from "lucide-react";

interface PublicBioHeaderProps {
  profile: {
    logo?: string;
    businessName: string;
    username: string;
    description?: string;
    hasPremium?: boolean;
    appLink?: string;
    appTitle?: string;
    appLogo?: string;
  };
  theme: {
    primaryColor: string;
    iconStyle: string;
  };
  stats: {
    followers: number;
    views: number;
    showFollowerCount?: boolean;
    showViewCount?: boolean;
  };
  actions: {
    isFollowing: boolean;
    canFollow: boolean;
    canGift: boolean;
    showSignIn: boolean;
    onFollow: () => void;
    onGift: () => void;
    onShare: () => void;
    onSignIn: () => void;
  };
}

export const PublicBioHeader = ({ profile, theme, stats, actions }: PublicBioHeaderProps) => {
  const getIconStyle = (style: string) => {
    switch (style) {
      case "rounded": return "rounded-2xl";
      case "square": return "rounded-none";
      case "circle": return "rounded-full";
      default: return "rounded-2xl";
    }
  };

  return (
    <div className="text-center space-y-6">
      {/* Profile Avatar */}
      {profile.logo && (
        <div className="flex justify-center">
          <div 
            className={`w-28 h-28 ${getIconStyle(theme.iconStyle)} overflow-hidden shadow-xl ring-4 ring-white/20 transition-transform hover:scale-105`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            <img 
              src={profile.logo} 
              alt={profile.businessName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      
      {/* Name and Verified Badge */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {profile.businessName}
          </h1>
          {profile.hasPremium && (
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold px-2 py-0.5"
            >
              <Crown className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          )}
        </div>
        
        <p className="text-white/70 text-sm">@{profile.username}</p>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-center gap-8">
        {stats.showFollowerCount !== false && (
          <div className="text-center group cursor-default">
            <div 
              className="text-2xl font-bold transition-colors group-hover:scale-110"
              style={{ color: theme.primaryColor }}
            >
              {stats.followers.toLocaleString()}
            </div>
            <div className="text-white/60 text-sm flex items-center gap-1">
              <Users className="w-3 h-3" />
              Followers
            </div>
          </div>
        )}
        
        {stats.showViewCount !== false && (
          <div className="text-center group cursor-default">
            <div 
              className="text-2xl font-bold transition-colors group-hover:scale-110"
              style={{ color: theme.primaryColor }}
            >
              {stats.views.toLocaleString()}
            </div>
            <div className="text-white/60 text-sm flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Views
            </div>
          </div>
        )}
      </div>

      {/* Bio Description */}
      {profile.description && (
        <p className="text-white/80 max-w-md mx-auto text-base leading-relaxed">
          {profile.description}
        </p>
      )}

      {/* App Link Section */}
      {profile.appLink && (
        <div className="flex justify-center pt-4 pb-2">
          <a 
            href={profile.appLink}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-3 transition-all hover:scale-105 max-w-sm w-full"
          >
            {profile.appLogo ? (
              <img 
                src={profile.appLogo} 
                alt={profile.appTitle || "App"} 
                className="w-12 h-12 rounded-lg object-cover shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <h3 className="text-white font-bold text-base truncate">{profile.appTitle || "Check out my App"}</h3>
              <div className="text-white/70 text-xs flex items-center gap-1">
                Open App ↗
              </div>
            </div>
          </a>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {/* Follow Button */}
        {actions.showSignIn ? (
          <Button
            onClick={actions.onSignIn}
            className={`${getIconStyle(theme.iconStyle)} gap-2 px-6 py-3 font-semibold transition-all hover:scale-105`}
            style={{ 
              backgroundColor: theme.primaryColor,
              color: '#fff',
            }}
          >
            <UserPlus className="w-5 h-5" />
            Sign in to Follow
          </Button>
        ) : actions.canFollow && (
          <Button
            onClick={actions.onFollow}
            variant={actions.isFollowing ? "outline" : "default"}
            className={`${getIconStyle(theme.iconStyle)} gap-2 px-6 py-3 font-semibold transition-all hover:scale-105`}
            style={actions.isFollowing ? {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: theme.primaryColor,
              color: '#fff',
            } : {
              backgroundColor: theme.primaryColor,
              color: '#fff',
            }}
          >
            {actions.isFollowing ? (
              <>
                <UserMinus className="w-5 h-5" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Follow
              </>
            )}
          </Button>
        )}

        {/* Gift Button */}
        {actions.canGift && (
          <Button
            onClick={actions.onGift}
            variant="outline"
            className={`${getIconStyle(theme.iconStyle)} gap-2 px-6 py-3 font-semibold transition-all hover:scale-105`}
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: theme.primaryColor,
              color: '#fff',
            }}
          >
            <Gift className="w-5 h-5" />
            Gift
          </Button>
        )}

        {/* Share Button */}
        <Button
          onClick={actions.onShare}
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all"
        >
          <Share2 className="w-5 h-5 text-white" />
        </Button>
      </div>
    </div>
  );
};
