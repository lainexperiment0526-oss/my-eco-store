import React, { useState, useCallback } from 'react';
import { 
  Link2, 
  QrCode, 
  Copy, 
  ExternalLink, 
  Download,
  Eye,
  BarChart3,
  Settings,
  Trash2,
  Edit,
  Share,
  Calendar,
  Globe,
  Zap,
  Star,
  Image,
  Upload,
  Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';

interface ShortenedLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title: string;
  description?: string;
  thumbnail?: string;
  displayStyle: 'classic' | 'featured' | 'animated';
  clicks: number;
  qrCode: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  password?: string;
  customDomain?: string;
  tags: string[];
  analytics: {
    clicks: number;
    uniqueVisitors: number;
    countries: Record<string, number>;
    referrers: Record<string, number>;
    devices: Record<string, number>;
  };
}

interface LinkShortenerProps {
  onLinksUpdate?: (links: ShortenedLink[]) => void;
  profileId?: string;
}

export const LinkShortener: React.FC<LinkShortenerProps> = ({ 
  onLinksUpdate,
  profileId 
}) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [displayStyle, setDisplayStyle] = useState<'classic' | 'featured' | 'animated'>('classic');
  const [thumbnail, setThumbnail] = useState('');
  const [password, setPassword] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shortenedLinks, setShortenedLinks] = useState<ShortenedLink[]>([]);
  const [selectedLink, setSelectedLink] = useState<ShortenedLink | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  // Generate short code
  const generateShortCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Validate URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Fetch URL metadata
  const fetchUrlMetadata = async (url: string) => {
    try {
      const response = await fetch(`https://api.linkpreview.net/?key=demo&q=${encodeURIComponent(url)}`);
      const data = await response.json();
      return {
        title: data.title || '',
        description: data.description || '',
        image: data.image || ''
      };
    } catch (error) {
      console.log('Could not fetch metadata:', error);
      return { title: '', description: '', image: '' };
    }
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setThumbnail(result);
        toast.success('Thumbnail uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Shorten URL
  const handleShortenUrl = async () => {
    if (!originalUrl) {
      toast.error('Please enter a URL to shorten');
      return;
    }

    if (!isValidUrl(originalUrl)) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);

    try {
      // Fetch metadata if title is not provided
      let finalTitle = linkTitle;
      let finalDescription = linkDescription;
      let finalThumbnail = thumbnail;

      if (!finalTitle || !finalDescription) {
        const metadata = await fetchUrlMetadata(originalUrl);
        finalTitle = finalTitle || metadata.title || 'Untitled Link';
        finalDescription = finalDescription || metadata.description || '';
        if (!finalThumbnail && metadata.image) {
          finalThumbnail = metadata.image;
        }
      }

      const shortCode = customAlias || generateShortCode();
      const shortUrl = `https://drop.link/${shortCode}`;

      const newLink: ShortenedLink = {
        id: `link_${Date.now()}`,
        originalUrl,
        shortCode,
        shortUrl,
        title: finalTitle,
        description: finalDescription,
        thumbnail: finalThumbnail,
        displayStyle,
        clicks: 0,
        qrCode: shortUrl,
        createdAt: new Date(),
        expiresAt: expiryDate ? new Date(expiryDate) : undefined,
        isActive: true,
        password: password || undefined,
        tags: [],
        analytics: {
          clicks: 0,
          uniqueVisitors: 0,
          countries: {},
          referrers: {},
          devices: {}
        }
      };

      // Add to list
      const updatedLinks = [newLink, ...shortenedLinks];
      setShortenedLinks(updatedLinks);
      onLinksUpdate?.(updatedLinks);

      // Save to backend (if profileId exists)
      if (profileId) {
        await saveToBackend(newLink);
      }

      // Reset form
      setOriginalUrl('');
      setCustomAlias('');
      setLinkTitle('');
      setLinkDescription('');
      setThumbnail('');
      setPassword('');
      setExpiryDate('');

      toast.success('Link shortened successfully!');

    } catch (error) {
      console.error('Error shortening URL:', error);
      toast.error('Failed to shorten URL');
    } finally {
      setIsLoading(false);
    }
  };

  // Save to backend
  const saveToBackend = async (link: ShortenedLink) => {
    try {
      // Implementation for saving to Supabase
      const response = await fetch('/api/shortened-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...link,
          profileId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save link');
      }
    } catch (error) {
      console.error('Error saving to backend:', error);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Download QR Code
  const downloadQRCode = (shortUrl: string, title: string) => {
    const canvas = document.querySelector(`canvas[data-url="${shortUrl}"]`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Get display style icon
  const getDisplayStyleIcon = (style: string) => {
    switch (style) {
      case 'featured': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'animated': return <Zap className="w-4 h-4 text-blue-500" />;
      default: return <Link2 className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get display style description
  const getDisplayStyleDescription = (style: string) => {
    switch (style) {
      case 'featured': return 'Make downloads stand out with a larger, more attractive display.';
      case 'animated': return 'Draw attention to your most important link.';
      default: return 'Efficient, direct and compact.';
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Link Shortener & QR Generator</h2>
        <p className="text-muted-foreground">
          Create compact, memorable links and QR codes with advanced customization
        </p>
      </div>

      {/* URL Shortening Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Shorten Your Link
          </CardTitle>
          <CardDescription>
            Transform long URLs into short, shareable links with custom styling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="original-url">Long URL *</Label>
                <Input
                  id="original-url"
                  type="url"
                  placeholder="https://example.com/very-long-url"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-alias">Custom Alias (Optional)</Label>
                <Input
                  id="custom-alias"
                  placeholder="my-custom-link"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleShortenUrl} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Shortening...' : 'Shorten URL'}
              </Button>
            </TabsContent>

            <TabsContent value="customize" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-title">Link Title</Label>
                <Input
                  id="link-title"
                  placeholder="My Awesome Link"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-description">Description</Label>
                <Textarea
                  id="link-description"
                  placeholder="A brief description of your link"
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Display Style</Label>
                <Select value={displayStyle} onValueChange={(value: 'classic' | 'featured' | 'animated') => setDisplayStyle(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Classic</div>
                          <div className="text-sm text-muted-foreground">Efficient, direct and compact</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="featured">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <div>
                          <div className="font-medium">Featured</div>
                          <div className="text-sm text-muted-foreground">Larger, more attractive display</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="animated">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-medium">Animated</div>
                          <div className="text-sm text-muted-foreground">Draw attention with animations</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {getDisplayStyleDescription(displayStyle)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Thumbnail/Icon</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      id="thumbnail-upload"
                    />
                    <Label
                      htmlFor="thumbnail-upload"
                      className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      {thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}
                    </Label>
                  </div>
                  {thumbnail && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                      <img
                        src={thumbnail}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password Protection</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Optional password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div className="p-4 border border-border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Premium Features
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Custom domains (yourbrand.com/link)</li>
                  <li>• Advanced analytics & tracking</li>
                  <li>• Bulk link creation</li>
                  <li>• API access for automation</li>
                  <li>• White-label QR codes</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Shortened Links List */}
      {shortenedLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Your Shortened Links
            </CardTitle>
            <CardDescription>
              Manage and track your shortened links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shortenedLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getDisplayStyleIcon(link.displayStyle)}
                        <h4 className="font-medium truncate">{link.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {link.clicks} clicks
                        </Badge>
                      </div>
                      
                      {link.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {link.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-500" />
                          <span className="font-mono text-blue-600">{link.shortUrl}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {link.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {link.thumbnail && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0">
                        <img
                          src={link.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(link.shortUrl)}
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowQRCode(!showQRCode)}
                      >
                        <QrCode className="w-4 h-4" />
                        QR Code
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(link.originalUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visit
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                        Analytics
                      </Button>
                      
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* QR Code Display */}
                  {showQRCode && selectedLink?.id === link.id && (
                    <div className="mt-4 p-4 border border-border rounded-lg bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-medium">QR Code</h5>
                        <Button
                          size="sm"
                          onClick={() => downloadQRCode(link.shortUrl, link.title)}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                      <div className="flex justify-center">
                        <QRCodeCanvas
                          value={link.shortUrl}
                          size={200}
                          level="M"
                          includeMargin
                          data-url={link.shortUrl}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};