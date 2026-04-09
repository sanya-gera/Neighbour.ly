import "./global.css";

import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";

// API and Types
import { auth, userApi } from "@/api";
import { User } from "@/types";

const queryClient = new QueryClient();

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const response = await auth.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    toast({
      title: "Welcome!",
      description: `Signed in as ${userData.name}`,
    });
  };

  const handleSignOut = async () => {
    try {
      const response = await auth.signOut();
      if (response.success) {
        setUser(null);
        toast({
          title: "Signed out",
          description: response.message || "Successfully signed out",
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to sign out", variant: "destructive" });
    }
  };

  const handleRoleSwitch = async (newRole: 'citizen' | 'authority') => {
    if (!user) return;
    try {
      const response = await userApi.updateRole(newRole);
      if (response.success && response.data) {
        setUser(response.data);
        toast({
          title: "Role Updated",
          description: response.message || `Switched to ${newRole} view`,
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to switch role", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Login - no layout */}
      <Route path="/login" element={<Login user={user} onLogin={handleLogin} />} />

      {/* OAuth callback - stores token then redirects */}
      <Route path="/auth/callback" element={<AuthCallback onLogin={handleLogin} />} />

      {/* Protected routes */}
      <Route path="/" element={<Layout user={user} onRoleSwitch={handleRoleSwitch} onSignOut={handleSignOut}><Dashboard user={user} onRoleSwitch={handleRoleSwitch} /></Layout>} />
      <Route path="/dashboard" element={<Layout user={user} onRoleSwitch={handleRoleSwitch} onSignOut={handleSignOut}><Dashboard user={user} onRoleSwitch={handleRoleSwitch} /></Layout>} />
      <Route path="/leaderboard" element={<Layout user={user} onRoleSwitch={handleRoleSwitch} onSignOut={handleSignOut}><Leaderboard user={user} /></Layout>} />
      <Route path="*" element={<Layout user={user} onRoleSwitch={handleRoleSwitch} onSignOut={handleSignOut}><NotFound /></Layout>} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
