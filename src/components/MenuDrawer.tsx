import { Link } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Menu,
  Home,
  Grid3X3,
  Sun,
  Moon,
  Megaphone,
  BarChart3,
  Shield,
  LogIn,
  LogOut,
  PlusCircle,
  AppWindow,
  User,
} from 'lucide-react';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

function MenuItem({ icon, label, href, onClick, isActive }: MenuItemProps) {
  const content = (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-secondary text-foreground'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  );

  if (href) {
    if (href.startsWith('http')) {
      return <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
    }
    return <Link to={href}>{content}</Link>;
  }

  return <button onClick={onClick} className="w-full text-left">{content}</button>;
}

export function MenuDrawer() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, signOut } = useAuth();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="text-left">OpenApp</SheetTitle>
        </SheetHeader>
        
        <div className="px-3 py-2 space-y-1">
          <MenuItem icon={<Home className="h-5 w-5" />} label="Home" href="/" />
          <MenuItem icon={<Grid3X3 className="h-5 w-5" />} label="Browse Apps" href="/" />
          <MenuItem icon={<PlusCircle className="h-5 w-5" />} label="Submit App" href="/submit" />
          {user && <MenuItem icon={<User className="h-5 w-5" />} label="Profile" href="/profile" />}
        </div>

        <div className="px-3 py-2 border-t border-border mt-2 pt-3 space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase mb-2">Ad Network</p>
          <MenuItem icon={<Megaphone className="h-5 w-5" />} label="Advertiser Dashboard" href="/advertiser" />
          <MenuItem icon={<BarChart3 className="h-5 w-5" />} label="Analytics" href="/analytics" />
          {user && <MenuItem icon={<AppWindow className="h-5 w-5" />} label="My Apps" href="/my-apps" />}
        </div>

        {isAdmin && (
          <div className="px-3 py-2 border-t border-border mt-2 pt-3 space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase mb-2">Admin</p>
            <MenuItem icon={<Shield className="h-5 w-5" />} label="App Moderation" href="/admin" />
            <MenuItem icon={<Shield className="h-5 w-5" />} label="Ad Moderation" href="/ad-moderation" />
          </div>
        )}

        <div className="px-3 py-2 border-t border-border mt-2 pt-3 space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase mb-2">Legal</p>
          <MenuItem icon={<Shield className="h-5 w-5" />} label="Privacy Policy" href="/privacy" />
          <MenuItem icon={<Shield className="h-5 w-5" />} label="Terms of Service" href="/terms" />
          <MenuItem icon={<Shield className="h-5 w-5" />} label="License" href="/license" />
        </div>

        <div className="px-3 py-2 border-t border-border mt-2 pt-3 space-y-1">
          <MenuItem
            icon={theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            onClick={toggleTheme}
          />
          {user ? (
            <MenuItem icon={<LogOut className="h-5 w-5" />} label="Sign Out" onClick={signOut} />
          ) : (
            <MenuItem icon={<LogIn className="h-5 w-5" />} label="Sign In" href="/auth" />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
