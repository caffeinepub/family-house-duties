import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Home, LogIn } from 'lucide-react';

export function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Home className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Family House Duties</h1>
          <p className="mt-2 text-muted-foreground">Shared household management for your family</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to manage your family's tasks and meal planning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <img
                src="/assets/generated/family-cooking.dim_800x600.jpg"
                alt="Family cooking together"
                className="w-full rounded-md object-cover"
              />
            </div>
            <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full" size="lg">
              <LogIn className="mr-2 h-5 w-5" />
              {isLoggingIn ? 'Signing in...' : 'Sign in with Internet Identity'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Secure authentication powered by Internet Computer
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
