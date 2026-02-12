import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

const SwitchToMerchant: React.FC = () => {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader 
        title="Become a Merchant" 
        description="Start selling your products on DropLink"
        icon={<Store />}
      />
      <div className="min-h-screen bg-sky-400 p-4 pb-24 flex items-center justify-center">
        <Card className="max-w-lg w-full bg-white shadow-xl border-slate-200">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Open Your Store</CardTitle>
            <CardDescription className="text-slate-600 text-base">
              Join thousands of merchants selling digital products and services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Sell Anything</h3>
                  <p className="text-sm text-slate-500">Digital products, services, subscriptions, and more.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ArrowRight className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Instant Payments</h3>
                  <p className="text-sm text-slate-500">Get paid directly to your wallet in Pi or other currencies.</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/merchant-setup")}
            >
              Start Setup
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
      <FooterNav />
    </>
  );
};

export default SwitchToMerchant;
