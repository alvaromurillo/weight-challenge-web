'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Plus, Activity, Scale, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeightProgressChart } from '@/components/charts/WeightProgressChart';
import { useAuth } from '@/hooks/useAuth';
import { getUserChallenges } from '@/lib/challenges-api';
import { fetchWeightLogs, calculateProgressStats, formatWeight } from '@/lib/weight-logs';
import { Challenge, WeightLog } from '@/types';
import { format } from 'date-fns';

export default function ProgressPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's challenges
  useEffect(() => {
    async function loadChallenges() {
      if (!user) return;
      
      try {
        setLoading(true);
        const userChallenges = await getUserChallenges(user.uid);
        setChallenges(userChallenges);
        
        // Auto-select the first active challenge
        const activeChallenge = userChallenges.find((c: Challenge) => c.isActive);
        if (activeChallenge) {
          setSelectedChallengeId(activeChallenge.id);
        } else if (userChallenges.length > 0) {
          setSelectedChallengeId(userChallenges[0].id);
        }
      } catch (err) {
        console.error('Error loading challenges:', err);
        setError('Failed to load challenges');
      } finally {
        setLoading(false);
      }
    }

    loadChallenges();
  }, [user]);

  // Fetch weight logs for selected challenge
  useEffect(() => {
    async function loadWeightLogs() {
      if (!selectedChallengeId) {
        setWeightLogs([]);
        return;
      }
      
      try {
        setLoading(true);
        const logs = await fetchWeightLogs(selectedChallengeId);
        setWeightLogs(logs);
        setError(null);
      } catch (err) {
        console.error('Error loading weight logs:', err);
        setError('Failed to load weight logs');
        setWeightLogs([]);
      } finally {
        setLoading(false);
      }
    }

    loadWeightLogs();
  }, [selectedChallengeId]);

  const selectedChallenge = challenges.find(c => c.id === selectedChallengeId);
  const progressStats = calculateProgressStats(weightLogs);

  if (loading && challenges.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Progress</h1>
            <p className="text-muted-foreground">Loading your progress data...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Progress</h1>
            <p className="text-muted-foreground">
              Track your weight loss journey and see your achievements.
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Challenges Yet</h3>
            <p className="text-muted-foreground mb-6">
              Join or create a challenge to start tracking your progress.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/challenges/create">Create Challenge</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/challenges/join">Join Challenge</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Progress</h1>
          <p className="text-muted-foreground">
            Track your weight loss journey and see your achievements.
          </p>
        </div>
        <Button asChild>
          <Link href="/weight-logging">
            <Plus className="h-4 w-4 mr-2" />
            Log Weight
          </Link>
        </Button>
      </div>

      {/* Challenge Selector */}
      {challenges.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label htmlFor="challenge-select" className="text-sm font-medium">
                Challenge:
              </label>
              <Select value={selectedChallengeId} onValueChange={setSelectedChallengeId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a challenge" />
                </SelectTrigger>
                <SelectContent>
                  {challenges.map((challenge) => (
                    <SelectItem key={challenge.id} value={challenge.id}>
                      {challenge.name} {challenge.isActive ? '(Active)' : '(Ended)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight Lost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressStats.totalWeightLoss > 0 
                ? `${formatWeight(progressStats.totalWeightLoss)}` 
                : '--'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {progressStats.totalLogs > 0 
                ? `Current: ${formatWeight(progressStats.currentWeight)}`
                : 'Start logging to see progress'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Active</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressStats.daysActive}</div>
            <p className="text-xs text-muted-foreground">
              {progressStats.totalLogs} total logs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Loss</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressStats.averageWeightLoss > 0 
                ? `${formatWeight(progressStats.averageWeightLoss)}/day`
                : '--'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Daily average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Logged</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressStats.lastLoggedDate 
                ? format(progressStats.lastLoggedDate, 'MMM dd')
                : '--'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {progressStats.lastLoggedDate 
                ? format(progressStats.lastLoggedDate, 'yyyy')
                : 'No logs yet'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weight Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weight Progress Chart</CardTitle>
          <CardDescription>
            {selectedChallenge 
              ? `Your weight tracking for "${selectedChallenge.name}"`
              : 'Your weight tracking over time'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weightLogs.length > 0 ? (
            <div className="h-[400px]">
              <WeightProgressChart 
                weightLogs={weightLogs}
                height={400}
                showGoal={false}
              />
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">No data to display</p>
              <p className="text-sm mb-4">
                {selectedChallenge 
                  ? `Start logging your weight for "${selectedChallenge.name}" to see your progress chart`
                  : 'Start logging your weight to see your progress chart'
                }
              </p>
              <Button asChild variant="outline">
                <Link href="/weight-logging">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Your First Weight
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Challenge Info */}
      {selectedChallenge && (
        <Card>
          <CardHeader>
            <CardTitle>Challenge Details</CardTitle>
            <CardDescription>Information about your selected challenge</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-1">Challenge Name</h4>
                <p className="text-sm text-muted-foreground">{selectedChallenge.name}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Status</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedChallenge.isActive ? 'Active' : 'Ended'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Start Date</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedChallenge.startDate ? format(selectedChallenge.startDate, 'PPP') : 'Not set'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">End Date</h4>
                <p className="text-sm text-muted-foreground">
                  {format(selectedChallenge.endDate, 'PPP')}
                </p>
              </div>
              {selectedChallenge.description && (
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedChallenge.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 