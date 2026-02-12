import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveSubscription, PlanType } from "@/hooks/useActiveSubscription";
import { Lock, Crown, AlertTriangle, Sparkles } from "lucide-react";

const PLAN_ORDER: PlanType[] = ["free", "basic", "premium", "pro"];

const PLAN_COLORS = {
  free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  basic: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  premium: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  pro: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
};

export const PlanGate = ({
  minPlan,
  children,
  featureName,
  isAdmin = false,
  showExpiredWarning = true,
  compact = false,
}: {
  minPlan: PlanType;
  children: ReactNode;
  featureName?: string;
  isAdmin?: boolean;
  showExpiredWarning?: boolean;
  compact?: boolean;
}) => {
  const { plan, loading, expiresAt, status } = useActiveSubscription();
  const navigate = useNavigate();
  
  // Check if plan is expired
  const now = new Date();
  const expiresDate = expiresAt ? new Date(expiresAt) : null;
  const isExpired = expiresDate ? expiresDate < now : false;
  const daysLeft = expiresDate 
    ? Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
  
  // Effective plan (downgrade to free if expired)
  const effectivePlan: PlanType = isExpired ? "free" : plan;
  const targetPlanName = minPlan === "pro" ? "Professional" 
    : minPlan.charAt(0).toUpperCase() + minPlan.slice(1);
  
  // Admins bypass plan requirements
  if (isAdmin) {
    return <>{children}</>;
  }
  
  if (loading) {
    return (
      <div className="animate-pulse bg-muted rounded-lg h-20 mb-4" />
    );
  }
  
  const userPlanIndex = PLAN_ORDER.indexOf(effectivePlan);
  const requiredPlanIndex = PLAN_ORDER.indexOf(minPlan);
  const hasAccess = userPlanIndex >= requiredPlanIndex;
  
  // User has access - show content (with optional expiring warning)
  if (hasAccess) {
    return (
      <>
        {showExpiredWarning && isExpiringSoon && !isExpired && (
          <Card className="mb-4 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your subscription expires in <strong>{daysLeft} days</strong>. 
                  <button 
                    onClick={() => navigate("/subscription")}
                    className="ml-1 underline hover:no-underline font-medium"
                  >
                    Renew now
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {children}
      </>
    );
  }
  
  // Compact mode - show inline lock
  if (compact) {
    return (
      <div className="relative">
        <div className="opacity-40 pointer-events-none blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/subscription")}
            className="gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            {targetPlanName}+ required
          </Button>
        </div>
      </div>
    );
  }
  
  // Show expired warning if user had access before
  const hadAccessBefore = plan !== "free" && isExpired;
  
  // Locked: show upgrade prompt
  return (
    <Card className={`mb-6 border-2 border-dashed ${
      hadAccessBefore 
        ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
        : "border-sky-200 bg-sky-50 dark:border-sky-700/70 dark:bg-sky-900/40"
    } shadow-md`}>
      <CardContent className="py-6 sm:py-8 flex flex-col items-center justify-center space-y-4 text-center px-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          hadAccessBefore 
            ? "bg-red-100 dark:bg-red-900/50"
            : "bg-sky-100 dark:bg-sky-800"
        }`}>
          {hadAccessBefore ? (
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          ) : (
            <Lock className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          )}
        </div>
        
        {/* Title */}
        <div>
          <h3 className={`text-base font-semibold leading-6 ${
            hadAccessBefore
              ? "text-red-900 dark:text-red-100"
              : "text-sky-900 dark:text-sky-100"
          }`}>
            {hadAccessBefore 
              ? "Your subscription has expired"
              : `${featureName || "This feature"} requires ${targetPlanName}`
            }
          </h3>
          {hadAccessBefore && (
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Renew your {plan.charAt(0).toUpperCase() + plan.slice(1)} plan to regain access to {featureName || "this feature"}
            </p>
          )}
        </div>
        
        {/* Plan badge */}
        <Badge className={PLAN_COLORS[minPlan]}>
          <Crown className="w-3.5 h-3.5 mr-1" />
          {targetPlanName} Plan
        </Badge>
        
        {/* CTA */}
        <Button
          onClick={() => navigate("/subscription")}
          className={hadAccessBefore 
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-sky-500 text-white hover:bg-sky-600"
          }
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {hadAccessBefore ? "Renew Subscription" : `Upgrade to ${targetPlanName}`}
        </Button>
        
        {/* Current plan indicator */}
        <p className="text-xs text-muted-foreground">
          Current plan: <span className="font-medium capitalize">{effectivePlan}</span>
          {isExpired && <span className="text-red-600 dark:text-red-400 ml-1">(Expired)</span>}
        </p>
      </CardContent>
    </Card>
  );
};