'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, TrendingUp, Target, Calendar, Loader2, Plus, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { ChallengeDashboard } from '@/components/challenges/ChallengeDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { subscribeToUserChallenges, getChallengeStatus } from '@/lib/challenges-api';
import { subscribeToUserWeightLogs } from '@/lib/challenges-api';
import { Challenge } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [userWeights, setUserWeights] = useState<Record<string, number | null>>({});

  // Real-time subscription for user challenges
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserChallenges(user.uid, (challengesData) => {
      console.log('📊 Dashboard: Received challenges:', challengesData.length);
      setChallenges(challengesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time subscriptions for weight logs for each challenge
  useEffect(() => {
    if (!user || challenges.length === 0) return;

    const unsubscribes: (() => void)[] = [];
    const weights: Record<string, number | null> = {};

    challenges.forEach((challenge) => {
      const unsubscribe = subscribeToUserWeightLogs(user.uid, challenge.id, (logs) => {
        // Update latest weight
        if (logs.length > 0) {
          weights[challenge.id] = logs[0].weight; // logs are ordered by loggedAt desc
        } else {
          weights[challenge.id] = null;
        }
        
        setUserWeights({ ...weights });
      });
      
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user, challenges]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your weight challenge progress.
          </p>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Calculate statistics
  const activeChallenges = challenges.filter(challenge => getChallengeStatus(challenge) === 'active');
  const completedChallenges = challenges.filter(challenge => getChallengeStatus(challenge) === 'completed');
  const upcomingChallenges = challenges.filter(challenge => getChallengeStatus(challenge) === 'upcoming');
  
  // Get current weight from the most recent active challenge
  const currentWeight = activeChallenges.length > 0 
    ? userWeights[activeChallenges[0].id] 
    : null;

  // Get recent challenges (last 3)
  const recentChallenges = challenges.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your weight challenge progress.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/challenges">
              <Trophy className="h-4 w-4 mr-2" />
              View All
            </Link>
          </Button>
          <Button asChild>
            <Link href="/challenges/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Challenge
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Challenges</h3>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{challenges.length}</div>
          <p className="text-xs text-muted-foreground">
            {activeChallenges.length} active, {completedChallenges.length} completed
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Active Challenges</h3>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{activeChallenges.length}</div>
          <p className="text-xs text-muted-foreground">
            {upcomingChallenges.length} upcoming
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Current Weight</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {currentWeight ? `${currentWeight} kg` : '--'}
          </div>
          <p className="text-xs text-muted-foreground">
            {currentWeight ? 'Latest logged weight' : 'Log your first weight'}
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Completion Rate</h3>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {challenges.length > 0 
              ? `${Math.round((completedChallenges.length / challenges.length) * 100)}%`
              : '--'
            }
          </div>
          <p className="text-xs text-muted-foreground">
            {completedChallenges.length} of {challenges.length} challenges
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      {challenges.length > 0 ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {activeChallenges.length > 0 && (
              <TabsTrigger value="active-dashboards">Active Challenge Dashboards</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Challenges */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Challenges</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/challenges">View All</Link>
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    userLatestWeight={userWeights[challenge.id]}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {activeChallenges.length > 0 && (
            <TabsContent value="active-dashboards" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Active Challenge Dashboards</h2>
                </div>
                <p className="text-muted-foreground">
                  Detailed participant progress and statistics for your active challenges
                </p>
              </div>

              {/* Active Challenge Dashboards */}
              <div className="space-y-8">
                {activeChallenges.map((challenge) => (
                  <div key={challenge.id} className="border rounded-lg p-6 bg-card">
                    <ChallengeDashboard 
                      challenge={challenge} 
                      currentUserId={user.uid}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        /* Empty state */
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No challenges yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven&apos;t joined any weight challenges yet. Create your first challenge or join an existing one to get started.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/challenges/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Challenge
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/challenges/join">
                  <Users className="h-4 w-4 mr-2" />
                  Join Challenge
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 