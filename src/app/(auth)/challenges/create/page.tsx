'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CreateChallengeForm from '@/components/forms/CreateChallengeForm';
import InvitationCodeShare from '@/components/challenges/InvitationCodeShare';
import { Challenge } from '@/types';

export default function CreateChallengePage() {
  const [challengeCreated, setChallengeCreated] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const router = useRouter();

  const handleSuccess = (challengeId: string, invitationCode: string) => {
    // Create a mock challenge object for the sharing component
    const mockChallenge: Challenge = {
      id: challengeId,
      name: 'New Challenge', // This will be updated when we fetch the actual challenge
      description: '',
      creatorId: '',
      invitationCode,
      startDate: new Date(),
      endDate: new Date(),
      joinByDate: new Date(),
      isActive: true,
      isArchived: false,
      participants: [],
      memberCount: 0,
      participantLimit: 50,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Fetch the actual challenge data
    fetchChallengeData(challengeId, mockChallenge);
    setChallengeCreated(true);
  };

  const fetchChallengeData = async (challengeId: string, mockChallenge: Challenge) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setChallenge({
            ...data.data,
            startDate: new Date(data.data.startDate),
            endDate: new Date(data.data.endDate),
            createdAt: new Date(data.data.createdAt),
            updatedAt: new Date(data.data.updatedAt)
          });
        } else {
          setChallenge(mockChallenge);
        }
      } else {
        setChallenge(mockChallenge);
      }
    } catch (error) {
      console.error('Error fetching challenge data:', error);
      setChallenge(mockChallenge);
    }
  };

  const handleCancel = () => {
    router.push('/challenges');
  };

  if (challengeCreated && challenge) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/challenges">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Challenges
            </Link>
          </Button>
        </div>

        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600">Challenge Created Successfully! 🎉</CardTitle>
            <CardDescription>
              Your challenge &ldquo;{challenge.name}&rdquo; has been created. Share the invitation with friends below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <InvitationCodeShare challenge={challenge} variant="compact" />

            <div className="flex gap-4">
              <Button 
                onClick={() => router.push(`/challenges/${challenge.id}`)}
                className="flex-1"
              >
                View Challenge
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/challenges">
                  My Challenges
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/challenges">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Challenges
          </Link>
        </Button>
      </div>

      <CreateChallengeForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
} 