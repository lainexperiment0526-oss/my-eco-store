import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { 
  Settings, 
  Palette, 
  Layout, 
  Bell, 
  Shield, 
  Users,
  Store,
  RefreshCw
} from "lucide-react";

export const UserPreferencesManager = () => {
  const {
    preferences,
    loading,
    updatePreference,
    updateNestedPreference,
    resetToDefaults,
    trackFeatureUsage
  } = useUserPreferences();

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    await updatePreference('theme_mode', theme);
    trackFeatureUsage('theme_switch');
    toast.success(`Switched to ${theme} theme`);
  };

  const handleResetPreferences = async () => {
    await resetToDefaults();
    trackFeatureUsage('preferences_reset');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p>Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          User Preferences
        </CardTitle>
        <CardDescription>
          Customize your DropLink experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="theme" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="theme">
              <Palette className="h-4 w-4 mr-1" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="store">
              <Store className="h-4 w-4 mr-1" />
              Store
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="h-4 w-4 mr-1" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-1" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="theme" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Theme Mode</Label>
                <div className="flex gap-2">
                  <Button
                    variant={preferences.theme_mode === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeChange('light')}
                  >
                    Light
                  </Button>
                  <Button
                    variant={preferences.theme_mode === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeChange('dark')}
                  >
                    Dark
                  </Button>
                  <Button
                    variant={preferences.theme_mode === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeChange('system')}
                  >
                    System
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="store" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Community Section</Label>
                  <p className="text-sm text-muted-foreground">Hide or show the followers & gifts block on your public bio</p>
                </div>
                <Switch
                  checked={preferences.store_settings.showCommunitySection}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('store_settings', 'showCommunitySection', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Message Form</Label>
                  <p className="text-sm text-muted-foreground">Allow visitors to send you public bio messages</p>
                </div>
                <Switch
                  checked={preferences.store_settings.showMessageForm}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('store_settings', 'showMessageForm', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Pi Ad Network</Label>
                  <p className="text-sm text-muted-foreground">Hide or show Pi ads on your public bio (when your plan allows ads)</p>
                </div>
                <Switch
                  checked={preferences.store_settings.showPiAds}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('store_settings', 'showPiAds', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Follower Count</Label>
                  <p className="text-sm text-muted-foreground">Display follower count on your profile</p>
                </div>
                <Switch
                  checked={preferences.store_settings.showFollowerCount}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('store_settings', 'showFollowerCount', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Gifts</Label>
                  <p className="text-sm text-muted-foreground">Allow visitors to send you gifts</p>
                </div>
                <Switch
                  checked={preferences.store_settings.allowGifts}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('store_settings', 'allowGifts', checked)
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Profile Visible</Label>
                  <p className="text-sm text-muted-foreground">Make your profile publicly visible</p>
                </div>
                <Switch
                  checked={preferences.privacy_settings.profileVisible}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('privacy_settings', 'profileVisible', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show in Search</Label>
                  <p className="text-sm text-muted-foreground">Allow your profile to appear in search results</p>
                </div>
                <Switch
                  checked={preferences.privacy_settings.showInSearch}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('privacy_settings', 'showInSearch', checked)
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                </div>
                <Switch
                  checked={preferences.notification_settings.browser}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('notification_settings', 'browser', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Follow Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when someone follows you</p>
                </div>
                <Switch
                  checked={preferences.notification_settings.follows}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('notification_settings', 'follows', checked)
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleResetPreferences}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
