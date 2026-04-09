/**
 * /client/pages/AuthCallback.tsx
 *
 * After Google OAuth, the backend redirects to:
 *   http://localhost:5173/auth/callback?token=<JWT>
 *
 * This page grabs the token, stores it, then redirects to the dashboard.
 * Add this route to App.tsx:
 *   <Route path="/auth/callback" element={<AuthCallback onLogin={handleLogin} />} />
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/api";

interface AuthCallbackProps {
  onLogin: (user: any) => void;
}

export default function AuthCallback({ onLogin }: AuthCallbackProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login?error=no_token");
      return;
    }

    // Store the token
    auth.handleCallback(token);

    // Fetch the user profile
    auth.getCurrentUser().then((res) => {
      if (res.success && res.data) {
        onLogin(res.data);
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login?error=fetch_failed");
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
