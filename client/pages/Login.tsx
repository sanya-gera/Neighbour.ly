import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { auth } from '@/api';
import { User } from '@/types';

interface LoginProps {
  user?: User | null;
  onLogin?: (user: User) => void;
}

export function Login({ user, onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await auth.signInWithGoogle();
      
      if (response.success && response.data) {
        onLogin?.(response.data);
      } else {
        setError(response.message || 'Failed to sign in');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-border bg-card shadow-2xl">
          <CardHeader className="space-y-6 pb-8">
            {/* Logo */}
            <div className="flex justify-center">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src="/logo.jpg" 
                  alt="Crowdsourced Problem Solver Logo" 
                />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                  CPS
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Crowdsourced Problem Solver
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to report & verify civic issues
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div 
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            {/* Google Sign In Button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium"
              size="lg"
              aria-label="Sign in with Google to access Crowdsourced Problem Solver"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg
                    className="mr-3 h-5 w-5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {/* Additional Info */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                By signing in, you agree to help improve your community by 
                reporting and verifying civic issues.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Instructions */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-muted">
          <h3 className="text-sm font-medium text-foreground mb-2">
            Demo Instructions
          </h3>
          <p className="text-xs text-muted-foreground">
            This is a demo application. Click "Continue with Google" to sign in 
            with mock credentials and explore the platform features.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
