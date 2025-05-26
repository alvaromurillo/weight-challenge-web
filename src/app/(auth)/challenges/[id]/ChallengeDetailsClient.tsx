'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  subscribeToChallenge,
  subscribeToUserWeightLogs,
  subscribeToChallengeWeightLogs,
  getChallengeParticipants,
  getChallengeStatus,
} from '@/lib/challenges-api';
import {
  getUsers,
  ParticipantData 
} from '@/lib/challenges';
import { Challenge, WeightLog } from '@/types';
import ParticipantList from '@/components/challenges/ParticipantList';
import { ChallengeProgressOverview } from '@/components/challenges/ChallengeProgressOverview';
import { WeightProgressChart } from '@/components/charts/WeightProgressChart';
import JoinRequestsManager from '@/components/challenges/JoinRequestsManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  ArrowLeft, 
  Loader2, 
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import InvitationCodeShare from '@/components/challenges/InvitationCodeShare';

interface ChallengeDetailsClientProps {
  challengeId: string;
  initialChallenge: Challenge | null;
}

export default function ChallengeDetailsClient({ challengeId, initialChallenge }: ChallengeDetailsClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(initialChallenge);
  const [loading, setLoading] = useState(!user || (!initialChallenge && !challenge));
  const [error, setError] = useState<string | null>(null);
  const [userLatestWeight, setUserLatestWeight] = useState<number | null>(null);
  const [userWeightLogs, setUserWeightLogs] = useState<WeightLog[]>([]);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [challengeWeightLogs, setChallengeWeightLogs] = useState<WeightLog[]>([]);

  // Real-time challenge data subscription
  useEffect(() => {
    if (!challengeId) return;

    const unsubscribe = subscribeToChallenge(challengeId, (challengeData) => {
      if (!challengeData) {
        setError('Challenge not found');
        setLoading(false);
        return;
      }
      
      setChallenge(challengeData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [challengeId]);

  // Real-time user weight logs subscription (now global, not per challenge)
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserWeightLogs(user.uid, (weightLogs) => {
      setUserWeightLogs(weightLogs);
      // Update latest weight (same for all challenges now)
      if (weightLogs.length > 0) {
        setUserLatestWeight(weightLogs[0].weight);
      } else {
        setUserLatestWeight(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time challenge weight logs subscription
  useEffect(() => {
    if (!challengeId) return;

    const unsubscribe = subscribeToChallengeWeightLogs(challengeId, (weightLogs) => {
      setChallengeWeightLogs(weightLogs);
    });

    return () => unsubscribe();
  }, [challengeId]);

  // Update participants when challenge or weight logs change
  useEffect(() => {
    if (!challenge || !user) return;

    // Check if user is a participant
    if (!challenge.participants.includes(user.uid)) {
      setError('You are not a participant in this challenge');
      return;
    }

    const updateParticipants = async () => {
      try {
        setParticipantsLoading(true);
        
        // Fetch all users
        const users = await getUsers(challenge.participants);
        
        // Group weight logs by user
        const weightLogsByUser = challengeWeightLogs.reduce((acc, log) => {
          if (!acc[log.userId]) {
            acc[log.userId] = [];
          }
          acc[log.userId].push(log);
          return acc;
        }, {} as Record<string, WeightLog[]>);
        
        // Build participant data
        const participantData: ParticipantData[] = users.map(user => {
          const userLogs = weightLogsByUser[user.id] || [];
          const sortedLogs = userLogs.sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
          
          const startWeight = sortedLogs.length > 0 ? sortedLogs[0].weight : null;
          const latestWeight = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1].weight : null;
          const weightLoss = startWeight && latestWeight ? startWeight - latestWeight : null;
          const lastLoggedAt = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1].loggedAt : null;
          
          return {
            user,
            latestWeight,
            weightLogs: userLogs,
            startWeight,
            weightLoss,
            lastLoggedAt,
          };
        });
        
        // Sort by weight loss (descending) - those with more weight loss first
        const sortedParticipants = participantData.sort((a, b) => {
          if (a.weightLoss === null && b.weightLoss === null) return 0;
          if (a.weightLoss === null) return 1;
          if (b.weightLoss === null) return -1;
          return b.weightLoss - a.weightLoss;
        });
        
        setParticipants(sortedParticipants);
      } catch (error) {
        console.error('Error updating participants:', error);
        // Don't set error for participants, just log it
      } finally {
        setParticipantsLoading(false);
      }
    };

    updateParticipants();
  }, [challenge, challengeWeightLogs, user]);

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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="rounded-lg border bg-destructive/10 text-destructive p-6 text-center">
          <p>{error || 'Challenge not found'}</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/challenges')} 
            className="mt-4"
          >
            Go to Challenges
          </Button>
        </div>
      </div>
    );
  }

  const isCreator = challenge.creatorId === user.uid;

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return format(new Date(date), 'EEEE, MMMM dd, yyyy');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2 ml-auto">
          <InvitationCodeShare challenge={challenge} variant="button-only" />
          {isCreator && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/challenges/${challengeId}/manage`}>
                Manage
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <ChallengeProgressOverview 
        challenge={challenge}
        participants={participants}
        currentUserId={user.uid}
        userLatestWeight={userLatestWeight}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Challenge Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Challenge Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Challenge Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Start Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(challenge.startDate)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">End Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(challenge.endDate)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <p className="text-sm text-muted-foreground">
                    {challenge.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Participants</h4>
                  <p className="text-sm text-muted-foreground">
                    {challenge.participants.length} member{challenge.participants.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invitation Sharing - Only for creators */}
          {isCreator && (
            <InvitationCodeShare challenge={challenge} variant="full" />
          )}

          {/* Weight Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Weight Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Current Weight</h4>
                    <p className="text-sm text-muted-foreground">
                      {userLatestWeight ? `${userLatestWeight} kg` : 'No weight recorded yet'}
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/progress?challenge=${challengeId}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Log Weight
                    </Link>
                  </Button>
                </div>
                
                {/* Weight Progress Chart */}
                <WeightProgressChart 
                  weightLogs={userWeightLogs}
                  height={250}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Participants Sidebar */}
        <div className="space-y-6">
          {/* Join Requests Manager - Only for creators */}
          {isCreator && (
            <JoinRequestsManager 
              challengeId={challengeId}
              isCreator={isCreator}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ParticipantList 
                participants={participants} 
                loading={participantsLoading}
                currentUserId={user.uid}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 