import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";

const CustomDomain = () => {
  const navigate = useNavigate();
  const { piUser, isAuthenticated } = usePi();
  const { plan } = useActiveSubscription();
  const isPremiumPlan = plan === "premium" || plan === "pro";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [domain, setDomain] = useState("");
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "failed" | null>(null);

  useEffect(() => {
    loadDomainSettings();
  }, [piUser, isAuthenticated]);

  const loadDomainSettings = async () => {
    try {
      if (!isAuthenticated || !piUser?.username) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", piUser.username)
        .maybeSingle();

      if (profile) {
        setProfileId(profile.id);
      }
    } catch (error) {
      console.error("Error loading domain settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDomain = async () => {
    if (!isPremiumPlan) {
      toast.error("Upgrade to Premium to connect a custom domain.");
      return;
    }

    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain.trim())) {
      toast.error("Please enter a valid domain (e.g., example.com)");
      return;
    }

    setSaving(true);
    try {
      if (!profileId) {
        toast.error("Profile not found");
        return;
      }

      toast.info("Custom domain feature is not yet available");
    } catch (error: any) {
      console.error("Error saving domain:", error);
      toast.error(error.message || "Failed to save domain");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!isPremiumPlan) {
      toast.error("Upgrade to Premium to manage custom domains.");
      return;
    }

    setSaving(true);
    try {
      if (!profileId) return;
      toast.info("Custom domain feature is not yet available");
    } catch (error: any) {
      console.error("Error removing domain:", error);
      toast.error("Failed to remove domain");
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="min-h-screen bg-sky-400">
      <PageHeader 
        title="Custom Domain" 
        description="Set your own domain"
        icon={<Globe className="w-6 h-6" />}
      />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-8 space-y-4 pb-24">
        {!isPremiumPlan && (
          <Alert className="border-primary/40 bg-primary/5">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong>Custom domains are a Premium feature.</strong>
              <br />
              <span className="text-sm text-muted-foreground">
                Upgrade to Premium or Pro to connect your own domain.
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Card className={!isPremiumPlan ? "opacity-75" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Connect Your Domain
            </CardTitle>
            <CardDescription>
              Connect your custom domain to your Droplink profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="domain">Custom Domain</Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="example.com"
                  className="flex-1"
                  disabled={saving || !isPremiumPlan}
                />
                <Button 
                  onClick={handleSaveDomain} 
                  disabled={saving || !domain.trim() || !isPremiumPlan}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
                {currentDomain && (
                  <Button 
                    variant="outline" 
                    onClick={handleRemoveDomain} 
                    disabled={saving || !isPremiumPlan}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your domain without http:// or https://
              </p>
            </div>

            {currentDomain && (
              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  <strong>Current domain:</strong> {currentDomain}
                  {verificationStatus === "pending" && (
                    <span className="ml-2 text-yellow-600">(Verification pending)</span>
                  )}
                  {verificationStatus === "verified" && (
                    <span className="ml-2 text-green-600">(Verified)</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Alert className="border-primary/50 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription>
                <strong>.pi Domain Support Coming Soon!</strong>
                <br />
                <span className="text-sm text-muted-foreground">
                  We're working on native .pi domain support. Stay tuned!
                </span>
              </AlertDescription>
            </Alert>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Contact support if you're having trouble connecting your domain.
              </p>
              <Button variant="outline" asChild>
                <a href="/ai-support">
                  <Info className="w-4 h-4 mr-2" />
                  Get Help
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <FooterNav />
    </div>
  );
};

export default CustomDomain;
