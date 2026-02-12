/**
 * Public Bio Products Component
 * Professional product showcase grid
 */

import { ShoppingBag, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: string;
  image?: string;
  fileUrl?: string;
}

interface PublicBioProductsProps {
  products: Product[];
  theme: {
    primaryColor: string;
    iconStyle: string;
  };
  onProductClick?: (productId: string, title: string) => void;
}

export const PublicBioProducts = ({ products, theme, onProductClick }: PublicBioProductsProps) => {
  if (!products || products.length === 0) return null;

  const getIconStyle = (style: string) => {
    switch (style) {
      case "rounded": return "rounded-2xl";
      case "square": return "rounded-lg";
      case "circle": return "rounded-3xl";
      default: return "rounded-2xl";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <ShoppingBag className="w-5 h-5" style={{ color: theme.primaryColor }} />
        <h2 className="text-xl font-bold text-white">Digital Products</h2>
      </div>

      {/* Products Grid */}
      <div className={cn(
        "grid gap-4",
        products.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
      )}>
        {products.map((product, index) => (
          <div
            key={product.id}
            className={cn(
              "group relative overflow-hidden transition-all duration-300",
              "hover:shadow-2xl hover:scale-[1.02]",
              "bg-white/5 backdrop-blur-sm border border-white/10",
              getIconStyle(theme.iconStyle)
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Product Image */}
            {product.image && (
              <div className="relative h-40 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}

            {/* Product Details */}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white line-clamp-2">
                    {product.title}
                  </h3>
                  {product.description && (
                    <p className="text-white/60 text-sm mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
                
                {/* Price Badge */}
                <div 
                  className="px-3 py-1.5 rounded-full font-bold text-white text-sm shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {product.price}
                </div>
              </div>

              {/* Purchase Button */}
              {product.fileUrl && (
                <a
                  href={product.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onProductClick?.(product.id, product.title)}
                  className={cn(
                    "flex items-center justify-center gap-2 w-full py-3 px-4 font-medium text-white transition-all",
                    "hover:shadow-lg active:scale-[0.98]",
                    getIconStyle(theme.iconStyle)
                  )}
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <span>Purchase</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
