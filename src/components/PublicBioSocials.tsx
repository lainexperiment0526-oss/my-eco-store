/**
 * Public Bio Social Links Component
 * Animated social media icons grid
 */

import { getSocialIcon, getSocialLabel, extractSocialUsername } from "@/utils/social-utils";
import { cn } from "@/lib/utils";

interface SocialLink {
  platform: string;
  url: string;
}

interface PublicBioSocialsProps {
  links: SocialLink[];
  theme: {
    primaryColor: string;
    iconStyle: string;
  };
  onSocialClick?: (platform: string) => void;
}

export const PublicBioSocials = ({ links, theme, onSocialClick }: PublicBioSocialsProps) => {
  if (!links || links.length === 0) return null;

  const validLinks = links.filter(link => link.url && link.url.trim() !== '');

  if (validLinks.length === 0) return null;

  const getIconStyle = (style: string) => {
    switch (style) {
      case "rounded": return "rounded-2xl";
      case "square": return "rounded-lg";
      case "circle": return "rounded-full";
      default: return "rounded-2xl";
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {validLinks.map((link, index) => {
        const platformId = link.platform;
        const label = getSocialLabel(platformId);
        const username = extractSocialUsername(platformId, link.url);

        return (
          <a
            key={`${link.platform}-${index}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSocialClick?.(link.platform)}
            title={username ? `@${username}` : label}
            className={cn(
              "group w-14 h-14 flex items-center justify-center transition-all duration-300",
              "hover:scale-110 hover:shadow-xl active:scale-95",
              getIconStyle(theme.iconStyle)
            )}
            style={{
              backgroundColor: theme.primaryColor,
              animationDelay: `${index * 50}ms`
            }}
          >
            <span className="text-white transition-transform group-hover:scale-110">
              {getSocialIcon(platformId, "w-5 h-5")}
            </span>
          </a>
        );
      })}
    </div>
  );
};
