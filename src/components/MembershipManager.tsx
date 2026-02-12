import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MembershipTier } from '@/types/features';
import { Trash2, Plus } from 'lucide-react';

interface MembershipManagerProps {
  tiers: MembershipTier[];
  onSave: (tier: Partial<MembershipTier> & { profile_id: string }) => Promise<void>;
  onDelete: (tierId: string) => Promise<void>;
  profileId: string;
}

export const MembershipManager = ({ tiers, onSave, onDelete, profileId }: MembershipManagerProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MembershipTier>>({});

  const startEdit = (tier?: MembershipTier) => {
    setFormData(tier || { currency: 'pi', billing_period: 'monthly', perks: [], is_active: true });
    setEditingId(tier?.id || 'new');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) return;
    await onSave({ ...formData, profile_id: profileId } as any);
    setEditingId(null);
  };

  const addPerk = () => {
    setFormData({ ...formData, perks: [...(formData.perks || []), ''] });
  };

  const updatePerk = (idx: number, value: string) => {
    const perks = [...(formData.perks || [])];
    perks[idx] = value;
    setFormData({ ...formData, perks });
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => startEdit()} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Membership Tier
      </Button>

      {tiers.map(tier => (
        <Card key={tier.id} className="p-4">
          {editingId === tier.id ? (
            <div className="space-y-3">
              <div>
                <Label>Tier Name</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Supporter"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What members get"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Period</Label>
                  <select
                    value={formData.billing_period || 'monthly'}
                    onChange={(e) => setFormData({ ...formData, billing_period: e.target.value as any })}
                    className="w-full px-2 py-2 border rounded"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Perks</Label>
                <div className="space-y-2">
                  {formData.perks?.map((perk, i) => (
                    <Input
                      key={i}
                      value={perk}
                      onChange={(e) => updatePerk(i, e.target.value)}
                      placeholder="e.g., Early access"
                    />
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addPerk} className="mt-2">
                  + Add Perk
                </Button>
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
                <h4 className="font-semibold">{tier.name}</h4>
                <p className="text-sm text-slate-600">{tier.description}</p>
                <p className="text-lg font-bold text-sky-600 mt-2">
                  {tier.price} {tier.currency}/{tier.billing_period}
                </p>
                {tier.perks.length > 0 && (
                  <ul className="text-xs text-slate-500 mt-2 space-y-1">
                    {tier.perks.map((p, i) => <li key={i}>✓ {p}</li>)}
                  </ul>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(tier)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(tier.id)}
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
