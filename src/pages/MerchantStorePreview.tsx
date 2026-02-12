import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";
import type { ProductItem, CartItem, Order } from "@/types/profile";
import { createDroppayPaymentViaApi } from "@/lib/droppay";
import { toast } from "sonner";

const MerchantStorePreview: React.FC = () => {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState({
    name: "",
    location: "",
    theme: "",
    contact: "",
    textColor: "#222",
    backgroundColor: "#f5f5dc",
    products: [] as ProductItem[],
  });
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    
    const fetchStore = async () => {
      // Fetch profile info
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, theme_settings")
        .eq("id", merchantId)
        .maybeSingle();
        
      // Fetch products using the correct table
      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("id, title, price, description, image_url, file_url")
        .eq("profile_id", merchantId)
        .order("created_at", { ascending: false });
        
      if (profileError) setError(profileError.message);
      if (prodError) setError(prodError.message);
      
      let textColor = "#222";
      let backgroundColor = "#f5f5dc";
      let storeName = "Merchant Store";
      
      if (profile && typeof profile === "object") {
        if (profile.theme_settings) {
          try {
            const theme = typeof profile.theme_settings === "string" 
              ? JSON.parse(profile.theme_settings) 
              : profile.theme_settings;
            textColor = theme?.textColor || textColor;
            backgroundColor = theme?.backgroundColor || backgroundColor;
          } catch {}
        }
        storeName = profile.username || storeName;
        setUsername(profile.username || null);
      }
      
      setStore({
        name: storeName,
        location: "",
        theme: "",
        contact: "",
        textColor,
        backgroundColor,
        products: (products || []).map((p) => ({
          id: p.id,
          name: p.title,
          price: parseFloat(p.price) || 0,
          description: p.description || "",
          image: p.image_url || undefined,
          file_url: p.file_url || undefined,
        })),
      });
      setLoading(false);
    };
    
    fetchStore();
  }, [merchantId]);

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    setCart((prev) => prev.map((item) => item.id === id ? { ...item, cartQuantity: qty } : item));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessingPayment(true);
    
    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
      
      // Prepare metadata with all purchased items
      const itemsMetadata = cart.map(item => ({
        id: item.id,
        title: item.name,
        price: item.price,
        quantity: item.cartQuantity,
        file_url: item.file_url
      }));

      const resp = await createDroppayPaymentViaApi({
        amount: total,
        currency: 'PI',
        description: `Order from ${store.name}`,
        metadata: {
          profile_id: merchantId,
          payment_type: 'cart_purchase',
          items: itemsMetadata,
          cart_count: cart.length
        },
      });

      if (!resp.success) {
        toast.error(resp.error || 'Payment initialization failed');
        setProcessingPayment(false);
        return;
      }

      const p = resp.payment;
      const url = p?.checkout_url || p?.url || p?.payment_url || p?.payment?.checkout_url;
      
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Missing checkout URL in response');
        setProcessingPayment(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to process checkout');
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-sky-400 flex items-center justify-center">Loading store...</div>;
  }
  
  if (error) {
    return <div className="min-h-screen bg-sky-400 flex items-center justify-center text-destructive">{error}</div>;
  }
  
  return (
    <>
      <PageHeader 
        title="Store Preview" 
        description="View merchant storefront"
        icon={<Store />}
      />
      <div
        className="min-h-screen flex flex-col items-center justify-start p-4 md:p-8 pb-24"
        style={{ background: store.backgroundColor, color: store.textColor }}
      >
      <div className="w-full max-w-full bg-white/80 rounded-xl shadow-lg p-6 mb-8">
        {username && (
          <div className="flex justify-end mb-4">
            <Button onClick={() => navigate(`/u/${username}`)}>
              View Bio
            </Button>
          </div>
        )}
        <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <ul className="space-y-4">
            {store.products.map((product) => (
              <li key={product.id} className="border rounded-lg p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                {product.image && (
                  <img src={product.image} alt={product.name} className="w-full sm:w-24 h-40 sm:h-24 object-cover rounded" />
                )}
                <div className="flex-1">
                  <span className="font-bold text-lg block mb-1">{product.name}</span>
                  <span className="block mb-1">Price: {product.price} Pi</span>
                  <span className="block text-sm text-muted-foreground">{product.description}</span>
                </div>
                <Button onClick={() => addToCart(product)}>
                  Add to Cart
                </Button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={() => setShowCart((v) => !v)}>
            {showCart ? "Hide Cart" : `View Cart (${cart.reduce((sum, i) => sum + i.cartQuantity, 0)})`}
          </Button>
        </div>
        
        {showCart && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">Your Cart</h3>
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground">Cart is empty.</p>
            ) : (
              <>
                <ul className="space-y-3">
                  {cart.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 pb-2 border-b">
                      <span className="flex-1">{item.name}</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={item.cartQuantity}
                        onChange={e => updateQuantity(item.id, Number(e.target.value))}
                        className="w-16 border rounded px-2 py-1"
                      />
                      <span className="w-20 text-right">{item.price * item.cartQuantity} Pi</span>
                      <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{cart.reduce((sum, i) => sum + i.price * i.cartQuantity, 0)} Pi</span>
                </div>
                <Button className="w-full mt-4" onClick={handleCheckout} disabled={processingPayment}>
                  {processingPayment ? "Initializing..." : "Checkout & Pay"}
                </Button>
              </>
            )}
          </div>
        )}
        
        {order && (
          <div className="mt-6 p-4 border rounded-lg bg-green-50">
            <h3 className="font-semibold mb-2">Order Placed!</h3>
            <p>Order ID: {order.id}</p>
            <p>Status: {order.status}</p>
            <p>Total: {order.total} Pi</p>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default MerchantStorePreview;
