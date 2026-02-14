import { useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login, identity, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };

  useEffect(() => {
    if (identity) {
      const redirectPath = search.redirect || '/dashboard';
      navigate({ to: redirectPath });
    }
  }, [identity, navigate, search.redirect]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome to Skill Sync</CardTitle>
          <CardDescription>
            Sign in with Internet Identity to start your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            size="lg"
          >
            {isLoggingIn ? 'Logging in...' : 'Login with Internet Identity'}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            New to Skill Sync? Create your profile after logging in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
