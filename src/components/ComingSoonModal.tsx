// Enhanced Coming Soon Modal Component
// File: src/components/ComingSoonModal.tsx

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Store, Wallet, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

interface ComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "dropstore" | "droppay";
}

const modalsConfig = {
  dropstore: {
    icon: Store,
    title: "DropStore",
    subtitle: "Coming Soon",
    description: "A Pi-first marketplace to launch digital storefronts, accept Pi payments, and reach global buyers.",
    features: [
      "Digital storefronts with themes",
      "Pi Network mainnet payments",
      "Discovery, search, and curation",
      "Real-time earnings and analytics",
      "Creator verification badges",
      "Commission-free selling",
    ],
    tagline: "Building the future of decentralized commerce",
    ctaText: "Notify Me",
  },
  droppay: {
    icon: Wallet,
    title: "DropPay",
    subtitle: "Coming Soon",
    description: "Seamless Pi payment modal with QR, on-chain verification, and branded checkout for your links and products.",
    features: [
      "Scan & Pay with Pi",
      "Instant blockchain verification",
      "Custom branding options",
      "Analytics and receipts",
      "Multi-currency support",
      "One-click integration",
    ],
    tagline: "The simplest way to accept Pi payments",
    ctaText: "Get Early Access",
  },
};

export const ComingSoonModal = ({ open, onOpenChange, type }: ComingSoonModalProps) => {
  const config = modalsConfig[type];
  const IconComponent = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{config.title}</DialogTitle>
        <DialogDescription className="sr-only">{config.description}</DialogDescription>
        {/* Header with Icon */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 flex items-center justify-center">
              <IconComponent className="w-8 h-8 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              {config.title}
            </h1>
            <p className="text-sm font-semibold text-sky-600 dark:text-sky-400 mt-1 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            {config.description}
          </p>

          {/* Tagline */}
          <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-lg border border-sky-200 dark:border-sky-800">
            <p className="text-sm font-semibold text-sky-900 dark:text-sky-100 italic">
              ✨ {config.tagline}
            </p>
          </div>

          {/* Features Grid */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Launch Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-colors"
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Developer Info (for DropPay) */}
          {type === "droppay" && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                💻 For Developers
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                DropPay is built with modern web technologies and can be easily integrated into any website or application. The platform provides a complete payment flow, UI components, and seamless user experience on Pi Network mainnet.
              </p>
              <div className="flex flex-wrap gap-2">
                {["React/TypeScript", "Pi Network SDK", "Responsive Design", "QR Code Support"].map((tech) => (
                  <span
                    key={tech}
                    className="text-xs px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>📅 Coming Q2 2026</strong>
              <br />
              <span className="text-xs">
                {type === "dropstore"
                  ? "Full marketplace platform with creator tools and discovery features"
                  : "Seamless payment integration across all DropLink features"}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            onClick={() => {
              // Track interest
              console.log(`User interested in ${type}`);
              // Could send to analytics or email list
              onOpenChange(false);
            }}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white"
          >
            {config.ctaText}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-4">
          DropLink is part of the Drop ecosystem. {type === "dropstore" ? "Become an early seller" : "Integrate payments into your platform today"}.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ComingSoonModal;
