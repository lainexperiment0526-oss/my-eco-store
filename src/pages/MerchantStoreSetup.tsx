import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Store, ShoppingBag, Palette, Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";

import { uploadImage } from "@/lib/supabase-storage";
import { Loader2, Upload, X } from "lucide-react";

const MerchantStoreSetup: React.FC = () => {
  const navigate = useNavigate();
  const { piUser, isAuthenticated } = usePi();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    logo: "",
    primaryColor: "#3b82f6"
  });

  // Keep existing theme settings to merge later
  const [existingTheme, setExistingTheme] = useState<any>({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!piUser?.username) return;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", piUser.username)
          .maybeSingle();

        if (error) throw error;
        
        if (profile) {
          setProfileId(profile.id);
          const theme = profile.theme_settings as any || {};
          setExistingTheme(theme);
          setFormData({
            business_name: profile.business_name || "",
            description: profile.bio || "", // Map to bio column
            logo: profile.logo || "",
            primaryColor: theme.primaryColor || "#3b82f6"
          });
        } else {
           // Handle case where profile doesn't exist yet (should be rare if authenticated)
           toast.error("Profile not found. Please try again.");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile data");
      }
    };

    if (isAuthenticated && piUser?.username) {
      loadProfile();
    }
  }, [isAuthenticated, piUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!profileId) {
      toast.error("Profile not loaded. Please try refreshing.");
      return;
    }
    
    if (!file) return;

    setUploadingLogo(true);
    try {
      const result = await uploadImage(file, 'profile_images', `${profileId}/store-logo`);
      if (result?.url) {
        setFormData(prev => ({ ...prev, logo: result.url }));
        toast.success("Logo uploaded successfully");
      }
    } catch (error) {
      console.error("Logo upload failed:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      // Reset input
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) {
      toast.error("Profile not loaded. Please try refreshing.");
      return;
    }

    setLoading(true);
    try {
      // 1. Update Profile Basics
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          business_name: formData.business_name,
          bio: formData.description, // Map to bio column
          logo: formData.logo,
          // Merge theme settings safely
          theme_settings: {
            ...existingTheme,
            primaryColor: formData.primaryColor,
            // Ensure these defaults exist if not already set, but don't overwrite if user customized them elsewhere
            backgroundColor: existingTheme.backgroundColor || "#ffffff",
            buttonStyle: existingTheme.buttonStyle || "filled",
            iconStyle: existingTheme.iconStyle || "rounded"
          }
        })
        .eq("id", profileId);

      if (profileError) throw profileError;

      toast.success("Store setup saved successfully!");
      
      // Redirect to Product Manager
      navigate("/merchant-products");
    } catch (error) {
      console.error("Error saving store setup:", error);
      toast.error("Failed to save store settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader 
        title="Store Setup" 
        description="Configure your merchant storefront"
        icon={<Store />}
      />
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                Details that will appear on your storefront.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="business_name">Store Name</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="business_name"
                      name="business_name"
                      placeholder="e.g. My Awesome Shop"
                      value={formData.business_name}
                      onChange={handleChange}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell customers what you sell..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="logo">Store Logo</Label>
                  <div className="flex items-start gap-4">
                    {formData.logo ? (
                        <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-muted/20">
                          <img 
                            src={formData.logo} 
                            alt="Store Logo" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, logo: "" }))}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                    ) : (
                      <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400">
                        <ImageIcon className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <div className="flex flex-col gap-2">
                         <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingLogo}
                          onClick={() => logoInputRef.current?.click()}
                          className="w-fit"
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Logo
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Recommended size: 500x500px. Max size: 5MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Theme Color</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground">{formData.primaryColor}</span>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate("/dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Saving..." : "Save & Continue"}
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <FooterNav />
    </>
  );
};

export default MerchantStoreSetup;
