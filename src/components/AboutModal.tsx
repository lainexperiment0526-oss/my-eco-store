import { useState } from "react";
import { PI_CONFIG } from '@/config/pi-config';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Info,
  Users,
  Zap,
  Shield,
  Globe,
  Heart,
  Code,
  Star,
  ExternalLink,
  Github,
  Twitter,
  Mail,
  Award,
  Play,
  Building,
  Crown,
  Network
} from "lucide-react";

interface AboutModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AboutModal = ({ children, open: externalOpen, onOpenChange }: AboutModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const appInfo = {
    name: "DropLink",
    version: "2.1.0",
    buildDate: new Date().toLocaleDateString(),
    description: "The ultimate Pi Network-powered bio link platform powered by Mrwain Organization",
    organization: "Mrwain Organization",
    founder: "Mrwain"
  };

  const organizationInfo = {
    name: "Mrwain Organization",
    founder: "Mrwain",
    mission: "Empowering the Pi Network ecosystem through innovative decentralized applications and tools",
    vision: "Building the future of Web3 social media and creator economy on Pi Network",
    established: "2024",
    focus: "Pi Network Development, Creator Economy, Decentralized Social Media"
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: "Pi Network Integration", 
      description: `Seamlessly integrated with ${PI_CONFIG.SANDBOX_MODE ? 'Pi Sandbox' : 'Pi Mainnet'} for authentic Web3 experience`
    },
    {
      icon: <Globe className="w-5 h-5 text-blue-500" />,
      title: "Pi Domain System",
      description: "Get your custom .pi domain for professional bio pages on Pi Network"
    },
    {
      icon: <Users className="w-5 h-5 text-green-500" />,
      title: "Creator Economy",
      description: "Monetize your content through Pi payments, tips, and premium subscriptions"
    },
    {
      icon: <Shield className="w-5 h-5 text-purple-500" />,
      title: "Secure & Decentralized",
      description: "Built on Pi Network's secure blockchain infrastructure"
    },
    {
      icon: <Network className="w-5 h-5 text-sky-500" />,
      title: "Pi Ecosystem Hub",
      description: "Connect with the entire Pi Network community and ecosystem"
    },
    {
      icon: <Heart className="w-5 h-5 text-red-500" />,
      title: "Community Driven",
      description: "Built by Pi Pioneers, for Pi Pioneers"
    }
  ];

  const piNetworkFeatures = [
    "Native Pi wallet integration",
    "Pi-to-Pi instant payments", 
    "Pi Network authentication",
    "Custom .pi domain names",
    "Pi ecosystem interoperability",
    `${PI_CONFIG.SANDBOX_MODE ? 'Sandbox' : 'Mainnet'} Pi transactions`
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Info className="w-4 h-4 mr-2" />
            About
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <span className="text-sky-500">{appInfo.name}</span>
            <Badge variant="secondary">v{appInfo.version}</Badge>
            <Badge variant="outline" className="text-sky-500 border-sky-500">Pi Network</Badge>
          </DialogTitle>
          <DialogDescription className="text-base">
            {appInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Watch Video */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-sky-500" />
                Watch DropLink
              </CardTitle>
              <CardDescription>
                See DropLink in action and learn how it powers the Pi Network ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/Oin7Ka7lXsg" 
                  title="DropLink - Pi Network Bio Links Platform"
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <Zap className="w-3 h-3 mr-1" />
                  Pi Network
                </Badge>
                <Badge variant="secondary">
                  <Globe className="w-3 h-3 mr-1" />
                  .pi Domain
                </Badge>
                <Badge variant="secondary">
                  <Crown className="w-3 h-3 mr-1" />
                  Creator Economy
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Organization Info */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-sky-500" />
                About Mrwain Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-sky-600">Our Mission</h4>
                  <p className="text-sm text-muted-foreground">{organizationInfo.mission}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-purple-600">Our Vision</h4>
                  <p className="text-sm text-muted-foreground">{organizationInfo.vision}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Founded By</p>
                  <p className="font-medium text-sky-600">{organizationInfo.founder}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Established</p>
                  <p className="font-medium">{organizationInfo.established}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Focus</p>
                  <p className="font-medium">{organizationInfo.focus}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pi Network Integration */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5 text-purple-500" />
                Pi Network Integration
              </CardTitle>
              <CardDescription>
                DropLink is fully aligned with Pi Network's vision and ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {piNetworkFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    {feature}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700">
                  <strong>Pi Domain System:</strong> DropLink enables users to get custom .pi domains, 
                  creating a unified identity across the Pi Network ecosystem. Your bio page becomes 
                  your gateway to the Pi-powered web.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Platform Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="mt-1">{feature.icon}</div>
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Founder & Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Leadership & Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 backdrop-blur-sm border">
                  <div>
                    <h4 className="font-semibold text-lg">Mrwain</h4>
                    <p className="text-sm text-sky-600 font-medium">Founder & Lead Developer</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pioneering Pi Network development with a vision to empower creators and build 
                      the decentralized social economy. Leading the charge in Pi ecosystem innovation.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <div>
                    <h4 className="font-medium">Pi Network Community</h4>
                    <p className="text-sm text-blue-600">Mainnet Contributors</p>
                    <p className="text-sm text-muted-foreground">
                      Thousands of Pi Pioneers shaping DropLink with real mainnet usage and feedback
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Pi Network */}
          <Card>
            <CardHeader>
              <CardTitle>Connect With Us</CardTitle>
              <CardDescription>
                Join the Pi Network ecosystem and DropLink community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 hover:bg-sky-50 hover:border-sky-300"
                  onClick={() => window.open('https://minepi.com/Wain2020', '_blank')}
                >
                  <Network className="w-4 h-4" />
                  Pi Network
                  <ExternalLink className="w-3 h-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => window.open('https://www.droplink.space/pi-domain-details', '_blank')}
                >
                  <Globe className="w-4 h-4" />
                  Learn About .pi Domains
                  <ExternalLink className="w-3 h-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => window.open('https://www.droplink.space/contact', '_blank')}
                >
                  <Mail className="w-4 h-4" />
                  Support
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Legal */}
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>© 2026 DropLink by Mrwain Organization. Built for the Pi Network ecosystem.</p>
            <p>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto"
                onClick={() => window.location.href = '/privacy'}
              >
                Privacy Policy
              </Button>
              {" • "}
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto"
                onClick={() => window.location.href = '/terms'}
              >
                Terms of Service
              </Button>
              {" • "}
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto"
                onClick={() => window.open('https://pi-apps.github.io/community-developer-guide/', '_blank')}
              >
                Pi Network Integration
              </Button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};