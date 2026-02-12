import React, { useState, useEffect } from 'react';
import { 
  Link as LinkIcon, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Image, 
  Globe, 
  Eye,
  Upload,
  ExternalLink,
  Palette,
  Type,
  MousePointer
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface LinkMetadata {
  id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  image?: string;
  color?: string;
  textColor?: string;
  icon?: string;
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

interface LinkCustomizerProps {
  links: LinkMetadata[];
  onLinksChange: (links: LinkMetadata[]) => void;
  onClose: () => void;
}

const LinkCustomizer: React.FC<LinkCustomizerProps> = ({ links, onLinksChange, onClose }) => {
  const [editingLink, setEditingLink] = useState<LinkMetadata | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fetchingMetadata, setFetchingMetadata] = useState(false);

  // Fetch metadata from URL
  const fetchUrlMetadata = async (url: string) => {
    if (!url) return;
    
    setFetchingMetadata(true);
    try {
      // Using a CORS proxy for demonstration - in production, use your backend
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      
      const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                   doc.querySelector('title')?.textContent ||
                   '';
      
      const description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                         doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                         '';
      
      const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                   doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                   '';
      
      const favicon = doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
                     doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
                     `${new URL(url).origin}/favicon.ico`;

      return { title, description, image, favicon };
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      return null;
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleAddLink = () => {
    const newLink: LinkMetadata = {
      id: Date.now().toString(),
      title: 'New Link',
      url: '',
      description: '',
      favicon: '',
      image: '',
      color: '#3b82f6',
      textColor: '#ffffff',
      icon: '🔗',
      isVisible: true,
      customStyling: {
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 500,
        padding: 12,
        animation: 'none'
      }
    };
    onLinksChange([...links, newLink]);
    setEditingLink(newLink);
  };

  const handleDeleteLink = (linkId: string) => {
    onLinksChange(links.filter(link => link.id !== linkId));
  };

  const handleSaveLink = () => {
    if (!editingLink) return;
    
    const updatedLinks = links.map(link => 
      link.id === editingLink.id ? editingLink : link
    );
    onLinksChange(updatedLinks);
    setEditingLink(null);
  };

  const handleUrlChange = async (url: string) => {
    if (!editingLink) return;
    
    setEditingLink({ ...editingLink, url });
    
    if (url && url.startsWith('http')) {
      const metadata = await fetchUrlMetadata(url);
      if (metadata) {
        setEditingLink(prev => prev ? {
          ...prev,
          title: metadata.title || prev.title,
          description: metadata.description || prev.description,
          image: metadata.image || prev.image,
          favicon: metadata.favicon || prev.favicon
        } : null);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'favicon' | 'image') => {
    const file = event.target.files?.[0];
    if (!file || !editingLink) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setEditingLink({
        ...editingLink,
        [type]: result
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LinkIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Link Customizer</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Customize your links with rich metadata, favicons, and styling options
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Links List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Links</h3>
                <Button onClick={handleAddLink} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Link
                </Button>
              </div>

              <div className="space-y-3">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className={`p-4 border rounded-lg transition-all cursor-pointer ${
                      editingLink?.id === link.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setEditingLink(link)}
                  >
                    <div className="flex items-start gap-3">
                      {link.favicon ? (
                        <img 
                          src={link.favicon} 
                          alt="" 
                          className="w-6 h-6 rounded-sm flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded-sm flex items-center justify-center text-sm">
                          {link.icon || '🔗'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 truncate">{link.title}</h4>
                        <p className="text-sm text-gray-500 truncate">{link.url}</p>
                        {link.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{link.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLink(link);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLink(link.id);
                          }}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Edit Form */}
            <div className="space-y-6">
              {editingLink ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Edit Link</h3>
                    <Button onClick={handleSaveLink} className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-700">Basic Information</h4>
                      
                      <div>
                        <Label>URL</Label>
                        <div className="flex gap-2">
                          <Input
                            value={editingLink.url}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            placeholder="https://example.com"
                            className="flex-1"
                          />
                          {fetchingMetadata && <div className="p-2">⏳</div>}
                        </div>
                      </div>

                      <div>
                        <Label>Title</Label>
                        <Input
                          value={editingLink.title}
                          onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                          placeholder="Link title"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={editingLink.description || ''}
                          onChange={(e) => setEditingLink({ ...editingLink, description: e.target.value })}
                          placeholder="Brief description of the link"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Icon/Emoji</Label>
                        <Input
                          value={editingLink.icon || ''}
                          onChange={(e) => setEditingLink({ ...editingLink, icon: e.target.value })}
                          placeholder="🔗"
                          maxLength={2}
                        />
                      </div>
                    </div>

                    {/* Media */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-700">Media & Images</h4>
                      
                      <div>
                        <Label>Favicon</Label>
                        <div className="flex gap-2">
                          <Input
                            value={editingLink.favicon || ''}
                            onChange={(e) => setEditingLink({ ...editingLink, favicon: e.target.value })}
                            placeholder="Favicon URL or upload file"
                            className="flex-1"
                          />
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'favicon')}
                              className="hidden"
                            />
                            <div className="p-2 border border-gray-300 rounded hover:bg-gray-100">
                              <Upload className="w-4 h-4" />
                            </div>
                          </label>
                        </div>
                        {editingLink.favicon && (
                          <img 
                            src={editingLink.favicon} 
                            alt="Favicon preview" 
                            className="w-8 h-8 mt-2 rounded border"
                          />
                        )}
                      </div>

                      <div>
                        <Label>Preview Image</Label>
                        <div className="flex gap-2">
                          <Input
                            value={editingLink.image || ''}
                            onChange={(e) => setEditingLink({ ...editingLink, image: e.target.value })}
                            placeholder="Preview image URL"
                            className="flex-1"
                          />
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'image')}
                              className="hidden"
                            />
                            <div className="p-2 border border-gray-300 rounded hover:bg-gray-100">
                              <Upload className="w-4 h-4" />
                            </div>
                          </label>
                        </div>
                        {editingLink.image && (
                          <img 
                            src={editingLink.image} 
                            alt="Preview" 
                            className="w-full h-32 mt-2 rounded border object-cover"
                          />
                        )}
                      </div>
                    </div>

                    {/* Styling */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-700">Custom Styling</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Background Color</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={editingLink.customStyling?.backgroundColor || '#3b82f6'}
                              onChange={(e) => setEditingLink({
                                ...editingLink,
                                customStyling: { ...editingLink.customStyling, backgroundColor: e.target.value }
                              })}
                              className="w-12 h-8 rounded border"
                            />
                            <Input
                              value={editingLink.customStyling?.backgroundColor || '#3b82f6'}
                              onChange={(e) => setEditingLink({
                                ...editingLink,
                                customStyling: { ...editingLink.customStyling, backgroundColor: e.target.value }
                              })}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Text Color</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={editingLink.textColor || '#ffffff'}
                              onChange={(e) => setEditingLink({ ...editingLink, textColor: e.target.value })}
                              className="w-12 h-8 rounded border"
                            />
                            <Input
                              value={editingLink.textColor || '#ffffff'}
                              onChange={(e) => setEditingLink({ ...editingLink, textColor: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Border Radius</Label>
                          <Input
                            type="number"
                            value={editingLink.customStyling?.borderRadius || 8}
                            onChange={(e) => setEditingLink({
                              ...editingLink,
                              customStyling: { ...editingLink.customStyling, borderRadius: parseInt(e.target.value) }
                            })}
                            min="0"
                            max="24"
                          />
                        </div>

                        <div>
                          <Label>Font Size</Label>
                          <Input
                            type="number"
                            value={editingLink.customStyling?.fontSize || 16}
                            onChange={(e) => setEditingLink({
                              ...editingLink,
                              customStyling: { ...editingLink.customStyling, fontSize: parseInt(e.target.value) }
                            })}
                            min="12"
                            max="24"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Animation</Label>
                        <select
                          value={editingLink.customStyling?.animation || 'none'}
                          onChange={(e) => setEditingLink({
                            ...editingLink,
                            customStyling: { ...editingLink.customStyling, animation: e.target.value as any }
                          })}
                          className="w-full p-2 border border-gray-300 rounded"
                        >
                          <option value="none">None</option>
                          <option value="bounce">Bounce</option>
                          <option value="pulse">Pulse</option>
                          <option value="glow">Glow</option>
                        </select>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Preview</h4>
                      <div
                        className="p-4 rounded-lg border flex items-center gap-3 transition-all hover:scale-105 cursor-pointer"
                        style={{
                          backgroundColor: editingLink.customStyling?.backgroundColor || '#3b82f6',
                          borderRadius: `${editingLink.customStyling?.borderRadius || 8}px`,
                          color: editingLink.textColor || '#ffffff',
                          fontSize: `${editingLink.customStyling?.fontSize || 16}px`,
                          animation: editingLink.customStyling?.animation === 'pulse' ? 'pulse 2s infinite' :
                                   editingLink.customStyling?.animation === 'bounce' ? 'bounce 1s infinite' : 'none'
                        }}
                      >
                        {editingLink.favicon ? (
                          <img src={editingLink.favicon} alt="" className="w-6 h-6 rounded" />
                        ) : (
                          <span className="text-lg">{editingLink.icon || '🔗'}</span>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{editingLink.title}</div>
                          {editingLink.description && (
                            <div className="text-sm opacity-80">{editingLink.description}</div>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 opacity-60" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a link to edit or create a new one</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkCustomizer;