import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Eye, Trash2, Edit2, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";

interface Product {
  id: string;
  title: string;
  price: string;
  description: string | null;
  file_url?: string | null;
}

const MerchantProductManager: React.FC = () => {
  const { piUser, isAuthenticated, signIn, loading: piLoading } = usePi();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ title: "", price: "", description: "", file_url: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  
  // Edit State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ title: "", price: "", description: "", file_url: "" });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handlePiAuth = async () => {
    try {
      await signIn(["username", "payments", "wallet_address"]);
    } catch (error) {
      console.error("Pi authentication failed:", error);
      toast.error("Failed to authenticate with Pi Network");
    }
  };

  useEffect(() => {
    const fetchProfileId = async () => {
      if (!piUser?.username) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", piUser.username)
        .maybeSingle();
        
      if (profile) setProfileId(profile.id);
    };
    fetchProfileId();
  }, [piUser]);

  useEffect(() => {
    if (profileId) {
      fetchProducts();
    }
  }, [profileId]);

  const fetchProducts = async () => {
    if (!profileId) return;
    
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from("products")
      .select("id, title, price, description, file_url")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });
      
    if (error) {
      setError(error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title,
      price: product.price,
      description: product.description || "",
      file_url: product.file_url || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    setLoading(true);
    
    const { error } = await supabase
      .from("products")
      .update({
        title: editForm.title,
        price: editForm.price,
        description: editForm.description,
        file_url: editForm.file_url
      })
      .eq("id", editingProduct.id);

    if (error) {
      toast.error("Failed to update product");
    } else {
      toast.success("Product updated successfully");
      setIsEditDialogOpen(false);
      fetchProducts();
    }
    setLoading(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) {
      toast.error("Please sign in first");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.from("products").insert({
      title: form.title,
      price: form.price,
      description: form.description,
      file_url: form.file_url,
      profile_id: profileId,
    });
    
    if (error) {
      setError(error.message);
      toast.error("Failed to add product");
    } else {
      toast.success("Product added successfully!");
      setForm({ title: "", price: "", description: "", file_url: "" });
      fetchProducts();
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    setLoading(true);
    const { error } = await supabase.from("products").delete().eq("id", productId);
    
    if (error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted successfully!");
      fetchProducts();
    }
    setLoading(false);
  };

  // Show authentication required if not authenticated
  if (!isAuthenticated || !piUser) {
    return (
      <div className="min-h-screen bg-sky-400 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-center text-slate-900">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-slate-600">
              Please sign in with Pi Network to access your product dashboard.
            </p>
            <Button 
              onClick={handlePiAuth} 
              disabled={piLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {piLoading ? "Connecting..." : "Sign in with Pi Network"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Product Manager" 
        description="Create and manage your digital products"
        icon={<TrendingUp />}
      />
      <div className="min-h-screen bg-sky-400 p-6 pb-24">
        <div className="w-full mx-auto flex flex-wrap gap-4 mb-6">
          <Link to="/sales-earnings">
            <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
              <TrendingUp size={18} />
              View Sales & Earnings
            </Button>
          </Link>
          {profileId && (
            <Link to={`/store/${profileId}`}>
              <Button className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
                <Eye size={18} />
                View Public Store
              </Button>
            </Link>
          )}
        </div>

        {/* Add Product Form */}
        <Card className="mb-8 bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">Add New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <Input
                type="text"
                name="title"
                placeholder="Product Title"
                value={form.title}
                onChange={handleChange}
                required
                className="bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500"
              />
              <Input
                type="text"
                name="price"
                placeholder="Price (in Pi)"
                value={form.price}
                onChange={handleChange}
                required
                className="bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500"
              />
              <Input
                type="text"
                name="file_url"
                placeholder="Download URL (e.g. Dropbox/Drive link)"
                value={form.file_url}
                onChange={handleChange}
                className="bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500"
              />
              <Textarea
                name="description"
                placeholder="Product Description"
                value={form.description}
                onChange={handleChange}
                className="bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500"
              />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Adding..." : "Add Product"}
              </Button>
            </form>
            {error && <div className="text-red-400 mt-2">{error}</div>}
          </CardContent>
        </Card>

        {/* Products Dashboard */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Products ({products.length})</h2>
            <div className="h-1 w-16 bg-blue-600 rounded"></div>
          </div>

          {loading && products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">No products added yet. Create your first product above!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="bg-white border-slate-200 hover:border-blue-400 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-slate-900 text-lg truncate">{product.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Price</p>
                      <p className="text-2xl font-bold text-blue-600">{product.price} π</p>
                    </div>
                    {product.description && (
                      <div>
                        <p className="text-slate-600 text-sm mb-1">Description</p>
                        <p className="text-slate-700 text-sm line-clamp-2">{product.description}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-4">
                      <Link to={`/product/${product.id}`} className="flex-1">
                        <Button className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2">
                          <Eye size={16} />
                          View
                        </Button>
                      </Link>
                      <Button 
                        className="flex-1 bg-slate-300 hover:bg-slate-400 flex items-center justify-center gap-2"
                        disabled={loading}
                        onClick={() => handleEditClick(product)}
                      >
                        <Edit2 size={16} />
                        Edit
                      </Button>
                      <Button 
                        className="flex-1 bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="price" className="text-sm font-medium">Price (Pi)</label>
              <Input
                id="price"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="file_url" className="text-sm font-medium">Download URL</label>
              <Input
                id="file_url"
                value={editForm.file_url}
                onChange={(e) => setEditForm({ ...editForm, file_url: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateProduct} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MerchantProductManager;
