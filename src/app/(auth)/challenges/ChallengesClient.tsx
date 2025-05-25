'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Plus, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { ChallengeSearchFilter } from '@/components/challenges/ChallengeSearchFilter';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUserChallenges,
  getUserLatestWeight,
  getChallengeStatus,
  subscribeToUserChallenges, 
  getChallengeParticipants,
  type ParticipantData
} from '@/lib/challenges-api';
import { 
  type ChallengeFilters,
  getDefaultChallengeFilters,
  filterAndSortChallenges
} from '@/lib/challenges';
import { Challenge } from '@/types';
import Link from 'next/link';

interface ChallengesClientProps {
  initialChallenges: Challenge[];
}

interface ChallengeStats {
  participantCount: number;
  activeParticipants: number;
}

export default function ChallengesClient({ initialChallenges }: ChallengesClientProps) {
  const { user, loading: authLoading } = useAuth();
  const [allChallenges, setAllChallenges] = useState<Challenge[]>(initialChallenges);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userWeights, setUserWeights] = useState<Record<string, number | null>>({});
  const [challengeStats, setChallengeStats] = useState<Record<string, ChallengeStats>>({});
  const [filters, setFilters] = useState<ChallengeFilters>(getDefaultChallengeFilters());

  // Apply filters and sorting to challenges
  const filteredChallenges = useMemo(() => {
    return filterAndSortChallenges(allChallenges, filters);
  }, [allChallenges, filters]);

  useEffect(() => {
    console.log('🎯 ChallengesClient: Auth state changed', { 
      user: user?.email || 'No user', 
      authLoading,
      userExists: !!user 
    });

    // If still loading auth, wait
    if (authLoading) {
      console.log('🎯 ChallengesClient: Still loading auth, waiting...');
      return;
    }

    // If no user after auth loading is complete, stop loading
    if (!user) {
      console.log('🎯 ChallengesClient: No user found after auth loading completed');
      setLoading(false);
      setError('No user authenticated');
      return;
    }

    console.log('🎯 ChallengesClient: User authenticated, setting up challenges subscription');
    setError(null);

    // Set up real-time listener for user's challenges
    try {
      const unsubscribe = subscribeToUserChallenges(user.uid, async (challengesData) => {
        console.log('🎯 Challenges Page: Received challenges:', challengesData.length);
        setAllChallenges(challengesData);
        setLoading(false);

        // Fetch latest weights and participant stats for each challenge
        const weights: Record<string, number | null> = {};
        const stats: Record<string, ChallengeStats> = {};
        
        for (const challenge of challengesData) {
          try {
            // Fetch user's latest weight
            const weight = await getUserLatestWeight(user.uid, challenge.id);
            weights[challenge.id] = weight;

            // Fetch participant data to calculate stats
            const participants = await getChallengeParticipants(challenge.id, challenge.participants);
            const activeParticipants = participants.filter(p => p.latestWeight !== null).length;
            
            stats[challenge.id] = {
              participantCount: challenge.participants.length,
              activeParticipants: activeParticipants
            };
          } catch (error) {
            console.error(`Error fetching data for challenge ${challenge.id}:`, error);
            weights[challenge.id] = null;
            stats[challenge.id] = {
              participantCount: challenge.participants.length,
              activeParticipants: 0
            };
          }
        }
        
        setUserWeights(weights);
        setChallengeStats(stats);
      });

      return () => {
        console.log('🎯 ChallengesClient: Cleaning up challenges subscription');
        unsubscribe();
      };
    } catch (error) {
      console.error('🎯 ChallengesClient: Error setting up subscription:', error);
      setError(`Failed to load challenges: ${error}`);
      setLoading(false);
    }
  }, [user, authLoading]);

  // Add timeout for loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !authLoading) {
        console.warn('🎯 ChallengesClient: Loading timeout reached');
        setError('Loading timeout - please refresh the page');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading, authLoading]);

  console.log('🎯 ChallengesClient: Render state', { 
    authLoading, 
    loading, 
    hasUser: !!user, 
    error,
    challengesCount: allChallenges.length 
  });

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Authentication Required</p>
          <p className="text-muted-foreground mb-4">Please log in to view your challenges.</p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2 text-red-600">Error</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Show loading while fetching challenges
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      {allChallenges.length > 0 && (
        <ChallengeSearchFilter
          filters={filters}
          onFiltersChange={setFilters}
          resultsCount={filteredChallenges.length}
        />
      )}

      {allChallenges.length === 0 ? (
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
      ) : filteredChallenges.length === 0 ? (
        /* No results state */
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No challenges found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              No challenges match your current search and filter criteria. Try adjusting your filters or search terms.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setFilters(getDefaultChallengeFilters())}
            >
              Clear all filters
            </Button>
          </div>
        </div>
      ) : (
        /* Challenges grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              userLatestWeight={userWeights[challenge.id]}
              participantCount={challengeStats[challenge.id]?.participantCount}
              activeParticipants={challengeStats[challenge.id]?.activeParticipants}
            />
          ))}
        </div>
      )}
    </div>
  );
} 