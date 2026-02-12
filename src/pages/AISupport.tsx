import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bot, Sparkles } from "lucide-react";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { PlanGate } from "@/components/PlanGate";
import { usePi } from "@/contexts/PiContext";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";

const STORAGE_KEY = 'droplink_ai_config';

const AISupport = () => {
  const navigate = useNavigate();
  const { piUser, isAuthenticated } = usePi();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    business_info: "",
    faqs: "",
    custom_instructions: "",
  });

  useEffect(() => {
    loadProfile();
  }, [piUser]);

  const loadProfile = async () => {
    try {
      if (!piUser?.username) {
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
        loadAIConfig(profile.id);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadAIConfig = (id: string) => {
    try {
      // Load from localStorage
      const stored = localStorage.getItem(`${STORAGE_KEY}_${id}`);
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading AI config:", error);
    }
  };

  const handleSave = async () => {
    if (!profileId) return;

    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(`${STORAGE_KEY}_${profileId}`, JSON.stringify(config));
      toast.success("AI Support settings saved!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };



  return (
    <PlanGate minPlan="pro" featureName="AI Support">
      <PageHeader 
        title="AI Support" 
        description="Configure AI chat assistant"
        icon={<Bot className="w-6 h-6" />}
      />
      <div className="min-h-screen bg-sky-400 p-3 sm:p-4 md:p-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Configuration</h1>
          </div>

          <Card className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled" className="text-lg font-medium">
                  Enable AI Support
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow visitors to chat with your AI assistant
                </p>
              </div>
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_info">Business Information</Label>
              <Textarea
                id="business_info"
                placeholder="Describe your business, services, and what you offer..."
                value={config.business_info}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, business_info: e.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faqs">Frequently Asked Questions</Label>
              <Textarea
                id="faqs"
                placeholder="Add common questions and answers for your AI to reference..."
                value={config.faqs}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, faqs: e.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_instructions">Custom Instructions</Label>
              <Textarea
                id="custom_instructions"
                placeholder="Add specific instructions for how your AI should respond..."
                value={config.custom_instructions}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    custom_instructions: e.target.value,
                  }))
                }
                rows={4}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </Card>
        </div>
      </div>
    </PlanGate>
  );
};

export default AISupport;
