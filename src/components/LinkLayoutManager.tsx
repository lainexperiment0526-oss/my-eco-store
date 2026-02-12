import React, { useState, useCallback } from 'react';
import { 
  Grid3X3, 
  List, 
  ArrowLeft, 
  ArrowRight,
  Eye,
  Plus,
  Edit,
  Trash2,
  Move,
  ShoppingBag,
  Users,
  Camera,
  Phone,
  Calendar,
  Type,
  MoreHorizontal,
  Star,
  Heart,
  Mail,
  Globe,
  MessageCircle,
  Music,
  Video,
  Image,
  FileText,
  Download,
  ExternalLink,
  Zap,
  Gift,
  CreditCard,
  MapPin,
  Clock,
  Tag,
  Bookmark
} from 'lucide-react';
import { 
  FaTwitter, 
  FaInstagram, 
  FaYoutube, 
  FaSpotify, 
  FaFacebook, 
  FaLinkedin, 
  FaTwitch,
  FaTiktok,
  FaDiscord,
  FaSnapchat,
  FaPinterest,
  FaWhatsapp,
  FaTelegram
} from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

type LinkDisplayType = 'stack' | 'grid' | 'carousel' | 'showcase';
type LinkCategory = 'suggested' | 'commerce' | 'social' | 'media' | 'contact' | 'events' | 'text';

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
  category: LinkCategory;
  isVisible: boolean;
  priority: number;
  displayStyle: 'classic' | 'featured' | 'animated';
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

interface LinkLayoutManagerProps {
  customLinks: CustomLink[];
  onLinksUpdate: (links: CustomLink[]) => void;
  displayType: LinkDisplayType;
  onDisplayTypeChange: (type: LinkDisplayType) => void;
}

const LINK_SUGGESTIONS = {
  suggested: [
    { title: "Website", url: "https://", icon: "globe", description: "Your main website" },
    { title: "Email", url: "mailto:", icon: "mail", description: "Contact email" },
    { title: "Phone", url: "tel:", icon: "phone", description: "Phone number" },
    { title: "Location", url: "https://maps.google.com", icon: "map", description: "Business location" }
  ],
  commerce: [
    { title: "Online Store", url: "https://", icon: "shop", description: "Your e-commerce store" },
    { title: "Amazon Store", url: "https://amazon.com", icon: "shop", description: "Amazon storefront" },
    { title: "Etsy Shop", url: "https://etsy.com", icon: "shop", description: "Handmade products" },
    { title: "PayPal", url: "https://paypal.me", icon: "credit-card", description: "PayPal payment link" },
    { title: "Stripe", url: "https://", icon: "credit-card", description: "Stripe payment" },
    { title: "Buy Me Coffee", url: "https://buymeacoffee.com", icon: "gift", description: "Support link" }
  ],
  social: [
    { title: "Instagram", url: "https://instagram.com", icon: "instagram", description: "Instagram profile" },
    { title: "Twitter", url: "https://twitter.com", icon: "twitter", description: "Twitter profile" },
    { title: "Facebook", url: "https://facebook.com", icon: "facebook", description: "Facebook page" },
    { title: "LinkedIn", url: "https://linkedin.com", icon: "linkedin", description: "Professional profile" },
    { title: "TikTok", url: "https://tiktok.com", icon: "tiktok", description: "TikTok profile" },
    { title: "YouTube", url: "https://youtube.com", icon: "youtube", description: "YouTube channel" },
    { title: "Discord", url: "https://discord.com", icon: "discord", description: "Discord server" },
    { title: "Snapchat", url: "https://snapchat.com", icon: "snapchat", description: "Snapchat profile" }
  ],
  media: [
    { title: "Spotify", url: "https://spotify.com", icon: "music", description: "Music playlist" },
    { title: "Apple Music", url: "https://music.apple.com", icon: "music", description: "Apple Music" },
    { title: "SoundCloud", url: "https://soundcloud.com", icon: "music", description: "SoundCloud profile" },
    { title: "YouTube Video", url: "https://youtube.com/watch", icon: "video", description: "Featured video" },
    { title: "Podcast", url: "https://", icon: "music", description: "Podcast episode" },
    { title: "Gallery", url: "https://", icon: "image", description: "Photo gallery" }
  ],
  contact: [
    { title: "WhatsApp", url: "https://wa.me", icon: "whatsapp", description: "WhatsApp chat" },
    { title: "Telegram", url: "https://t.me", icon: "telegram", description: "Telegram contact" },
    { title: "Email", url: "mailto:", icon: "mail", description: "Email contact" },
    { title: "Phone", url: "tel:", icon: "phone", description: "Phone number" },
    { title: "Contact Form", url: "https://", icon: "mail", description: "Contact form" },
    { title: "Support", url: "https://", icon: "help", description: "Customer support" }
  ],
  events: [
    { title: "Eventbrite", url: "https://eventbrite.com", icon: "calendar", description: "Event tickets" },
    { title: "Meetup", url: "https://meetup.com", icon: "users", description: "Meetup group" },
    { title: "Zoom Meeting", url: "https://zoom.us", icon: "video", description: "Virtual meeting" },
    { title: "Calendar", url: "https://calendar.google.com", icon: "calendar", description: "Schedule appointment" },
    { title: "Booking", url: "https://", icon: "clock", description: "Book appointment" },
    { title: "Event Page", url: "https://", icon: "calendar", description: "Event details" }
  ],
  text: [
    { title: "Blog", url: "https://", icon: "file-text", description: "Blog or articles" },
    { title: "Newsletter", url: "https://", icon: "mail", description: "Newsletter signup" },
    { title: "Medium", url: "https://medium.com", icon: "file-text", description: "Medium articles" },
    { title: "Substack", url: "https://substack.com", icon: "file-text", description: "Substack newsletter" },
    { title: "Documentation", url: "https://", icon: "file-text", description: "Documentation" },
    { title: "Resume/CV", url: "https://", icon: "download", description: "Download resume" }
  ]
};

const DISPLAY_TYPE_CONFIGS = {
  stack: {
    name: "Stack",
    description: "Display links in a compact vertical list",
    icon: List,
    columns: 1,
    spacing: "space-y-2"
  },
  grid: {
    name: "Grid",
    description: "Show links in a responsive grid layout",
    icon: Grid3X3,
    columns: 2,
    spacing: "grid grid-cols-2 gap-2"
  },
  carousel: {
    name: "Carousel",
    description: "Swipeable horizontal carousel of links",
    icon: ArrowLeft,
    columns: "auto",
    spacing: "flex gap-3 overflow-x-auto pb-2"
  },
  showcase: {
    name: "Showcase",
    description: "Featured links with larger display",
    icon: Star,
    columns: 1,
    spacing: "space-y-4"
  }
};

export const LinkLayoutManager: React.FC<LinkLayoutManagerProps> = ({
  customLinks,
  onLinksUpdate,
  displayType,
  onDisplayTypeChange
}) => {
  const [activeCategory, setActiveCategory] = useState<LinkCategory>('suggested');
  const [isEditing, setIsEditing] = useState(false);
  const [editingLink, setEditingLink] = useState<CustomLink | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get links by category
  const getLinksByCategory = (category: LinkCategory) => {
    return customLinks.filter(link => link.category === category && link.isVisible);
  };

  // Get category counts
  const getCategoryCounts = () => {
    const counts: Record<LinkCategory, number> = {
      suggested: 0,
      commerce: 0,
      social: 0,
      media: 0,
      contact: 0,
      events: 0,
      text: 0
    };
    
    customLinks.forEach(link => {
      if (link.isVisible) {
        counts[link.category]++;
      }
    });
    
    return counts;
  };

  // Add new link from suggestion
  const addLinkFromSuggestion = (suggestion: any, category: LinkCategory) => {
    const newLink: CustomLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: suggestion.title,
      url: suggestion.url,
      icon: suggestion.icon,
      description: suggestion.description,
      category,
      isVisible: true,
      priority: customLinks.length,
      displayStyle: 'classic',
      color: '#3b82f6',
      textColor: '#ffffff'
    };

    const updatedLinks = [...customLinks, newLink];
    onLinksUpdate(updatedLinks);
    toast.success(`Added ${suggestion.title} to ${category} links`);
  };

  // Edit link
  const editLink = (link: CustomLink) => {
    setEditingLink({ ...link });
    setIsEditing(true);
  };

  // Save edited link
  const saveEditedLink = () => {
    if (!editingLink) return;

    const updatedLinks = customLinks.map(link => 
      link.id === editingLink.id ? editingLink : link
    );
    onLinksUpdate(updatedLinks);
    setIsEditing(false);
    setEditingLink(null);
    toast.success('Link updated successfully');
  };

  // Delete link
  const deleteLink = (linkId: string) => {
    const updatedLinks = customLinks.filter(link => link.id !== linkId);
    onLinksUpdate(updatedLinks);
    toast.success('Link removed');
  };

  // Toggle link visibility
  const toggleLinkVisibility = (linkId: string) => {
    const updatedLinks = customLinks.map(link => 
      link.id === linkId ? { ...link, isVisible: !link.isVisible } : link
    );
    onLinksUpdate(updatedLinks);
  };

  // Reorder links
  const reorderLinks = (dragIndex: number, hoverIndex: number) => {
    const draggedLink = customLinks[dragIndex];
    const updatedLinks = [...customLinks];
    updatedLinks.splice(dragIndex, 1);
    updatedLinks.splice(hoverIndex, 0, draggedLink);
    
    // Update priorities
    updatedLinks.forEach((link, index) => {
      link.priority = index;
    });
    
    onLinksUpdate(updatedLinks);
  };

  // Get icon component
  const getIconComponent = (iconName: string, className: string = "w-4 h-4") => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      globe: Globe,
      mail: Mail,
      phone: Phone,
      map: MapPin,
      shop: ShoppingBag,
      "credit-card": CreditCard,
      gift: Gift,
      instagram: FaInstagram,
      twitter: FaTwitter,
      facebook: FaFacebook,
      linkedin: FaLinkedin,
      tiktok: FaTiktok,
      youtube: FaYoutube,
      discord: FaDiscord,
      snapchat: FaSnapchat,
      music: Music,
      video: Video,
      image: Image,
      whatsapp: FaWhatsapp,
      telegram: FaTelegram,
      users: Users,
      calendar: Calendar,
      clock: Clock,
      "file-text": FileText,
      download: Download,
      help: MessageCircle
    };

    const IconComponent = iconMap[iconName] || Globe;
    return <IconComponent className={className} />;
  };

  // Render links based on display type
  const renderLinks = (links: CustomLink[]) => {
    const config = DISPLAY_TYPE_CONFIGS[displayType];
    
    if (displayType === 'carousel') {
      return (
        <div className="relative">
          <div className={config.spacing}>
            {links.map((link) => (
              <div
                key={link.id}
                className="flex-shrink-0 w-48 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                style={{
                  backgroundColor: link.color,
                  color: link.textColor
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    {link.favicon ? (
                      <img src={link.favicon} alt="" className="w-5 h-5 rounded" />
                    ) : (
                      getIconComponent(link.icon || 'globe', 'w-4 h-4')
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{link.title}</p>
                    {link.description && (
                      <p className="text-xs opacity-80 truncate">{link.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (displayType === 'grid') {
      return (
        <div className={config.spacing}>
          {links.map((link) => (
            <div
              key={link.id}
              className="group relative p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              style={{
                backgroundColor: link.color,
                color: link.textColor
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  {link.favicon ? (
                    <img src={link.favicon} alt="" className="w-5 h-5 rounded" />
                  ) : (
                    getIconComponent(link.icon || 'globe', 'w-4 h-4')
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{link.title}</p>
                  {link.description && (
                    <p className="text-xs opacity-80 truncate">{link.description}</p>
                  )}
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editLink(link)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (displayType === 'showcase') {
      return (
        <div className={config.spacing}>
          {links.map((link) => (
            <div
              key={link.id}
              className="group relative p-6 rounded-xl border-2 bg-card hover:bg-muted/50 transition-colors shadow-sm"
              style={{
                backgroundColor: link.color,
                borderColor: link.color + '33',
                color: link.textColor
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  {link.favicon ? (
                    <img src={link.favicon} alt="" className="w-8 h-8 rounded-lg" />
                  ) : (
                    getIconComponent(link.icon || 'globe', 'w-6 h-6')
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-lg truncate">{link.title}</p>
                  {link.description && (
                    <p className="text-sm opacity-80 mt-1 line-clamp-2">{link.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs opacity-70">Featured Link</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editLink(link)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // Stack layout (default)
    return (
      <div className={config.spacing}>
        {links.map((link, index) => (
          <div
            key={link.id}
            className="group relative flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            style={{
              backgroundColor: link.color,
              color: link.textColor
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              {link.favicon ? (
                <img src={link.favicon} alt="" className="w-5 h-5 rounded" />
              ) : (
                getIconComponent(link.icon || 'globe', 'w-4 h-4')
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{link.title}</p>
              {link.description && (
                <p className="text-xs opacity-80 truncate">{link.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editLink(link)}
                className="h-6 w-6 p-0"
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleLinkVisibility(link.id)}
                className="h-6 w-6 p-0"
              >
                <Eye className={`w-3 h-3 ${!link.isVisible ? 'opacity-50' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteLink(link.id)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const categoryCounts = getCategoryCounts();
  const categories: { key: LinkCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'suggested', label: 'Suggested', icon: Star },
    { key: 'commerce', label: 'Commerce', icon: ShoppingBag },
    { key: 'social', label: 'Social', icon: Users },
    { key: 'media', label: 'Media', icon: Camera },
    { key: 'contact', label: 'Contact', icon: Phone },
    { key: 'events', label: 'Events', icon: Calendar },
    { key: 'text', label: 'Text', icon: Type }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Link Layout Manager</h2>
          <p className="text-sm text-muted-foreground">
            Customize how your links are displayed to visitors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Links
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Bulk Edit
          </Button>
        </div>
      </div>

      {/* Display Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            Display Layout
          </CardTitle>
          <CardDescription>
            Choose how your links are displayed to visitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(DISPLAY_TYPE_CONFIGS).map(([type, config]) => {
              const IconComponent = config.icon;
              const isActive = displayType === type;
              
              return (
                <button
                  key={type}
                  onClick={() => onDisplayTypeChange(type as LinkDisplayType)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <IconComponent className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <h4 className={`font-medium ${isActive ? 'text-primary' : ''}`}>
                      {config.name}
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Link Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Organize your links by type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    activeCategory === key 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{label}</span>
                  </div>
                  {categoryCounts[key] > 0 && (
                    <Badge variant={activeCategory === key ? "secondary" : "default"}>
                      {categoryCounts[key]}
                    </Badge>
                  )}
                </button>
              ))}
              
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setActiveCategory('suggested')}
              >
                <MoreHorizontal className="w-4 h-4 mr-2" />
                View All ({customLinks.filter(l => l.isVisible).length})
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Category Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="capitalize">{activeCategory} Links</CardTitle>
                  <CardDescription>
                    {activeCategory === 'suggested' && "Quick link suggestions to get started"}
                    {activeCategory === 'commerce' && "E-commerce and payment links"}
                    {activeCategory === 'social' && "Social media profiles and pages"}
                    {activeCategory === 'media' && "Music, videos, and media content"}
                    {activeCategory === 'contact' && "Contact information and communication"}
                    {activeCategory === 'events' && "Events, meetings, and bookings"}
                    {activeCategory === 'text' && "Blogs, newsletters, and written content"}
                  </CardDescription>
                </div>
                {categoryCounts[activeCategory] > 0 && (
                  <Badge variant="secondary">
                    {categoryCounts[activeCategory]} active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="existing" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">Your Links</TabsTrigger>
                  <TabsTrigger value="suggestions">Add New</TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="space-y-4">
                  {getLinksByCategory(activeCategory).length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Preview in {DISPLAY_TYPE_CONFIGS[displayType].name.toLowerCase()} layout
                        </p>
                        <Select value={displayType} onValueChange={(value) => onDisplayTypeChange(value as LinkDisplayType)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(DISPLAY_TYPE_CONFIGS).map(([type, config]) => (
                              <SelectItem key={type} value={type}>
                                {config.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {renderLinks(getLinksByCategory(activeCategory))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        {(() => {
                          const category = categories.find(c => c.key === activeCategory);
                          const Icon = category?.icon || Star;
                          return <Icon className="w-8 h-8 text-muted-foreground" />;
                        })()}
                      </div>
                      <h4 className="font-medium mb-2">No {activeCategory} links yet</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add your first {activeCategory} link to get started
                      </p>
                      <Button size="sm" onClick={() => setActiveCategory('suggested')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Browse Suggestions
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {LINK_SUGGESTIONS[activeCategory]?.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            {getIconComponent(suggestion.icon, 'w-4 h-4 text-primary')}
                          </div>
                          <div>
                            <h5 className="font-medium text-sm">{suggestion.title}</h5>
                            <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addLinkFromSuggestion(suggestion, activeCategory)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No suggestions available for this category
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Link Dialog */}
      {isEditing && editingLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>Edit Link</CardTitle>
              <CardDescription>Customize your link appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingLink.title}
                  onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-url">URL</Label>
                <Input
                  id="edit-url"
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingLink.description || ''}
                  onChange={(e) => setEditingLink({ ...editingLink, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-color">Background Color</Label>
                  <Input
                    id="edit-color"
                    type="color"
                    value={editingLink.color || '#3b82f6'}
                    onChange={(e) => setEditingLink({ ...editingLink, color: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-text-color">Text Color</Label>
                  <Input
                    id="edit-text-color"
                    type="color"
                    value={editingLink.textColor || '#ffffff'}
                    onChange={(e) => setEditingLink({ ...editingLink, textColor: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editingLink.category}
                  onValueChange={(value) => setEditingLink({ ...editingLink, category: value as LinkCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(({ key, label }) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-visible">Visible</Label>
                <Switch
                  id="edit-visible"
                  checked={editingLink.isVisible}
                  onCheckedChange={(checked) => setEditingLink({ ...editingLink, isVisible: checked })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveEditedLink} className="flex-1">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingLink(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};