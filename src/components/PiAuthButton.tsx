import { useState } from "react";
import { PiBrowserModal } from "./PiBrowserModal";
import { usePi, isPiBrowserEnv } from "@/contexts/PiContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PiAuthButtonProps {
  redirectTo?: string;
  className?: string;
  children?: React.ReactNode;
}

export const PiAuthButton = ({ redirectTo = "/dashboard", className = "", children }: PiAuthButtonProps) => {
  const { signIn, loading: piLoading, isInitialized } = usePi();
  const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handlePiAuth = async () => {
    setLoading(true);
    try {
        // Check if we're definitely not in Pi Browser BEFORE trying to authenticate
        if (!isInitialized && !isPiBrowserEnv()) {
          console.warn('[AUTH] Not in Pi Browser environment, showing modal');
          setShowModal(true);
          setLoading(false);
          return;
        }
        
        await signIn();
        // After successful signIn, verify token with backend
        const accessToken = localStorage.getItem('pi_access_token');
        if (accessToken) {
          const response = await fetch('/verify-pi-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accessToken }),
          });
          const result = await response.json();
          if (result.success) {
            navigate(redirectTo);
          }
        }
    } catch (error) {
        console.error('[AUTH] Authentication error:', error);
        // Only show modal if it's a Pi Browser environment issue
        if (!isPiBrowserEnv()) {
          setShowModal(true);
        } else {
          // If we ARE in Pi Browser but got an error, log it for debugging
          console.error('[AUTH] Auth failed even though we are in Pi Browser:', error);
        }
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
        <Button
          onClick={handlePiAuth}
          className={`w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 ${className}`}
          disabled={piLoading || loading}
        >
          {children || (piLoading || loading ? "Connecting..." : "Sign in with Pi Network")}
        </Button>
        <PiBrowserModal open={showModal} onClose={() => setShowModal(false)} />
      </>
  );
};
