import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlayCircle, Droplets, Clock, CheckCircle } from 'lucide-react';
import { PI_CONFIG } from '@/config/pi-config';
import { usePi } from '@/contexts/PiContext';

interface AdReward {
  amount: number;
  currency: string;
  timestamp: Date;
}

interface AdNetworkConfig {
  enabled: boolean;
  rewardPerAd: number;
  maxAdsPerDay: number;
  minWatchTime: number;
}

const PiAdNetwork: React.FC = () => {
  const { piUser, isAuthenticated, showRewardedAd } = usePi();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [dailyWatched, setDailyWatched] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [lastAdReward, setLastAdReward] = useState<AdReward | null>(null);
  const [adConfig] = useState<AdNetworkConfig>({
    enabled: import.meta.env.VITE_PI_AD_NETWORK_ENABLED === 'true',
    rewardPerAd: 0.01,
    maxAdsPerDay: 20,
    minWatchTime: 30
  });

  // Debug state for ad network
  const [adDebug, setAdDebug] = useState<string>("");

  useEffect(() => {
    let debugMsg = "";
    if (!adConfig.enabled) debugMsg += "Ad network is disabled by env (VITE_PI_AD_NETWORK_ENABLED != true). ";
    if (!(window as any).Pi) debugMsg += "Pi SDK not detected (must use Pi Browser). ";
    if (!isAuthenticated) debugMsg += "User not authenticated with Pi. ";
    if (!piUser) debugMsg += "No Pi user loaded. ";
    setAdDebug(debugMsg.trim());
  }, [adConfig.enabled, isAuthenticated, piUser]);

  // Withdraw state (must be outside of adConfig useState)
  const [withdrawAddress, setWithdrawAddress] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawStatus, setWithdrawStatus] = useState<string>("");
  const minWithdraw = 10;




  // Load ad history from localStorage for the current user
  const loadAdHistory = () => {
    if (!piUser) return;
    try {
      const data = localStorage.getItem(`ad_history_${piUser.uid}`);
      if (data) {
        const parsed = JSON.parse(data);
        setDailyWatched(parsed.dailyWatched || 0);
        setTotalEarnings(parsed.totalEarnings || 0);
        if (parsed.lastReward) {
          setLastAdReward({
            ...parsed.lastReward,
            timestamp: new Date(parsed.lastReward.timestamp)
          });
        }
      } else {
        setDailyWatched(0);
        setTotalEarnings(0);
        setLastAdReward(null);
      }
    } catch (e) {
      setDailyWatched(0);
      setTotalEarnings(0);
      setLastAdReward(null);
    }
  };

  useEffect(() => {
    loadAdHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piUser]);

  // Show debug info if ads are not enabled
  if (!adConfig.enabled) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Pi Ad Network integration is currently disabled.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If Pi SDK or Pi user data is missing, keep UI visible but disable actions
  if (!(window as any).Pi || !piUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Pi Ad Network
            <Badge variant="secondary">{PI_CONFIG.SANDBOX_MODE ? 'Sandbox' : 'Mainnet'}</Badge>
          </CardTitle>
          <CardDescription>
            Watch ads and earn DROP tokens on Pi Network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {adDebug || 'Pi Browser is required to load ads.'}
            </AlertDescription>
          </Alert>
          <Button className="w-full" size="lg" disabled>
            <PlayCircle className="h-5 w-5 mr-2" />
            Watch Ad (Pi Browser required)
          </Button>
        </CardContent>
      </Card>
    );
  }

  const watchAd = async () => {
    if (!isAuthenticated || dailyWatched >= adConfig.maxAdsPerDay) {
      return;
    }
    setIsWatchingAd(true);
    setAdProgress(0);
    try {
      // Call Pi Network rewarded ad and only reward on success
      const success = await showRewardedAd();
      if (success) {
        completeAdWatch();
        setAdProgress(100);
      } else {
        setIsWatchingAd(false);
        setAdProgress(0);
      }
    } catch (error) {
      console.error('Error watching ad:', error);
      setIsWatchingAd(false);
      setAdProgress(0);
    }
  };

  const completeAdWatch = async () => {
    try {
      const reward: AdReward = {
        amount: adConfig.rewardPerAd,
        currency: 'DROP',
        timestamp: new Date()
      };

      setDailyWatched(prev => prev + 1);
      setTotalEarnings(prev => prev + reward.amount);
      setLastAdReward(reward);

      // Persist to localStorage for demo; in production, update Supabase here
      const userData = {
        dailyWatched: dailyWatched + 1,
        totalEarnings: totalEarnings + reward.amount,
        lastReward: reward
      };
      localStorage.setItem(`ad_history_${piUser?.uid}`, JSON.stringify(userData));

      setTimeout(() => {
        setIsWatchingAd(false);
        setAdProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Error completing ad watch:', error);
      setIsWatchingAd(false);
      setAdProgress(0);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Pi Ad Network
          </CardTitle>
          <CardDescription>
            Watch ads and earn DROP tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please authenticate with Pi Network to start watching ads.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          Pi Ad Network
          <Badge variant="secondary">{PI_CONFIG.SANDBOX_MODE ? 'Sandbox' : 'Mainnet'}</Badge>
        </CardTitle>
        <CardDescription>
          Watch ads and earn DROP tokens on Pi Network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Earnings Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-sky-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Droplets className="h-4 w-4 text-sky-600" />
              <span className="text-sm font-medium text-sky-600">Today's Earnings</span>
            </div>
            <div className="text-2xl font-bold text-sky-700">
              {(dailyWatched * adConfig.rewardPerAd).toFixed(2)} DROP
            </div>
          </div>
          <div className="text-center p-4 bg-sky-100 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-sky-700" />
              <span className="text-sm font-medium text-sky-700">Ads Watched</span>
            </div>
            <div className="text-2xl font-bold text-sky-900">
              {dailyWatched}/{adConfig.maxAdsPerDay}
            </div>
          </div>
        </div>

        {/* Watch Ad Button */}
        <div className="text-center">
          {isWatchingAd ? (
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-sky-500 h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${adProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {adProgress < 100 
                  ? `Watching ad... ${Math.round((adConfig.minWatchTime * adProgress) / 100)}s`
                  : 'Ad complete! Distributing reward...'
                }
              </p>
              {adProgress >= 100 && (
                <div className="flex items-center justify-center gap-2 text-sky-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>+{adConfig.rewardPerAd} DROP earned!</span>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={watchAd}
              disabled={dailyWatched >= adConfig.maxAdsPerDay}
              className="w-full"
              size="lg"
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              {dailyWatched >= adConfig.maxAdsPerDay 
                ? 'Daily limit reached' 
                : `Watch Ad (+${adConfig.rewardPerAd} DROP)`
              }
            </Button>
          )}
        </div>

        {/* Last Reward */}
        {lastAdReward && (
          <Alert>
            <Droplets className="h-4 w-4" />
            <AlertDescription>
              Last reward: +{lastAdReward.amount} {lastAdReward.currency} at{' '}
              {lastAdReward.timestamp.toLocaleTimeString()}
            </AlertDescription>
          </Alert>
        )}

        {/* Withdraw Section */}
        <div className="p-4 bg-sky-50 rounded-lg border border-sky-100 space-y-3">
          <div className="font-semibold text-sky-700 mb-1">Withdraw DROP</div>
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <input
              type="text"
              className="flex-1 border border-sky-200 rounded px-3 py-2 text-xs"
              placeholder="Your Pi Network DROP wallet address"
              value={withdrawAddress}
              onChange={e => setWithdrawAddress(e.target.value)}
            />
            <input
              type="number"
              className="w-32 border border-sky-200 rounded px-3 py-2 text-xs"
              placeholder="Amount"
              min={minWithdraw}
              step="0.01"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
            />
            <Button
              className="bg-sky-600 hover:bg-sky-700 text-white"
              disabled={
                !withdrawAddress ||
                Number(withdrawAmount) < minWithdraw ||
                Number(withdrawAmount) > totalEarnings
              }
              onClick={() => {
                if (!withdrawAddress) {
                  setWithdrawStatus("Enter your DROP wallet address.");
                  return;
                }
                if (Number(withdrawAmount) < minWithdraw) {
                  setWithdrawStatus(`Minimum withdraw is ${minWithdraw} DROP.`);
                  return;
                }
                if (Number(withdrawAmount) > totalEarnings) {
                  setWithdrawStatus("Insufficient balance.");
                  return;
                }
                // Simulate withdraw request
                setWithdrawStatus("Withdrawal request submitted! (Demo only)");
                // Here you would call backend/blockchain send logic
              }}
            >
              Withdraw
            </Button>
          </div>
          <div className="text-xs text-sky-700 min-h-[1.5em]">{withdrawStatus}</div>
          <div className="text-xs text-sky-500">Minimum withdraw: {minWithdraw} DROP. Withdrawals are sent to your Pi Network DROP wallet.</div>
        </div>

        {/* Info */}
        <div className="text-xs text-sky-700 space-y-1">
          <p>• Earn {adConfig.rewardPerAd} DROP tokens per ad</p>
          <p>• Maximum {adConfig.maxAdsPerDay} ads per day</p>
          <p>• Minimum {adConfig.minWatchTime} seconds watch time required</p>
          <p>• Powered by Pi Ad Network API</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default PiAdNetwork;