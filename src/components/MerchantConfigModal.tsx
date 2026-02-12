import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Store, 
  Rocket, 
  Users, 
  Palette, 
  Code, 
  TrendingUp, 
  Heart,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

export const MerchantConfigModal = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Store className="w-4 h-4" />
            Merchant
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full px-4 sm:px-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-xl flex-wrap">
            <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            DropStore: Digital Marketplace
            <Badge variant="secondary" className="bg-orange-500 text-white">
              Coming Soon
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-hidden">
          {/* Vision Statement */}
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Coming Soon! 🚀
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                DropStore is launching soon! We're building a comprehensive 
                <strong> digital marketplace</strong> where businesses, artists, developers, and creators 
                can build thriving online storefronts with blockchain-powered transactions on Pi Network mainnet.
              </p>
            </CardContent>
          </Card>

          {/* Who Can Build */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Who Will Use DropStore?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="font-medium break-words">Businesses</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-words">Retail stores, service providers, and startups will create professional storefronts</p>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="font-medium break-words">Artists & Creators</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-words">Sell digital art, NFTs, music, and creative content directly to fans</p>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="font-medium break-words">Developers</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-words">Offer software, apps, courses, and technical services through integrated payments</p>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="font-medium break-words">Entrepreneurs</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-words">Launch new products and services with built-in payment and marketing tools</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Coming Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Features Coming Soon
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg overflow-hidden">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-0.5"></div>
                <span className="text-sm break-words"><strong>Advanced Storefronts:</strong> Multi-product catalogs with inventory management</span>
              </div>
              <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg overflow-hidden">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-0.5"></div>
                <span className="text-sm break-words"><strong>Marketplace Discovery:</strong> Browse and search all DropStore shops</span>
              </div>
              <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg overflow-hidden">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-0.5"></div>
                <span className="text-sm break-words"><strong>Pi Network Integration:</strong> Native Pi payments and DROP token rewards</span>
              </div>
              <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg overflow-hidden">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-0.5"></div>
                <span className="text-sm break-words"><strong>Smart Contracts:</strong> Automated escrow and trustless transactions</span>
              </div>
              <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg overflow-hidden">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-0.5"></div>
                <span className="text-sm break-words"><strong>Social Commerce:</strong> Reviews, ratings, and social sharing</span>
              </div>
              <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg overflow-hidden">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-0.5"></div>
                <span className="text-sm break-words"><strong>Analytics & Insights:</strong> Advanced sales and customer analytics</span>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-700">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold">Exciting Things Coming Soon!</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  We're building something amazing! DropStore will revolutionize how creators and businesses 
                  sell on Pi Network. Stay tuned for launch updates.
                </p>
                <Button 
                  variant="outline" 
                  className="gap-2 w-full" 
                  onClick={() => {
                    setOpen(false);
                    navigate('/voting');
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Vote on Future Features
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MerchantConfigModal;
