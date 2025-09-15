import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Crown, Check, Users } from 'lucide-react';
import type { Screen } from '../types';

interface GenderSelectProps {
  selectedGender: 'male' | 'female' | 'other' | null;
  onSelect: (gender: 'male' | 'female' | 'other' | null) => void;
  navigateTo: (screen: Screen) => void;
}

const genderOptions = [
  {
    value: 'male' as const,
    label: 'Male',
    icon: '👨',
    description: 'Match with male users only'
  },
  {
    value: 'female' as const,
    label: 'Female',
    icon: '👩',
    description: 'Match with female users only'
  },
  {
    value: 'other' as const,
    label: 'Other',
    icon: '🧑',
    description: 'Match with non-binary users'
  },
  {
    value: null,
    label: 'Any Gender',
    icon: '👥',
    description: 'Match with users of any gender'
  }
];

export function GenderSelect({ selectedGender, onSelect, navigateTo }: GenderSelectProps) {
  const [tempSelected, setTempSelected] = useState(selectedGender);

  const handleConfirm = () => {
    onSelect(tempSelected);
    navigateTo('home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo('home')}
            className="w-8 h-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Select Gender Filter</h1>
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3 text-primary" />
              <span className="text-xs text-muted-foreground">Premium Feature</span>
            </div>
          </div>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20">
          Optional
        </Badge>
      </div>

      {/* Info Card */}
      <div className="p-4">
        <Card className="glass bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Gender Filtering</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Choose who you'd like to connect with. This filter is optional and can be changed anytime.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gender Options */}
      <div className="px-4 pb-24 space-y-3">
        {genderOptions.map((option) => (
          <Card
            key={option.value || 'any'}
            className={`glass p-4 cursor-pointer transition-all hover:scale-[1.02] ${
              tempSelected === option.value
                ? 'border-primary bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setTempSelected(option.value)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center text-2xl">
                  {option.icon}
                </div>
                <div>
                  <h3 className="font-medium">{option.label}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
              {tempSelected === option.value && (
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border/50">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigateTo('home')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            Confirm Selection
          </Button>
        </div>
      </div>
    </div>
  );
}