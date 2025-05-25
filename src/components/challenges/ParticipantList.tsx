'use client';

import React from 'react';
import { ParticipantData } from '@/lib/challenges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  TrendingDown, 
  TrendingUp, 
  Calendar,
  Loader2,
  Medal,
  Crown
} from 'lucide-react';
import { format } from 'date-fns';

interface ParticipantListProps {
  participants: ParticipantData[];
  loading?: boolean;
  currentUserId?: string;
}

export default function ParticipantList({ 
  participants, 
  loading = false, 
  currentUserId 
}: ParticipantListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Participant Progress</CardTitle>
          <CardDescription>
            Track how everyone is doing in the challenge
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

  if (participants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Participant Progress</CardTitle>
          <CardDescription>
            Track how everyone is doing in the challenge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2" />
            <p>No participants yet</p>
            <p className="text-sm">Invite friends to join the challenge</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Participant Progress
        </CardTitle>
        <CardDescription>
          Current rankings based on weight loss progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {participants.map((participant, index) => {
            const isCurrentUser = participant.user.id === currentUserId;
            
            return (
              <div
                key={participant.user.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  isCurrentUser 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index)}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  {participant.user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={participant.user.photoURL} 
                      alt={participant.user.displayName || participant.user.email}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-muted text-muted-foreground text-sm font-medium">
                      {getInitials(participant.user.displayName, participant.user.email)}
                    </div>
                  )}
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {participant.user.displayName || participant.user.email}
                      {isCurrentUser && (
                        <span className="text-sm text-muted-foreground ml-1">(You)</span>
                      )}
                    </p>
                    {getRankBadge(index)}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>Current: {participant.latestWeight ? `${participant.latestWeight} kg` : '--'}</span>
                    </div>
                    
                    {participant.lastLoggedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Last: {format(new Date(participant.lastLoggedAt), 'MMM dd')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weight Loss */}
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    {getWeightLossIcon(participant.weightLoss)}
                    <span className={`font-medium ${
                      participant.weightLoss && participant.weightLoss > 0 
                        ? 'text-green-600' 
                        : participant.weightLoss && participant.weightLoss < 0
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                    }`}>
                      {formatWeightLoss(participant.weightLoss)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {participant.weightLoss !== null ? 'lost' : 'no data'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {participants.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total participants: {participants.length}</span>
              <span>Rankings update in real-time</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 