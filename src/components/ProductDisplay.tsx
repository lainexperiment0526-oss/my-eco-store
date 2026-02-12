import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShoppingCart, Download } from 'lucide-react';
import { Product } from '@/types/features';

interface ProductDisplayProps {
  product: Product;
  onPurchase: (productId: string, walletOrEmail: string) => Promise<void>;
}

export const ProductDisplay = ({ product, onPurchase }: ProductDisplayProps) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [email, setEmail] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    try {
      setPurchasing(true);
      await onPurchase(product.id, email);
      toast.success('Purchase complete! Check your email.');
      setEmail('');
      setShowCheckout(false);
    } catch (error) {
      toast.error('Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
            {product.title}
          </h3>
          {product.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {product.description}
            </p>
          )}
          <p className="text-xl font-bold text-sky-600 mt-3">
            {product.price} {product.currency}
          </p>
        </div>
        <ShoppingCart className="w-6 h-6 text-sky-500 flex-shrink-0" />
      </div>

      {!showCheckout ? (
        <Button
          onClick={() => setShowCheckout(true)}
          className="w-full mt-4 bg-sky-500 hover:bg-sky-600 text-white"
        >
          {product.type === 'tip' ? '💝 Send Tip' : '🛒 Buy Now'}
        </Button>
      ) : (
        <div className="mt-4 space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={purchasing}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCheckout(false)}
              disabled={purchasing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={purchasing}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
            >
              {purchasing ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
