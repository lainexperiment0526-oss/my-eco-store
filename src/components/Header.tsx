import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { MenuDrawer } from '@/components/MenuDrawer';
import { LanguageSelector } from '@/components/LanguageSelector';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-xl font-bold text-foreground">OpenApp</span>
        </Link>

        <nav className="flex items-center gap-2">
          <div className="hidden sm:block"><LanguageSelector compact /></div>
          <MenuDrawer />
        </nav>
      </div>
    </header>
  );
}

