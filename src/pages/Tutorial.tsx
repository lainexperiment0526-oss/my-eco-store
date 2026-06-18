import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Compass,
  PlusCircle,
  AppWindow,
  Coins,
  Megaphone,
  BarChart3,
  Bookmark,
  Star,
  Receipt,
  Code2,
  Globe,
  Shield,
  Languages,
  Bell,
  Trophy,
  Sparkles,
} from "lucide-react";

interface Section {
  icon: React.ReactNode;
  title: string;
  summary: string;
  steps: string[];
}

const sections: Section[] = [
  {
    icon: <Compass className="h-5 w-5" />,
    title: "Browsing & Discovering Apps",
    summary: "Explore the OpenApp catalog of Pi Network mini-apps.",
    steps: [
      "Open the Home page to see featured, new, and top-rated apps.",
      "Use the category tabs (Apps, Games, Arcade) to filter by type.",
      "Tap any app card to open its detail page with screenshots, video, reviews and ratings.",
      "Tap 'Open App' to launch the live web app in a new tab — no download required.",
    ],
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "New & Top Apps",
    summary: "Find the freshest and best-rated apps in the catalog.",
    steps: [
      "Open the menu and tap 'New Apps' to see the most recently approved listings.",
      "Tap 'Top Apps' to see apps sorted by rating and engagement.",
      "Bookmark apps you love using the favorite icon on any app card or detail page.",
    ],
  },
  {
    icon: <PlusCircle className="h-5 w-5" />,
    title: "Submitting Your App",
    summary: "List your Pi Network app on OpenApp for the community.",
    steps: [
      "Sign in with Pi Network or email from the top-right of the page.",
      "Open the menu and tap 'Submit App'.",
      "Fill in your app name, description, category, and website URL.",
      "Upload your app icon (square, 512x512), screenshots, and an optional 16:9 cover image.",
      "Add a YouTube link to show a video preview on your app page.",
      "Select your monetization model: Free, One-time purchase, or Monthly subscription.",
      "Pay the 25 Pi listing fee to submit. Your app goes to admin review.",
      "Once approved, your app appears live in the catalog. If rejected, you'll see the reason in 'My Apps'.",
    ],
  },
  {
    icon: <AppWindow className="h-5 w-5" />,
    title: "Managing Your Apps",
    summary: "Edit, update, or track your submitted apps.",
    steps: [
      "Open the menu and tap 'My Apps' to view all your submissions.",
      "Tap the edit icon to update title, description, screenshots, cover, YouTube link, or pricing.",
      "Drafts auto-save so you can come back and finish later.",
      "Check listing status: Pending review, Approved, or Rejected (with reason).",
    ],
  },
  {
    icon: <Coins className="h-5 w-5" />,
    title: "Monetization & Payments",
    summary: "Earn Pi from your apps and manage payouts.",
    steps: [
      "Choose pricing per app: Free, one-time Pi purchase, or monthly subscription.",
      "OpenApp splits revenue 70% to the developer / 30% to the platform.",
      "Users pay in Pi via the Pi Network SDK directly from the app detail page.",
      "Track earnings in the Developer Dashboard.",
      "Submit a withdrawal request via OpenPay; admins review and process the payout.",
    ],
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: "Developer Dashboard",
    summary: "Monitor performance, revenue and engagement.",
    steps: [
      "Open the menu and tap 'Developer Dashboard'.",
      "View views, ratings, reviews and revenue for each app.",
      "Request OpenPay withdrawals from your available balance.",
      "Track withdrawal status (pending / approved / paid).",
    ],
  },
  {
    icon: <Megaphone className="h-5 w-5" />,
    title: "Advertising (Ad Network)",
    summary: "Promote your app inside OpenApp.",
    steps: [
      "Open the menu and tap 'Advertiser Dashboard'.",
      "Create a campaign: title, banner/video, target app and budget in Pi.",
      "Submit for moderation — campaigns go live after admin approval.",
      "Inside the Pi Browser, ads rotate between Pi Ad Network and OpenApp video ads.",
      "Track impressions and clicks in 'Analytics'.",
    ],
  },
  {
    icon: <Star className="h-5 w-5" />,
    title: "Reviews & Ratings",
    summary: "Help the community discover great apps.",
    steps: [
      "Open any app detail page and scroll to the reviews section.",
      "Tap the stars to rate from 1 to 5.",
      "Write a short review explaining your experience.",
      "Edit or delete your review anytime from the same screen.",
    ],
  },
  {
    icon: <Bookmark className="h-5 w-5" />,
    title: "Bookmarks (Favorites)",
    summary: "Save apps to come back to later.",
    steps: [
      "Tap the bookmark icon on any app card or detail page.",
      "Open the menu and tap 'Favorites' to see your saved list.",
      "Tap an item to jump straight to that app.",
    ],
  },
  {
    icon: <Receipt className="h-5 w-5" />,
    title: "Purchases & Subscriptions",
    summary: "Manage paid apps you've unlocked.",
    steps: [
      "Open the menu and tap 'Purchases'.",
      "See every Pi payment, one-time unlock and active subscription.",
      "Re-open a purchased app anytime — your access is tied to your account.",
    ],
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Pi Network Integration",
    summary: "Sign in, pay and authenticate with Pi.",
    steps: [
      "Inside the Pi Browser, tap 'Sign in with Pi Network' for instant authentication.",
      "All in-app purchases and listing fees are processed in Pi.",
      "Ads automatically use the Pi Ad Network when running in the Pi Browser.",
    ],
  },
  {
    icon: <Languages className="h-5 w-5" />,
    title: "Changing Language",
    summary: "Use OpenApp in 40+ languages.",
    steps: [
      "Open the menu (top-right icon).",
      "Pick your language from the dropdown at the top of the menu.",
      "The whole app translates instantly and remembers your choice.",
    ],
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "Profile & Account",
    summary: "Manage your OpenApp identity.",
    steps: [
      "Open the menu and tap 'Profile'.",
      "Update your username, avatar and account preferences.",
      "Sign out anytime from the bottom of the menu.",
    ],
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Analytics",
    summary: "Track performance for your apps and ads.",
    steps: [
      "Open the menu and tap 'Analytics'.",
      "View per-app views, engagement and revenue trends.",
      "Track campaign impressions, clicks and CTR for active ads.",
    ],
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    title: "Affiliate Rewards",
    summary: "Earn Pi by referring developers.",
    steps: [
      "Open the menu and tap 'Affiliate' (if available in your account).",
      "Share your referral link with other developers.",
      "Earn rewards when they list an approved app on OpenApp.",
    ],
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Admin Tools",
    summary: "For admins only — moderation features.",
    steps: [
      "App Moderation: review submissions, approve or reject with a reason.",
      "Ad Moderation: review and approve advertiser campaigns before they go live.",
      "Blog Manager: write and publish blog posts to the OpenApp blog.",
      "Withdrawal Review: process developer OpenPay payout requests.",
    ],
  },
];

export default function Tutorial() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 flex items-start gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">OpenApp Tutorial</h1>
            <p className="mt-1 text-muted-foreground">
              A complete guide to every feature in OpenApp — for users, developers, and advertisers.
            </p>
          </div>
        </div>

        <Card className="mb-6 border-primary/20 bg-primary/5 p-5">
          <h2 className="mb-2 text-lg font-semibold">Quick start</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground/90">
            <li>Sign in with Pi Network or email.</li>
            <li>Browse the catalog and bookmark apps you like.</li>
            <li>Tap "Open App" on any listing to launch it instantly in your browser.</li>
            <li>Want to publish? Tap "Submit App" in the menu and follow the wizard.</li>
          </ol>
        </Card>

        <Accordion type="multiple" defaultValue={["item-0"]} className="space-y-2">
          {sections.map((s, i) => (
            <AccordionItem
              key={s.title}
              value={`item-${i}`}
              className="rounded-xl border border-border bg-card px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <span className="rounded-lg bg-secondary p-2 text-primary">{s.icon}</span>
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-xs font-normal text-muted-foreground">{s.summary}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ol className="ml-2 list-decimal space-y-2 pl-5 text-sm text-foreground/90">
                  {s.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Card className="mt-8 p-5 text-sm text-muted-foreground">
          Need more help? Open the menu and tap <span className="font-semibold text-foreground">Feedback</span> to
          contact the OpenApp team.
        </Card>
      </main>
    </div>
  );
}
