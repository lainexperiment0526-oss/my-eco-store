import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Zap, 
  Shield, 
  Users,
  CheckCircle,
  ExternalLink,
  Sparkles
} from "lucide-react";

interface PiDomainModalProps {
  children?: React.ReactNode;
}

export const PiDomainModal = ({ children }: PiDomainModalProps) => {
  const [open, setOpen] = useState(false);

  const benefits = [
    {
      icon: <Globe className="w-5 h-5 text-sky-500" />,
      title: "Your Own .pi Domain",
      description: "Get a unique, memorable domain that identifies you on the Pi Network"
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: "Instant Setup",
      description: "Create your .pi domain in seconds with just a few clicks"
    },
    {
      icon: <Shield className="w-5 h-5 text-green-500" />,
      title: "Secure & Decentralized",
      description: "Your domain is secured on the Pi Network blockchain"
    },
    {
      icon: <Users className="w-5 h-5 text-purple-500" />,
      title: "Community Verified",
      description: "Build trust with Pi Pioneers who recognize .pi domains"
    }
  ];

  const features = [
    "Professional online presence",
    "Direct access to your DropLink profile",
    "Share your personalized .pi domain link",
    "Showcase your creator economy presence",
    "Connect with Pi Network community"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Globe className="w-4 h-4" />
            Learn About .pi Domains
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full px-4 sm:px-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-xl flex-wrap">
            <Globe className="w-6 h-6 text-sky-500" />
            .pi Domains on Pi Network
            <Badge variant="secondary" className="bg-sky-500 text-white">
              Exclusive
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-hidden">
          {/* Intro Card */}
          <Card className="bg-sky-50 border-sky-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-500" />
                What is a .pi Domain?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                A <strong>.pi domain</strong> is your unique identity on the Pi Network. It's a decentralized, 
                blockchain-secured domain that works exclusively within the Pi ecosystem. Instead of a complex 
                username or wallet address, you get a memorable, professional web address like <code className="bg-white px-2 py-1 rounded text-sky-600 font-mono">yourname.pi</code>
              </p>
            </CardContent>
          </Card>

          {/* Benefits Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-sky-500" />
              Why Get a .pi Domain?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-l-4 border-l-sky-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-2">
                      {benefit.icon}
                      <span className="font-medium break-words">{benefit.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 break-words">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Features List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-500" />
                Key Features
              </CardTitle>
              <CardDescription>
                Everything you get with your .pi domain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0" />
                    <span className="text-sm break-words">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-sky-50 border-sky-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Ready to Get Your .pi Domain?</h3>
                <p className="text-gray-600">
                  Learn more about acquiring your custom .pi domain and establishing your presence on the Pi Network.
                </p>
                <Button 
                  className="gap-2 bg-sky-500 hover:bg-sky-600"
                  onClick={() => window.open('https://www.droplink.space/pi-domain-details', '_blank')}
                >
                  <Globe className="w-4 h-4" />
                  Learn More About .pi Domains
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PiDomainModal;
