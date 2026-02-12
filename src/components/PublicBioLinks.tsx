/**
 * Public Bio Links Component
 * Droplink-style link cards with animations
 */

import { ExternalLink, ShoppingBag, Mail, Phone, Calendar, Download, Heart, Star, Zap, Link as LinkIcon, Play, Music, FileText, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  thumbnail?: string;
}

interface PublicBioLinksProps {
  links: CustomLink[];
  theme: {
    primaryColor: string;
    buttonStyle: string;
    iconStyle: string;
  };
  onLinkClick?: (linkId: string, title: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  shop: <ShoppingBag className="w-5 h-5" />,
  mail: <Mail className="w-5 h-5" />,
  phone: <Phone className="w-5 h-5" />,
  calendar: <Calendar className="w-5 h-5" />,
  download: <Download className="w-5 h-5" />,
  external: <ExternalLink className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  play: <Play className="w-5 h-5" />,
  music: <Music className="w-5 h-5" />,
  file: <FileText className="w-5 h-5" />,
  location: <MapPin className="w-5 h-5" />,
  link: <LinkIcon className="w-5 h-5" />,
};

export const PublicBioLinks = ({ links, theme, onLinkClick }: PublicBioLinksProps) => {
  if (!links || links.length === 0) return null;

  const getIconStyle = (style: string) => {
    switch (style) {
      case "rounded": return "rounded-2xl";
      case "square": return "rounded-none";
      case "circle": return "rounded-full";
      default: return "rounded-2xl";
    }
  };

  const getButtonStyles = () => {
    switch (theme.buttonStyle) {
      case 'outlined':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: `2px solid ${theme.primaryColor}`,
          hoverBg: 'rgba(255, 255, 255, 0.15)'
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          hoverBg: 'rgba(255, 255, 255, 0.2)'
        };
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${theme.primaryColor}, ${adjustColor(theme.primaryColor, 30)})`,
          hoverBg: theme.primaryColor
        };
      default:
        return {
          backgroundColor: theme.primaryColor,
          hoverBg: adjustColor(theme.primaryColor, -15)
        };
    }
  };

  const buttonStyles = getButtonStyles();

  return (
    <div className="space-y-3 w-full">
      {links.map((link, index) => {
        const icon = ICON_MAP[link.icon || 'link'] || <LinkIcon className="w-5 h-5" />;
        
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onLinkClick?.(link.id, link.title)}
            className={cn(
              "group flex items-center w-full py-4 px-6 text-white font-medium transition-all duration-300",
              "hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]",
              getIconStyle(theme.iconStyle)
            )}
            style={{
              ...buttonStyles,
              animationDelay: `${index * 50}ms`
            }}
          >
            {/* Thumbnail or Icon */}
            {link.thumbnail ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                <img 
                  src={link.thumbnail} 
                  alt={link.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 bg-white/10">
                {icon}
              </div>
            )}
            
            {/* Title */}
            <span className="flex-1 text-center pr-10 truncate">
              {link.title}
            </span>
            
            {/* Arrow indicator */}
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity absolute right-6" />
          </a>
        );
      })}
    </div>
  );
};

// Helper to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
