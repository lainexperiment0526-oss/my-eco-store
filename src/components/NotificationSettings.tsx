import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bell, Smartphone, Globe, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { isPiBrowserEnv } from '@/contexts/PiContext';

interface NotificationSettingsProps {
  profileId: string;
  userEmail: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  profileId,
  userEmail,
}) => {
  const {
    isSupported,
    hasPermission,
    isInitialized,
    isLoading,
    error,
    isPiBrowser,
    requestPermission,
    initialize,
    sendTest,
  } = usePushNotifications(profileId, userEmail);

  const [localError, setLocalError] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Notification permission granted!');
      await initialize(profileId, userEmail);
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleSendTest = async () => {
    const success = await sendTest(profileId, userEmail);
    if (success) {
      toast.success('Test notification sent!');
    } else {
      toast.error('Failed to send test notification');
    }
  };

  return (
    <div className="space-y-4">
      {/* Support Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications while using DropLink
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Support Status */}
          <div className="space-y-2">
            <h4 className="font-medium">Support Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Browser Support */}
              <div className="p-3 rounded-lg border border-border flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4" />
                    <span className="font-medium text-sm">Browser Support</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isSupported ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Supported
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                        Not Supported
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Pi Browser Detection */}
              <div className="p-3 rounded-lg border border-border flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="w-4 h-4" />
                    <span className="font-medium text-sm">Pi Browser</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isPiBrowser ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Detected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-gray-500" />
                        Not Detected
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Permission Status */}
          <div className="space-y-2">
            <h4 className="font-medium">Permission Status</h4>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Notification Permission</span>
              </div>
              <Badge variant={hasPermission ? 'default' : 'secondary'}>
                {hasPermission ? 'Granted' : 'Not Granted'}
              </Badge>
            </div>
          </div>

          {/* Initialization Status */}
          <div className="space-y-2">
            <h4 className="font-medium">Initialization Status</h4>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm">Service Ready</span>
              </div>
              <Badge variant={isInitialized ? 'default' : 'secondary'}>
                {isInitialized ? 'Ready' : 'Not Ready'}
              </Badge>
            </div>
          </div>

          {/* Error Display */}
          {(error || localError) && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error || localError}</span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {!hasPermission && isSupported && (
              <Button onClick={handleRequestPermission} disabled={isLoading} className="flex-1">
                {isLoading ? 'Requesting...' : 'Enable Notifications'}
              </Button>
            )}

            {hasPermission && (
              <Button
                onClick={handleSendTest}
                disabled={isLoading || !isInitialized}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? 'Sending...' : 'Send Test Notification'}
              </Button>
            )}
          </div>

          {/* Info Box */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
            <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              <strong>💡 Tip:</strong> Push notifications work best when you grant browser
              permission. {isPiBrowser && 'In Pi Browser, notifications will appear in your notification center.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Types</CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              id: 'follows',
              label: 'New Followers',
              description: 'When someone follows your profile',
            },
            {
              id: 'comments',
              label: 'New Comments',
              description: 'When someone comments on your content',
            },
            {
              id: 'messages',
              label: 'Direct Messages',
              description: 'When you receive a new message',
            },
            {
              id: 'sales',
              label: 'New Sales',
              description: 'When someone purchases your digital product',
            },
            {
              id: 'tips',
              label: 'Tips & Donations',
              description: 'When you receive a tip or donation',
            },
          ].map((notificationType) => (
            <div key={notificationType.id} className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium">{notificationType.label}</label>
                <p className="text-xs text-muted-foreground">{notificationType.description}</p>
              </div>
              <Switch defaultChecked disabled={!hasPermission} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Platform-Specific Info */}
      {isPiBrowser && (
        <Card className="border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/10">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Pi Browser Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 dark:text-blue-200 space-y-2">
            <p>
              ✅ You&apos;re using Pi Browser! Notifications will be sent to your device&apos;s notification center.
            </p>
            <p>
              Make sure to allow notifications in your Pi Browser settings to receive all updates about:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>New followers and social activity</li>
              <li>Product sales and tips</li>
              <li>Important account updates</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationSettings;
