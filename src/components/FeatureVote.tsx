import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePi } from '@/contexts/PiContext';
import { ThumbsUp, AlertCircle } from 'lucide-react';

const SAMPLE_FEATURES = [
  { key: 'feature-ads-improvements', title: 'Improved Ad Rewards', emoji: '💰', description: 'Better rewards for watching ads' },
  { key: 'feature-profile-badges', title: 'Profile Badges & Achievements', emoji: '🏆', description: 'Display badges for milestones' },
  { key: 'feature-merchant-dashboard', title: 'Merchant Dashboard', emoji: '🛍️', description: 'Advanced store management tools' },
  { key: 'feature-analytics', title: 'Creator Analytics', emoji: '📊', description: 'Detailed performance metrics' },
  { key: 'feature-livestream', title: 'Live Stream Integration', emoji: '🎥', description: 'Stream directly from DropLink' },
  { key: 'feature-nft-support', title: 'NFT Marketplace', emoji: '🖼️', description: 'Buy and sell NFTs on DropLink' }
];

export default function FeatureVote() {
  const { piUser } = usePi();
  const [selected, setSelected] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState<Record<string, number>>(() => {
    // Load votes from localStorage
    const stored = localStorage.getItem('feature_votes');
    return stored ? JSON.parse(stored) : {};
  });

  const handleVote = async () => {
    if (!piUser) {
      toast.error('Auth required', {
        description: 'Please sign in with Pi to vote.'
      });
      return;
    }
    
    if (!selected) {
      toast.error('Choose a feature', {
        description: 'Select a feature to vote for.'
      });
      return;
    }

    try {
      // Update local votes
      const newVotes = { 
        ...votes, 
        [selected]: (votes[selected] || 0) + 1 
      };
      setVotes(newVotes);
      localStorage.setItem('feature_votes', JSON.stringify(newVotes));

      toast.success('Vote recorded! 🎉', {
        description: 'Thank you for your feedback!'
      });

      // Reset form
      setSelected(null);
      setHasVoted(true);

      // Re-enable voting after 2 seconds
      setTimeout(() => setHasVoted(false), 2000);
    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Failed to record vote', {
        description: 'Please try again later.'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ThumbsUp className="w-5 h-5 text-sky-500" />
          Vote for Your Favorite Features
        </CardTitle>
        <CardDescription>
          Select a feature you'd like to see next.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!piUser && (
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Sign in required</p>
              <p>Please sign in with Pi Network to vote for features</p>
            </div>
          </div>
        )}

        {hasVoted && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            ✓ Your vote has been recorded! Select another feature to vote again.
          </div>
        )}

        <div className="grid gap-3">
          {SAMPLE_FEATURES.map(f => (
            <label 
              key={f.key} 
              className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selected === f.key 
                  ? 'border-sky-500 bg-sky-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="feature_vote"
                value={f.key}
                checked={selected === f.key}
                onChange={() => setSelected(f.key)}
                className="mt-1 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <span>{f.emoji}</span>
                  {f.title}
                  {votes[f.key] > 0 && (
                    <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                      {votes[f.key]} votes
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{f.description}</p>
              </div>
            </label>
          ))}
        </div>

        <Button 
          onClick={handleVote} 
          disabled={!piUser || !selected}
          className="w-full gap-2"
        >
          <ThumbsUp className="w-4 h-4" />
          Vote
        </Button>
      </CardContent>
    </Card>
  );
}
