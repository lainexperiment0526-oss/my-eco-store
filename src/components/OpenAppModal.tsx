import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Globe } from 'lucide-react';

interface OpenAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpenAppModal({ open, onOpenChange }: OpenAppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">OpenApp on the Web</DialogTitle>
          <DialogDescription className="text-center">
            OpenApp is accessible directly through the web. No external download is required.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Globe className="h-10 w-10 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Just open OpenApp in your browser to browse, discover, and use apps — no installs, no APKs.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
