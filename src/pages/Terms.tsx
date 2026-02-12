import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FooterNav } from "@/components/FooterNav";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-sky-400">
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-4 text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2 text-white" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Droplink, you accept and agree to be bound by the terms and provision of this agreement.
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily use Droplink for personal and commercial purposes. This is the grant of a license,
                not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose without explicit permission</li>
                <li>Attempt to decompile or reverse engineer any software</li>
                <li>Remove any copyright or other proprietary notations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility
                for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
              <p>
                All payments are processed through Pi Network. By making a payment, you agree to the terms and conditions of Pi Network.
                Refunds are subject to our refund policy and Pi Network's terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Content Responsibility</h2>
              <p>
                You are solely responsible for the content you post on Droplink. You agree not to post content that is illegal, harmful,
                threatening, abusive, or violates any third-party rights. We reserve the right to remove any content that violates these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
              <p>
                Droplink shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use
                or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any significant changes. Your continued use
                of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us through the app or visit our support page.
              </p>
            </section>
          </CardContent>
          <div className="border-t p-6 flex justify-center">
            <Button 
              className="bg-sky-500 hover:bg-sky-600 text-white"
              onClick={() => window.open('https://www.droplink.space/community-guidelines', '_blank')}
            >
              Community Guidelines
            </Button>
          </div>
        </Card>
      </div>

      {/* Footer Navigation */}
      <FooterNav />
    </div>
  );
};

export default Terms;

