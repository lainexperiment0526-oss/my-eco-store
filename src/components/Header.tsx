import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { MenuDrawer } from '@/components/MenuDrawer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { User } from 'lucide-react';

function getDisplayName(user: ReturnType<typeof useAuth>['user']) {
  if (!user) return '';
  if (user.user_metadata?.username) return String(user.user_metadata.username);
  if (user.user_metadata?.full_name) return String(user.user_metadata.full_name);
  if (user.email) return user.email.split('@')[0];
  return 'User';
}

export function Header() {
  const { user, loading } = useAuth();
  const displayName = getDisplayName(user);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-xl font-bold text-foreground">OpenApp</span>
        </Link>

        <nav className="flex items-center gap-2">
          {!loading && (
            user ? (
              <Link
                to="/profile"
                className="hidden max-w-[150px] items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:flex"
              >
                <User className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{displayName}</span>
              </Link>
            ) : (
              <Button asChild size="sm" className="rounded-full">
                <Link to="/auth">Sign In</Link>
              </Button>
            )
          )}
          <MenuDrawer />
        </nav>
      </div>
    </header>
  );
}

