import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Image as ImageIcon, ExternalLink } from "lucide-react";
import type { ImageLinkCard } from "@/types/profile";

interface ImageLinkCardManagerProps {
  cards: ImageLinkCard[];
  onChange: (cards: ImageLinkCard[]) => void;
}

export function ImageLinkCardManager({ cards, onChange }: ImageLinkCardManagerProps) {
  const [editingCard, setEditingCard] = useState<ImageLinkCard | null>(null);

  const addNewCard = () => {
    const newCard: ImageLinkCard = {
      id: `card-${Date.now()}`,
      imageUrl: "",
      linkUrl: "",
      title: ""
    };
    setEditingCard(newCard);
  };

  const saveCard = () => {
    if (!editingCard) return;
    
    const existingIndex = cards.findIndex(c => c.id === editingCard.id);
    if (existingIndex >= 0) {
      const updated = [...cards];
      updated[existingIndex] = editingCard;
      onChange(updated);
    } else {
      onChange([...cards, editingCard]);
    }
    setEditingCard(null);
  };

  const removeCard = (id: string) => {
    onChange(cards.filter(c => c.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingCard) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingCard({ ...editingCard, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Image Link Cards
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Add clickable image cards with links (e.g., Patreon, OnlyFans, etc.)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Cards */}
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
            >
              {card.imageUrl && (
                <img
                  src={card.imageUrl}
                  alt={card.title}
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{card.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground truncate">{card.linkUrl}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCard(card)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCard(card.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Card Button */}
        {!editingCard && (
          <Button onClick={addNewCard} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Image Link Card
          </Button>
        )}

        {/* Card Editor */}
        {editingCard && (
          <div className="space-y-4 p-4 border rounded-lg bg-background">
            <div>
              <Label>Card Title</Label>
              <Input
                placeholder="e.g., Patreon (VIP)"
                value={editingCard.title}
                onChange={(e) =>
                  setEditingCard({ ...editingCard, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Link URL</Label>
              <div className="flex gap-2">
                <ExternalLink className="w-4 h-4 mt-2.5 text-muted-foreground" />
                <Input
                  placeholder="https://patreon.com/..."
                  value={editingCard.linkUrl}
                  onChange={(e) =>
                    setEditingCard({ ...editingCard, linkUrl: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Card Image</Label>
              <div className="space-y-2">
                {editingCard.imageUrl && (
                  <img
                    src={editingCard.imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveCard} className="flex-1">
                Save Card
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingCard(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
