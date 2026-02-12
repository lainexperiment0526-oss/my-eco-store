import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  Bot, 
  BarChart3, 
  Settings, 
  Plus,
  Zap,
  Star,
  Eye,
  Download,
  QrCode,
  MessageCircle,
  Palette,
  Globe,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinkShortener } from './LinkShortener';
import { AIChatSupport } from './AIChatSupport';
import { toast } from 'sonner';

interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  uniqueVisitors: number;
  activeChats: number;
  chatSatisfaction: number;
  topLinks: Array<{
    title: string;
    shortCode: string;
    clicks: number;
    displayStyle: string;
  }>;
  recentActivity: Array<{
    date: string;
    clicks: number;
  }>;
}

interface EnhancedDashboardProps {
  profileId?: string;
  username?: string;
  hasPremium?: boolean;
}

export const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  profileId,
  username,
  hasPremium = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalLinks: 0,
    totalClicks: 0,
    uniqueVisitors: 0,
    activeChats: 0,
    chatSatisfaction: 0,
    topLinks: [],
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch dashboard stats
  const fetchStats = async () => {
    if (!profileId) return;

    setIsLoading(true);
    try {
      // Fetch link analytics
      const response = await fetch(`/api/link-shortener?action=analytics&profile_id=${profileId}&days=30`);
      const linkData = await response.json();

      if (linkData.success) {
        setStats(prev => ({
          ...prev,
          totalLinks: linkData.data?.total_links || 0,
          totalClicks: linkData.data?.total_clicks || 0,
          uniqueVisitors: linkData.data?.total_unique_visitors || 0,
          topLinks: linkData.data?.top_links || [],
          recentActivity: linkData.data?.recent_activity || []
        }));
      }

      // Fetch chat analytics (if premium)
      if (hasPremium) {
        const chatResponse = await fetch(`/api/ai-chat-support?action=analytics&profile_id=${profileId}`);
        const chatData = await chatResponse.json();

        if (chatData.success) {
          setStats(prev => ({
            ...prev,
            activeChats: chatData.data?.active_conversations || 0,
            chatSatisfaction: chatData.data?.average_satisfaction || 0
          }));
        }
      }

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [profileId]);

  // Format number for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Get display style icon
  const getDisplayStyleIcon = (style: string) => {
    switch (style) {
      case 'featured': return <Star className="w-3 h-3 text-yellow-500" />;
      case 'animated': return <Zap className="w-3 h-3 text-blue-500" />;
      default: return <Link2 className="w-3 h-3 text-gray-500" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enhanced Dashboard</h1>
          <p className="text-muted-foreground">
            Link shortening & AI chat analytics for {username || 'your profile'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchStats} variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {!hasPremium && (
            <Button size="sm">
              <Star className="w-4 h-4 mr-2" />
              Upgrade for More
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="links">Link Manager</TabsTrigger>
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Link2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Links</p>
                    <p className="text-2xl font-bold">{formatNumber(stats.totalLinks)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                    <p className="text-2xl font-bold">{formatNumber(stats.totalClicks)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Visitors</p>
                    <p className="text-2xl font-bold">{formatNumber(stats.uniqueVisitors)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {hasPremium ? 'Active Chats' : 'Chat (Premium)'}
                    </p>
                    <p className="text-2xl font-bold">
                      {hasPremium ? formatNumber(stats.activeChats) : '✨'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top Performing Links
              </CardTitle>
              <CardDescription>Your most clicked links this month</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topLinks.length > 0 ? (
                <div className="space-y-3">
                  {stats.topLinks.slice(0, 5).map((link, index) => (
                    <div key={link.shortCode} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          {getDisplayStyleIcon(link.displayStyle)}
                          <div>
                            <p className="font-medium">{link.title}</p>
                            <p className="text-sm text-muted-foreground">drop.link/{link.shortCode}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatNumber(link.clicks)}</p>
                        <p className="text-sm text-muted-foreground">clicks</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No links created yet</p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setActiveTab('links')}
                  >
                    Create Your First Link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Rapidly access common features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => setActiveTab('links')}
                >
                  <Plus className="w-5 h-5" />
                  Create Short Link
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => setActiveTab('chat')}
                >
                  <Bot className="w-5 h-5" />
                  Customize AI Chat
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => setActiveTab('analytics')}
                >
                  <BarChart3 className="w-5 h-5" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Link Manager Tab */}
        <TabsContent value="links">
          <LinkShortener 
            profileId={profileId}
            onLinksUpdate={(links) => {
              // Update stats when links change
              fetchStats();
            }}
          />
        </TabsContent>

        {/* AI Chat Tab */}
        <TabsContent value="chat">
          {hasPremium ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    AI Chat Assistant
                  </CardTitle>
                  <CardDescription>
                    Customize your AI chat support for visitors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AIChatSupport 
                    profileId={profileId}
                    onDesignUpdate={(design) => {
                      toast.success('Chat design updated!');
                      fetchStats();
                    }}
                  />
                </CardContent>
              </Card>
              
              {stats.chatSatisfaction > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Chat Satisfaction</p>
                        <p className="text-2xl font-bold">{stats.chatSatisfaction.toFixed(1)}/5.0</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI Chat Support</h3>
                <p className="text-muted-foreground mb-6">
                  Provide instant, intelligent support to your visitors with customizable AI chat
                </p>
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="flex items-center gap-3 text-sm">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>Instant 24/7 customer support</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Palette className="w-4 h-4 text-blue-500" />
                    <span>Fully customizable design</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <BarChart3 className="w-4 h-4 text-green-500" />
                    <span>Detailed conversation analytics</span>
                  </div>
                </div>
                <Button className="mt-6">
                  <Star className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Advanced Analytics
              </CardTitle>
              <CardDescription>
                Detailed insights into your link performance and visitor engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Click Activity (Last 30 Days)</h4>
                    <div className="space-y-2">
                      {stats.recentActivity.map((day, index) => (
                        <div key={day.date} className="flex items-center justify-between p-2 rounded border">
                          <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                          <Badge variant="secondary">{day.clicks} clicks</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {hasPremium && (
                    <div>
                      <h4 className="font-semibold mb-3">Premium Analytics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium mb-2">Geographic Data</h5>
                          <p className="text-sm text-muted-foreground">Coming soon...</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium mb-2">Device Breakdown</h5>
                          <p className="text-sm text-muted-foreground">Coming soon...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No analytics data available yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create some links to start seeing analytics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Link Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Default Link Style</p>
                    <p className="text-sm text-muted-foreground">Choose default display style for new links</p>
                  </div>
                  <Badge>Classic</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-generate QR Codes</p>
                    <p className="text-sm text-muted-foreground">Automatically create QR codes for all links</p>
                  </div>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Link Analytics</p>
                    <p className="text-sm text-muted-foreground">Track clicks and visitor data</p>
                  </div>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Chat Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasPremium ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">AI Chat Status</p>
                        <p className="text-sm text-muted-foreground">Enable AI chat for visitors</p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-responses</p>
                        <p className="text-sm text-muted-foreground">Intelligent automatic responses</p>
                      </div>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Chat Analytics</p>
                        <p className="text-sm text-muted-foreground">Track conversation metrics</p>
                      </div>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Chat settings available with Premium</p>
                    <Button size="sm">Upgrade Now</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};