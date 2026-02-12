import { useEffect, useState } from "react";
import { usePi } from "@/contexts/PiContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ProgramRole = "ambassador" | "moderator";

type CommunityProgramProps = {
  role: ProgramRole;
};

const roleCopy: Record<ProgramRole, { title: string; tagline: string; reward: string }> = {
  ambassador: {
    title: "Ambassador Program",
    tagline: "Represent DropLink, grow the community, and unlock creator perks.",
    reward: "Approved ambassadors receive theme rewards and access to special DropLink tools.",
  },
  moderator: {
    title: "Moderator Program",
    tagline: "Help keep the community safe, helpful, and on-topic.",
    reward: "Approved moderators receive theme rewards and access to moderation tools.",
  },
};

export default function CommunityProgram({ role }: CommunityProgramProps) {
  const { piUser, isAuthenticated } = usePi();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [motivation, setMotivation] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !piUser?.username) return;
    setUsername(piUser.username);
    setLoadingProfile(true);
    const load = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("username", piUser.username)
          .maybeSingle();
        if (profile?.id) {
          setProfileId(profile.id);
        }
        if (profile?.email) {
          setEmail(profile.email);
        }
      } catch (error) {
        console.error("[CommunityProgram] Failed to load profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };
    load();
  }, [isAuthenticated, piUser]);

  useEffect(() => {
    const loadEmail = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.email && !email) {
          setEmail(data.user.email);
        }
      } catch (error) {
        console.warn("[CommunityProgram] Failed to load email:", error);
      }
    };
    loadEmail();
  }, [email]);

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !username.trim() || !motivation.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("community_applications" as any)
        .insert({
          role,
          full_name: fullName.trim(),
          email: email.trim(),
          username: username.trim().replace(/^@/, ""),
          portfolio_url: portfolioUrl.trim() || null,
          experience: experience.trim() || null,
          availability: availability.trim() || null,
          motivation: motivation.trim(),
          status: "pending",
          profile_id: profileId,
        });

      if (error) throw error;
      toast.success("Application submitted! We will review it soon.");
      setPortfolioUrl("");
      setExperience("");
      setAvailability("");
      setMotivation("");
    } catch (error) {
      console.error("[CommunityProgram] Submit failed:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = roleCopy[role];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Community</p>
        <h1 className="text-3xl font-semibold text-foreground">{copy.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">{copy.tagline}</p>
      </div>

      <Card className="p-6 space-y-2 border border-slate-200/80 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/70">
        <p className="text-sm text-foreground font-medium">What you get</p>
        <p className="text-sm text-muted-foreground">{copy.reward}</p>
      </Card>

      <Card className="p-6 space-y-5 border border-slate-200/80 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/70">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Droplink username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio or Links</Label>
            <Input
              id="portfolio"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">Relevant Experience</Label>
          <Textarea
            id="experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Tell us about your experience"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">Weekly Availability</Label>
          <Input
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g., 5-10 hours/week"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivation">Why do you want to apply?</Label>
          <Textarea
            id="motivation"
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="Share your motivation"
            rows={4}
          />
        </div>

        <Button onClick={handleSubmit} disabled={submitting || loadingProfile} className="w-full">
          {submitting ? "Submitting..." : "Submit application"}
        </Button>
      </Card>
    </div>
  );
}
