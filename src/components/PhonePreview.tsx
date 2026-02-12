import { 
  User,
  ShoppingBag,
  Mail,
  Phone,
  Calendar,
  Download,
  ExternalLink,
  Heart,
  Star,
  Zap,
  Link as LinkIcon,
  Globe,
  CreditCard,
  DollarSign,
  Gift,
  Users,
  Pi,
  Wallet,
  QrCode,
  Copy,
  Image as ImageIcon
} from "lucide-react";
import { getVerifiedBadgeUrl } from "@/utils/verifiedUsers";
import { getSocialIcon, getSocialLabel, extractSocialUsername, isDisplayableSocialUrl } from "@/utils/social-utils";
import { Badge } from "@/components/ui/badge";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { BackgroundMusicPlayer } from "./BackgroundMusicPlayer";
import { toast } from "sonner";
import { ProfileData } from "@/types/profile";
import React, { useState, useRef, useEffect } from "react";
import { Flag } from "lucide-react";

import type { ThemeData } from "@/types/profile";
import { BioTemplate } from "@/config/bioTemplates";

interface PhonePreviewProps {
  profile: ProfileData;
  bioTemplate?: BioTemplate;
}

export const PhonePreview = ({ profile, bioTemplate = 'cards' }: PhonePreviewProps) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const iconRadius = profile.theme?.iconStyle === 'circle' ? 'rounded-full' : 
                     profile.theme?.iconStyle === 'square' ? 'rounded-lg' : 'rounded-2xl';
  
  const buttonStyle = profile.theme?.buttonStyle || 'filled';

  // Template-specific styling
  const getTemplateStyles = (section: string) => {
    switch (bioTemplate) {
      case 'minimal':
        return {
          section: 'space-y-3',
          card: 'bg-transparent border-0 shadow-none p-2',
          heading: 'text-xs'
        };
      case 'cards':
        return {
          section: 'space-y-2 sm:space-y-3',
          card: 'bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg',
          heading: 'text-xs sm:text-sm'
        };
      case 'grid':
        return {
          section: 'grid grid-cols-2 gap-2 sm:gap-3',
          card: 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/20 rounded-lg p-3 sm:p-4 shadow-lg',
          heading: 'text-xs sm:text-sm'
        };
      case 'gallery':
        return {
          section: 'grid grid-cols-2 gap-2 sm:gap-3',
          card: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-3 sm:p-4 shadow-xl',
          heading: 'text-xs sm:text-sm'
        };
      default:
        return {
          section: 'space-y-2 sm:space-y-3',
          card: 'bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg',
          heading: 'text-xs sm:text-sm'
        };
    }
  };

  const formatCompactNumber = (value: number) => {
    if (!Number.isFinite(value)) return "0";
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return value.toLocaleString();
  };

  const socialLinkData = Array.isArray(profile.socialLinks)
  ? profile.socialLinks
      .filter((link) => isDisplayableSocialUrl(link?.url))
      .map((link) => {
        const platformId = link.platform || link.type || link.icon || "website";
        const username = extractSocialUsername(platformId, link.url);
        const followers = Number(link.verified_followers ?? link.followers ?? 0);
        return {
          platformId,
          url: link.url,
          username,
          followers,
          label: getSocialLabel(platformId),
        };
      })
  : [];

  const getButtonStyles = () => {
    const baseStyles = "w-full py-3 px-4 rounded-xl font-medium text-sm transition-all";
    const primaryColor = profile.theme?.primaryColor || '#3b82f6';
    
    if (buttonStyle === 'outlined') {
      return {
        className: `${baseStyles} bg-transparent text-white`,
        style: { border: `2px solid ${primaryColor}` }
      };
    } else if (buttonStyle === 'minimal') {
      return {
        className: `${baseStyles} bg-muted text-foreground border border-border`,
        style: {}
      };
    } else {
      return {
        className: `${baseStyles} text-white`,
        style: { backgroundColor: primaryColor }
      };
    }
  };

  const getCustomLinkIcon = (iconValue?: string) => {
    const iconProps = { className: "w-4 h-4" };
    switch (iconValue) {
      case "shop": return <ShoppingBag {...iconProps} />;
      case "mail": return <Mail {...iconProps} />;
      case "phone": return <Phone {...iconProps} />;
      case "calendar": return <Calendar {...iconProps} />;
      case "download": return <Download {...iconProps} />;
      case "external": return <ExternalLink {...iconProps} />;
      case "heart": return <Heart {...iconProps} />;
      case "star": return <Star {...iconProps} />;
      case "zap": return <Zap {...iconProps} />;
      default: return <LinkIcon {...iconProps} />;
    }
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'product': return <ShoppingBag className="w-4 h-4" />;
      case 'donation': return <Gift className="w-4 h-4" />;
      case 'tip': return <DollarSign className="w-4 h-4" />;
      case 'subscription': return <CreditCard className="w-4 h-4" />;
      case 'group': return <Users className="w-4 h-4" />;
      default: return <Pi className="w-4 h-4" />;
    }
  };

  const formatPiAmount = (amount: number) => {
    return `π ${amount.toFixed(2)}`;
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isVideoMuted;
    if (!isVideoMuted) {
      videoRef.current.volume = 0.5;
    }
  }, [isVideoMuted]);

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-[2.5rem] sm:rounded-[3rem] border-[8px] sm:border-[10px] border-foreground/20 shadow-2xl overflow-hidden flex flex-col mx-auto"
         style={
           (profile.theme?.backgroundType === 'gif' && profile.theme?.backgroundGif) || (profile.theme?.backgroundType === 'video' && profile.theme?.backgroundVideo)
             ? {}
             : { backgroundColor: profile.theme?.backgroundColor || '#000000' }
         }>

      

      {/* Video Background for Phone Preview */}
      {profile.theme?.backgroundType === 'video' && profile.theme?.backgroundVideo && (
        <div className="absolute inset-0 z-0">
          <video
            src={profile.theme.backgroundVideo}
            autoPlay
            loop
            muted={isVideoMuted}
            playsInline
            className="w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
            ref={videoRef}
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            onError={(e) => {
              console.log('Video background failed to load:', profile.theme?.backgroundVideo);
              (e.target as HTMLVideoElement).style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.style.backgroundColor = profile.theme?.backgroundColor || '#000000';
              }
            }}
            onLoadedData={() => {
              console.log('Video background loaded successfully:', profile.theme?.backgroundVideo);
            }}
          />
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !isVideoMuted;
                setIsVideoMuted(next);
                if (videoRef.current) {
                  videoRef.current.muted = next;
                  if (!next) {
                    videoRef.current.volume = 0.5;
                  }
                }
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20"
              title={isVideoMuted ? "Unmute background video" : "Mute background video"}
            >
              {isVideoMuted ? <span className="text-xs">🔇</span> : <span className="text-xs">🔊</span>}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!videoRef.current) return;
                if (isVideoPlaying) {
                  videoRef.current.pause();
                } else {
                  void videoRef.current.play();
                }
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20"
              title={isVideoPlaying ? "Pause background video" : "Play background video"}
            >
              {isVideoPlaying ? <span className="text-xs">⏸</span> : <span className="text-xs">▶</span>}
            </button>
          </div>
        </div>
      )}

      {/* GIF Background for Phone Preview */}
      {profile.theme?.backgroundType === 'gif' && profile.theme?.backgroundGif && (
        <div className="absolute inset-0 z-0">
          <img
            src={profile.theme.backgroundGif}
            alt="Background"
            className="w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
            referrerPolicy="no-referrer"
            onError={(e) => {
              console.log('GIF background failed to load:', profile.theme?.backgroundGif);
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.style.backgroundColor = profile.theme?.backgroundColor || '#000000';
              }
            }}
            onLoad={() => {
              console.log('GIF background loaded successfully:', profile.theme?.backgroundGif);
            }}
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      )}
      
      {/* Phone Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-28 md:w-32 h-5 sm:h-6 bg-foreground/20 rounded-b-2xl sm:rounded-b-3xl z-10" />
      
      {/* Phone Screen Content - Scrollable with proper flex layout */}
      <div className="flex-1 overflow-y-auto pt-6 sm:pt-8 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 relative z-10 w-full flex flex-col scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent" data-template={bioTemplate}>
        <div className="flex flex-col items-center text-center space-y-4 sm:space-y-5 md:space-y-6 w-full min-w-0">
          {/* Cover + Portrait (match Public Bio look) */}
          {profile.theme?.coverImage ? (
            <div className="relative w-full pb-10">
              <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 shadow-xl">
                <img
                  src={profile.theme.coverImage}
                  alt="Profile cover"
                  className="w-full h-24 sm:h-28 md:h-32 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                <div
                  className={`relative w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 ${iconRadius} overflow-hidden shadow-2xl ring-4 ring-white/30`}
                  style={{ backgroundColor: profile.theme?.primaryColor || '#3b82f6' }}
                >
                  {profile.logo ? (
                    <img src={profile.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white/80" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={`w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 ${iconRadius} bg-muted border border-border flex items-center justify-center overflow-hidden shadow-lg`}>
              {profile.logo ? (
                <img src={profile.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white/70" />
              )}
            </div>
          )}

          {/* Business Name + Verified Badge */}
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-base sm:text-lg md:text-xl px-3 sm:px-4 font-bold text-white drop-shadow-lg shadow-black/50">
              {profile.businessName || "YOUR BUSINESS NAME"}
            </h1>
            {profile.isVerified && (
              <img
                src={getVerifiedBadgeUrl(profile.username)}
                alt="Verified"
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
            )}
          </div>

          {/* Stats: Total Social Followers - Enhanced */}
          {Array.isArray(profile.socialLinks) && profile.socialLinks.some(l => Number(l.followers) > 0) && (
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 animate-fade-in">
              <Users className="w-4 h-4 text-sky-400 animate-pulse" />
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-sm text-white">{formatCompactNumber(profile.socialLinks.reduce((sum, l) => sum + (Number(l.followers) || 0), 0))}</span>
                <span className="text-xs text-white/70">Followers</span>
              </div>
            </div>
          )}

          {/* Description */}
          {profile.description && (
            <p className="text-xs sm:text-sm px-3 sm:px-4 text-white/90 leading-relaxed drop-shadow-md shadow-black/50">
              {profile.description}
            </p>
          )}

          {(() => {
            const appLinks = Array.isArray(profile.appLinks) && profile.appLinks.length > 0
              ? profile.appLinks
              : profile.appLink
                ? [{
                    id: "primary",
                    title: profile.appTitle || "Check out my App",
                    url: profile.appLink,
                    logo: profile.appLogo,
                    description: profile.appDescription
                  }]
                : [];
            if (appLinks.length === 0) return null;
            return (
              <div className="w-full px-3 sm:px-4 space-y-3">
                {appLinks.map((link: any) => (
                  <a
                    key={link.id || link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-4 transition-all"
                  >
                    {link.logo ? (
                      <img
                        src={link.logo}
                        alt={link.title || "App"}
                        className="w-12 h-12 rounded-xl object-cover shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white text-base">
                        ⚡
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-white font-semibold text-sm truncate">{link.title || "Check out my App"}</div>
                      {link.description && (
                        <div className="text-white/70 text-[11px] line-clamp-2">{link.description}</div>
                      )}
                      <div className="text-white/80 text-[11px]">Open App ↗</div>
                    </div>
                  </a>
                ))}
              </div>
            );
          })()}

          {/* Background Music Player */}
          {profile.backgroundMusicUrl && (
            <div className="px-4 w-full">
              <BackgroundMusicPlayer 
                musicUrl={profile.backgroundMusicUrl}
                autoPlay={true}
                loop={true}
              />
            </div>
          )}

          {/* YouTube Video */}
          {profile.youtubeVideoUrl && extractYouTubeVideoId(profile.youtubeVideoUrl) && (
            <div className="w-full">
              <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg bg-muted">
                <div className="absolute inset-0 flex items-center justify-center">
                  {getSocialIcon("youtube", "w-8 h-8 text-white/50")}
                </div>
              </div>
            </div>
          )}
            {showReportModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-2xl relative">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowReportModal(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <div className="mb-4 flex flex-col items-center">
                    <Flag className="w-8 h-8 text-red-500 mb-2" />
                    <h2 className="text-xl font-bold mb-1 text-gray-800">Report Profile</h2>
                  </div>
                  <p className="text-gray-700 mb-4 text-sm">
                    If you see unwanted, abusive, or inappropriate content on this profile, please let us know. Your report is confidential and helps keep the community safe.
                  </p>
                  <a
                    href="https://www.droplink.space/report-abuse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-colors mb-2"
                  >
                    Go to Report Abuse Form
                  </a>
                  <button
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl transition-colors"
                    onClick={() => setShowReportModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}


                    {/* Social Links - Enhanced */}
          {socialLinkData.length > 0 && (
            <div className="w-full pt-4 px-2">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-3"></div>
              <div className="flex flex-wrap justify-center gap-3">
                {socialLinkData.map((link, idx) => (
                  <a
                    key={`${link.platformId}-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${link.label}`}
                    className="flex flex-col items-center gap-1 w-16 sm:w-20"
                  >
                    <span
                      className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 ${iconRadius} flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 transform focus:outline-none focus:ring-2 focus:ring-white/60`}
                      style={{
                        backgroundColor: profile.theme?.primaryColor || '#3b82f6',
                        border: '2px solid rgba(255,255,255,0.15)',
                        animation: `slideUp 0.4s ease-out ${idx * 0.05}s both`
                      }}
                    >
                      {getSocialIcon(link.platformId, "w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white transition-transform duration-300 hover:rotate-12")}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-white/85 truncate w-full text-center">
                      {link.username ? `@${link.username}` : link.label}
                    </span>
                    {link.followers > 0 && (
                      <span className="text-[9px] sm:text-[10px] text-white/60">
                        {formatCompactNumber(link.followers)} followers
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Custom Links */}
          {profile.customLinks && profile.customLinks.length > 0 && (
            <div className="w-full pt-2">
              {(() => {
                const visibleLinks = profile.customLinks.filter(link => link.isVisible !== false);
                const layoutType = profile.linkLayoutType || 'stack';
                
                // Sort links by priority
                const sortedLinks = [...visibleLinks].sort((a, b) => (a.priority || 0) - (b.priority || 0));
                
                const renderLink = (link: typeof profile.customLinks[0], layoutClass?: string) => {
                  const customStyle = link.customStyling;
                  const hasCustomStyling = customStyle && customStyle.backgroundColor;
                  const displayStyle = link.displayStyle || 'classic';
                  
                  // Enhanced display styles based on layout
                  const getDisplayClassName = () => {
                    let baseClass = layoutClass || '';
                    
                    if (displayStyle === 'featured') {
                      return `${baseClass} p-6 rounded-xl shadow-lg border-2 border-yellow-400/30 bg-gradient-to-r from-yellow-50/10 to-orange-50/10`;
                    } else if (displayStyle === 'animated') {
                      return `${baseClass} p-4 rounded-lg animate-pulse hover:animate-bounce transition-all duration-300 shadow-md border border-blue-400/50`;
                    } else {
                      return `${baseClass} p-3 rounded-lg transition-all duration-200 hover:scale-105 shadow-md`;
                    }
                  };
                  
                  const iconSize = layoutType === 'showcase' || displayStyle === 'featured' ? 'w-10 h-10' : 
                                 layoutType === 'grid' ? 'w-6 h-6' : 'w-8 h-8';
                  const textSize = layoutType === 'showcase' || displayStyle === 'featured' ? 'text-base' : 'text-sm';
                  const padding = layoutType === 'carousel' ? 'p-2' : layoutType === 'showcase' ? 'p-4' : 'p-3';
                  
                  return (
                    <button
                      key={link.id}
                      className={`${getDisplayClassName()} flex items-center gap-3 relative ${
                        hasCustomStyling ? '' : getButtonStyles().className
                      } ${padding}`}
                      style={hasCustomStyling ? {
                        backgroundColor: customStyle.backgroundColor || link.color || '#3b82f6',
                        color: link.textColor || '#ffffff',
                        borderRadius: `${customStyle.borderRadius || 8}px`,
                        fontSize: `${customStyle.fontSize || (displayStyle === 'featured' ? 18 : 14)}px`,
                        fontWeight: customStyle.fontWeight || (displayStyle === 'featured' ? 600 : 500),
                        borderColor: customStyle.borderColor || 'transparent',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                        animation: customStyle.animation === 'pulse' ? 'pulse 2s infinite' :
                                 customStyle.animation === 'bounce' ? 'bounce 1s infinite' :
                                 customStyle.animation === 'glow' ? 'glow 2s infinite' :
                                 displayStyle === 'animated' ? 'pulse 2s infinite' : 'none'
                      } : {
                        backgroundColor: link.color || '#3b82f6',
                        color: link.textColor || '#ffffff',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      {/* Icon/Favicon */}
                      <div className={`flex-shrink-0 ${iconSize} flex items-center justify-center rounded-lg ${displayStyle === 'featured' ? 'bg-white/20' : 'bg-white/10'}`}>
                        {link.favicon ? (
                          <img 
                            src={link.favicon} 
                            alt="" 
                            className={`${iconSize} rounded object-cover shadow-sm`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        {(!link.favicon || true) && (
                          <div className={`${link.favicon ? 'hidden' : ''} ${displayStyle === 'featured' ? 'text-xl' : 'text-base'}`}>
                            {link.icon && (link.icon.length <= 2) ? link.icon : getCustomLinkIcon(link.icon)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 text-left min-w-0 ${layoutType === 'carousel' ? 'hidden sm:block' : ''}`}>
                        <div className={`font-medium truncate ${textSize} ${displayStyle === 'featured' ? 'mb-1' : ''} drop-shadow-sm`}>
                          {link.title || "Untitled Link"}
                        </div>
                        {link.description && layoutType !== 'carousel' && (
                          <div className={`text-xs opacity-80 mt-1 ${displayStyle === 'featured' || layoutType === 'showcase' ? 'line-clamp-2' : 'truncate'} drop-shadow-sm`}>
                            {link.description}
                          </div>
                        )}
                        {displayStyle === 'featured' && (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs opacity-70">Featured</span>
                          </div>
                        )}
                      </div>

                      {/* Preview Image */}
                      {link.image && layoutType !== 'carousel' && (
                        <div className={`flex-shrink-0 ${displayStyle === 'featured' ? 'w-12 h-12' : 'w-8 h-8'}`}>
                          <img 
                            src={link.image} 
                            alt="" 
                            className={`w-full h-full rounded object-cover shadow-sm ${displayStyle === 'featured' ? 'border border-white/20' : ''}`}
                          />
                        </div>
                      )}

                      {/* Style Indicators */}
                      {displayStyle === 'animated' && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                      )}
                      {link.category === 'commerce' && (
                        <div className="absolute top-1 left-1">
                          <ShoppingBag className="w-3 h-3 text-green-400" />
                        </div>
                      )}
                    </button>
                  );
                };
                
                // Render based on layout type
                if (layoutType === 'grid') {
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      {sortedLinks.map(link => renderLink(link, 'w-full'))}
                    </div>
                  );
                } else if (layoutType === 'carousel') {
                  return (
                    <div className="relative">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {sortedLinks.map(link => renderLink(link, 'flex-shrink-0 w-32 sm:w-40'))}
                      </div>
                      {sortedLinks.length > 3 && (
                        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
                      )}
                    </div>
                  );
                } else if (layoutType === 'showcase') {
                  return (
                    <div className="space-y-3">
                      {sortedLinks.slice(0, 3).map(link => renderLink(link, 'w-full border-2 shadow-sm'))}
                      {sortedLinks.length > 3 && (
                        <div className="text-center py-2">
                          <Badge variant="secondary" className="text-xs">
                            +{sortedLinks.length - 3} more links
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Stack layout (default)
                  return (
                    <div className="space-y-2">
                      {sortedLinks.map(link => renderLink(link, 'w-full'))}
                    </div>
                  );
                }
              })()}
            </div>
          )}

          {/* Image Link Cards - Enhanced */}
          {profile.imageLinkCards && profile.imageLinkCards.length > 0 && (
            <div className="w-full pt-4 sm:pt-5">
              <div className="px-2 mb-3">
                <div className="flex items-center gap-2 text-white text-xs sm:text-sm font-semibold drop-shadow-md mb-2">
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  <span>Featured Links ({profile.imageLinkCards.length})</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 px-2">
                {profile.imageLinkCards.slice(0, 4).map((card: any, idx: number) => (
                  <a
                    key={card.id}
                    href={card.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                    style={{ 
                      aspectRatio: '4 / 3',
                      animation: `slideUp 0.4s ease-out ${idx * 0.08}s both`
                    }}
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/90" />
                    <div className="absolute inset-0 flex items-end justify-center p-3">
                      <p className="text-white font-bold text-[11px] sm:text-xs text-center drop-shadow-lg truncate group-hover:line-clamp-2 transition-all duration-300">
                        {card.title}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
              {profile.imageLinkCards.length > 4 && (
                <p className="text-[9px] sm:text-[10px] text-white/60 text-center pt-3 drop-shadow-sm font-medium">
                  +{profile.imageLinkCards.length - 4} more cards
                </p>
              )}
            </div>
          )}

          
          {profile.paymentLinks && profile.paymentLinks.filter(link => link.active).length > 0 && (
            <div className="w-full space-y-1.5 sm:space-y-2 pt-4 sm:pt-5 px-2">
              <div className="flex items-center gap-2 text-white text-xs sm:text-sm font-semibold drop-shadow-md">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Tips & Donations ({profile.paymentLinks.filter(link => link.active).length})</span>
              </div>
              {profile.paymentLinks.filter(link => link.active).slice(0, 3).map((link, idx) => (
                <button
                  key={link.id}
                  {...getButtonStyles()}
                  className={`${getButtonStyles().className} flex items-center justify-between gap-2 group hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95`}
                  style={{
                    ...getButtonStyles().style,
                    animation: `slideUp 0.4s ease-out ${idx * 0.08}s both`
                  }}
                >
                  <div className="flex items-center gap-2">
                    {getPaymentIcon(link.type)}
                    <span className="truncate drop-shadow-sm font-medium text-sm">{link.description}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg">
                    <span className="text-xs font-bold drop-shadow-sm">{formatPiAmount(link.amount)}</span>
                    <Pi className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
              {profile.paymentLinks.filter(link => link.active).length > 3 && (
                <p className="text-[10px] text-white/60 text-center drop-shadow-sm font-medium">
                  +{profile.paymentLinks.filter(link => link.active).length - 3} more options
                </p>
              )}
            </div>
          )}

          
          {profile.products && profile.products.length > 0 && (
            <div className={`w-full ${getTemplateStyles('products').section} pt-4 sm:pt-5`}>
              <div className="px-2 flex items-center gap-2 text-white text-xs sm:text-sm font-semibold drop-shadow-md">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Products ({profile.products.length})</span>
              </div>
              {bioTemplate === 'grid' || bioTemplate === 'gallery' ? (
                // Grid/Gallery layout for products
                profile.products.slice(0, 4).map((product, idx) => (
                  <div 
                    key={product.id}
                    className={`${getTemplateStyles('products').card} text-left transition-all duration-300 backdrop-blur-sm hover:shadow-2xl hover:scale-105`}
                    style={{ animation: `slideUp 0.4s ease-out ${idx * 0.1}s both` }}
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white truncate drop-shadow-sm">{product.title || "Untitled"}</h4>
                      <span className="text-xs font-bold text-emerald-400 drop-shadow-sm">${product.price || "0"}</span>
                    </div>
                  </div>
                ))
              ) : (
                // Stack layout for products
                profile.products.slice(0, 2).map((product, idx) => (
                  <div 
                    key={product.id}
                    className={`mx-2 ${getTemplateStyles('products').card} text-left`}
                    style={{ animation: `slideUp 0.4s ease-out ${idx * 0.1}s both` }}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-sm flex-1">{product.title || "Untitled"}</h4>
                      <span className="text-xs sm:text-sm font-bold text-emerald-400 drop-shadow-sm whitespace-nowrap">${product.price || "0"}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-white/70 line-clamp-2 drop-shadow-sm">{product.description || "No description"}</p>
                  </div>
                ))
              )}
              {profile.products.length > (bioTemplate === 'grid' || bioTemplate === 'gallery' ? 4 : 2) && (
                <p className="text-[9px] sm:text-[10px] text-white/60 text-center drop-shadow-sm px-2">+{profile.products.length - (bioTemplate === 'grid' || bioTemplate === 'gallery' ? 4 : 2)} more products</p>
              )}
            </div>
          )}


          
          {profile.piWalletAddress && (
            <div className="w-full flex flex-col items-center pt-4 sm:pt-5 md:pt-6 pb-2">
              <div className="relative w-[100px] h-[100px] sm:w-[110px] sm:h-[110px] md:w-[120px] md:h-[120px] mb-2 shadow-lg rounded">
                {/* QR code with Droplink logo overlay */}
                <QRCodeDisplay value={profile.piWalletAddress} size={window.innerWidth < 640 ? 100 : window.innerWidth < 768 ? 110 : 120} />
                <img
                  src="/droplink-logo.png"
                  alt="Droplink Logo"
                  className="absolute left-1/2 top-1/2 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 -translate-x-1/2 -translate-y-1/2 shadow-lg border-2 border-white bg-white rounded-lg"
                  style={{ pointerEvents: 'none' }}
                />
              </div>
              <div className="text-[10px] sm:text-xs text-white/80 text-center break-all mb-1 px-2 drop-shadow-md">{profile.piWalletAddress}</div>
              <div className="text-[10px] sm:text-xs text-sky-300 text-center drop-shadow-md">Tip Pi or DROP</div>
            </div>
          )}

          
          {!profile.hasPremium && profile.storeUrl && (
            <div className="w-full pt-6 pb-2 text-center">
              <p className="text-xs text-white/50 drop-shadow-md">
                Join {profile.storeUrl} on <span className="text-sky-400 font-semibold">Droplink</span>
              </p>
            </div>
          )}

          
          <div className="w-full pt-4 pb-2 flex justify-center">
            <button
              className="bg-white/80 hover:bg-red-100 rounded-full p-3 shadow-lg border border-red-300 inline-flex items-center gap-2 px-6 transition-all"
              title="Report unwanted content"
              onClick={() => setShowReportModal(true)}
            >
              <Flag className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 font-medium">Report Unwanted Content</span>
            </button>
          </div>

          
          {!profile.businessName && !profile.description && socialLinkData.length === 0 && profile.products?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-white/70 drop-shadow-md">
                Start customizing your profile to see changes here
              </p>
            </div>
          )}
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-2xl relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowReportModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="mb-4 flex flex-col items-center">
              <Flag className="w-8 h-8 text-red-500 mb-2" />
              <h2 className="text-xl font-bold mb-1 text-gray-800">Report Profile</h2>
            </div>
            <p className="text-gray-700 mb-4 text-sm">
              If you see unwanted, abusive, or inappropriate content on this profile, please let us know. Your report is confidential and helps keep the community safe.
            </p>
            <a
              href="https://www.droplink.space/report-abuse"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-colors mb-2"
            >
              Go to Report Abuse Form
            </a>
            <button
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl transition-colors"
              onClick={() => setShowReportModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

// Add animations style
const animationStyles = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-4px);
    }
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 5px rgba(255, 255, 255, 0.1);
    }
    50% {
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
    }
  }

  .animate-slide-up {
    animation: slideUp 0.4s ease-out;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-glow {
    animation: glow 2s ease-in-out infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = animationStyles;
  document.head.appendChild(styleElement);
}






