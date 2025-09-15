import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import {
  Video,
  Mail,
  Lock,
  Facebook,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import type { User, Screen } from "../types";
import { signInWithGoogle, signInWithFacebook, initializeGoogleAuth, initializeFacebookSDK, mockSocialLogin, shouldUseMockLogin, type SocialUser } from "./utils/social-auth";
import { API_CONFIG } from "./utils/api-config";

interface AuthProps {
  onLogin: (user: User) => void;
  navigateTo: (screen: Screen) => void;
}

export function Auth({ onLogin, navigateTo }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [socialAuthReady, setSocialAuthReady] = useState(false);

  // Initialize social auth SDKs
  useEffect(() => {
    const initSocialAuth = async () => {
      // Always mark as ready for development environments
      if (API_CONFIG.IS_DEVELOPMENT) {
        setSocialAuthReady(true);
        return;
      }

      try {
        await Promise.all([
          initializeGoogleAuth().catch(console.error),
          initializeFacebookSDK().catch(console.error)
        ]);
        setSocialAuthReady(true);
      } catch (error) {
        console.error('Failed to initialize social auth:', error);
        setSocialAuthReady(true); // Still allow the UI to show
      }
    };

    initSocialAuth();
  }, []);

  const handleEmailLogin = async (isSignup: boolean) => {
    if (!email || !password || (isSignup && !name)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: "1",
      name: isSignup ? name : email.split('@')[0],
      email,
      country: "India",
      gender: null,
      isPremium: false,
      tokens: 50,
    };

    onLogin(mockUser);
    toast.success(
      `${isSignup ? "Account created" : "Logged in"} successfully!`,
    );
    setIsLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);

    try {
      let socialUser: SocialUser | null = null;

      // Check if we should use mock login for development/preview
      if (shouldUseMockLogin(provider)) {
        socialUser = await mockSocialLogin(provider);
      } else {
        // Use real social login
        if (provider === 'google') {
          socialUser = await signInWithGoogle();
        } else if (provider === 'facebook') {
          socialUser = await signInWithFacebook();
        }
      }

      if (socialUser) {
        const user: User = {
          id: socialUser.id,
          name: socialUser.name,
          email: socialUser.email,
          country: "India", // Default, can be detected or asked later
          gender: null,
          isPremium: false,
          tokens: 50,
        };

        onLogin(user);
        const providerName = provider === 'google' ? 'Google' : 'Facebook';
        toast.success(`Logged in with ${providerName}!`);
      }
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      
      // Show user-friendly error messages
      if (error.message.includes('not configured')) {
        // Fall back to mock login silently
        try {
          const socialUser = await mockSocialLogin(provider);
          const user: User = {
            id: socialUser.id,
            name: socialUser.name,
            email: socialUser.email,
            country: "India",
            gender: null,
            isPremium: false,
            tokens: 50,
          };
          onLogin(user);
          toast.success(`Logged in with ${provider === 'google' ? 'Google' : 'Facebook'}!`);
        } catch (demoError) {
          toast.error(`Failed to login with ${provider}`);
        }
      } else {
        toast.error(error.message || `Failed to login with ${provider}`);
      }
    } finally {
      setIsLoading(false);
    }
  };



  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Password reset link sent to your email!");
    setIsLoading(false);
    setShowForgotPassword(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="glass w-full max-w-md p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold">
              Reset Password
            </h2>
            <p className="text-muted-foreground">
              Enter your email to receive a password reset link
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              onClick={handleForgotPassword}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowForgotPassword(false)}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="glass w-full max-w-md p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold">
            Welcome to Swipx
          </h1>
          <p className="text-muted-foreground">
            Connect with people worldwide
          </p>
        </div>

        <Tabs defaultValue="login" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => handleEmailLogin(false)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <Button
                variant="link"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-sm text-muted-foreground"
              >
                Forgot password?
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => handleEmailLogin(true)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading
                  ? "Creating account..."
                  : "Create Account"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">
              or
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => handleSocialLogin("google")}
              disabled={isLoading}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Continue with Google
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSocialLogin("facebook")}
              disabled={isLoading}
              className="w-full"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Continue with Facebook
            </Button>
          </div>
        </div>

        {/* Privacy Links */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>By continuing, you agree to our</p>
          <div className="flex justify-center gap-4">
            <Button
              variant="link"
              className="p-0 h-auto text-sm text-primary"
            >
              Terms of Service
            </Button>
            <Button
              variant="link"
              className="p-0 h-auto text-sm text-primary"
            >
              Privacy Policy
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}