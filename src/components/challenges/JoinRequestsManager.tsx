'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, User, Target, Scale } from 'lucide-react';
import { JoinRequest } from '@/types';
import { subscribeToJoinRequests, approveJoinRequest, rejectJoinRequest } from '@/lib/join-requests-api';
import { toast } from 'sonner';

interface JoinRequestsManagerProps {
  challengeId: string;
  isCreator: boolean;
}

export default function JoinRequestsManager({ challengeId, isCreator }: JoinRequestsManagerProps) {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isCreator) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToJoinRequests(
      challengeId,
      (requests) => {
        setJoinRequests(requests);
        setLoading(false);
      },
      (error) => {
        console.error('Error subscribing to join requests:', error);
        toast.error('Failed to load join requests');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [challengeId, isCreator]);

  const handleApprove = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      const result = await approveJoinRequest(requestId);
      
      if (result.success) {
        toast.success(result.message || 'Join request approved successfully');
        // The real-time subscription will update the UI automatically
      } else {
        toast.error('Failed to approve join request');
      }
    } catch (error) {
      console.error('Error approving join request:', error);
      toast.error('Failed to approve join request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      const result = await rejectJoinRequest(requestId);
      
      if (result.success) {
        toast.success(result.message || 'Join request rejected');
        // The real-time subscription will update the UI automatically
      } else {
        toast.error('Failed to reject join request');
      }
    } catch (error) {
      console.error('Error rejecting join request:', error);
      toast.error('Failed to reject join request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const formatWeight = (weight: number) => {
    return `${weight} kg`;
  };

  const getGoalTypeIcon = (goalType: 'gain' | 'lose') => {
    return goalType === 'lose' ? '📉' : '📈';
  };

  const getGoalTypeText = (goalType: 'gain' | 'lose') => {
    return goalType === 'lose' ? 'Lose Weight' : 'Gain Weight';
  };

  if (!isCreator) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Join Requests
          </CardTitle>
          <CardDescription>
            Loading pending join requests...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (joinRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Join Requests
          </CardTitle>
          <CardDescription>
            Manage pending requests to join your challenge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No pending join requests</p>
            <p className="text-sm text-muted-foreground mt-1">
              New requests will appear here when users want to join your challenge
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Join Requests
          <Badge variant="secondary" className="ml-auto">
            {joinRequests.length} pending
          </Badge>
        </CardTitle>
        <CardDescription>
          Review and approve requests to join your challenge
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {joinRequests.map((request, index) => (
          <div key={request.id}>
            <div className="flex items-start space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={request.userPhotoURL} alt={request.userDisplayName} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{request.userDisplayName}</h4>
                    {request.userEmail && (
                      <p className="text-sm text-muted-foreground">{request.userEmail}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.requestedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Goal:</span>
                    <Badge variant="outline" className="text-xs">
                      {getGoalTypeIcon(request.goalType)} {getGoalTypeText(request.goalType)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Start:</span>
                    <span className="font-medium">{formatWeight(request.startWeight)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium">{formatWeight(request.targetWeight)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(request.id)}
                    disabled={processingRequests.has(request.id)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {processingRequests.has(request.id) ? 'Approving...' : 'Approve'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    disabled={processingRequests.has(request.id)}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    {processingRequests.has(request.id) ? 'Rejecting...' : 'Reject'}
                  </Button>
                </div>
              </div>
            </div>
            
            {index < joinRequests.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 