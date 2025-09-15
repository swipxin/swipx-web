import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Loader2, X, Globe, Users, Crown } from 'lucide-react';
import { toast } from 'sonner';
import type { User, Screen } from '../types';

interface MatchingProps {
  user: User | null;
  selectedCountry: string | null;
  selectedGender: 'male' | 'female' | 'other' | null;
  navigateTo: (screen: Screen) => void;
}

const matchingTips = [
  "Be respectful and friendly to make great connections!",
  "Make sure you have good lighting for the best video quality.",
  "A stable internet connection ensures smooth video calls.",
  "Smile! It makes you more approachable and friendly.",
  "Keep conversations light and fun to start with.",
  "Remember that everyone is here to meet new people just like you!"
];

export function Matching({ user, selectedCountry, selectedGender, navigateTo }: MatchingProps) {
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [isSearching, setIsSearching] = useState(true);

  useEffect(() => {
    if (!user) {
      navigateTo('auth');
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Simulate finding a match
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsSearching(false);
            toast.success('Match found! Connecting...');
            setTimeout(() => {
              navigateTo('video-call');
            }, 1500);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 800);

    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % matchingTips.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, [user, navigateTo]);

  const handleCancel = () => {
    setIsSearching(false);
    navigateTo('home');
  };

  const getFilterText = () => {
    if (user?.isPremium) {
      const country = selectedCountry || 'Any Country';
      const gender = selectedGender ? 
        selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1) : 'Any Gender';
      return `${country} • ${gender}`;
    }
    return 'Global (India preferred) • Same gender preferred';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-xl font-semibold">Finding Your Match</h1>
          <p className="text-sm text-muted-foreground">Please wait while we connect you</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="w-8 h-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* Animated Loader */}
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center animate-pulse">
              {isSearching ? (
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              ) : (
                <div className="w-8 h-8 bg-white rounded-full animate-bounce" />
              )}
            </div>
          </div>
          
          {/* Ripple Effect */}
          {isSearching && (
            <>
              <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping" />
              <div className="absolute inset-0 border-4 border-accent/30 rounded-full animate-ping animation-delay-1000" />
            </>
          )}
        </div>

        {/* Status */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-semibold">
            {isSearching ? 'Searching for someone...' : 'Match found!'}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <Progress value={progress} className="w-48 h-2" />
            <span className="text-sm text-muted-foreground min-w-[3rem]">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Current Filters */}
        <Card className="glass p-4 w-full max-w-md">
          <h3 className="font-medium mb-3 text-center">Current Filters</h3>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {user.isPremium ? (
                <Crown className="w-4 h-4 text-primary" />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground" />
              )}
              <Badge 
                variant={user.isPremium ? "default" : "secondary"}
                className={user.isPremium ? "bg-gradient-to-r from-primary to-accent" : ""}
              >
                {getFilterText()}
              </Badge>
            </div>
            {user.isPremium && (
              <p className="text-xs text-muted-foreground text-center">
                Premium strict matching active
              </p>
            )}
          </div>
        </Card>

        {/* Tips */}
        <Card className="glass p-4 w-full max-w-md">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Pro Tip</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {matchingTips[currentTip]}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="flex items-center gap-6 text-center">
          <div>
            <div className="text-lg font-semibold text-primary">1.2M+</div>
            <div className="text-xs text-muted-foreground">Active Users</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <div className="text-lg font-semibold text-accent">250+</div>
            <div className="text-xs text-muted-foreground">Countries</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <div className="text-lg font-semibold text-primary">99.9%</div>
            <div className="text-xs text-muted-foreground">Uptime</div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-6">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="w-full glass"
        >
          Cancel Search
        </Button>
      </div>
    </div>
  );
}