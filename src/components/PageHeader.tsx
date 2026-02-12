import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  icon?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  showBackButton = true,
  icon,
}) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 bg-sky-400 border-b border-sky-500/30 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
      <div className="w-full mx-auto">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {icon && (
              <div className="text-white flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-white/80 truncate">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
