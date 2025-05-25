'use client';

import { useState } from 'react';
import { Archive, ArchiveRestore, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Challenge } from '@/types';

interface ArchiveButtonProps {
  challenge: Challenge;
  onArchiveChange?: (challengeId: string, isArchived: boolean) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function ArchiveButton({ 
  challenge, 
  onArchiveChange, 
  variant = 'outline',
  size = 'sm'
}: ArchiveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleArchiveToggle = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to archive challenges',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Get the Firebase Auth token
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/challenges/${challenge.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          isArchived: !challenge.isArchived,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update challenge');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: challenge.isArchived ? 'Challenge Unarchived' : 'Challenge Archived',
          description: challenge.isArchived 
            ? 'The challenge has been restored to your active challenges.'
            : 'The challenge has been moved to your archived challenges.',
        });
        
        // Notify parent component of the change
        onArchiveChange?.(challenge.id, !challenge.isArchived);
      } else {
        throw new Error(result.error || 'Failed to update challenge');
      }
    } catch (error) {
      console.error('Error updating challenge archive status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update challenge',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isArchived = challenge.isArchived;
  const actionText = isArchived ? 'Unarchive' : 'Archive';
  const Icon = isArchived ? ArchiveRestore : Archive;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          {actionText}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {actionText} Challenge
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isArchived ? (
              <>
                Are you sure you want to unarchive &quot;{challenge.name}&quot;? 
                This will restore it to your active challenges list.
              </>
            ) : (
              <>
                Are you sure you want to archive &quot;{challenge.name}&quot;? 
                This will move it to your archived challenges and hide it from the main list.
                You can unarchive it later if needed.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleArchiveToggle}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 