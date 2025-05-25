'use client';

import { Challenge } from '@/types';
import { getChallengeStatus } from '@/lib/challenges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArchiveButton } from '@/components/challenges/ArchiveButton';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, 
  Users, 
  TrendingDown, 
  Clock, 
  Target
} from 'lucide-react';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';

interface ChallengeCardProps {
  challenge: Challenge;
  userLatestWeight?: number | null;
  participantCount?: number;
  activeParticipants?: number;
}

export function ChallengeCard({ 
  challenge, 
  userLatestWeight,
  participantCount,
  activeParticipants 
}: ChallengeCardProps) {
  const { user } = useAuth();
  const status = getChallengeStatus(challenge);
  const isCreator = user?.uid === challenge.creatorId;
  
  // Calculate progress - handle null startDate
  const startDate = challenge.startDate ? new Date(challenge.startDate) : new Date();
  const endDate = new Date(challenge.endDate);
  const now = new Date();
  
  // If startDate is null/undefined, use current date or a reasonable default
  const effectiveStartDate = challenge.startDate ? startDate : now;
  
  const totalDays = differenceInDays(endDate, effectiveStartDate);
  const daysElapsed = Math.max(0, differenceInDays(now, effectiveStartDate));
  const daysRemaining = Math.max(0, differenceInDays(endDate, now));
  const progressPercentage = totalDays > 0 ? Math.min(100, (daysElapsed / totalDays) * 100) : 0;
  
  const getStatusBadge = () => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Upcoming</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Completed</Badge>;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'upcoming':
        return 'border-blue-200 bg-blue-50/50 hover:bg-blue-50';
      case 'active':
        return 'border-green-200 bg-green-50/50 hover:bg-green-50';
      case 'completed':
        return 'border-gray-200 bg-gray-50/50 hover:bg-gray-50';
      default:
        return 'hover:bg-gray-50';
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Not set';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      console.warn('Error formatting date:', date, error);
      return 'Invalid date';
    }
  };

  const getDaysRemainingText = () => {
    if (status === 'completed') return 'Challenge completed';
    if (status === 'upcoming') return `Starts in ${Math.abs(daysElapsed)} days`;
    if (daysRemaining === 0) return 'Ends today';
    if (daysRemaining === 1) return '1 day left';
    return `${daysRemaining} days left`;
  };

  return (
    <Card className={`transition-all hover:shadow-lg ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{challenge.name}</CardTitle>
              {getStatusBadge()}
            </div>
            {challenge.description && (
              <CardDescription className="text-sm line-clamp-2">
                {challenge.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar for Active Challenges */}
        {status === 'active' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>
        )}

        {/* Challenge Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{formatDate(challenge.startDate)}</span>
              <span className="text-xs text-muted-foreground">Start date</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{getDaysRemainingText()}</span>
              <span className="text-xs text-muted-foreground">
                {status === 'active' ? 'Time left' : 'Status'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">
                {participantCount || challenge.participants.length} participants
              </span>
              <span className="text-xs text-muted-foreground">
                {activeParticipants ? `${activeParticipants} active` : 'Total joined'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {userLatestWeight ? (
              <>
                <TrendingDown className="h-4 w-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-green-600">{userLatestWeight} kg</span>
                  <span className="text-xs text-muted-foreground">Your weight</span>
                </div>
              </>
            ) : (
              <>
                <Target className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">No data</span>
                  <span className="text-xs text-muted-foreground">Start logging</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/challenges/${challenge.id}`}>
              View Details
            </Link>
          </Button>
          {status === 'active' && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/progress?challenge=${challenge.id}`}>
                Log Weight
              </Link>
            </Button>
          )}
          {isCreator && (
            <ArchiveButton 
              challenge={challenge} 
              variant="outline" 
              size="sm"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
} 