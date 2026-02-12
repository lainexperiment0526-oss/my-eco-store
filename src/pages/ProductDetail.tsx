import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PurchaseButton } from "@/components/PurchaseButton";
import { toast } from "sonner";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";

interface Product {
  id: string;
  title: string;
  price: string;
  description: string | null;
  image_url: string | null;
  file_url?: string | null;
  download_url?: string | null;
  profile_id: string;
  created_at: string;
}

interface Owner {
  username: string;
  business_name: string | null;
}

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { piUser } = usePi();
  const [product, setProduct] = useState<Product | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!productId) {
        setError("Product ID is missing");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Fetch product
      const { data: prod, error: prodError } = await supabase
        .from("products")
        .select("id, title, price, description, image_url, file_url, profile_id, created_at")
        .eq("id", productId)
        .maybeSingle();

      if (prodError || !prod) {
        setError("Product not found");
        setLoading(false);
        return;
      }

      // Fetch owner profile
      const { data: ownerData, error: ownerError } = await supabase
        .from("profiles")
        .select("username, business_name")
        .eq("id", (prod as any).profile_id)
        .maybeSingle();

      if (ownerError) {
        console.error("Error fetching owner:", ownerError);
      }

      // Get current user profile ID if signed in
      if (piUser?.username) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", piUser.username)
          .maybeSingle();
        if (userProfile) setProfileId(userProfile.id);
      }

      setProduct(prod as unknown as Product);
      setOwner(ownerData as Owner | null);
      setLoading(false);
    };

    fetch();
  }, [productId, piUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500 font-semibold">{error || "Product not found"}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const price = parseFloat(product.price || "0");

  return (
    <>
      <PageHeader 
        title="Product Details" 
        description="View product information"
        icon={<ShoppingBag />}
      />
      <div className="min-h-screen bg-sky-400 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 pb-24">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-auto rounded-lg object-cover shadow-lg"
            />
          ) : (
            <div className="w-full aspect-square bg-slate-200 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">No image</p>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            {owner && (
              <p className="text-sm text-muted-foreground mb-2">
                Sold by <span className="font-medium">{owner.business_name || owner.username}</span>
              </p>
            )}
            <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-primary">{price}</span>
              <span className="text-2xl text-muted-foreground">Pi</span>
            </div>
          </div>

          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle>About This Product</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Purchase Section */}
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Ready to Purchase?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!piUser ? (
                <p className="text-sm text-muted-foreground mb-4">Sign in with Pi Network to purchase this product.</p>
              ) : !profileId ? (
                <p className="text-sm text-muted-foreground mb-4">Loading your profile...</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    After payment, you'll immediately get access to download this digital product.
                  </p>
                  <PurchaseButton
                    amount={price}
                    productId={product.id}
                    profileId={profileId}
                    productTitle={product.title}
                    downloadUrl={product.file_url || product.download_url || undefined}
                    description={product.description || `Purchase: ${product.title}`}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Meta Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Product ID: {product.id}</p>
            <p>Created: {new Date(product.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
