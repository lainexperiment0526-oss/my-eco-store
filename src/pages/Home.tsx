import { useEffect } from "react";
import { Loader2, ExternalLink } from "lucide-react";

const Home = () => {
  useEffect(() => {
    // Redirect to droplink.space landing page
    window.location.href = "https://www.droplink.space";
  }, []);

  return (
    <div className="min-h-screen bg-sky-400 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-sky-500" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Redirecting to DropLink</h1>
          <p className="text-muted-foreground">
            Taking you to our main landing page...
          </p>
        </div>
        <div className="pt-4">
          <a
            href="https://www.droplink.space"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 transition-colors"
          >
            Click here if redirect doesn't work
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
