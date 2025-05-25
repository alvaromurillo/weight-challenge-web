'use client';

import { Suspense } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChallengeDetailsClient from './ChallengeDetailsClient';
import React from 'react';

// Loading component
function ChallengeDetailsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" disabled>
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

interface ChallengeDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Main client component
export default function ChallengeDetailsPage({ params }: ChallengeDetailsPageProps) {
  return (
    <Suspense fallback={<ChallengeDetailsLoading />}>
      <ChallengeDetailsClientWrapper params={params} />
    </Suspense>
  );
}

// Wrapper to handle params
function ChallengeDetailsClientWrapper({ params }: { params: Promise<{ id: string }> }) {
  const [challengeId, setChallengeId] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then(({ id }) => setChallengeId(id));
  }, [params]);

  if (!challengeId) {
    return <ChallengeDetailsLoading />;
  }

  return (
    <ChallengeDetailsClient 
      challengeId={challengeId}
      initialChallenge={null}
    />
  );
} 