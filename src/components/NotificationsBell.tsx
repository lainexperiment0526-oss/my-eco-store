import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { usePi } from "@/contexts/PiContext";

export const NotificationsBell: React.FC<{ profileId?: string | null }> = ({ profileId }) => {
  const { piUser } = usePi();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const { items, unread, markAllRead, clear } = useNotifications({
    username: (piUser as any)?.username,
    profileId,
    enableToasts: true,
  });

  useEffect(() => {
    // mark unread when opening the page for a while
    const t = setTimeout(() => markAllRead(), 30000);
    return () => clearTimeout(t);
  }, [markAllRead]);

  // Don't render if no user or if we don't have a concrete profileId yet
  if (!piUser || !profileId) return null;

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm"
        className="text-xs"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unread > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px]">{unread}</span>
        )}
      </Button>
      
      {/* Dropdown */}
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <Card className="absolute right-0 top-full mt-2 p-3 w-80 max-w-[90vw] z-20 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Notifications</div>
              <div className="flex gap-1">
                {unread > 0 && (
                  <Button size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={markAllRead}>
                    Mark read
                  </Button>
                )}
                {items.length > 0 && (
                  <Button size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={clear}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1 max-h-64 overflow-auto">
              {items.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">No notifications yet</div>
              ) : (
                items.slice(0, 15).map((n, idx) => (
                  <div key={idx} className="text-xs p-2 rounded bg-sky-50 hover:bg-sky-100">
                    <div className="font-medium">{n.title}</div>
                    {n.description && <div className="text-gray-600 line-clamp-2">{n.description}</div>}
                    <div className="text-[10px] text-gray-500 mt-1">{new Date(n.created_at).toLocaleTimeString()}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
