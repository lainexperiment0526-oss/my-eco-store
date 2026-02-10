import { App, Category, Screenshot } from '@/types/app';
import { Link } from 'react-router-dom';
import { AppIcon } from './AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { StarRating } from './StarRating';
import { ChevronRight } from 'lucide-react';

interface AppCardProps {
  app: App & { category?: Category; screenshots?: Screenshot[] };
  variant?: 'default' | 'compact' | 'featured' | 'list';
}

export function AppCard({ app, variant = 'default' }: AppCardProps) {
  const { theme } = useTheme();
  const appKey = app.name.toLowerCase();
  const badgeMap: Record<string, { light: string; dark: string }> = {
    'flappy pi': {
      light: 'https://i.ibb.co/BVQYVbyb/verified.png',
      dark: 'https://i.ibb.co/BVQYVbyb/verified.png',
    },
    'droplink': {
      light: 'https://i.ibb.co/BVQYVbyb/verified.png',
      dark: 'https://i.ibb.co/BVQYVbyb/verified.png',
    },
    'mrwain hub': {
      light: 'https://i.ibb.co/p6HtQ2c5/verify-3.png',
      dark: 'https://i.ibb.co/p6HtQ2c5/verify-3.png',
    },
  };
  const badge = badgeMap[appKey];
  const isVerified = !!badge;
  const badgeSrc = badge ? (theme === 'dark' ? badge.dark : badge.light) : '';
  const normalizedWebsite = (() => {
    const raw = (app.website_url || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  })();
  const renderGetButton = (className: string) => {
    if (normalizedWebsite) {
      return (
        <a
          href={normalizedWebsite}
          rel="noopener noreferrer"
          className={className}
          onClick={(e) => e.stopPropagation()}
        >
          Get
        </a>
      );
    }
    return (
      <Link to={`/app/${app.id}`} className={className} onClick={(e) => e.stopPropagation()}>
        Get
      </Link>
    );
  };

  // Featured story card - large hero style
  if (variant === 'featured') {
    return (
      <Link to={`/app/${app.id}`} className="block group">
        <div className="relative overflow-hidden rounded-2xl">
          {/* Background image or gradient */}
          <div className="aspect-[2/1] bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
            {app.screenshots && app.screenshots[0] && (
              <img 
                src={app.screenshots[0].image_url} 
                alt="" 
                className="h-full w-full object-cover opacity-80"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
              {app.is_featured ? 'FEATURED' : 'NOW AVAILABLE'}
            </p>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {app.name}
              {isVerified && (
                <img src={badgeSrc} alt="Verified" className="h-5 w-5" />
              )}
            </h3>
            <p className="text-sm text-white/80 line-clamp-1">{app.tagline}</p>
          </div>
          
          {/* App info card at bottom */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-card/90 backdrop-blur-sm p-3">
            <AppIcon src={app.logo_url} name={app.name} size="sm" />
            <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate flex items-center gap-2">
              {app.name}
              {isVerified && (
                <img src={badgeSrc} alt="Verified" className="h-4 w-4" />
              )}
            </h4>
              <p className="text-xs text-muted-foreground truncate">{app.tagline}</p>
            </div>
            {renderGetButton("flex-shrink-0 rounded-full bg-secondary px-5 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary/80")}
          </div>
        </div>
      </Link>
    );
  }

  // Compact list item - like "You Might Also Like"
  if (variant === 'compact' || variant === 'list') {
    return (
      <div className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
        <Link to={`/app/${app.id}`} className="flex-shrink-0">
          <AppIcon src={app.logo_url} name={app.name} size="sm" />
        </Link>
        <Link to={`/app/${app.id}`} className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground leading-tight flex items-center gap-2">
            {app.name}
            {isVerified && (
              <img src={badgeSrc} alt="Verified" className="h-4 w-4" />
            )}
          </h4>
          <p className="text-sm text-muted-foreground truncate">{app.tagline || app.category?.name}</p>
        </Link>
        {renderGetButton("flex-shrink-0 rounded-full bg-secondary px-5 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary/80")}
      </div>
    );
  }

  // Default grid card
  return (
    <Link to={`/app/${app.id}`} className="block group">
      <div className="flex items-start gap-3">
        <AppIcon src={app.logo_url} name={app.name} size="sm" />
        <div className="flex-1 min-w-0 py-1">
          <h4 className="font-medium text-foreground truncate leading-tight flex items-center gap-2">
            {app.name}
            {isVerified && (
              <img src={badgeSrc} alt="Verified" className="h-4 w-4" />
            )}
          </h4>
          <p className="text-sm text-muted-foreground truncate">{app.tagline || app.category?.name}</p>
          {app.ratings_count > 0 && (
            <div className="mt-1">
              <StarRating rating={app.average_rating} size="sm" />
            </div>
          )}
        </div>
        {renderGetButton("flex-shrink-0 rounded-full bg-secondary px-5 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary/80 mt-1")}
      </div>
    </Link>
  );
}

// Section header component
interface SectionHeaderProps {
  title: string;
  href?: string;
}

export function SectionHeader({ title, href }: SectionHeaderProps) {
  if (href) {
    return (
      <Link to={href} className="flex items-center justify-between mb-4 group">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </Link>
    );
  }
  
  return (
    <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
  );
}
