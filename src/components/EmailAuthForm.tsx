import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EmailAuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === "signIn") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("Signed in! Check your email for confirmation if required.");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Sign up successful! Check your email for confirmation.");
      }
    } catch (err: any) {
      setMessage(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={loading}>
          {mode === "signIn" ? "Sign In" : "Sign Up"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
        >
          {mode === "signIn" ? "Switch to Sign Up" : "Switch to Sign In"}
        </Button>
      </div>
      {message && <div className="text-xs text-center text-red-500">{message}</div>}
    </form>
  );
};

export default EmailAuthForm;
