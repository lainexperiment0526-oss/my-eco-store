import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FooterNav } from "@/components/FooterNav";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="glassmorphism-page glassmorphism-page-light dark:glassmorphism-page-dark flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements - Light Mode */}
      <div className="dark:hidden absolute top-0 left-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="dark:hidden absolute top-40 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      {/* Background decorative elements - Dark Mode */}
      <div className="hidden dark:block absolute top-0 left-10 w-96 h-96 bg-blue-900 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
      <div className="hidden dark:block absolute top-40 right-10 w-96 h-96 bg-purple-900 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="text-center relative z-10">
        <div className="glass-container rounded-3xl p-12 max-w-md">
          <div className="glass-overlay"></div>
          <div className="glass-border-glow"></div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white drop-shadow-md">404</h1>
          <p className="mb-6 text-xl text-gray-700 dark:text-gray-200 drop-shadow-md">Oops! Page not found</p>
          <a href="/" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-400/40 to-purple-400/40 dark:from-blue-500/30 dark:to-purple-500/30 backdrop-blur-lg border border-white/40 dark:border-white/25 rounded-lg text-gray-900 dark:text-white font-semibold hover:from-blue-400/60 dark:hover:from-blue-500/50 hover:to-purple-400/60 dark:hover:to-purple-500/50 transition-all duration-200">
            Return to Home
          </a>
        </div>
      </div>

      {/* Footer Navigation */}
      <FooterNav />
    </div>
  );
};

export default NotFound;
