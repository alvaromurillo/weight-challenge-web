'use client';

import { useState, useEffect } from 'react';
import { Plus, Scale, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeightLogForm from '@/components/forms/WeightLogForm';
import BulkWeightLogForm from '@/components/forms/BulkWeightLogForm';
import WeightLogHistory from '@/components/weight/WeightLogHistory';
import { Challenge } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function WeightLoggingPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [entryMode, setEntryMode] = useState<'single' | 'bulk'>('single');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchChallenges = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/challenges');
        if (!response.ok) {
          throw new Error('Failed to fetch challenges');
        }
        
        const result = await response.json();
        if (result.success && result.data && result.data.challenges && Array.isArray(result.data.challenges)) {
          // Filter for active challenges where user is a participant
          const activeChallenges = result.data.challenges.filter((challenge: Challenge) => 
            challenge.isActive && challenge.participants.includes(user.uid)
          );
          setChallenges(activeChallenges);
          
          // Auto-select the first challenge if available
          if (activeChallenges.length > 0 && !selectedChallengeId) {
            setSelectedChallengeId(activeChallenges[0].id);
          }
        } else {
          console.warn('No challenges data received or data is not an array:', result);
          setChallenges([]);
        }
      } catch (error) {
        console.error('Error fetching challenges:', error);
        setChallenges([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenges();
  }, [user, selectedChallengeId]);

  const handleWeightLogged = () => {
    setShowForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleShowForm = (mode: 'single' | 'bulk') => {
    setEntryMode(mode);
    setShowForm(true);
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weight Logging</h1>
          <p className="text-muted-foreground">
            Please log in to track your weight progress.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weight Logging</h1>
          <p className="text-muted-foreground">
            Track your weight progress across all your challenges.
          </p>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Loading challenges...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weight Logging</h1>
        <p className="text-muted-foreground">
          Track your weight progress across all your challenges.
        </p>
      </div>

      {/* Challenge Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Challenge</CardTitle>
          <CardDescription>
            Choose which challenge you want to log weight for
          </CardDescription>
        </CardHeader>
        <CardContent>
          {challenges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No active challenges</p>
              <p className="text-sm">Join or create a challenge to start logging your weight</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="challenge-select">Challenge</Label>
                <Select
                  value={selectedChallengeId}
                  onValueChange={setSelectedChallengeId}
                >
                  <SelectTrigger id="challenge-select">
                    <SelectValue placeholder="Select a challenge" />
                  </SelectTrigger>
                  <SelectContent>
                    {challenges.map((challenge) => (
                      <SelectItem key={challenge.id} value={challenge.id}>
                        {challenge.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedChallengeId && !showForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button onClick={() => handleShowForm('single')} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Single Entry
                  </Button>
                  <Button 
                    onClick={() => handleShowForm('bulk')} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Entry
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weight Logging Forms */}
      {selectedChallengeId && showForm && (
        <Tabs value={entryMode} onValueChange={(value: string) => setEntryMode(value as 'single' | 'bulk')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Single Entry
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk Entry
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="mt-6">
            <WeightLogForm
              challengeId={selectedChallengeId}
              onSuccess={handleWeightLogged}
              onCancel={() => setShowForm(false)}
            />
          </TabsContent>
          
          <TabsContent value="bulk" className="mt-6">
            <BulkWeightLogForm
              challengeId={selectedChallengeId}
              onSuccess={handleWeightLogged}
              onCancel={() => setShowForm(false)}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Weight History */}
      {selectedChallengeId && (
        <WeightLogHistory
          challengeId={selectedChallengeId}
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
} 