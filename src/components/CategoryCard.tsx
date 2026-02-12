import { Link } from 'react-router-dom';
import { Category } from '@/types/app';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface CategoryPillProps {
  category: Category;
  isActive?: boolean;
}

export function CategoryPill({ category, isActive }: CategoryPillProps) {
  const iconName = category.icon || 'Grid3x3';
  const IconComponent = (Icons[iconName as keyof typeof Icons] as LucideIcon) || Icons.Grid3x3;

  return (
    <Link
      to={`/?category=${category.id}`}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
        isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      }`}
    >
      <IconComponent className="h-4 w-4" />
      <span>{category.name}</span>
    </Link>
  );
}

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  // Dynamic icon lookup
  const iconName = category.icon || 'Grid3x3';
  const IconComponent = (Icons[iconName as keyof typeof Icons] as LucideIcon) || Icons.Grid3x3;

  return (
    <Link
      to={`/?category=${category.id}`}
      className="group flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-sm transition-all hover:shadow-md hover:bg-secondary/50"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <IconComponent className="h-7 w-7" />
      </div>
      <span className="text-sm font-medium text-foreground">{category.name}</span>
    </Link>
  );
}
