'use client';

import { Suspense } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ChallengesClient from './ChallengesClient';

// Loading component
function ChallengesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Create Challenge
        </Button>
      </div>
      
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </div>
  );
}

// Main client component
export default function ChallengesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Challenges</h1>
          <p className="text-muted-foreground">
            Manage your active weight challenges and track progress.
          </p>
        </div>
        <Button asChild>
          <Link href="/challenges/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Challenge
          </Link>
        </Button>
      </div>

      <Suspense fallback={<ChallengesLoading />}>
        <ChallengesClient initialChallenges={[]} />
      </Suspense>
    </div>
  );
} 