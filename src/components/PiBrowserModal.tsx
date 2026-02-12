import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const PiBrowserModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Pi Browser Required</DialogTitle>
        <DialogDescription>
          <div className="space-y-3">
            <p>This feature requires Pi Network authentication and must be loaded in the official Pi Browser.</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="font-medium text-sm text-blue-900">If you're already in Pi Browser:</p>
              <ul className="text-xs text-blue-800 mt-2 list-disc list-inside space-y-1">
                <li>Try refreshing the page (Cmd+R or Ctrl+R)</li>
                <li>Clear browser cache and reload</li>
                <li>Ensure Pi Browser version is up to date</li>
              </ul>
            </div>
            
            <p>If you don't have Pi Browser yet:</p>
            <a href="https://minepi.com/get" target="_blank" rel="noopener noreferrer" className="block mt-2 w-full rounded-md bg-[#FF8200] text-white hover:bg-[#cc6900] py-3 text-center font-medium transition-colors">
              Download Pi Browser
            </a>
          </div>
        </DialogDescription>
      </DialogHeader>
      <Button onClick={onClose} className="w-full mt-2">Close</Button>
    </DialogContent>
  </Dialog>
);
