import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePi } from "@/contexts/PiContext";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";

export default function CreateDropProduct() {
  const { piUser } = usePi();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("10");
  const [productLink, setProductLink] = useState("");
  const [creating, setCreating] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!piUser?.username) {
      toast.error("Please sign in with Pi Network first");
      return;
    }
    
    setCreating(true);
    
    try {
      // Get profile ID for current user
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', piUser.username)
        .maybeSingle();
      
      if (!profile) {
        toast.error("Profile not found");
        setCreating(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          profile_id: profile.id,
          title,
          description,
          price,
          file_url: productLink,
        })
        .select()
        .single();
        
      if (error) {
        toast.error('Error creating product: ' + error.message);
        setCreating(false);
        return;
      }
      
      setPublicUrl(`/pay/${data.id}`);
      toast.success("Product created successfully!");
    } catch (error) {
      console.error("Create product error:", error);
      toast.error("Failed to create product");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-400">
      <PageHeader 
        title="Create Product" 
        description="Create a new DropPay product"
        icon={<Package />}
      />
      <div className="max-w-xl mx-auto py-8 px-3 sm:px-4 md:px-6 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Create a Product (DropPay)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Product Title" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
          <Input type="text" placeholder="Price (Pi)" value={price} onChange={e => setPrice(e.target.value)} />
          <Input placeholder="Product Link (download or delivery)" value={productLink} onChange={e => setProductLink(e.target.value)} />
          <Button className="w-full" onClick={handleCreate} disabled={creating || !title || !price}>
            {creating ? "Creating..." : "Create Product & Get Link"}
          </Button>
          {publicUrl && (
            <div className="mt-4 text-center">
              <div className="font-medium">Public Product Link:</div>
              <a href={publicUrl} className="text-primary underline" target="_blank" rel="noopener noreferrer">{window.location.origin + publicUrl}</a>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
