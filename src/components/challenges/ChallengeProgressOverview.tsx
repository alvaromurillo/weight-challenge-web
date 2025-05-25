'use client';

import { Challenge } from '@/types';
import { getChallengeStatus, ParticipantData } from '@/lib/challenges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingDown,
  Target,
  Clock,
  Award,
  Activity
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface ChallengeProgressOverviewProps {
  challenge: Challenge;
  participants: ParticipantData[];
  currentUserId: string;
  userLatestWeight?: number | null;
}

export function ChallengeProgressOverview({ 
  challenge, 
  participants, 
  currentUserId,
  userLatestWeight 
}: ChallengeProgressOverviewProps) {
  const status = getChallengeStatus(challenge);
  
  // Calculate challenge progress
  const startDate = challenge.startDate ? new Date(challenge.startDate) : new Date();
  const endDate = new Date(challenge.endDate);
  const now = new Date();
  const totalDays = differenceInDays(endDate, startDate);
  const daysElapsed = Math.max(0, differenceInDays(now, startDate));
  const daysRemaining = Math.max(0, differenceInDays(endDate, now));
  const progressPercentage = totalDays > 0 ? Math.min(100, (daysElapsed / totalDays) * 100) : 0;

  // Calculate participant statistics
  const activeParticipants = participants.filter(p => p.latestWeight !== null).length;
  const totalWeightLoss = participants.reduce((sum, p) => sum + (p.weightLoss || 0), 0);
  const averageWeightLoss = participants.length > 0 ? totalWeightLoss / participants.length : 0;
  
  // Find current user's data
  const currentUserData = participants.find(p => p.user.id === currentUserId);
  const userRank = participants.findIndex(p => p.user.id === currentUserId) + 1;

  const getStatusBadge = () => {
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

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const getDaysRemainingText = () => {
    if (status === 'completed') return 'Challenge completed';
    if (status === 'upcoming') return `Starts in ${Math.abs(daysElapsed)} days`;
    if (daysRemaining === 0) return 'Ends today';
    if (daysRemaining === 1) return '1 day remaining';
    return `${daysRemaining} days remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Challenge Header with Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{challenge.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{challenge.description}</p>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Challenge Progress</span>
                <span className="font-medium">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress 
                value={progressPercentage} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatDate(startDate)}</span>
                <span>{getDaysRemainingText()}</span>
                <span>{formatDate(endDate)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Days Remaining */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Left</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status === 'completed' ? 'Done' : `${daysRemaining}d`}
            </div>
            <p className="text-xs text-muted-foreground">
              {getDaysRemainingText()}
            </p>
          </CardContent>
        </Card>

        {/* Active Participants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeParticipants}/{challenge.participants.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Participants logging
            </p>
          </CardContent>
        </Card>

        {/* Your Rank */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRank > 0 ? `#${userRank}` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userRank > 0 ? `of ${participants.length}` : 'Start logging'}
            </p>
          </CardContent>
        </Card>

        {/* Your Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Loss</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentUserData?.weightLoss ? `${currentUserData.weightLoss.toFixed(1)}kg` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userLatestWeight ? `Current: ${userLatestWeight}kg` : 'No data yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Challenge Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight Lost</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalWeightLoss.toFixed(1)} kg
            </div>
            <p className="text-xs text-muted-foreground">
              Combined by all participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Loss</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageWeightLoss.toFixed(1)} kg
            </div>
            <p className="text-xs text-muted-foreground">
              Per participant average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participation</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((activeParticipants / challenge.participants.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Active engagement rate
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 