import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FooterNav } from "@/components/FooterNav";

const Privacy = () => {
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
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <p>
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Your Pi Network username and unique identifier</li>
                <li>Profile information (business name, description, logo)</li>
                <li>Email address (if provided)</li>
                <li>Payment and transaction information</li>
                <li>Content you create and share on the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends and usage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share your information only:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who assist in operating our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
              <p>
                We use industry-standard security measures to protect your information. Your data is stored securely using Supabase
                and is encrypted in transit and at rest. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Local Storage</h2>
              <p>
                We use browser localStorage to store your profile preferences locally on your device. This data is only accessible
                on your device and is used to improve your experience by remembering your settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of certain data collection</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
              <p>
                We use localStorage to store your preferences. We do not use cookies for tracking purposes. Third-party services
                (such as Pi Network) may use their own tracking technologies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
              <p>
                Our service is not intended for children under 13. We do not knowingly collect personal information from children
                under 13. If you believe we have collected such information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Changes to Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy
                on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us through the app or visit our support page.
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

export default Privacy;

