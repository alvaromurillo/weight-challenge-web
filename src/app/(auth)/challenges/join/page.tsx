'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Loader2, CheckCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { findChallengeByInvitationCode, joinChallenge, getChallengeStatus } from '@/lib/challenges';
import { Challenge } from '@/types';

// Form validation schema
const joinChallengeSchema = z.object({
  invitationCode: z.string()
    .min(6, 'Invitation code must be at least 6 characters')
    .max(10, 'Invitation code must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Invitation code must contain only uppercase letters and numbers'),
});

type JoinChallengeFormData = z.infer<typeof joinChallengeSchema>;

export default function JoinChallengePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundChallenge, setFoundChallenge] = useState<Challenge | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const form = useForm<JoinChallengeFormData>({
    resolver: zodResolver(joinChallengeSchema),
    defaultValues: {
      invitationCode: '',
    },
  });

  // Pre-fill invitation code from URL parameter
  useEffect(() => {
    const codeFromUrl = searchParams?.get('code');
    if (codeFromUrl) {
      form.setValue('invitationCode', codeFromUrl.toUpperCase());
    }
  }, [searchParams, form]);

  const onSubmit = async (data: JoinChallengeFormData) => {
    if (!user) {
      setError('You must be logged in to join a challenge');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFoundChallenge(null);

    try {
      // First, find the challenge by invitation code
      const challenge = await findChallengeByInvitationCode(data.invitationCode);
      
      if (!challenge) {
        setError('Invalid invitation code. Please check the code and try again.');
        return;
      }

      // Check if user is already a participant
      if (challenge.participants.includes(user.uid)) {
        setError('You are already a participant in this challenge.');
        return;
      }

      // Set found challenge for preview
      setFoundChallenge(challenge);
      
      // Join the challenge
      await joinChallenge(challenge.id, user.uid);
      
      // Show success state
      setJoinSuccess(true);
      
      // Navigate to challenge details after a short delay
      setTimeout(() => {
        router.push(`/challenges/${challenge.id}`);
      }, 2000);
      
    } catch (err: unknown) {
      console.error('Error joining challenge:', err);
      setError(err instanceof Error ? err.message : 'Failed to join challenge. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (joinSuccess && foundChallenge) {
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

        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Successfully Joined!</CardTitle>
            <CardDescription>
              You&apos;ve been added to the challenge. Redirecting to challenge details...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800">{foundChallenge.name}</h3>
                <p className="text-sm text-green-600 mt-1">{foundChallenge.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-green-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {foundChallenge.startDate ? foundChallenge.startDate.toLocaleDateString() : 'TBD'} - {foundChallenge.endDate.toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {foundChallenge.participants.length} participants
                  </div>
                </div>
              </div>
              
              <Button asChild className="w-full">
                <Link href={`/challenges/${foundChallenge.id}`}>
                  View Challenge Details
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

      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Join Challenge</CardTitle>
          <CardDescription>
            Enter the invitation code to join an existing weight challenge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="invitationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invitation Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., ABC123"
                        className="text-center text-lg font-mono tracking-wider uppercase"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the 6-character code shared by the challenge creator
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Challenge preview */}
              {foundChallenge && !joinSuccess && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800">{foundChallenge.name}</h3>
                  <p className="text-sm text-blue-600 mt-1">{foundChallenge.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-blue-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {foundChallenge.startDate ? foundChallenge.startDate.toLocaleDateString() : 'TBD'} - {foundChallenge.endDate.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {foundChallenge.participants.length} participants
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getChallengeStatus(foundChallenge) === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : getChallengeStatus(foundChallenge) === 'upcoming'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {getChallengeStatus(foundChallenge)}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {foundChallenge ? 'Joining Challenge...' : 'Finding Challenge...'}
                  </>
                ) : (
                  'Join Challenge'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Don&apos;t have an invitation code?
            </p>
            <Button variant="outline" asChild>
              <Link href="/challenges/create">
                Create Your Own Challenge
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 