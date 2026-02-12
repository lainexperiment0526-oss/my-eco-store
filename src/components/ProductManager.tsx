import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Product } from '@/types/features';
import { Trash2, Plus } from 'lucide-react';

interface ProductManagerProps {
  products: Product[];
  onSave: (product: Partial<Product> & { profile_id: string }) => Promise<void>;
  onDelete: (productId: string) => Promise<void>;
  profileId: string;
}

export const ProductManager = ({ products, onSave, onDelete, profileId }: ProductManagerProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});

  const startEdit = (product?: Product) => {
    setFormData(product || { type: 'digital', currency: 'pi', status: 'active' });
    setEditingId(product?.id || 'new');
  };

  const handleSave = async () => {
    if (!formData.title || !formData.price) {
      return;
    }
    await onSave({ ...formData, profile_id: profileId } as any);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => startEdit()} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Product
      </Button>

      {products.map(p => (
        <Card key={p.id} className="p-4">
          {editingId === p.id ? (
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Product title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <select
                    value={formData.type || 'digital'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-2 py-2 border rounded"
                  >
                    <option value="digital">Digital</option>
                    <option value="tip">Tip</option>
                    <option value="one_time">One-time</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>File URL (optional)</Label>
                <Input
                  value={formData.file_url || ''}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 bg-sky-500">
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{p.title}</h4>
                <p className="text-sm text-slate-600">{p.description}</p>
                <p className="text-lg font-bold text-sky-600 mt-2">{p.price} {p.currency}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(p)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(p.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
