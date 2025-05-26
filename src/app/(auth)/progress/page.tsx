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
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch weight logs for user (now global, not per challenge)
  useEffect(() => {
    async function loadWeightLogs() {
      try {
        setLoading(true);
        const logs = await fetchWeightLogs();
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
  }, []);

  const progressStats = calculateProgressStats(weightLogs);

  if (loading) {
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
            Your weight tracking over time - visible across all your challenges
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
                Start logging your weight to see your progress chart
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


    </div>
  );
} 