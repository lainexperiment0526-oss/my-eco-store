import React, { useState } from 'react';
import { isPiBrowserEnv } from '@/contexts/PiContext';
import { usePi } from '@/contexts/PiContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const PiAuthTest: React.FC = () => {
  const { 
    piUser, 
    accessToken, 
    isAuthenticated, 
    loading, 
    signIn, 
    signOut, 
    currentProfile,
    checkUsernameAvailability,
    getPiUserProfile 
  } = usePi();

  const [testUsername, setTestUsername] = useState('');
  const [usernameCheckResult, setUsernameCheckResult] = useState<boolean | null>(null);
  const [profileLookup, setProfileLookup] = useState('');
  const [profileData, setProfileData] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.Pi === 'undefined') {
      setSdkError('Pi SDK not loaded. Please use the Pi Browser.');
    }
  }, []);

  const handleSignIn = async () => {
    setSdkError(null);
    if (typeof window === 'undefined' || typeof window.Pi === 'undefined') {
      setSdkError('Pi SDK not loaded. Please use the Pi Browser.');
      return;
    }
    try {
      await signIn();
    } catch (error) {
      setSdkError('Sign in failed: ' + (error instanceof Error ? error.message : String(error)));
      console.error('Sign in failed:', error);
    }
  };

  const handleUsernameCheck = async () => {
    if (!testUsername.trim()) {
      toast.error('Please enter a username to check');
      return;
    }
    setIsChecking(true);
    try {
      const isAvailable = await checkUsernameAvailability(testUsername);
      setUsernameCheckResult(isAvailable);
      toast.success(`Username "${testUsername}" is ${isAvailable ? 'available' : 'taken'}`);
    } catch (error) {
      toast.error('Failed to check username availability');
      console.error('Username check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleProfileLookup = async () => {
    if (!profileLookup.trim()) {
      toast.error('Please enter a username or ID to lookup');
      return;
    }
    setIsLookingUp(true);
    setProfileData(null);
    try {
      const data = await getPiUserProfile(profileLookup);
      setProfileData(data);
    } catch (error) {
      setProfileData(null);
      toast.error('Profile lookup failed');
      console.error('Profile lookup failed:', error);
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Pi Network Authentication Test</h1>
        <p className="text-muted-foreground">Test the Pi Network authentication system</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sdkError && (
            <Alert variant="destructive">
              <AlertDescription>{sdkError}</AlertDescription>
            </Alert>
          )}
          <div className="flex items-center gap-2">
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          {!isAuthenticated ? (
            <Button onClick={handleSignIn} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Sign In with Pi Network
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Pi User Information
                </h3>
                <div className="space-y-1 text-sm">
                  <p><strong>User ID:</strong> {piUser?.uid}</p>
                  <p><strong>Username:</strong> {piUser?.username || 'Not set'}</p>
                  <p><strong>Wallet Address:</strong> {piUser?.wallet_address || 'Not connected'}</p>
                  <p><strong>Access Token:</strong> {accessToken ? '✓ Present' : '✗ Missing'}</p>
                </div>
              </div>
              {currentProfile && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Current Profile
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Profile ID:</strong> {currentProfile.id}</p>
                    <p><strong>Username:</strong> {currentProfile.username}</p>
                    <p><strong>Business Name:</strong> {currentProfile.business_name}</p>
                    <p><strong>Pi Username:</strong> {currentProfile.pi_username}</p>
                    <p><strong>Pi User ID:</strong> {currentProfile.pi_user_id}</p>
                    <p><strong>Premium:</strong> {currentProfile.has_premium ? '✓' : '✗'}</p>
                    <p><strong>Wallet Verified:</strong> {currentProfile.pi_wallet_verified ? '✓' : '✗'}</p>
                  </div>
                </div>
              )}
              <Button onClick={signOut} variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Username Availability Check
          </CardTitle>
          <CardDescription>
            Check if a username is available for Pi Network authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter username to check"
              value={testUsername}
              onChange={(e) => setTestUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUsernameCheck()}
            />
            <Button 
              onClick={handleUsernameCheck} 
              disabled={isChecking || !testUsername.trim()}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Check'
              )}
            </Button>
          </div>
          {usernameCheckResult !== null && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              usernameCheckResult 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {usernameCheckResult ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Username "{testUsername}" is available
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Username "{testUsername}" is already taken
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Lookup
          </CardTitle>
          <CardDescription>
            Search for a user profile by username, Pi username, or user ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter username or ID to lookup"
              value={profileLookup}
              onChange={(e) => setProfileLookup(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleProfileLookup()}
            />
            <Button 
              onClick={handleProfileLookup} 
              disabled={isLookingUp || !profileLookup.trim()}
            >
              {isLookingUp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Lookup'
              )}
            </Button>
          </div>
          {profileData && (
            <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Profile Found</h3>
              <div className="space-y-1 text-sm">
                <p><strong>ID:</strong> {profileData.id}</p>
                <p><strong>Username:</strong> {profileData.username}</p>
                <p><strong>Business Name:</strong> {profileData.business_name}</p>
                <p><strong>Pi Username:</strong> {profileData.pi_username}</p>
                <p><strong>Pi User ID:</strong> {profileData.pi_user_id}</p>
                <p><strong>Description:</strong> {profileData.description}</p>
                <p><strong>Premium:</strong> {profileData.has_premium ? '✓' : '✗'}</p>
                <p><strong>Wallet Verified:</strong> {profileData.pi_wallet_verified ? '✓' : '✗'}</p>
                <p><strong>Created:</strong> {new Date(profileData.created_at).toLocaleDateString()}</p>
                {profileData.pi_wallet_address && (
                  <p><strong>Wallet:</strong> {profileData.pi_wallet_address}</p>
                )}
              </div>
            </div>
          )}
          {profileData === null && profileLookup && !isLookingUp && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg">
              No profile found for "{profileLookup}"
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};