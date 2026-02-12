import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, Shield, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";

interface AccountDeletionProps {
  currentUser: any;
  onAccountDeleted: () => void;
}

export const AccountDeletion: React.FC<AccountDeletionProps> = ({ 
  currentUser, 
  onAccountDeleted 
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const { toast } = useToast();
  const { piUser, signOut } = usePi();

  const confirmationPhrase = "DELETE MY ACCOUNT";
  const isConfirmed = confirmationText === confirmationPhrase;

  const handleAccountDeletion = async () => {
    if (!isConfirmed) {
      toast({
        title: "Confirmation Required",
        description: `Please type \"${confirmationPhrase}\" to confirm account deletion`,
        variant: "destructive"
      });
      return;
    }

    // Additional confirmation dialog with detailed warning
    const finalConfirm = window.confirm(
      '⚠️ FINAL WARNING: Deleting your account will:\n\n' +
      '• PERMANENTLY delete ALL subscriptions\n' +
      '• Remove ALL gift cards (purchased & redeemed)\n' +
      '• Delete ALL profile data and settings\n' +
      '• Erase ALL payment history and links\n' +
      '• Remove ALL custom content and preferences\n\n' +
      'If you create a new account, you will start with:\n' +
      '• FREE plan (no active subscription)\n' +
      '• No previous data or history\n' +
      '• Default settings only\n\n' +
      'This action is PERMANENT and CANNOT be undone!\n\n' +
      'Click OK to proceed with account deletion, or Cancel to keep your account.'
    );

    if (!finalConfirm) {
      return;
    }

    const userIdToDelete = currentUser?.id || piUser?.uid;
    if (!userIdToDelete) {
      toast({
        title: "User ID Missing",
        description: "Could not determine the user ID to delete. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Step 1: Delete user data via database function
      setDeleteStep(1);
      const { data: deleteResult, error: deleteError } = await supabase
        .rpc('delete_user_account_completely' as any, {
          user_id_to_delete: userIdToDelete
        });

      if (deleteError) {
        throw new Error(`Failed to delete user data: ${deleteError.message}`);
      }

      console.log('Account deletion result:', deleteResult);

      // Step 2: Sign out from Pi Network
      setDeleteStep(2);
      await signOut();

      // Step 3: Clear local storage
      setDeleteStep(3);
      localStorage.clear();
      sessionStorage.clear();

      // Step 4: Clear any cached data
      setDeleteStep(4);
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      toast({
        title: "Account Deleted Successfully",
        description: "Your account, all subscriptions, and gift cards have been permanently deleted. You can create a new account anytime starting with the FREE plan.",
        duration: 5000
      });


      // Call the callback to handle app-level reset
      onAccountDeleted();

      // Force a full page reload to ensure all state is reset
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('Account deletion error:', error);
      toast({
        title: "Account Deletion Failed", 
        description: error.message || "An error occurred while deleting your account. Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteStep(1);
      setIsDeleteDialogOpen(false);
    }
  };

  const getStepDescription = () => {
    switch (deleteStep) {
      case 1: return "Deleting subscriptions, gift cards, and user data...";
      case 2: return "Signing out from Pi Network...";
      case 3: return "Clearing local storage...";
      case 4: return "Clearing cached data...";
      default: return "Processing deletion...";
    }
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <Trash2 className="h-5 w-5" />
          Delete Account
        </CardTitle>
        <CardDescription className="text-red-600">
          Permanently delete your DropLink account and all associated data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Warning: This action cannot be undone!</strong>
            <br />
            Deleting your account will permanently remove:
          </AlertDescription>
        </Alert>

        <div className="bg-white p-4 rounded-lg border border-red-200">
          <h4 className="font-semibold text-red-700 mb-2">What will be deleted:</h4>
          <ul className="space-y-1 text-sm text-red-600">
            <li>• <strong>All subscriptions (reset to FREE plan)</strong></li>
            <li>• <strong>All gift cards (purchased & redeemed)</strong></li>
            <li>• All profile information and settings</li>
            <li>• Payment links and transaction history</li>
            <li>• Analytics data and usage statistics</li>
            <li>• Custom links and domain settings</li>
            <li>• Pi Network wallet connections</li>
            <li>• User preferences and customizations</li>
            <li>• Products, orders, and merchant data</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <RefreshCw className="h-4 w-4" />
            <span className="font-semibold">After Deletion & Fresh Start</span>
          </div>
          <p className="text-sm text-blue-600 mb-2">
            You can create a new account anytime using your Pi Network username. 
            Your new account will start completely fresh with:
          </p>
          <ul className="space-y-1 text-sm text-blue-600 ml-4">
            <li>• <strong>FREE plan by default</strong> (no active subscription)</li>
            <li>• Default settings and preferences</li>
            <li>• No previous data or history</li>
            <li>• Clean slate for a new beginning</li>
          </ul>
          <p className="text-sm text-blue-600 mt-2">
            <strong>Note:</strong> Deleting your account permanently removes all subscriptions. 
            If you had a paid plan, it will not carry over to your new account.
          </p>
        </div>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Confirm Account Deletion
              </DialogTitle>
              <DialogDescription>
                This action will permanently delete your account and cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <Shield className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <strong>All data will be permanently lost:</strong>
                  <br />
                  • All subscriptions deleted (reset to FREE plan)
                  <br />
                  • All gift cards removed (purchased & redeemed)
                  <br />
                  • All profile data, links, and settings erased
                  <br />
                  <br />
                  You can create a new account later, but it will start completely fresh with no subscription or previous data.
                </AlertDescription>
              </Alert>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Type "{confirmationPhrase}" to confirm:
                </label>
                <Input
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={confirmationPhrase}
                  className={confirmationText && !isConfirmed ? "border-red-300" : ""}
                  disabled={isDeleting}
                />
              </div>

              {isDeleting && (
                <div className="text-center text-sm text-gray-600">
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" />
                  {getStepDescription()}
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setConfirmationText('');
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleAccountDeletion}
                disabled={!isConfirmed || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};