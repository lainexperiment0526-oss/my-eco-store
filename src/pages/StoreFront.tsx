
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { useStoreProfile } from "../hooks/useStoreProfile";
import StorefrontWalletQR from "../components/StorefrontWalletQR";
import StorefrontGiftButton from "../components/StorefrontGiftButton";
import { supabase } from "@/integrations/supabase/client";
import StoreCustomizer from "../components/StoreCustomizer";
import ProductCategoryManager from "../components/ProductCategoryManager";
import ThemeCustomizer from "../components/ThemeCustomizer";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";
import { Store } from "lucide-react";

const getStoreUrl = () => {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  const match = pathname.match(/\/storefront\/([^/]+)/);
  const storeId = match ? match[1] : "your-store-id";
  return `${origin}/storefront/${storeId}`;
};


// Demo MP4 background URL (replace with user input or store setting as needed)


const StoreFront: React.FC = () => {
  const [showPreview, setShowPreview] = useState(true);
  // Theme and video background state lifted here
  const [theme, setTheme] = useState({ background: "#f5f5f5", text: "#222222" });
  const [useVideoBg, setUseVideoBg] = useState(false);
  const [videoUrl, setVideoUrl] = useState("https://www.w3schools.com/html/mov_bbb.mp4");
  // Wallet QR and tip text state
  const [walletAddress, setWalletAddress] = useState("");
  const [tipText, setTipText] = useState("Tip Pi or DROP");

  // Share dialog state
  const [showShareDialog, setShowShareDialog] = useState(false);
  // Wallet QR dialog state
  const [showWalletQRDialog, setShowWalletQRDialog] = useState(false);
  
  // Products state for preview
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);

  // Get store username from URL
  let storeUsername = "";
  if (typeof window !== "undefined") {
    const match = window.location.pathname.match(/\/storefront\/([^/]+)/);
    storeUsername = match ? match[1] : "";
  }
  useStoreProfile(storeUsername, setWalletAddress, setTipText);

  // Fetch products for preview
  useEffect(() => {
    const fetchPreviewProducts = async () => {
      if (!storeUsername) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', storeUsername)
        .maybeSingle();
        
      if (profile) {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false });
          
        if (products) setPreviewProducts(products);
      }
    };
    fetchPreviewProducts();
  }, [storeUsername]);

  // Example: Send Supabase JWT to your backend
  const sendJwtToBackend = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      window.alert("No user session found.");
      return;
    }
    // Example POST to your backend
    const response = await fetch("/api/protected", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ message: "Hello from frontend!" })
    });
    const result = await response.json();
    window.alert("Backend response: " + JSON.stringify(result));
  };

  return (
    <>
      <PageHeader 
        title="StoreFront" 
        description="Manage your digital storefront"
        icon={<Store />}
      />
      <div className="min-h-screen relative" style={{ background: !useVideoBg ? theme.background : undefined }}>
      {/* MP4 Video Background */}
      {useVideoBg && videoUrl && (
        <video
          className="fixed inset-0 w-full h-full object-cover z-0"
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{ pointerEvents: 'none' }}
        />
      )}
      {/* Overlay for readability */}
      {useVideoBg && (
        <div className="fixed inset-0 bg-black/40 z-10 pointer-events-none" />
      )}
      {/* Header */}
      <header className="px-4 py-4 shadow-sm border-b border-border bg-background relative z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-sky-500">Store Dashboard</h1>
            <span className="text-xs text-muted-foreground">Your Storefront</span>
          </div>
          <div className="flex items-center gap-2">
            {/* MP4 background controls moved to ThemeCustomizer */}
            <input
              type="text"
              value={getStoreUrl()}
              readOnly
              className="border p-2 rounded bg-gray-100 text-xs w-64"
              onFocus={e => e.target.select()}
            />
            <button
              type="button"
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
              onClick={() => {
                navigator.clipboard.writeText(getStoreUrl());
                window.alert("Store URL copied!");
              }}
            >Copy</button>
            <button
              type="button"
              className="bg-green-600 text-white px-3 py-1 rounded text-xs"
              onClick={sendJwtToBackend}
            >Send JWT to Backend</button>
            <button
              className={`ml-2 px-4 py-2 rounded ${showPreview ? 'bg-gray-400' : 'bg-green-600 text-white'} text-xs`}
              onClick={() => setShowPreview(p => !p)}
            >{showPreview ? 'Hide Preview' : 'Show Preview'}</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] relative z-20">
        {/* Editor Panel */}
        <div className={`flex-1 overflow-y-auto p-4 lg:p-8 glass-card m-2 rounded-xl ${showPreview ? 'hidden lg:block' : 'block'}`}>
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Store Customization</h2>
              <StoreCustomizer />
            </div>
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Product Categories</h2>
              <ProductCategoryManager />
            </div>
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Theme & Appearance</h2>
              <ThemeCustomizer
                theme={theme}
                setTheme={setTheme}
                useVideoBg={useVideoBg}
                setUseVideoBg={setUseVideoBg}
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
              />
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className={`lg:w-[400px] xl:w-[500px] ${showPreview ? 'flex' : 'hidden lg:flex'} bg-background border-l border-border/30 p-6 lg:p-8 flex-col items-center`}>
          <div className="mb-4 flex items-center justify-between w-full">
            <h3 className="text-sm font-medium text-muted-foreground">Preview</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setShowWalletQRDialog(true)}
              >
                Pi Wallet QR
              </Button>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(getStoreUrl());
                  window.alert("Store URL copied!");
                }}
              >Copy link</button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setShowShareDialog(true)}
              >
                Share
              </Button>
            </div>
          </div>
          {/* Replace below with your actual store preview component */}
            <div className="w-full h-full flex flex-col items-center justify-center bg-white border rounded-xl shadow-inner min-h-[400px] p-4">
              {/* Wallet QR code and tip section (legacy inline, now in dialog) */}
              {/* <StorefrontWalletQR walletAddress={walletAddress} tipText={tipText} /> */}
              {/* TODO: Replace demo-profile-id with real profile id if needed */}
              <StorefrontGiftButton receiverProfileId={storeUsername} receiverName={storeUsername || "Store Owner"} />
              <div className="w-full max-w-xs mt-4 space-y-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Wallet Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 text-sm mb-2"
                    placeholder="Enter your Pi wallet address"
                    value={walletAddress}
                    onChange={e => setWalletAddress(e.target.value)}
                  />
                  {walletAddress && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-blue-300 h-8 mt-1"
                      onClick={() => setShowWalletQRDialog(true)}
                    >
                      View QR Code
                    </Button>
                  )}
                </div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tip Message (shown below QR)</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-sm"
                  placeholder="e.g. Buy me a coffee ☕ or Donate Pi"
                  value={tipText}
                  onChange={e => setTipText(e.target.value)}
                />
              </div>

              {/* Product Grid Preview */}
              <div className="w-full mt-6 max-w-sm overflow-y-auto max-h-[300px]">
                <h4 className="text-sm font-semibold mb-3 text-slate-800">Products</h4>
                {previewProducts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center italic">No products found</p>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {previewProducts.map(p => (
                            <div key={p.id} className="bg-slate-50 p-3 rounded border border-slate-100 flex flex-col gap-2">
                                <div className="aspect-square bg-slate-200 rounded flex items-center justify-center overflow-hidden">
                                    {p.image_url ? (
                                        <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-slate-400">No Img</span>
                                    )}
                                </div>
                                <div className="text-xs font-medium truncate text-slate-900">{p.title}</div>
                                <div className="text-xs text-blue-600 font-bold">{p.price} Pi</div>
                            </div>
                        ))}
                    </div>
                )}
              </div>

                            {/* Wallet QR Dialog */}
                            <Dialog open={showWalletQRDialog} onOpenChange={setShowWalletQRDialog}>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Pi Wallet QR Code</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col items-center space-y-4 py-4">
                                  <div className="bg-white p-4 rounded-lg relative w-[220px] h-[220px] flex items-center justify-center">
                                    <QRCodeSVG
                                      id="wallet-qr-svg"
                                      value={walletAddress || ' '}
                                      size={180}
                                      level="H"
                                      includeMargin={true}
                                    />
                                    <img
                                      src="/droplink-logo.png"
                                      alt="Droplink Logo"
                                      className="absolute left-1/2 top-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 shadow-lg border-2 border-white bg-white rounded-lg"
                                      style={{ pointerEvents: 'none' }}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-800 text-center break-all mb-1">{walletAddress}</div>
                                  <div className="text-xs text-blue-600 text-center">{tipText || 'Tip Pi or DROP'}</div>
                                </div>
                              </DialogContent>
                            </Dialog>
              {/* Share Dialog for Store Link with QR and logo */}
              <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Share Your Store</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center space-y-4 py-4">
                    <div className="bg-white p-4 rounded-lg relative w-[272px] h-[272px] flex items-center justify-center">
                      <QRCodeSVG
                        id="store-link-qr-svg"
                        value={getStoreUrl()}
                        size={256}
                        level="H"
                        includeMargin={true}
                        fgColor="#222"
                        bgColor="#fff"
                      />
                      <img
                        src="https://i.ibb.co/1fdJky1d/Gemini-Generated-Image-ar8t52ar8t52ar8t.png"
                        alt="Droplink Logo"
                        className="absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 z-10 shadow-lg border-2 border-white bg-white rounded-lg"
                        style={{ pointerEvents: 'none' }}
                      />
                    </div>
                    <p className="text-base font-semibold text-center text-gray-900" style={{wordBreak:'break-word'}}>
                      {getStoreUrl()}
                    </p>
                    <p className="text-sm text-blue-700 text-center font-medium">
                      Scan this QR code to visit your store
                    </p>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(getStoreUrl());
                        window.alert("Store URL copied!");
                      }}
                      className="w-full gap-2"
                    >
                      Copy Store Link
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default StoreFront;
