import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { VirtualCard } from "@/components/VirtualCard";
import { Download, Printer, RefreshCw, Palette, Share2, Link, AlertCircle, Eye, X, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { Button as UIButton } from "@/components/ui/button";
import { usePi } from "@/contexts/PiContext";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";

export default function CardGenerator() {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Pi auth + profile resolution
  const { piUser, isAuthenticated, signIn } = usePi() as any;
  
  // Get active subscription status (properly checks for 30 Pi Pro plan)
  const { plan, isActive, loading: subscriptionLoading } = useActiveSubscription();

  // Load persisted profile as a soft fallback only
  const profileData = localStorage.getItem("profile");
  const profile = profileData ? JSON.parse(profileData) : null;

  // Resolved username backed by Pi auth, falls back to stored profile, else placeholder
  const [username, setUsername] = useState<string>(profile?.username || "yourusername");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  // Resolve username from Pi auth first, then verify via Supabase profiles
  // and fetch full public bio data including followers
  useEffect(() => {
    let mounted = true;
    const resolve = async () => {
      const piName = (piUser as any)?.username;
      const candidate = piName || profile?.username || "yourusername";
      if (mounted) setUsername(candidate);
      // Try to resolve profile id and fetch full profile data
      try {
        if (candidate && candidate !== "yourusername") {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', candidate)
            .maybeSingle();
          if (mounted && data?.id) {
            setProfileId(data.id);
            if (data.username && data.username !== candidate) setUsername(data.username);
            
            // Fetch follower count
            const { count: followerCount } = await supabase
              .from('followers')
              .select('id', { count: 'exact' })
              .eq('following_profile_id', data.id);
            
            if (mounted && followerCount !== null) {
              setFollowerCount(followerCount);
            }

            // Log fetched public bio data
            console.log('[CardGenerator] Fetched public bio data for:', {
              username: data.username,
              business_name: data.business_name,
              description: data.description,
              logo: data.logo,
              pi_wallet_address: data.pi_wallet_address,
              social_links: data.social_links,
              follower_count: followerCount,
            });
          }
        }
      } catch (error) {
        console.error('[CardGenerator] Error fetching profile:', error);
      }
    };
    resolve();
    return () => { mounted = false; };
  }, [piUser, profile?.username]);

  // Public bio URL: link QR to public bio at /@username
  const storeUrl = useMemo(() => {
    const name = username || "yourusername";
    return `${window.location.origin}/@${name}`;
  }, [username]);

  // Card customization state - default colors: Sky Blue theme
  const [frontColor, setFrontColor] = useState(
    profile?.card_front_color || "#2bbdee"
  );
  const [backColor, setBackColor] = useState(
    profile?.card_back_color || "#2bbdee"
  );
  const [textColor, setTextColor] = useState(
    profile?.card_text_color || "#000000"
  );
  const [accentColor, setAccentColor] = useState(
    profile?.card_accent_color || "#fafafa"
  );
  const [shareableLink, setShareableLink] = useState("");
  const [showShareLink, setShowShareLink] = useState(false);
  const [viewCardOnly, setViewCardOnly] = useState(false);
  const [isCapturingCard, setIsCapturingCard] = useState(false);
  
  // Detect Pi Browser
  const isPiBrowser = navigator.userAgent.includes("PiBrowser") || window.location.hostname.includes("pi.app");
  
  // Check if user has Pro plan (30 Pi subscription) - properly detects active subscription
  const hasProPlan = (plan === "pro" || plan === "premium") && isActive;

  // Preset color themes
  const presets = [
    {
      name: "Classic Blue",
      front: "#1a1a2e",
      back: "#16213e",
      text: "#ffffff",
      accent: "#87ceeb",
    },
    {
      name: "Purple Dream",
      front: "#2d1b69",
      back: "#1e0342",
      text: "#ffffff",
      accent: "#c77dff",
    },
    {
      name: "Emerald",
      front: "#064e3b",
      back: "#022c22",
      text: "#ffffff",
      accent: "#34d399",
    },
    {
      name: "Rose Gold",
      front: "#4a1942",
      back: "#2d0a2b",
      text: "#ffffff",
      accent: "#f9a8d4",
    },
    {
      name: "Ocean",
      front: "#0c4a6e",
      back: "#082f49",
      text: "#ffffff",
      accent: "#7dd3fc",
    },
    {
      name: "Sunset",
      front: "#7c2d12",
      back: "#431407",
      text: "#ffffff",
      accent: "#fdba74",
    },
  ];

  const saveCardColors = async () => {
    if (!profileId && !profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please authenticate with Pi Browser to save your card design.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const cardDesignData = {
        version: "1.0",
        printReady: true,
        mirrored: true,
        colors: {
          front: frontColor,
          back: backColor,
          text: textColor,
          accent: accentColor,
        },
        savedAt: new Date().toISOString(),
      };

      console.log('Saving card colors for profile:', profile.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          card_front_color: frontColor,
          card_back_color: backColor,
          card_text_color: textColor,
          card_accent_color: accentColor,
          card_design_data: cardDesignData,
        } as any)
        .eq('id', profile.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Saved successfully:', data);

      toast({
        title: "Saved!",
        description: "Card design saved with front and back (mirrored for printing).",
      });
    } catch (error) {
      console.error('Error saving card colors:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Could not save card colors. Please try again.",
        variant: "destructive",
      });
    }
  };

  const applyPreset = (preset: typeof presets[0]) => {
    if (!hasProPlan) {
      toast({
        title: "Pro Plan Required",
        description: "Subscribe to the 30 Pi Pro plan to unlock card customization features.",
        variant: "destructive",
      });
      return;
    }
    setFrontColor(preset.front);
    setBackColor(preset.back);
    setTextColor(preset.text);
    setAccentColor(preset.accent);
    
    // Save to database
    setTimeout(() => saveCardColors(), 500);
    
    toast({
      title: "Theme Applied",
      description: `${preset.name} theme has been applied to your card.`,
    });
  };

  const resetColors = () => {
    setFrontColor("#1a1a2e");
    setBackColor("#16213e");
    setTextColor("#ffffff");
    setAccentColor("#87ceeb");
    toast({
      title: "Colors Reset",
      description: "Card colors have been reset to default.",
    });
  };

  const handlePrint = async () => {
    if (!cardRef.current) return;

    try {
      setIsCapturingCard(true);

      // Capture front side (current state)
      const frontCanvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
      });

      // Get the card flip element
      const cardContainer = cardRef.current.querySelector('[style*="transform-style"]') as HTMLElement;
      
      // Toggle the flip by clicking the card container
      if (cardContainer) {
        cardContainer.click();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait longer for animation
      }

      // Capture back side (after flip)
      const backCanvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
      });

      // Create combined image with front (left) and mirrored back (right)
      const combinedCanvas = document.createElement('canvas');
      const ctx = combinedCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas size for both cards side by side
      combinedCanvas.width = frontCanvas.width * 2 + 20; // Add 20px gap
      combinedCanvas.height = frontCanvas.height;

      // Draw front card on left
      ctx.drawImage(frontCanvas, 0, 0);

      // Draw back card on right (mirrored)
      ctx.save();
      ctx.translate(frontCanvas.width * 2 + 20, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(backCanvas, 0, 0);
      ctx.restore();

      // Create printable image
      const printWindow = window.open('', 'PRINT', 'height=600,width=800');
      if (printWindow) {
        const imgData = combinedCanvas.toDataURL('image/png');
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Droplink Card</title>
              <style>
                body { margin: 0; padding: 10px; font-family: Arial, sans-serif; }
                img { max-width: 100%; height: auto; display: block; margin: 10px 0; }
                p { margin: 5px 0; font-size: 14px; }
                .instructions { font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 10px; }
                @media print {
                  body { margin: 0; padding: 0; }
                  img { margin: 0; page-break-after: avoid; }
                }
              </style>
            </head>
            <body onload="window.print();window.close();">
              <p><strong>FRONT (Left) | BACK Mirrored (Right)</strong></p>
              <img src="${imgData}" />
              <div class="instructions">
                <p><strong>Print Instructions:</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  <li>Print on cardstock (300gsm recommended)</li>
                  <li>Use duplex printing with "Flip on Short Edge"</li>
                  <li>Back side is mirrored for correct text orientation when flipped</li>
                </ul>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
      }

      // Flip back to front
      if (cardContainer) {
        cardContainer.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setIsCapturingCard(false);

      toast({
        title: "Printing...",
        description: "Front and mirrored back ready to print.",
      });
    } catch (error) {
      setIsCapturingCard(false);
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: "Could not prepare card for printing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;

    try {
      setIsCapturingCard(true);
      
      // Capture front side
      const frontCanvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
      });

      // Get the card flip element and flip it
      const cardContainer = cardRef.current.querySelector('[style*="transform-style"]') as HTMLElement;
      if (cardContainer) {
        cardContainer.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Capture back side after flip
      const backCanvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
      });

      // Create combined image with front (left) and mirrored back (right)
      const combinedCanvas = document.createElement('canvas');
      const ctx = combinedCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas size for both cards side by side
      combinedCanvas.width = frontCanvas.width * 2 + 20;
      combinedCanvas.height = frontCanvas.height;

      // Draw front card on left
      ctx.drawImage(frontCanvas, 0, 0);

      // Draw back card on right (mirrored)
      ctx.save();
      ctx.translate(frontCanvas.width * 2 + 20, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(backCanvas, 0, 0);
      ctx.restore();

      // Download combined image
      const link = document.createElement("a");
      link.download = `droplink-card-${username}-front-and-back.png`;
      link.href = combinedCanvas.toDataURL("image/png");
      link.click();

      // Flip back to front
      if (cardContainer) {
        cardContainer.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setIsCapturingCard(false);

      toast({
        title: "Downloaded!",
        description: "PNG with front and mirrored back ready to print.",
      });
    } catch (error) {
      setIsCapturingCard(false);
      toast({
        title: "Download Failed",
        description: "Could not download card. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;

    try {
      setIsCapturingCard(true);

      // Capture front side
      const frontCanvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
      });

      // Get the card flip element and flip it
      const cardContainer = cardRef.current.querySelector('[style*="transform-style"]') as HTMLElement;
      if (cardContainer) {
        cardContainer.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Capture back side after flip
      const backCanvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
      });

      // Create PDF with both sides
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 53.98],
      });

      // Add front side (Page 1)
      const frontImgData = frontCanvas.toDataURL("image/png");
      pdf.addImage(frontImgData, "PNG", 0, 0, 85.6, 53.98);

      // Add back side (Page 2) - mirrored for duplex printing
      pdf.addPage([85.6, 53.98], "landscape");
      
      // Create mirrored back canvas
      const mirroredCanvas = document.createElement('canvas');
      mirroredCanvas.width = backCanvas.width;
      mirroredCanvas.height = backCanvas.height;
      const ctx = mirroredCanvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.translate(mirroredCanvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(backCanvas, 0, 0);
        ctx.restore();
      }
      
      const backImgData = mirroredCanvas.toDataURL("image/png");
      pdf.addImage(backImgData, "PNG", 0, 0, 85.6, 53.98);
      
      pdf.save(`droplink-card-${username}-print-ready.pdf`);

      // Flip back to front
      if (cardContainer) {
        cardContainer.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setIsCapturingCard(false);

      toast({
        title: "Downloaded!",
        description: "Print-ready PDF with front (page 1) and mirrored back (page 2).",
      });
    } catch (error) {
      setIsCapturingCard(false);
      toast({
        title: "Download Failed",
        description: "Could not download card. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateShareableLink = () => {
    // Create shareable URL with card customization data
    const params = new URLSearchParams({
      username,
      frontColor,
      backColor,
      textColor,
      accentColor,
    });
    const link = `${window.location.origin}/card-generator?${params.toString()}`;
    setShareableLink(link);
    setShowShareLink(true);
    
    // Copy to clipboard
    navigator.clipboard.writeText(link);
    
    toast({
      title: "Link Copied!",
      description: "Open this link in any browser to download your card.",
    });
  };

  const copyShareableLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
  };

  return (
    <div>
      <PageHeader 
        title="Card Generator" 
        description="Create your virtual business card"
        icon={<CreditCard className="w-6 h-6" />}
      />
      <div className="min-h-screen bg-sky-400 py-3 sm:py-4 md:py-8 px-3 sm:px-4">
      {/* View Card Only Mode */}
      {viewCardOnly && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-2xl">
            <Button
              onClick={() => setViewCardOnly(false)}
              variant="ghost"
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </Button>
            <VirtualCard
              username={username}
              storeUrl={storeUrl}
              frontColor={frontColor}
              backColor={backColor}
              textColor={textColor}
              accentColor={accentColor}
            />
          </div>
        </div>
      )}

      <div className="w-full mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-white">
            Virtual Card Generator
          </h1>
          <p className="text-sm sm:text-base text-white/90">
            Create your personalized Droplink card with QR code
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          {/* Card Preview */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-800">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
                <Palette className="w-5 h-5" />
                Card Preview
              </h2>
              {/* Sign-in helper if not authenticated */}
              {!isAuthenticated && (
                <div className="mb-4">
                  <UIButton
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                    size="sm"
                    onClick={() => signIn(['username'])}
                  >
                    Sign in with Pi to load your username
                  </UIButton>
                </div>
              )}
              <div ref={cardRef} className="print-area">
                <VirtualCard
                  username={username}
                  storeUrl={storeUrl}
                  frontColor={frontColor}
                  backColor={backColor}
                  textColor={textColor}
                  accentColor={accentColor}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6 no-print">
                <Button
                  onClick={() => setViewCardOnly(true)}
                  variant="outline"
                  className="w-full col-span-2"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Card Only
                </Button>
                <Button
                  onClick={generateShareableLink}
                  className="w-full sm:col-span-2 bg-sky-500 hover:bg-sky-600"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Get Link
                </Button>
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="w-full text-xs sm:text-sm"
                >
                  <Printer className="w-4 h-4 mr-1 sm:mr-2" />
                  Print
                </Button>
                <Button
                  onClick={handleDownloadPNG}
                  variant="outline"
                  className="w-full text-xs sm:text-sm"
                >
                  <Download className="w-4 h-4 mr-1 sm:mr-2" />
                  PNG
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  className="w-full sm:col-span-2 text-xs sm:text-sm"
                >
                  <Download className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span> PDF
                </Button>
              </div>
            </Card>

            {/* Pi Browser Notice */}
            {isPiBrowser && (
              <Alert className="no-print bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm">
                  <strong>Pi Browser Users:</strong> Downloads may be restricted. Use the "Generate Share Link" button to open in another browser!
                </AlertDescription>
              </Alert>
            )}

            {/* Share Link Card (Always visible if link generated) */}
            {shareableLink && (
              <Card className="p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-2 border-green-200 dark:border-green-800 no-print">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-slate-900">
                  <Link className="w-4 h-4" />
                  Download or Share Link
                </h3>
                <p className="text-xs text-slate-700 mb-2">
                  Open this link in any browser to download your card:<br />
                  <a href={shareableLink} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline break-all">{shareableLink}</a>
                </p>
                <div className="flex gap-2">
                  <Input
                    value={shareableLink}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    onClick={copyShareableLink}
                    size="sm"
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </Card>
            )}

            {/* Info Card */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 no-print">
              <h3 className="font-semibold mb-2 text-slate-900">💳 About Your Card</h3>
              <ul className="text-sm space-y-1 text-slate-800">
                <li>✓ Standard credit card size (85.6 × 53.98 mm)</li>
                <li>✓ QR code links to your public bio: @{username}</li>
                <li>✓ High-quality print ready</li>
                <li>✓ Front & back saved automatically</li>
                <li>✓ Back side mirrored for duplex printing</li>
                <li>✓ Download as PNG or PDF (2 pages)</li>
                <li>✓ Click card to see both sides</li>
                {isPiBrowser && (
                  <li className="text-amber-600 font-semibold">⚠️ Use share link for downloads</li>
                )}
              </ul>
            </Card>

            {/* Followers Stats Card */}
            {profileId && (
              <Card className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 border-2 border-pink-200 dark:border-pink-800 no-print">
                <h3 className="font-semibold mb-3 text-lg text-slate-900">👥 Your Followers</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                      {followerCount}
                    </p>
                    <p className="text-sm text-slate-700">
                      {followerCount === 1 ? 'follower' : 'followers'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-700 mb-2">
                      Share your public bio to gain followers
                    </p>
                    <Button
                      onClick={() => {
                        const bioUrl = storeUrl;
                        navigator.clipboard.writeText(bioUrl);
                        toast({
                          title: "Copied!",
                          description: "Public bio URL copied to clipboard",
                        });
                      }}
                      size="sm"
                      className="bg-pink-500 hover:bg-pink-600"
                    >
                      Copy Bio Link
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Printing Instructions */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800 no-print">
              <h3 className="font-semibold mb-2 text-slate-900">🖨️ Print Instructions</h3>
              <ul className="text-xs space-y-1 text-slate-800">
                <li><strong>PDF:</strong> 2 pages - Page 1 (Front), Page 2 (Back - mirrored)</li>
                <li><strong>PNG:</strong> Both sides side-by-side (back mirrored)</li>
                <li><strong>Duplex Printing:</strong> Select "Flip on Short Edge"</li>
                <li><strong>Paper:</strong> Use thick cardstock (300gsm)</li>
                <li><strong>Note:</strong> Back is auto-mirrored so text reads correctly when flipped</li>
              </ul>
            </Card>
          </div>

          {/* Customization Panel */}
          <div className="space-y-4 sm:space-y-6 no-print">
            {/* Pro Plan Notice */}
            {!hasProPlan && (
              <Alert className="bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800">
                <AlertCircle className="h-4 w-4 text-sky-600" />
                <AlertDescription className="text-xs sm:text-sm">
                  <strong>Customization Locked:</strong> Subscribe to the <strong>30 Pi Pro plan</strong> to customize card colors and themes. Default sky blue theme is active.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Color Customization */}
            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Colors</h2>
                <div className="flex gap-2">
                  {hasProPlan && (
                    <Button
                      onClick={saveCardColors}
                      variant="default"
                      size="sm"
                      className="bg-sky-500 hover:bg-sky-600 text-xs sm:text-sm"
                    >
                      Save
                    </Button>
                  )}
                  <Button
                    onClick={resetColors}
                    variant="ghost"
                    size="sm"
                    disabled={!hasProPlan}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="frontColor">Front Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="frontColor"
                      type="color"
                      value={frontColor}
                      onChange={(e) => hasProPlan && setFrontColor(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                      disabled={!hasProPlan}
                    />
                    <Input
                      type="text"
                      value={frontColor}
                      onChange={(e) => hasProPlan && setFrontColor(e.target.value)}
                      placeholder="#1a1a2e"
                      className="flex-1"
                      disabled={!hasProPlan}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="backColor">Back Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="backColor"
                      type="color"
                      value={backColor}
                      onChange={(e) => hasProPlan && setBackColor(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                      disabled={!hasProPlan}
                    />
                    <Input
                      type="text"
                      value={backColor}
                      onChange={(e) => hasProPlan && setBackColor(e.target.value)}
                      placeholder="#16213e"
                      className="flex-1"
                      disabled={!hasProPlan}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={textColor}
                      onChange={(e) => hasProPlan && setTextColor(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                      disabled={!hasProPlan}
                    />
                    <Input
                      type="text"
                      value={textColor}
                      onChange={(e) => hasProPlan && setTextColor(e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                      disabled={!hasProPlan}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accentColor">Accent Color (Droplink Logo)</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={accentColor}
                      onChange={(e) => hasProPlan && setAccentColor(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                      disabled={!hasProPlan}
                    />
                    <Input
                      type="text"
                      value={accentColor}
                      onChange={(e) => hasProPlan && setAccentColor(e.target.value)}
                      placeholder="#87ceeb"
                      className="flex-1"
                      disabled={!hasProPlan}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Preset Themes */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-slate-900">Preset Themes</h2>
              <div className="grid grid-cols-2 gap-3">
                {presets.map((preset) => (
                  <Button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    disabled={!hasProPlan}
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: preset.front }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <span className="text-sm font-medium">{preset.name}</span>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Card Details */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-slate-900">Card Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-600">Username:</span>
                  <span className="font-mono font-semibold text-slate-900">@{username}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-600">Store URL:</span>
                  <span className="font-mono text-xs truncate max-w-[200px] text-slate-900">
                    {storeUrl}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-600">Card Size:</span>
                  <span className="font-semibold text-slate-900">85.6 × 53.98 mm</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Network:</span>
                  <span className="font-semibold text-blue-700">Pi Network</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          @page {
            size: 85.6mm 53.98mm;
            margin: 0;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-area, .print-area * {
            visibility: visible;
          }
          
          .print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 85.6mm !important;
            height: 53.98mm !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            page-break-after: avoid;
            page-break-before: avoid;
            page-break-inside: avoid;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      </div>
    </div>
  );
}
