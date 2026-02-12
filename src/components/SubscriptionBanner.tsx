import React from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { 
  Crown, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Sparkles
} from "lucide-react";

interface SubscriptionBannerProps {
  showIfActive?: boolean;
  compact?: boolean;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ 
  showIfActive = false,
  compact = false 
}) => {
  const navigate = useNavigate();
  const { 
    plan, 
    isActive, 
    isExpired, 
    isExpiringSoon, 
    daysLeft, 
    loading,
    expiresAt
  } = useActiveSubscription();
  
  if (loading) return null;
  
  // Don't show banner for active plans unless explicitly requested
  if (isActive && !isExpiringSoon && !showIfActive) return null;
  
  const planName = plan === "pro" ? "Professional" 
    : plan.charAt(0).toUpperCase() + plan.slice(1);
  
  // Expired subscription
  if (isExpired) {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-red-800 dark:text-red-200">
            <span className="font-semibold">Your subscription has expired.</span>
            <span className="hidden sm:inline"> Premium features are now locked.</span>
          </div>
          <Button 
            size="sm" 
            onClick={() => navigate("/subscription")}
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Renew Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Expiring soon
  if (isExpiringSoon && daysLeft !== null) {
    return (
      <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-amber-800 dark:text-amber-200">
            <span className="font-semibold">
              Your {planName} plan expires on {expiresAt ? new Date(expiresAt).toLocaleDateString() : ''} ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left).
            </span>
            <span className="hidden sm:inline"> Renew to keep your premium features.</span>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate("/subscription")}
            className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 w-full sm:w-auto"
          >
            Renew
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Free plan - prompt to upgrade
  if (plan === "free") {
    if (compact) {
      return (
        <div 
          onClick={() => navigate("/subscription")}
          className="mb-4 px-3 py-2 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-200 dark:border-sky-800 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="text-sm text-sky-800 dark:text-sky-200">
              Upgrade to unlock all features
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-sky-600 dark:text-sky-400" />
        </div>
      );
    }
    
    return (
      <Alert className="mb-4 border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 dark:border-sky-800">
        <Crown className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sky-800 dark:text-sky-200">
            <span className="font-semibold">You're on the Free plan.</span>
            <span className="hidden sm:inline"> Upgrade to unlock premium features.</span>
          </div>
          <Button 
            size="sm" 
            onClick={() => navigate("/subscription")}
            className="bg-sky-500 hover:bg-sky-600 text-white w-full sm:w-auto"
          >
            <Crown className="w-4 h-4 mr-1" />
            Upgrade
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Active paid plan (only shown if showIfActive is true)
  if (showIfActive && isActive) {
    return (
      <div className="mb-4 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-green-800 dark:text-green-200">
                {planName} Plan
              </span>
              <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">
                Active
              </Badge>
            </div>
            {daysLeft !== null && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Expires: {expiresAt ? new Date(expiresAt).toLocaleDateString() : ''} ({daysLeft} days left)
              </p>
            )}
          </div>
        </div>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => navigate("/subscription")}
          className="text-green-700 hover:text-green-800 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/50"
        >
          Manage
        </Button>
      </div>
    );
  }
  
  return null;
};

export default SubscriptionBanner;
