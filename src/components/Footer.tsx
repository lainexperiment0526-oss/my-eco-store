import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
        <span>© 2026 OpenApp by Mrwain Organization</span>
        <div className="flex items-center gap-3">
          <Link to="/terms" className="hover:text-foreground transition-colors">Legal</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/license" className="hover:text-foreground transition-colors">License</Link>
        </div>
      </div>
    </footer>
  );
}
