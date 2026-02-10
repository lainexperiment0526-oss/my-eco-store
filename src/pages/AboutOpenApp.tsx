import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';

export default function AboutOpenApp() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">About OpenApp</h1>
            <p className="text-sm text-muted-foreground">Welcome to the Decentralized Network Hub</p>
          </div>

          <div className="space-y-6 text-sm text-muted-foreground">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">What is OpenApp?</h2>
              <p>
                OpenApp is a Web3 Network Hub that connects you to all Pi Network applications in one place.
                We serve as a decentralized directory where developers can showcase their Pi Network apps and
                users can discover new experiences.
              </p>
            </section>

            <section className="space-y-3 rounded-xl border border-border bg-secondary/50 p-4">
              <h2 className="text-base font-semibold text-foreground">What is Web3?</h2>
              <p>
                Web3 is the next evolution of the internet, aiming for a decentralized, user-centric web built
                on blockchain technology. Unlike previous generations, Web3 gives users true ownership of their
                data and digital assets.
              </p>
              <div className="space-y-2">
                <p><span className="font-semibold text-foreground">Web 1.0:</span> Read-only web (1990s-2000s) - Static websites, no user interaction</p>
                <p><span className="font-semibold text-foreground">Web 2.0:</span> Read-write web (2000s-present) - Social media, user-generated content, but centralized platforms control data</p>
                <p><span className="font-semibold text-foreground">Web 3.0:</span> Read-write-own web (present-future) - Decentralized, blockchain-based, users own their data and digital assets</p>
              </div>
            </section>

            <section className="space-y-2 rounded-xl border border-border bg-secondary/30 p-4">
              <h2 className="text-base font-semibold text-foreground">Third-Party Applications</h2>
              <p>
                All applications listed on OpenApp are third-party applications developed and maintained by independent developers.
                These apps are not owned, operated, or endorsed by OpenApp or the mrwain organization.
              </p>
              <ul className="space-y-1">
                <li>• Each app is owned and operated by its respective developer</li>
                <li>• App functionality, security, and privacy policies are managed by individual developers</li>
                <li>• Always review each app's terms of service and privacy policy before use</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">Your Responsibility</h2>
              <ul className="space-y-1">
                <li>✓ Verifying the legitimacy and security of apps before use</li>
                <li>✓ Reading and understanding each app's terms and conditions</li>
                <li>✓ Protecting your personal information and Pi wallet credentials</li>
                <li>✓ Reporting suspicious or fraudulent apps to OpenApp support</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">Limitation of Liability</h2>
              <p>
                OpenApp and the mrwain organization are not liable for any damages, losses, or issues arising from your
                use of third-party applications listed on this platform. This includes but is not limited to:
              </p>
              <ul className="space-y-1">
                <li>• Financial losses or unauthorized transactions</li>
                <li>• Data breaches or privacy violations</li>
                <li>• App malfunctions or service interruptions</li>
                <li>• Disputes between users and app developers</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">Explore Our Other Products</h2>
              <p>
                The mrwain organization develops and maintains other trusted products for the Pi Network ecosystem.
                Check out our official products that are directly supported by our team.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm">Learn More About Us</Button>
                <Button variant="secondary" size="sm">App Options</Button>
                <Button variant="secondary" size="sm">Contact Support</Button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
