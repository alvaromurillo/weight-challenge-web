'use client';

import React, { useState, useEffect } from 'react';
import { Challenge } from '@/types';
import { getChallengeParticipants, getChallengeStatus, type ParticipantData } from '@/lib/challenges-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  Target,
  Activity,
  Crown,
  Medal,
  Loader2,
  BarChart3,
  Clock
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import Link from 'next/link';

interface ChallengeDashboardProps {
  challenge: Challenge;
  currentUserId: string;
}

interface ChallengeStats {
  totalParticipants: number;
  activeParticipants: number;
  averageWeightLoss: number;
  totalWeightLoss: number;
  topPerformer: ParticipantData | null;
  participationRate: number;
  daysRemaining: number;
  progressPercentage: number;
}

export function ChallengeDashboard({ challenge, currentUserId }: ChallengeDashboardProps) {
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ChallengeStats | null>(null);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setLoading(true);
        const participantsData = await getChallengeParticipants(challenge.id, challenge.participants);
        setParticipants(participantsData);
        
        // Calculate challenge statistics
        const challengeStats = calculateChallengeStats(challenge, participantsData);
        setStats(challengeStats);
      } catch (error) {
        console.error('Error fetching participants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [challenge]);

  const calculateChallengeStats = (challenge: Challenge, participants: ParticipantData[]): ChallengeStats => {
    const startDate = challenge.startDate ? new Date(challenge.startDate) : new Date();
    const endDate = new Date(challenge.endDate);
    const now = new Date();
    
    const totalDays = differenceInDays(endDate, startDate);
    const daysElapsed = Math.max(0, differenceInDays(now, startDate));
    const daysRemaining = Math.max(0, differenceInDays(endDate, now));
    const progressPercentage = totalDays > 0 ? Math.min(100, (daysElapsed / totalDays) * 100) : 0;

    const activeParticipants = participants.filter(p => p.latestWeight !== null).length;
    const totalWeightLoss = participants.reduce((sum, p) => sum + (p.weightLoss || 0), 0);
    const averageWeightLoss = participants.length > 0 ? totalWeightLoss / participants.length : 0;
    const topPerformer = participants.length > 0 ? participants[0] : null;
    const participationRate = participants.length > 0 ? (activeParticipants / participants.length) * 100 : 0;

    return {
      totalParticipants: participants.length,
      activeParticipants,
      averageWeightLoss,
      totalWeightLoss,
      topPerformer,
      participationRate,
      daysRemaining,
      progressPercentage
    };
  };

  const getStatusBadge = () => {
    const status = getChallengeStatus(challenge);
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Completed</Badge>;
      default:
        return null;
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">1st Place</Badge>;
      case 1:
        return <Badge variant="secondary">2nd Place</Badge>;
      case 2:
        return <Badge variant="outline">3rd Place</Badge>;
      default:
        return null;
    }
  };

  const formatWeightLoss = (weightLoss: number | null) => {
    if (weightLoss === null) return '--';
    if (weightLoss > 0) return `${weightLoss.toFixed(1)} kg`;
    if (weightLoss < 0) return `+${Math.abs(weightLoss).toFixed(1)} kg`;
    return '0 kg';
  };

  const getWeightLossIcon = (weightLoss: number | null) => {
    if (weightLoss === null) return null;
    if (weightLoss > 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    if (weightLoss < 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getInitials = (name: string | undefined, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getDaysRemainingText = () => {
    const status = getChallengeStatus(challenge);
    if (status === 'completed') return 'Challenge completed';
    if (status === 'upcoming') return `Starts in ${Math.abs(stats?.daysRemaining || 0)} days`;
    if (stats?.daysRemaining === 0) return 'Ends today';
    if (stats?.daysRemaining === 1) return '1 day remaining';
    return `${stats?.daysRemaining} days remaining`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Challenge Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive overview of participant progress and challenge statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Challenge Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {challenge.name} Dashboard
              </CardTitle>
              <CardDescription>{challenge.description}</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Challenge Progress</span>
                  <span className="font-medium">{Math.round(stats.progressPercentage)}%</span>
                </div>
                <Progress value={stats.progressPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{challenge.startDate ? format(new Date(challenge.startDate), 'MMM dd, yyyy') : 'TBD'}</span>
                  <span>{getDaysRemainingText()}</span>
                  <span>{format(new Date(challenge.endDate), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Participants */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParticipants}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeParticipants} actively logging
              </p>
            </CardContent>
          </Card>

          {/* Participation Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.participationRate)}%</div>
              <p className="text-xs text-muted-foreground">
                Active participation rate
              </p>
            </CardContent>
          </Card>

          {/* Average Weight Loss */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatWeightLoss(stats.averageWeightLoss)}</div>
              <p className="text-xs text-muted-foreground">
                Average weight loss
              </p>
            </CardContent>
          </Card>

          {/* Days Remaining */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Left</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getChallengeStatus(challenge) === 'completed' ? 'Done' : `${stats.daysRemaining}d`}
              </div>
              <p className="text-xs text-muted-foreground">
                {getDaysRemainingText()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Views */}
      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="progress">Progress Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Participant Rankings
              </CardTitle>
              <CardDescription>
                Current standings based on weight loss progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p>No participants yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {participants.map((participant, index) => (
                    <div
                      key={participant.user.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        participant.user.id === currentUserId 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankIcon(index)}
                        </div>
                        <Avatar className="h-10 w-10">
                          <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-600 text-sm font-medium">
                            {getInitials(participant.user.displayName, participant.user.email)}
                          </div>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {participant.user.displayName || participant.user.email}
                            </p>
                            {participant.user.id === currentUserId && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                            {getRankBadge(index)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {getWeightLossIcon(participant.weightLoss)}
                            <span>{formatWeightLoss(participant.weightLoss)}</span>
                            {participant.latestWeight && (
                              <span>• Current: {participant.latestWeight} kg</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {participant.weightLogs.length} logs
                        </p>
                        {participant.lastLoggedAt && (
                          <p className="text-xs text-muted-foreground">
                            Last: {format(new Date(participant.lastLoggedAt), 'MMM dd')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Progress Overview
              </CardTitle>
              <CardDescription>
                Detailed progress statistics for all participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2" />
                  <p>No progress data available</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress Distribution */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Weight Loss Distribution</h4>
                    <div className="space-y-2">
                      {participants.map((participant) => (
                        <div key={participant.user.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{participant.user.displayName || participant.user.email}</span>
                            <span className="font-medium">{formatWeightLoss(participant.weightLoss)}</span>
                          </div>
                          <Progress 
                            value={participant.weightLoss ? Math.min(100, (participant.weightLoss / (stats?.totalWeightLoss || 1)) * 100) : 0} 
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{formatWeightLoss(stats?.totalWeightLoss || 0)}</p>
                      <p className="text-sm text-muted-foreground">Total Weight Lost</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{formatWeightLoss(stats?.averageWeightLoss || 0)}</p>
                      <p className="text-sm text-muted-foreground">Average per Person</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{stats?.topPerformer ? formatWeightLoss(stats.topPerformer.weightLoss) : '--'}</p>
                      <p className="text-sm text-muted-foreground">Top Performance</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest weight logging activity from participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>No activity yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {participants
                    .filter(p => p.lastLoggedAt)
                    .sort((a, b) => new Date(b.lastLoggedAt!).getTime() - new Date(a.lastLoggedAt!).getTime())
                    .slice(0, 10)
                    .map((participant) => (
                      <div key={participant.user.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <Avatar className="h-8 w-8">
                          <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-600 text-xs font-medium">
                            {getInitials(participant.user.displayName, participant.user.email)}
                          </div>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {participant.user.displayName || participant.user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Logged {participant.latestWeight} kg • {format(new Date(participant.lastLoggedAt!), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getWeightLossIcon(participant.weightLoss)}
                          <span className="text-sm font-medium">{formatWeightLoss(participant.weightLoss)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button asChild>
          <Link href={`/challenges/${challenge.id}`}>
            View Challenge Details
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/weight-logging">
            Log Weight
          </Link>
        </Button>
      </div>
    </div>
  );
} 