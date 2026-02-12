import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Bell,
  Heart,
  MessageCircle,
  ShoppingCart,
  Users,
  Trash2,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsCenterProps {
  profileId: string;
  userEmail: string;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  profileId,
  userEmail,
}) => {
  const { notifications, isLoading, markAsRead, refreshNotifications } =
    usePushNotifications(profileId, userEmail);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <Users className="w-4 h-4" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4" />;
      case 'like':
        return <Heart className="w-4 h-4" />;
      case 'sale':
        return <ShoppingCart className="w-4 h-4" />;
      case 'tip':
        return <Heart className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    toast.success('Notification marked as read');
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    for (const id of unreadIds) {
      await markAsRead(id);
    }
    toast.success('All notifications marked as read');
  };

  return (
    <div className="space-y-4">
      {/* Header with Badge */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                    : 'You are all caught up!'}
                </CardDescription>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
          size="sm"
        >
          Unread ({unreadCount})
        </Button>
        <Button
          onClick={() => refreshNotifications(profileId)}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <ScrollArea className="h-[600px]">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {filter === 'unread'
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Stay tuned for updates about your profile activity
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-muted/30' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4
                          className={`text-sm ${
                            !notification.read ? 'font-semibold' : 'font-medium'
                          } truncate`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          onClick={() => handleMarkAsRead(notification.id)}
                          variant="ghost"
                          size="sm"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete notification"
                        disabled
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Load More / Info */}
      <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground text-center">
        Showing {filteredNotifications.length} of {notifications.length} notifications
      </div>
    </div>
  );
};

export default NotificationsCenter;
