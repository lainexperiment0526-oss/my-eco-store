import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Zap, 
  Shield, 
  CreditCard,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Lock,
  Smartphone,
  Code
} from "lucide-react";

interface DropPayModalProps {
  children?: React.ReactNode;
}

export const DropPayModal = ({ children }: DropPayModalProps) => {
  const [open, setOpen] = useState(false);

  const benefits = [
    {
      icon: <Wallet className="w-5 h-5 text-sky-500" />,
      title: "Seamless Pi Payments",
      description: "Accept Pi cryptocurrency payments directly with a beautiful, easy-to-use modal interface"
    },
    {
      icon: <Zap className="w-5 h-5 text-sky-500" />,
      title: "Instant Integration",
      description: "Add the DropPay modal to your website in minutes with simple code integration"
    },
    {
      icon: <Shield className="w-5 h-5 text-sky-500" />,
      title: "Secure Transactions",
      description: "All payments are secured by Pi Network's blockchain technology"
    },
    {
      icon: <Smartphone className="w-5 h-5 text-sky-500" />,
      title: "Mobile Optimized",
      description: "Beautiful responsive design works perfectly on all devices and screen sizes"
    }
  ];

  const features = [
    "Ready-to-use payment modal UI",
    "Pi Network blockchain integration",
    "QR code payment support",
    "Real-time payment verification",
    "Customizable branding and styling",
    "Transaction history tracking",
    "Support payment methods: Pi and Drop",
    "Developer-friendly API"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Wallet className="w-4 h-4" />
            Learn About DropPay
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full px-4 sm:px-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-xl flex-wrap">
            <Wallet className="w-6 h-6 text-sky-500" />
            DropPay: Pi Payment Modal
            <Badge variant="secondary" className="bg-sky-500 text-white">
              Mainnet Live
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-hidden">
          {/* Intro Card */}
          <Card className="bg-sky-50 border-sky-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-500" />
                What is DropPay?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                <strong>DropPay</strong> is a beautiful, ready-to-use payment modal interface for accepting 
                Pi cryptocurrency payments. It provides a seamless checkout experience with QR codes, 
                real-time verification, and a polished UI that matches modern web standards. Perfect for 
                e-commerce, digital products, services, and any business accepting Pi payments.
              </p>
            </CardContent>
          </Card>

          {/* Benefits Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-sky-500" />
              Why Use DropPay?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-l-4 border-l-sky-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">{benefit.icon}</div>
                      <div className="min-w-0">
                        <h4 className="font-semibold mb-1 break-words">{benefit.title}</h4>
                        <p className="text-sm text-gray-600 break-words">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Features List */}
          <Card className="bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-sky-500" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-sky-500 flex-shrink-0" />
                    <span className="break-words">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* How It Works */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-sky-500" />
              How It Works
            </h3>
            <div className="space-y-3">
              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="flex-shrink-0 bg-sky-50 text-sky-700 border-sky-300">
                      1
                    </Badge>
                    <div className="min-w-0">
                      <h4 className="font-semibold mb-1">Customer Initiates Payment</h4>
                      <p className="text-sm text-gray-600">Customer clicks pay button and the DropPay modal opens with payment details</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="flex-shrink-0 bg-sky-50 text-sky-700 border-sky-300">
                      2
                    </Badge>
                    <div className="min-w-0">
                      <h4 className="font-semibold mb-1">Scan & Pay with Pi</h4>
                      <p className="text-sm text-gray-600">Customer scans QR code with Pi Browser or uses deep link to complete payment</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-sky-500">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="flex-shrink-0 bg-sky-50 text-sky-700 border-sky-300">
                      3
                    </Badge>
                    <div className="min-w-0">
                      <h4 className="font-semibold mb-1">Instant Verification</h4>
                      <p className="text-sm text-gray-600">Payment is verified on Pi Network blockchain and customer receives confirmation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Live Demo */}
          <Card className="bg-gradient-to-r from-sky-500 to-sky-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Launch DropPay Platform</h3>
                </div>
                <p className="text-sky-50 max-w-md">
                  Access the live DropPay mainnet platform to accept Pi and Drop cryptocurrency payments.
                </p>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-sky-600 hover:bg-sky-50 font-semibold gap-2"
                  onClick={() => {
                    window.open('https://droppay.space/', '_blank', 'noopener,noreferrer');
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open DropPay Platform
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Developer Resources */}
          <Card className="border-sky-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="w-5 h-5 text-sky-500" />
                For Developers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                DropPay is built with modern web technologies and can be easily integrated into any website 
                or application. The platform provides a complete payment flow, UI components, and seamless user experience on Pi Network mainnet.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-300">
                  React/TypeScript
                </Badge>
                <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-300">
                  Pi Network SDK
                </Badge>
                <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-300">
                  Responsive Design
                </Badge>
                <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-300">
                  QR Code Support
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>
              DropPay is part of the Drop ecosystem, bringing seamless Pi payments to the decentralized web.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
