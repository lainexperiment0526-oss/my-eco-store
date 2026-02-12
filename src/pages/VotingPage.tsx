import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FeatureVote from '@/components/FeatureVote';
import VotingSystem from '@/components/VotingSystem';
import { ArrowLeft, Vote, Lightbulb, LogIn, LogOut, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePi } from '@/contexts/PiContext';
import { FooterNav } from '@/components/FooterNav';

export default function VotingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, piUser, signIn, signOut } = usePi();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            {/* Pi Auth Status */}
            <div className="flex items-center gap-3">
              {isAuthenticated && piUser ? (
                <div className="flex items-center gap-3 px-4 py-2 bg-sky-50 border border-sky-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-sky-600" />
                    <span className="font-medium text-sky-900">{piUser.username || piUser.uid}</span>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-600">Authenticated</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => signOut()}
                    className="gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => signIn()}
                  className="gap-2 bg-sky-600 hover:bg-sky-700"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in with Pi
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Vote className="w-8 h-8 text-sky-500" />
              Feature Voting
            </h1>
            <p className="text-lg text-gray-600">
              Vote for features you want to see next and help shape the future of DropLink
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-sky-50 border-sky-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Vote className="w-5 h-5 text-sky-500" />
                Vote for Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Cast your vote for features you'd like to see implemented. Each vote helps us prioritize development.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-green-600" />
                Earn Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Earn 1 DROP token when voted features are released. Your voice matters!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Voting Systems */}
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="quick">Quick Vote</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Voting</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vote for Upcoming Features</CardTitle>
                <CardDescription>
                  Select a feature and submit your vote. Quick and simple.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureVote />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            <VotingSystem />
          </TabsContent>
        </Tabs>

        {/* Feature Info */}
        <Card className="mt-8 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">How Voting Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
              <div>
                <p className="font-medium">Select a Feature</p>
                <p className="text-gray-600">Browse and choose from upcoming features you'd like to see</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
              <div>
                <p className="font-medium">Submit Your Vote</p>
                <p className="text-gray-600">Click the vote button to register your preference</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
              <div>
                <p className="font-medium">Earn Rewards</p>
                <p className="text-gray-600">Get 1 DROP token when your voted feature is released</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Navigation */}
      <FooterNav />
    </div>
  );
}
