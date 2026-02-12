import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Link as LinkIcon, 
  Copy, 
  QrCode, 
  ExternalLink, 
  Plus, 
  Edit, 
  Trash2, 
  Star,
  BarChart3,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ShoppingBag,
  Mail,
  Phone,
  Calendar,
  Download,
  Heart,
  Zap,
  Users,
  Globe,
  Image,
  Palette,
  Upload,
  X
} from "lucide-react";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { CustomLink, ShortenedLink, LinkCategory, DisplayStyle, LayoutType } from "@/types/profile";

interface LinkManagerProps {
  customLinks: CustomLink[];
  shortenedLinks?: ShortenedLink[];
  onCustomLinksChange: (links: CustomLink[]) => void;
  onShortenedLinksChange?: (links: ShortenedLink[]) => void;
  layoutType?: LayoutType;
  onLayoutChange?: (layout: LayoutType) => void;
}

const linkCategories: { value: LinkCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'suggested', label: 'Suggested', icon: Star, color: 'bg-yellow-500' },
  { value: 'commerce', label: 'Commerce', icon: ShoppingBag, color: 'bg-green-500' },
  { value: 'social', label: 'Social', icon: Users, color: 'bg-blue-500' },
  { value: 'media', label: 'Media', icon: Globe, color: 'bg-purple-500' },
  { value: 'contact', label: 'Contact', icon: Phone, color: 'bg-orange-500' },
  { value: 'events', label: 'Events', icon: Calendar, color: 'bg-red-500' },
  { value: 'text', label: 'Text', icon: LinkIcon, color: 'bg-gray-500' }
];

const displayStyles: { value: DisplayStyle; label: string; description: string }[] = [
  { value: 'classic', label: 'Classic', description: 'Clean and minimal' },
  { value: 'featured', label: 'Featured', description: 'Larger with star indicator' },
  { value: 'animated', label: 'Animated', description: 'Eye-catching effects' }
];

const layoutTypes: { value: LayoutType; label: string; description: string }[] = [
  { value: 'stack', label: 'Stack', description: 'Vertical list layout' },
  { value: 'grid', label: 'Grid', description: '2-column responsive grid' },
  { value: 'carousel', label: 'Carousel', description: 'Horizontal scrolling' },
  { value: 'showcase', label: 'Showcase', description: 'Large featured format' }
];

const suggestedLinks = [
  { title: 'Website', url: 'https://yourwebsite.com', icon: '🌐', category: 'suggested' as LinkCategory },
  { title: 'Email', url: 'mailto:hello@example.com', icon: '✉️', category: 'contact' as LinkCategory },
  { title: 'Phone', url: 'tel:+1234567890', icon: '📞', category: 'contact' as LinkCategory },
  { title: 'Instagram', url: 'https://instagram.com/username', icon: '📷', category: 'social' as LinkCategory },
  { title: 'Twitter', url: 'https://twitter.com/username', icon: '🐦', category: 'social' as LinkCategory },
  { title: 'YouTube', url: 'https://youtube.com/channel/username', icon: '📺', category: 'media' as LinkCategory },
  { title: 'Online Store', url: 'https://store.com', icon: '🛍️', category: 'commerce' as LinkCategory },
  { title: 'Portfolio', url: 'https://portfolio.com', icon: '💼', category: 'text' as LinkCategory }
];

const LinkManager: React.FC<LinkManagerProps> = ({
  customLinks = [],
  shortenedLinks = [],
  onCustomLinksChange,
  onShortenedLinksChange,
  layoutType = 'stack',
  onLayoutChange
}) => {
  const [editingLink, setEditingLink] = useState<CustomLink | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [urlToShorten, setUrlToShorten] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [isShortening, setIsShortening] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<LinkCategory>('suggested');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form state for custom link editing
  const [formData, setFormData] = useState<Partial<CustomLink>>({});

  const handleShortenUrl = async () => {
    if (!urlToShorten.trim()) {
      toast.error('Please enter a URL to shorten');
      return;
    }

    setIsShortening(true);
    try {
      // Simulate URL shortening (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const shortCode = customAlias || Math.random().toString(36).substring(2, 8);
      const newShortened: ShortenedLink = {
        id: Date.now().toString(),
        originalUrl: urlToShorten,
        shortCode,
        shortUrl: `${window.location.origin}/s/${shortCode}`,
        title: `Shortened Link #${shortCode}`,
        clicks: 0,
        created: new Date(),
        active: true
      };

      const updatedLinks = [...(shortenedLinks || []), newShortened];
      onShortenedLinksChange?.(updatedLinks);
      
      setUrlToShorten('');
      setCustomAlias('');
      toast.success('URL shortened successfully!');
    } catch (error) {
      toast.error('Failed to shorten URL');
    } finally {
      setIsShortening(false);
    }
  };

  const handleAddCustomLink = (suggestion?: typeof suggestedLinks[0]) => {
    const newLink: CustomLink = {
      id: Date.now().toString(),
      title: suggestion?.title || formData.title || 'New Link',
      url: suggestion?.url || formData.url || 'https://example.com',
      icon: suggestion?.icon || formData.icon || '🔗',
      category: suggestion?.category || formData.category || selectedCategory,
      isVisible: true,
      priority: customLinks.length,
      displayStyle: formData.displayStyle || 'classic',
      color: formData.color || '#3b82f6',
      textColor: formData.textColor || '#ffffff',
      description: formData.description || '',
      customStyling: formData.customStyling
    };

    onCustomLinksChange([...customLinks, newLink]);
    setFormData({});
    setShowAddLink(false);
    toast.success('Link added successfully!');
  };

  const handleUpdateLink = (linkId: string, updates: Partial<CustomLink>) => {
    const updatedLinks = customLinks.map(link => 
      link.id === linkId ? { ...link, ...updates } : link
    );
    onCustomLinksChange(updatedLinks);
    toast.success('Link updated successfully!');
  };

  const handleDeleteLink = (linkId: string) => {
    const updatedLinks = customLinks.filter(link => link.id !== linkId);
    onCustomLinksChange(updatedLinks);
    toast.success('Link deleted successfully!');
  };

  const handleReorderLink = (linkId: string, direction: 'up' | 'down') => {
    const currentIndex = customLinks.findIndex(link => link.id === linkId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= customLinks.length) return;

    const reorderedLinks = [...customLinks];
    [reorderedLinks[currentIndex], reorderedLinks[newIndex]] = 
    [reorderedLinks[newIndex], reorderedLinks[currentIndex]];
    
    // Update priorities
    const updatedLinks = reorderedLinks.map((link, index) => ({
      ...link,
      priority: index
    }));

    onCustomLinksChange(updatedLinks);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'favicon') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `link-${field}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars') // Using existing avatars bucket
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update form data
      setFormData(prev => ({ ...prev, [field]: publicUrl }));
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditLink = (link: CustomLink) => {
    setEditingLink(link);
    setFormData(link);
    setImagePreview(link.image || link.favicon || null);
    setShowEditDialog(true);
  };

  const handleSaveEditedLink = () => {
    if (!editingLink || !formData.title || !formData.url) {
      toast.error('Please fill in required fields');
      return;
    }

    const updatedLink: CustomLink = {
      ...editingLink,
      ...formData,
      title: formData.title,
      url: formData.url,
    };

    handleUpdateLink(editingLink.id, updatedLink);
    setShowEditDialog(false);
    setEditingLink(null);
    setFormData({});
    setImagePreview(null);
  };

  const handleCancelEdit = () => {
    setShowEditDialog(false);
    setEditingLink(null);
    setFormData({});
    setImagePreview(null);
  };

  const categorizedLinks = linkCategories.map(category => ({
    ...category,
    links: customLinks.filter(link => link.category === category.value)
  }));

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Layout Selection */}
      {onLayoutChange && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Layout Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {layoutTypes.map((layout) => (
                <Button
                  key={layout.value}
                  variant={layoutType === layout.value ? 'default' : 'outline'}
                  onClick={() => onLayoutChange(layout.value)}
                  className="h-auto p-3 flex flex-col items-center gap-2 text-xs sm:text-sm"
                >
                  <span className="font-medium truncate w-full">{layout.label}</span>
                  <span className="text-xs text-muted-foreground truncate w-full">{layout.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="custom" className="w-full max-w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="custom">Custom Links</TabsTrigger>
          <TabsTrigger value="shortened">Short Links</TabsTrigger>
        </TabsList>

        <TabsContent value="custom" className="space-y-4">
          {/* Quick Add Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Quick Add Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {suggestedLinks.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCustomLink(suggestion)}
                    className="flex items-center gap-1 sm:gap-2 h-auto p-2 sm:p-3 text-xs sm:text-sm"
                  >
                    <span className="text-sm sm:text-base">{suggestion.icon}</span>
                    <span className="text-xs truncate">{suggestion.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Add Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Custom Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      placeholder="Link title"
                      value={formData.title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input
                      placeholder="https://example.com"
                      value={formData.url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Icon/Emoji</Label>
                    <Input
                      placeholder="🔗 or icon name"
                      value={formData.icon || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category || selectedCategory} onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, category: value as LinkCategory }));
                      setSelectedCategory(value as LinkCategory);
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {linkCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Brief description of this link"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Display Style</Label>
                  <Select value={formData.displayStyle || 'classic'} onValueChange={(value) => setFormData(prev => ({ ...prev, displayStyle: value as DisplayStyle }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {displayStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <span className="text-xs sm:text-sm">{style.label} - {style.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={formData.color || '#3b82f6'}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="h-10 w-full"
                  />
                </div>
                <div>
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={formData.textColor || '#ffffff'}
                    onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                    className="h-10 w-full"
                  />
                </div>
              </div>
              
              {/* Image Upload Section */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Link Thumbnail</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'image')}
                        className="hidden"
                        id="thumbnail-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('thumbnail-upload')?.click()}
                        disabled={uploadingImage}
                        className="flex items-center gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingImage ? 'Uploading...' : 'Upload Thumbnail'}
                      </Button>
                      {formData.image && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, image: undefined }))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {(formData.image || imagePreview) && (
                      <div className="relative w-20 h-20 border rounded-lg overflow-hidden">
                        <img
                          src={imagePreview || formData.image}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>Favicon/Icon</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'favicon')}
                        className="hidden"
                        id="favicon-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('favicon-upload')?.click()}
                        disabled={uploadingImage}
                        className="flex items-center gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingImage ? 'Uploading...' : 'Upload Icon'}
                      </Button>
                      {formData.favicon && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, favicon: undefined }))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {(formData.favicon || (imagePreview && !formData.image)) && (
                      <div className="relative w-12 h-12 border rounded-lg overflow-hidden">
                        <img
                          src={(imagePreview && !formData.image) ? imagePreview : formData.favicon}
                          alt="Favicon preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button onClick={() => handleAddCustomLink()} className="w-full text-sm sm:text-base">
                Add Custom Link
              </Button>
            </CardContent>
          </Card>

          {/* Existing Custom Links by Category */}
          {categorizedLinks.map((category) => (
            category.links.length > 0 && (
              <Card key={category.value}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="w-5 h-5" />
                    {category.label} ({category.links.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.links.map((link, index) => (
                      <div key={link.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        {/* Link Preview */}
                        <div className="flex-shrink-0">
                          {link.image ? (
                            <div className="w-16 h-12 rounded-lg overflow-hidden border">
                              <img 
                                src={link.image} 
                                alt={link.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : link.favicon ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border flex items-center justify-center bg-gray-100">
                              <img 
                                src={link.favicon} 
                                alt={link.title}
                                className="w-8 h-8 object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg border flex items-center justify-center bg-gray-100">
                              <span className="text-lg">{link.icon || '🔗'}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Link Content */}
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-gray-900 truncate text-sm sm:text-base">{link.title}</span>
                            <Badge variant={link.displayStyle === 'featured' ? 'default' : 'secondary'} className="text-xs">
                              {link.displayStyle}
                            </Badge>
                            {!link.isVisible && <EyeOff className="w-4 h-4 text-gray-400" />}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 truncate mb-1 break-all">{link.url}</p>
                          {link.description && (
                            <p className="text-xs text-gray-400 line-clamp-2">{link.description}</p>
                          )}
                          
                          {/* Visual Styling Indicators */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {link.color && link.color !== '#3b82f6' && (
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300" 
                                style={{ backgroundColor: link.color }}
                                title="Custom background color"
                              />
                            )}
                            {link.customStyling?.animation && link.customStyling.animation !== 'none' && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {link.customStyling.animation}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReorderLink(link.id, 'up')}
                            disabled={index === 0}
                            title="Move up"
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReorderLink(link.id, 'down')}
                            disabled={index === category.links.length - 1}
                            title="Move down"
                            className="h-8 w-8 p-0"
                          >
                            <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateLink(link.id, { isVisible: !link.isVisible })}
                            title={link.isVisible ? 'Hide link' : 'Show link'}
                            className="h-8 w-8 p-0"
                          >
                            {link.isVisible ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowQR(link.url)}
                            title="Generate QR code"
                            className="h-8 w-8 p-0"
                          >
                            <QrCode className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(link.url)}
                            title="Copy URL"
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditLink(link)}
                            title="Edit link"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteLink(link.id)}
                            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                            title="Delete link"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </TabsContent>

        <TabsContent value="shortened" className="space-y-4">
          {/* URL Shortening */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Shorten New URL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>URL to Shorten</Label>
                <Input
                  placeholder="https://example.com/very-long-url"
                  value={urlToShorten}
                  onChange={(e) => setUrlToShorten(e.target.value)}
                />
              </div>
              <div>
                <Label>Custom Alias (optional)</Label>
                <Input
                  placeholder="my-custom-link"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                />
              </div>
              <Button onClick={handleShortenUrl} disabled={isShortening} className="w-full">
                {isShortening ? 'Shortening...' : 'Shorten URL'}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Shortened Links */}
          {shortenedLinks && shortenedLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Your Shortened Links ({shortenedLinks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shortenedLinks.map((link) => (
                    <div key={link.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      {/* Link Preview - no thumbnail for ShortenedLink */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg border flex items-center justify-center bg-gray-100">
                          <LinkIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      </div>
                      {/* Link Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 truncate">{link.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {link.clicks} clicks
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-600 truncate mb-1">{link.shortUrl}</p>
                        <p className="text-xs text-gray-500 truncate">{link.originalUrl}</p>
                        {/* Additional Info */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>Created {new Date(link.created ? link.created : Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowQR(link.shortUrl)}
                          title="Generate QR code"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(link.shortUrl)}
                          title="Copy short URL"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(link.originalUrl, '_blank')}
                          title="Open original URL"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* QR Code Dialog */}
      <Dialog open={!!showQR} onOpenChange={() => setShowQR(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
          </DialogHeader>
          {showQR && (
            <div className="flex flex-col items-center space-y-4">
              <QRCodeDisplay value={showQR} />
              <Button onClick={() => copyToClipboard(showQR)} variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Link Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Link
            </DialogTitle>
          </DialogHeader>
          
          {editingLink && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    placeholder="Link title"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>URL *</Label>
                  <Input
                    placeholder="https://example.com"
                    value={formData.url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Icon/Emoji</Label>
                  <Input
                    placeholder="🔗 or icon name"
                    value={formData.icon || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category || 'suggested'} onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, category: value as LinkCategory }));
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {linkCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Brief description of this link"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Image Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Link Thumbnail</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {(formData.image || imagePreview) ? (
                      <div className="space-y-3">
                        <div className="relative mx-auto w-32 h-24 border rounded-lg overflow-hidden">
                          <img
                            src={imagePreview || formData.image}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, image: undefined }));
                              setImagePreview(null);
                            }}
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('edit-thumbnail-upload')?.click()}
                          disabled={uploadingImage}
                        >
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Image className="w-12 h-12 mx-auto text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Upload Thumbnail</p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('edit-thumbnail-upload')?.click()}
                          disabled={uploadingImage}
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {uploadingImage ? 'Uploading...' : 'Choose Image'}
                        </Button>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'image')}
                      className="hidden"
                      id="edit-thumbnail-upload"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Favicon/Icon</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {(formData.favicon) ? (
                      <div className="space-y-3">
                        <div className="relative mx-auto w-16 h-16 border rounded-lg overflow-hidden">
                          <img
                            src={formData.favicon}
                            alt="Favicon preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, favicon: undefined }))}
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('edit-favicon-upload')?.click()}
                          disabled={uploadingImage}
                        >
                          Change Icon
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Globe className="w-8 h-8 mx-auto text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Upload Icon</p>
                          <p className="text-xs text-gray-500">Small square icon</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('edit-favicon-upload')?.click()}
                          disabled={uploadingImage}
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {uploadingImage ? 'Uploading...' : 'Choose Icon'}
                        </Button>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'favicon')}
                      className="hidden"
                      id="edit-favicon-upload"
                    />
                  </div>
                </div>
              </div>

              {/* Styling Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Display Style</Label>
                  <Select value={formData.displayStyle || 'classic'} onValueChange={(value) => setFormData(prev => ({ ...prev, displayStyle: value as DisplayStyle }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {displayStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label} - {style.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={formData.color || '#3b82f6'}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={formData.textColor || '#ffffff'}
                    onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Advanced Styling */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Advanced Styling (Optional)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">Border Radius</Label>
                    <Input
                      type="number"
                      placeholder="8"
                      value={formData.customStyling?.borderRadius || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customStyling: {
                          ...prev.customStyling,
                          borderRadius: e.target.value ? Number(e.target.value) : undefined
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Font Size</Label>
                    <Input
                      type="number"
                      placeholder="14"
                      value={formData.customStyling?.fontSize || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customStyling: {
                          ...prev.customStyling,
                          fontSize: e.target.value ? Number(e.target.value) : undefined
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Font Weight</Label>
                    <Select value={formData.customStyling?.fontWeight?.toString() || ''} onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      customStyling: {
                        ...prev.customStyling,
                        fontWeight: value ? Number(value) : undefined
                      }
                    }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Normal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">Light (300)</SelectItem>
                        <SelectItem value="400">Normal (400)</SelectItem>
                        <SelectItem value="500">Medium (500)</SelectItem>
                        <SelectItem value="600">Semi Bold (600)</SelectItem>
                        <SelectItem value="700">Bold (700)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Animation</Label>
                    <Select value={formData.customStyling?.animation || 'none'} onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      customStyling: {
                        ...prev.customStyling,
                        animation: value as 'none' | 'bounce' | 'pulse' | 'glow'
                      }
                    }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="bounce">Bounce</SelectItem>
                        <SelectItem value="pulse">Pulse</SelectItem>
                        <SelectItem value="glow">Glow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEditedLink} disabled={!formData.title || !formData.url}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LinkManager;