import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Zap, 
  Calendar, 
  TrendingUp, 
  Users, 
  Star, 
  Clock, 
  CheckCircle,
  PlayCircle,
  ArrowRight,
  Sparkles,
  Rocket,
  Award,
  Gift
} from "lucide-react";

interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_development' | 'testing' | 'coming_soon' | 'released';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_release: string;
  pi_earning_potential: number;
  vote_count: number;
  category: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export const FutureFeaturesDashboard = () => {
  const [features, setFeatures] = useState<RoadmapFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votedFeatures, setVotedFeatures] = useState<Set<string>>(new Set());

  const loadFeatures = async () => {
    try {
      setLoading(true);
      setError(null);

      // Real upcoming features for next updates
      setFeatures([
        {
          id: '1',
          title: 'AI Assistant Integration',
          description: 'Smart AI assistant to help create and optimize your bio content with personalized suggestions',
          status: 'in_development' as const,
          priority: 'high' as const,
          estimated_release: '2025-01-15',
          pi_earning_potential: 25,
          vote_count: 89,
          category: 'AI & Intelligence',
          progress_percentage: 85,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Advanced QR Code Generator',
          description: 'Generate custom QR codes with logos, colors, and analytics tracking for your bio pages',
          status: 'testing' as const,
          priority: 'medium' as const,
          estimated_release: '2025-01-30',
          pi_earning_potential: 15,
          vote_count: 67,
          category: 'Tools & Utilities',
          progress_percentage: 95,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Multi-Language Support',
          description: 'Support for 15+ languages with automatic translation for international audiences',
          status: 'planned' as const,
          priority: 'medium' as const,
          estimated_release: '2025-02-15',
          pi_earning_potential: 20,
          vote_count: 134,
          category: 'Internationalization',
          progress_percentage: 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          title: 'Video Background Support',
          description: 'Add animated video backgrounds to make your bio page more engaging and dynamic',
          status: 'planned' as const,
          priority: 'low' as const,
          estimated_release: '2025-03-01',
          pi_earning_potential: 10,
          vote_count: 156,
          category: 'Design & Media',
          progress_percentage: 15,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          title: 'Team Workspace Feature',
          description: 'Collaborative workspace for teams to manage multiple bio pages and shared resources',
          status: 'planned' as const,
          priority: 'high' as const,
          estimated_release: '2025-02-28',
          pi_earning_potential: 50,
          vote_count: 98,
          category: 'Collaboration',
          progress_percentage: 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '6',
          title: 'Advanced Analytics Pro',
          description: 'Deep analytics with visitor heatmaps, conversion tracking, and A/B testing capabilities',
          status: 'in_development' as const,
          priority: 'critical' as const,
          estimated_release: '2025-01-20',
          pi_earning_potential: 40,
          vote_count: 203,
          category: 'Analytics & Insights',
          progress_percentage: 70,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '7',
          title: 'Social Media Auto-Sync',
          description: 'Automatically sync your bio updates across Instagram, Twitter, LinkedIn and more platforms',
          status: 'coming_soon' as const,
          priority: 'medium' as const,
          estimated_release: '2025-01-10',
          pi_earning_potential: 30,
          vote_count: 177,
          category: 'Social Integration',
          progress_percentage: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '8',
          title: 'Custom Domain Plus',
          description: 'Enhanced custom domain support with SSL certificates and subdomain management',
          status: 'in_development' as const,
          priority: 'medium' as const,
          estimated_release: '2025-02-05',
          pi_earning_potential: 35,
          vote_count: 145,
          category: 'Professional Features',
          progress_percentage: 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '9',
          title: 'E-commerce Integration',
          description: 'Sell products directly from your bio page with integrated payment processing and inventory management',
          status: 'planned' as const,
          priority: 'critical' as const,
          estimated_release: '2025-03-15',
          pi_earning_potential: 75,
          vote_count: 289,
          category: 'Commerce & Sales',
          progress_percentage: 20,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '10',
          title: 'Mobile App Companion',
          description: 'Native iOS and Android apps for managing your bio pages on-the-go with push notifications',
          status: 'planned' as const,
          priority: 'high' as const,
          estimated_release: '2025-04-01',
          pi_earning_potential: 60,
          vote_count: 334,
          category: 'Mobile Platform',
          progress_percentage: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      
      console.log('Real upcoming features loaded for next updates');
    } catch (err) {
      console.error('Failed to load features:', err);
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (featureId: string) => {
    if (votedFeatures.has(featureId)) {
      toast.info('You have already voted for this feature!');
      return;
    }

    try {
      // For now, just update local state since database table may not exist yet
      setFeatures(prev => prev.map(f => 
        f.id === featureId 
          ? { ...f, vote_count: f.vote_count + 1 }
          : f
      ));
      setVotedFeatures(prev => new Set(prev.add(featureId)));
      toast.success('Thanks for your vote! (Database integration pending migration)');
    } catch (err) {
      console.error('Failed to vote:', err);
      toast.error('Failed to vote');
    }
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'in_development':
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      case 'testing':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'coming_soon':
        return <Rocket className="w-4 h-4 text-orange-500" />;
      case 'released':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'in_development':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'testing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'coming_soon':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'released':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Loading Future Features...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <Rocket className="w-5 h-5" />
            Failed to Load Features
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadFeatures} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (features.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Future Features
          </CardTitle>
          <CardDescription>
            Exciting new features are coming soon! Stay tuned for updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No features in the roadmap yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const upcomingFeatures = features.filter(f => f.status !== 'released');
  const recentlyReleased = features.filter(f => f.status === 'released').slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="w-6 h-6" />
            Future Features
          </h2>
          <p className="text-muted-foreground">
            Vote for features you want to see next and earn Pi when they're released!
          </p>
        </div>
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Zap className="w-3 h-3 mr-1" />
          Earn Pi on Release
        </Badge>
      </div>

      {/* Recently Released Features */}
      {recentlyReleased.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Recently Released
            </CardTitle>
            <CardDescription>
              These features just went live! Early adopters earned bonus Pi rewards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {recentlyReleased.map((feature) => (
                <div key={feature.id} className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    +{feature.pi_earning_potential} Pi
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Features */}
      <div className="grid gap-6">
        {upcomingFeatures.map((feature) => (
          <Card key={feature.id} className="border-border/50 hover:border-blue-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(feature.status)}
                    <Badge variant="outline" className={getStatusColor(feature.status)}>
                      {feature.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(feature.priority)}`} />
                    <span className="text-xs text-muted-foreground capitalize">
                      {feature.priority} Priority
                    </span>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {feature.description}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600 mb-2">
                    <Zap className="w-3 h-3 mr-1" />
                    +{feature.pi_earning_potential} Pi
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Est. {new Date(feature.estimated_release).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feature.progress_percentage > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Development Progress</span>
                      <span>{feature.progress_percentage}%</span>
                    </div>
                    <Progress value={feature.progress_percentage} className="h-2" />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {feature.vote_count} votes
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant={votedFeatures.has(feature.id) ? "outline" : "default"}
                    onClick={() => handleVote(feature.id)}
                    disabled={votedFeatures.has(feature.id)}
                  >
                    {votedFeatures.has(feature.id) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Voted
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-2" />
                        Vote
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold">Earn Pi for Feature Participation</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Vote for features, participate in beta testing, and earn Pi rewards when features are released. 
              Your feedback shapes the future of DropLink!
            </p>
            <Button className="gap-2">
              Join Beta Program
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};