import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Link as LinkIcon, ShoppingBag, Mail, Phone, Calendar, Download, ExternalLink, Heart, Star, Zap, Lock, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import LinkCustomizer from "./LinkCustomizer";

interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  favicon?: string;
  image?: string;
  color?: string;
  textColor?: string;
  category?: string;
  isVisible: boolean;
  customStyling?: {
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: number;
    fontSize?: number;
    fontWeight?: number;
    padding?: number;
    animation?: 'none' | 'bounce' | 'pulse' | 'glow';
  };
}

const ICON_OPTIONS = [
  { value: "link", label: "Link", icon: LinkIcon },
  { value: "shop", label: "Shop", icon: ShoppingBag },
  { value: "mail", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "calendar", label: "Calendar", icon: Calendar },
  { value: "download", label: "Download", icon: Download },
  { value: "external", label: "External", icon: ExternalLink },
  { value: "heart", label: "Heart", icon: Heart },
  { value: "star", label: "Star", icon: Star },
  { value: "zap", label: "Lightning", icon: Zap },
];

interface CustomLinksManagerProps {
  links: CustomLink[];
  onChange: (links: CustomLink[]) => void;
}

export const CustomLinksManager = ({ links, onChange }: CustomLinksManagerProps) => {
  // UNLOCKED: All users get unlimited custom links
  const [showLinkCustomizer, setShowLinkCustomizer] = useState(false);
  
  const getMaxLinks = () => {
    return Infinity; // Unlimited for all users
  };

  const addLink = () => {
    // UNLOCKED: No restrictions on adding links
    const newLink: CustomLink = {
      id: crypto.randomUUID(),
      title: "",
      url: "",
      icon: "link",
      description: "",
      favicon: "",
      image: "",
      color: "#3b82f6",
      textColor: "#ffffff",
      category: "general",
      isVisible: true,
      customStyling: {
        backgroundColor: "#3b82f6",
        borderColor: "#2563eb",
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 500,
        padding: 12,
        animation: 'none'
      }
    };
    onChange([...links, newLink]);
  };

  const removeLink = (id: string) => {
    onChange(links.filter(link => link.id !== id));
  };

  const updateLink = (id: string, field: 'title' | 'url' | 'icon', value: string) => {
    onChange(links.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const getIconComponent = (iconValue?: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.value === iconValue);
    return iconOption ? iconOption.icon : LinkIcon;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Custom Links</Label>
          <p className="text-sm text-muted-foreground">Add custom buttons to your profile</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowLinkCustomizer(true)}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
          >
            <Settings className="w-4 h-4" />
            Link Metadata
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLink}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </Button>
        </div>
      </div>

      {/* UNLOCKED: No more plan restrictions */}

      {links.length > 0 && (
        <div className="space-y-3">
          {links.map((link) => {
            const IconComponent = getIconComponent(link.icon);
            return (
              <div key={link.id} className="flex gap-2 p-3 border rounded-lg bg-card">
                <IconComponent className="w-5 h-5 text-muted-foreground mt-2 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Button Title (e.g., Shop Now, Discord Server)"
                    value={link.title}
                    onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                  />
                  <Input
                    placeholder="https://your-link.com"
                    value={link.url}
                    onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                    type="url"
                  />
                  <Select
                    value={link.icon || "link"}
                    onValueChange={(value) => updateLink(link.id, 'icon', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((option) => {
                        const OptionIcon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <OptionIcon className="w-4 h-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLink(link.id)}
                  className="mt-2 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {links.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <LinkIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No custom links yet. Click "Add Link" to get started.
          </p>
        </div>
      )}

      {/* Link Customizer Modal */}
      {showLinkCustomizer && (
        <LinkCustomizer
          links={links}
          onLinksChange={onChange}
          onClose={() => setShowLinkCustomizer(false)}
        />
      )}
    </div>
  );
};