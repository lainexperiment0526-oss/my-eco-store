import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Newspaper, Gamepad2, LayoutGrid, Joystick, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Newspaper, label: 'Today', path: '/', match: (p: string, s: URLSearchParams) => p === '/' && !s.get('tab') && !s.get('search') },
  { icon: Gamepad2, label: 'Games', path: '/?tab=games', match: (p: string, s: URLSearchParams) => s.get('tab') === 'games' },
  { icon: LayoutGrid, label: 'Apps', path: '/?tab=apps', match: (p: string, s: URLSearchParams) => s.get('tab') === 'apps' },
  { icon: Joystick, label: 'Arcade', path: '/?tab=arcade', match: (p: string, s: URLSearchParams) => s.get('tab') === 'arcade' },
  { icon: Search, label: 'Search', path: '/?search=1', match: (p: string, s: URLSearchParams) => !!s.get('search') || !!s.get('q') },
];

export function BottomNav() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/85 backdrop-blur-xl safe-area-inset-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pt-1.5 pb-1">
        {navItems.map(({ icon: Icon, label, path, match }) => {
          const isActive = match(location.pathname, searchParams);
          return (
            <Link
              key={label}
              to={path}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 1.8} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.15 : 0} />
              <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
