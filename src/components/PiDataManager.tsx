import { useState, useEffect } from "react";
import { usePi } from "@/contexts/PiContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Database, CheckCircle, XCircle, RefreshCw, Eye } from "lucide-react";

interface PiUserData {
  pi_username?: string;
  pi_uid?: string;
  profileId?: string;
  supabaseUserId?: string;
  lastSynced?: string;
  isNewProfile?: boolean;
}

const PiDataManager = () => {
  const { piUser, accessToken, isAuthenticated, getPiUserProfile } = usePi();
  const [extendedData, setExtendedData] = useState<PiUserData | null>(null);
  const [supabaseProfile, setSupabaseProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExtendedData();
  }, [piUser]);

  const loadExtendedData = () => {
    const stored = localStorage.getItem('pi_user_extended');
    if (stored) {
      try {
        setExtendedData(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse extended Pi data:', err);
      }
    }
  };

  const refreshSupabaseProfile = async () => {
    if (!piUser?.username) return;

    setLoading(true);
    try {
      const profile = await getPiUserProfile(piUser.username);
      setSupabaseProfile(profile);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewProfileInSupabase = () => {
    if (supabaseProfile?.id) {
      // Open Supabase dashboard (you'll need to replace with your actual project URL)
      const supabaseUrl = `https://app.supabase.com/project/idkjfuctyukspexmijvb/editor/profiles?filter=id%3Aeq%3A${supabaseProfile.id}`;
      window.open(supabaseUrl, '_blank');
    }
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      return true;
    } catch (err) {
      console.error('Database test failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (!isAuthenticated || !piUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Pi Network Data Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              Please sign in with Pi Network to view your data management options.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Pi Network ↔ Supabase Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pi-data">Pi Data</TabsTrigger>
              <TabsTrigger value="supabase-data">Supabase Data</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Pi Network Status</h3>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Connected as @{piUser.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Pi UID: {piUser.uid}</span>
                  </div>
                  {piUser.wallet_address && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Wallet: {piUser.wallet_address.substring(0, 8)}...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Supabase Sync Status</h3>
                  {extendedData ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Synced to Database</span>
                      </div>
                      {extendedData.profileId && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Profile ID: {extendedData.profileId.substring(0, 8)}...</span>
                        </div>
                      )}
                      {extendedData.lastSynced && (
                        <div className="text-sm text-muted-foreground">
                          Last synced: {formatDate(extendedData.lastSynced)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-yellow-500" />
                      <span>Not synced yet</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={refreshSupabaseProfile} 
                  disabled={loading}
                  variant="outline"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Supabase Data
                </Button>
                {supabaseProfile && (
                  <Button 
                    onClick={viewProfileInSupabase}
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View in Supabase
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pi-data" className="space-y-4">
              <h3 className="font-medium">Pi Network User Data</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <p className="font-mono">{piUser.username || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID (UID)</label>
                  <p className="font-mono text-xs break-all">{piUser.uid}</p>
                </div>
                {piUser.wallet_address && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Wallet Address</label>
                    <p className="font-mono text-xs break-all">{piUser.wallet_address}</p>
                  </div>
                )}
              </div>

              {accessToken && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Access Token (truncated)</label>
                  <p className="font-mono text-xs">
                    {accessToken.substring(0, 20)}...{accessToken.substring(accessToken.length - 10)}
                  </p>
                </div>
              )}

              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  This data is automatically saved to your browser's localStorage and synced to Supabase database 
                  when you authenticate with Pi Network.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="supabase-data" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Supabase Profile Data</h3>
                <Button 
                  onClick={refreshSupabaseProfile} 
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {supabaseProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Profile ID</label>
                      <p className="font-mono text-sm">{supabaseProfile.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Username</label>
                      <p className="font-mono">{supabaseProfile.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                      <p>{supabaseProfile.business_name || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created At</label>
                      <p className="text-sm">{formatDate(supabaseProfile.created_at)}</p>
                    </div>
                  </div>

                  {supabaseProfile.user_id && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Supabase User ID</label>
                      <p className="font-mono text-sm">{supabaseProfile.user_id}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Store URL</label>
                    <p className="text-sm text-primary">
                      {window.location.origin}/u/{supabaseProfile.username}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="outline">
                      Linked to Pi Network
                    </Badge>
                    <Badge variant="secondary">
                      Database Synced
                    </Badge>
                  </div>
                </div>
              ) : (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    No Supabase profile data found. Click "Refresh" to load data from the database.
                    {!loading && " If this persists, your Pi user data may not be synced yet."}
                  </AlertDescription>
                </Alert>
              )}

              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading profile data from Supabase...
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Extended Local Data */}
      {extendedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Extended Local Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(extendedData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PiDataManager;