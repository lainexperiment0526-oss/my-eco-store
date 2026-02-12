import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, TrendingUp, AlertCircle } from 'lucide-react';
import { usePi } from '@/contexts/PiContext';
import { toast } from 'sonner';

interface Feature {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'proposed' | 'in_progress' | 'completed' | 'rejected';
  upvotes: number;
  downvotes: number;
}

// Sample features for display (voting not connected to database)
const SAMPLE_FEATURES: Feature[] = [
  {
    id: '1',
    title: 'Faster Page Loads',
    description: 'Optimize assets and caching for quicker bio page performance on all devices',
    category: 'ui',
    status: 'proposed',
    upvotes: 42,
    downvotes: 3
  },
  {
    id: '2',
    title: 'Mobile App',
    description: 'Create native mobile apps for iOS and Android to manage bio pages on the go',
    category: 'platform',
    status: 'in_progress',
    upvotes: 89,
    downvotes: 5
  },
  {
    id: '3',
    title: 'Advanced Analytics Dashboard', 
    description: 'Enhanced analytics with real-time visitor tracking, geographic data, and device information',
    category: 'analytics',
    status: 'proposed',
    upvotes: 67,
    downvotes: 8
  },
  {
    id: '4',
    title: 'Social Media Auto-Posting',
    description: 'Automatically share updates across multiple social media platforms when you update your bio',
    category: 'integration',
    status: 'proposed',
    upvotes: 34,
    downvotes: 12
  }
];

const VotingSystem: React.FC = () => {
  const { isAuthenticated, piUser } = usePi();
  const [features, setFeatures] = useState<Feature[]>(SAMPLE_FEATURES);
  const [userVotes, setUserVotes] = useState<Record<string, 'upvote' | 'downvote'>>({});

  const handleVote = (featureId: string, voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated || !piUser) {
      toast.error('Auth required', {
        description: 'Please sign in with Pi Network to vote.'
      });
      return;
    }

    // Toggle vote
    setUserVotes(prev => {
      const current = prev[featureId];
      if (current === voteType) {
        const { [featureId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [featureId]: voteType };
    });

    // Update feature vote counts locally
    setFeatures(prev => prev.map(f => {
      if (f.id !== featureId) return f;
      
      const currentVote = userVotes[featureId];
      let { upvotes, downvotes } = f;
      
      // Remove previous vote
      if (currentVote === 'upvote') upvotes--;
      if (currentVote === 'downvote') downvotes--;
      
      // Add new vote if not removing
      if (currentVote !== voteType) {
        if (voteType === 'upvote') upvotes++;
        if (voteType === 'downvote') downvotes++;
      }
      
      return { ...f, upvotes, downvotes };
    }));

    toast.success(`${voteType === 'upvote' ? '👍' : '👎'} Vote recorded!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <TrendingUp className="h-5 w-5" />
            Community Voting
          </CardTitle>
          <CardDescription className="text-amber-700">
            Sign in with Pi Network to vote on features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please authenticate with Pi Network to access the voting system.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Feature Voting System
          </CardTitle>
          <CardDescription>
            Vote on proposed features to help shape DropLink's future
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {features.map((feature) => {
          const totalVotes = feature.upvotes + feature.downvotes;
          const votePercentage = totalVotes > 0 ? (feature.upvotes / totalVotes) * 100 : 50;
          const userVote = userVotes[feature.id];

          return (
            <Card key={feature.id} className="border-l-4 border-l-primary bg-white shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {feature.description}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(feature.status)}>
                    {feature.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant={userVote === 'upvote' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleVote(feature.id, 'upvote')}
                    className="flex items-center gap-1"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {feature.upvotes}
                  </Button>
                  <Button
                    variant={userVote === 'downvote' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => handleVote(feature.id, 'downvote')}
                    className="flex items-center gap-1"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    {feature.downvotes}
                  </Button>
                  <span className="text-sm text-muted-foreground ml-2 self-center">
                    {Math.round(votePercentage)}% positive
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default VotingSystem;
