'use client';

import { useState, useEffect } from 'react';
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
  const [canModify, setCanModify] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Verificar ownership cuando el usuario o challenge cambien
  useEffect(() => {
    const checkOwnership = () => {
      if (authLoading || !user) {
        setCanModify(false);
        return;
      }

      const isCreator = user.uid === challenge.creatorId;
      setCanModify(isCreator);
      
      // Debug logging
      console.log('🔍 ArchiveButton ownership check:', {
        challengeId: challenge.id,
        challengeName: challenge.name,
        userId: user.uid,
        userEmail: user.email,
        creatorId: challenge.creatorId,
        isCreator,
        canModify: isCreator
      });
    };

    checkOwnership();
  }, [user, authLoading, challenge.creatorId, challenge.id, challenge.name]);

  const handleArchiveToggle = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to archive challenges',
        variant: 'destructive',
      });
      return;
    }

    // Doble verificación de ownership antes de hacer la petición
    if (user.uid !== challenge.creatorId) {
      console.error('❌ SECURITY: User attempted to modify challenge they do not own', {
        userId: user.uid,
        userEmail: user.email,
        challengeId: challenge.id,
        creatorId: challenge.creatorId
      });
      
      toast({
        title: 'Permission Denied',
        description: 'Only the challenge creator can archive/unarchive this challenge',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Get the Firebase Auth token
      const token = await user.getIdToken();
      console.log('🔑 Got Firebase token for archive operation');
      
      const requestBody = {
        isArchived: !challenge.isArchived,
      };
      
      console.log('📤 Sending PATCH request:', {
        url: `/api/challenges/${challenge.id}/archive`,
        method: 'PATCH',
        body: requestBody,
        userId: user.uid,
        creatorId: challenge.creatorId
      });
      
      const response = await fetch(`/api/challenges/${challenge.id}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update challenge`);
      }

      const result = await response.json();
      console.log('✅ API Success Response:', result);
      
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
      console.error('❌ Error updating challenge archive status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update challenge',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // No mostrar nada mientras se carga la autenticación
  if (authLoading) {
    return null;
  }

  // No mostrar el botón si no hay usuario o no puede modificar
  if (!user || !canModify) {
    console.log('🚫 ArchiveButton hidden:', {
      hasUser: !!user,
      canModify,
      challengeId: challenge.id,
      reason: !user ? 'No user' : 'Not creator'
    });
    return null;
  }

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