import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// User Preferences Types - stored in localStorage only
export interface DashboardLayout {
  sidebarCollapsed: boolean;
  previewMode: 'phone' | 'tablet' | 'desktop';
  activeTab: string;
}

export interface StoreSettings {
  showFollowerCount: boolean;
  showVisitCount: boolean;
  enableComments: boolean;
  allowGifts: boolean;
  showSocialLinks: boolean;
  showCommunitySection: boolean;
  showMessageForm: boolean;
  showPiAds: boolean;
  showEmailCapture?: boolean;
}

export interface SocialSettings {
  allowFollows: boolean;
  showOnline: boolean;
  enableNotifications: boolean;
  allowMessages: boolean;
}

export interface ContentSettings {
  autoSave: boolean;
  draftsEnabled: boolean;
  backupEnabled: boolean;
  autoPublish: boolean;
}

export interface PrivacySettings {
  profileVisible: boolean;
  analyticsEnabled: boolean;
  dataCollection: boolean;
  showInSearch: boolean;
}

export interface NotificationSettings {
  email: boolean;
  browser: boolean;
  marketing: boolean;
  follows: boolean;
  comments: boolean;
}

export interface UserPreferences {
  id?: string;
  user_id?: string;
  profile_id?: string;
  theme_mode: 'light' | 'dark' | 'system';
  primary_color: string;
  background_color: string;
  font_size: 'small' | 'medium' | 'large';
  dashboard_layout: DashboardLayout;
  store_settings: StoreSettings;
  social_settings: SocialSettings;
  content_settings: ContentSettings;
  privacy_settings: PrivacySettings;
  notification_settings: NotificationSettings;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  theme_mode: 'light',
  primary_color: '#8B5CF6',
  background_color: '#ffffff',
  font_size: 'medium',
  dashboard_layout: {
    sidebarCollapsed: false,
    previewMode: 'phone',
    activeTab: 'links'
  },
  store_settings: {
    showFollowerCount: true,
    showVisitCount: true,
    enableComments: false,
    allowGifts: true,
    showSocialLinks: true,
    showCommunitySection: true,
    showMessageForm: true,
    showPiAds: true
  },
  social_settings: {
    allowFollows: true,
    showOnline: true,
    enableNotifications: true,
    allowMessages: false
  },
  content_settings: {
    autoSave: true,
    draftsEnabled: true,
    backupEnabled: true,
    autoPublish: false
  },
  privacy_settings: {
    profileVisible: true,
    analyticsEnabled: true,
    dataCollection: false,
    showInSearch: true
  },
  notification_settings: {
    email: true,
    browser: true,
    marketing: false,
    follows: true,
    comments: true
  }
};

interface UserPreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  updateNestedPreference: <K extends keyof UserPreferences, NK extends keyof UserPreferences[K]>(
    key: K, 
    nestedKey: NK, 
    value: UserPreferences[K][NK]
  ) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  trackFeatureUsage: (featureName: string) => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'droplink_user_preferences';

const mergeWithDefaults = (partial: Partial<UserPreferences>): UserPreferences => ({
  ...defaultPreferences,
  ...partial,
  dashboard_layout: {
    ...defaultPreferences.dashboard_layout,
    ...(partial.dashboard_layout || {})
  },
  store_settings: {
    ...defaultPreferences.store_settings,
    ...(partial.store_settings || {})
  },
  social_settings: {
    ...defaultPreferences.social_settings,
    ...(partial.social_settings || {})
  },
  content_settings: {
    ...defaultPreferences.content_settings,
    ...(partial.content_settings || {})
  },
  privacy_settings: {
    ...defaultPreferences.privacy_settings,
    ...(partial.privacy_settings || {})
  },
  notification_settings: {
    ...defaultPreferences.notification_settings,
    ...(partial.notification_settings || {})
  }
});

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    hydratePreferences();
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (!loading) {
      savePreferences();
    }
  }, [preferences, loading]);

  // Apply theme to HTML element - LIGHT MODE ONLY
  useEffect(() => {
    const root = document.documentElement;
    // Always apply light mode, disable dark mode completely
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  const hydratePreferences = async () => {
    try {
      let nextPreferences: UserPreferences = defaultPreferences;

      // Start with any locally cached preferences
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        nextPreferences = mergeWithDefaults(JSON.parse(cached));
      }

      // Attempt to load the authenticated user and profile so we can pull remote prefs
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id || null;
      setAuthUserId(userId);

      let resolvedProfileId: string | null = null;
      if (userId) {
        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) {
          console.error('Error loading profile for preferences:', profileError);
        }
        resolvedProfileId = profileRow?.id || null;
        setProfileId(resolvedProfileId);
      }

      // Pull remote preferences if available for this profile
      if (resolvedProfileId) {
        const { data: remotePrefs, error } = await (supabase as any)
          .from('user_preferences')
          .select('theme_mode, primary_color, background_color, store_settings, social_settings, content_settings, privacy_settings, notification_settings')
          .eq('profile_id', resolvedProfileId)
          .maybeSingle();

        if (error) {
          console.error('Failed to load remote preferences:', error);
        } else if (remotePrefs) {
          nextPreferences = mergeWithDefaults(remotePrefs as Partial<UserPreferences>);
        }
      }

      setPreferences(nextPreferences);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
    } catch (error) {
      console.error('Error loading preferences:', error);
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  };

  const persistToSupabase = async (next: UserPreferences) => {
    if (!authUserId) return;

    const payload = {
      user_id: authUserId,
      profile_id: profileId,
      theme_mode: next.theme_mode,
      primary_color: next.primary_color,
      background_color: next.background_color,
      store_settings: next.store_settings,
      social_settings: next.social_settings,
      content_settings: next.content_settings,
      privacy_settings: next.privacy_settings,
      notification_settings: next.notification_settings
    };

    try {
      const { data: existing } = await (supabase as any)
        .from('user_preferences')
        .select('id')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await (supabase as any)
          .from('user_preferences')
          .update(payload)
          .eq('id', existing.id);
        if (error) {
          console.error('Failed to update preferences in Supabase:', error);
        }
      } else {
        const { error } = await (supabase as any)
          .from('user_preferences')
          .insert(payload);
        if (error) {
          console.error('Failed to insert preferences in Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Supabase preference sync error:', error);
    }
  };

  const savePreferences = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const updatePreference = async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => {
      const next = {
        ...prev,
        [key]: value
      };
      void persistToSupabase(next);
      return next;
    });
    console.log(`Updated preference: ${String(key)}`);
  };

  const updateNestedPreference = async <K extends keyof UserPreferences, NK extends keyof UserPreferences[K]>(
    key: K, 
    nestedKey: NK, 
    value: UserPreferences[K][NK]
  ) => {
    setPreferences(prev => {
      const next = {
        ...prev,
        [key]: {
          ...(prev[key] as any),
          [nestedKey]: value
        }
      };
      void persistToSupabase(next);
      return next;
    });
    console.log(`Updated nested preference: ${String(key)}.${String(nestedKey)}`);
  };

  const resetToDefaults = async () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem(STORAGE_KEY);
    await persistToSupabase(defaultPreferences);
    toast.success('Preferences reset to defaults');
  };

  const trackFeatureUsage = (featureName: string) => {
    console.log(`Feature used: ${featureName}`);
  };

  return (
    <UserPreferencesContext.Provider value={{
      preferences,
      loading,
      updatePreference,
      updateNestedPreference,
      resetToDefaults,
      trackFeatureUsage
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

export { defaultPreferences };
