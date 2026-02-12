import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Database, Users, Eye } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";

interface DebugInfo {
  tablesExist: boolean;
  profilesCount: number;
  sampleProfiles: any[];
  currentUser: any;
  authStatus: string;
  errors: string[];
}

const ProfileDebug = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    tablesExist: false,
    profilesCount: 0,
    sampleProfiles: [],
    currentUser: null,
    authStatus: 'checking',
    errors: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const errors: string[] = [];
    let tablesExist = false;
    let profilesCount = 0;
    let sampleProfiles: any[] = [];
    let currentUser = null;
    let authStatus = 'unauthenticated';

    try {
      // Check auth status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        errors.push(`Auth Error: ${authError.message}`);
      } else if (user) {
        currentUser = user;
        authStatus = 'authenticated';
      }

      // Test table access
      const { data: profiles, error: profileError, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .limit(5);

      if (profileError) {
        errors.push(`Database Error: ${profileError.message}`);
        if (profileError.message.includes('does not exist')) {
          errors.push('❌ Database tables are not set up. Please run the migration scripts.');
        }
      } else {
        tablesExist = true;
        profilesCount = count || 0;
        sampleProfiles = profiles || [];
      }

      // Test analytics table
      try {
        const { error: analyticsError } = await supabase
          .from('analytics')
          .select('*')
          .limit(1);
        
        if (analyticsError) {
          errors.push(`Analytics Error: ${analyticsError.message}`);
        }
      } catch (e) {
        errors.push('Analytics table not accessible');
      }

    } catch (error) {
      errors.push(`General Error: ${error}`);
    }

    setDebugInfo({
      tablesExist,
      profilesCount,
      sampleProfiles,
      currentUser,
      authStatus,
      errors
    });
    setLoading(false);
  };

  const createTestProfile = async () => {
    if (!debugInfo.currentUser) {
      alert('Please sign in first');
      return;
    }

    try {
      const testUsername = `test_${Date.now()}`;
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: debugInfo.currentUser.id,
          username: testUsername,
          business_name: 'Test Store',
          description: 'This is a test store for debugging',
          social_links: {},
          theme_settings: { primaryColor: '#38bdf8' },
        })
        .select()
        .single();

      if (error) {
        alert(`Failed to create test profile: ${error.message}`);
      } else {
        alert(`Test profile created! URL: ${window.location.origin}/u/${testUsername}`);
        runDiagnostics(); // Refresh diagnostics
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 animate-spin" />
            Running diagnostics...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <PageHeader 
        title="Profile Debug" 
        description="Database and profile information"
        icon={<Database />}
      />
      <div className="space-y-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 pb-24">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Profile Debug Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="profiles">Profiles</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {debugInfo.tablesExist ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>Database Tables</span>
                    <Badge variant={debugInfo.tablesExist ? "default" : "destructive"}>
                      {debugInfo.tablesExist ? 'EXISTS' : 'MISSING'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Total Profiles</span>
                    <Badge variant="outline">
                      {debugInfo.profilesCount}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {debugInfo.authStatus === 'authenticated' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span>Authentication</span>
                    <Badge variant={debugInfo.authStatus === 'authenticated' ? "default" : "secondary"}>
                      {debugInfo.authStatus.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {debugInfo.currentUser && (
                    <div className="text-sm text-muted-foreground">
                      User ID: {debugInfo.currentUser.id.substring(0, 8)}...
                    </div>
                  )}
                </div>
              </div>

              {debugInfo.tablesExist && debugInfo.currentUser && (
                <div className="pt-4">
                  <Button onClick={createTestProfile} className="w-full">
                    Create Test Profile
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="profiles" className="space-y-4">
              {debugInfo.sampleProfiles.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No profiles found. {debugInfo.tablesExist ? 'Create a profile to test.' : 'Database tables need to be set up first.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {debugInfo.sampleProfiles.map((profile) => (
                    <Card key={profile.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{profile.business_name || 'No Name'}</h3>
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/u/${profile.username}`, '_blank')}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              {debugInfo.errors.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No errors detected! System appears to be working correctly.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {debugInfo.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default ProfileDebug;
