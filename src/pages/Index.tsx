

import { PiAuthButton } from "@/components/PiAuthButton";
import { FooterNav } from "@/components/FooterNav";

const Index = () => {

  return (
    <div className="glassmorphism-page glassmorphism-page-light dark:glassmorphism-page-dark flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements - Light Mode */}
      <div className="dark:hidden absolute top-0 left-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="dark:hidden absolute top-40 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="dark:hidden absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Background decorative elements - Dark Mode */}
      <div className="hidden dark:block absolute top-0 left-10 w-96 h-96 bg-blue-900 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
      <div className="hidden dark:block absolute top-40 right-10 w-96 h-96 bg-purple-900 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="hidden dark:block absolute -bottom-8 left-20 w-96 h-96 bg-pink-900 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="text-center space-y-6 max-w-md mx-auto p-8 relative z-10 group">
        {/* Light Mode Glass Card */}
        <div className="dark:hidden glass-container-light rounded-3xl p-8 overflow-hidden">
          <div className="glass-overlay"></div>
          <div className="glass-border-glow"></div>
          <div className="glass-inner-glow"></div>
          <div className="relative z-10">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 drop-shadow-sm">Welcome to DropLink</h1>
            <p className="text-xl text-gray-700 mb-6 drop-shadow-sm">Start building your amazing project here!</p>
            <PiAuthButton />
          </div>
        </div>

        {/* Dark Mode Glass Card */}
        <div className="hidden dark:block glass-container-dark rounded-3xl p-8 overflow-hidden">
          <div className="glass-overlay"></div>
          <div className="glass-border-glow"></div>
          <div className="glass-inner-glow"></div>
          <div className="relative z-10">
            <h1 className="mb-4 text-4xl font-bold text-foreground drop-shadow-md">Welcome to DropLink</h1>
            <p className="text-xl text-muted-foreground mb-6 drop-shadow-md">Start building your amazing project here!</p>
            <PiAuthButton />
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <FooterNav />
    </div>
  );
};

export default Index;
