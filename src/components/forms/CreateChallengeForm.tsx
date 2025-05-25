'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { functions } from '@/lib/firebase';
import { cn } from '@/lib/utils';

// Form validation schema
const createChallengeSchema = z.object({
  name: z.string()
    .min(3, 'Challenge name must be at least 3 characters')
    .max(100, 'Challenge name must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  endDate: z.date({
    required_error: 'End date is required',
  }).refine((date) => date > new Date(), {
    message: 'End date must be in the future',
  }),
  joinByDate: z.date({
    required_error: 'Join by date is required',
  }).refine((date) => date > new Date(), {
    message: 'Join by date must be in the future',
  }),
  targetWeight: z.number()
    .min(20, 'Target weight must be at least 20 kg')
    .max(500, 'Target weight must be less than 500 kg'),
  startWeight: z.number()
    .min(20, 'Start weight must be at least 20 kg')
    .max(500, 'Start weight must be less than 500 kg'),
  goalType: z.enum(['gain', 'lose'], {
    required_error: 'Please select a goal type',
  }),
  participantLimit: z.number()
    .min(2, 'Participant limit must be at least 2')
    .max(10, 'Participant limit must be less than 10'),
}).refine((data) => {
  if (data.goalType === 'lose') {
    return data.targetWeight < data.startWeight;
  } else {
    return data.targetWeight > data.startWeight;
  }
}, {
  message: 'Target weight must align with your goal type',
  path: ['targetWeight'],
}).refine((data) => {
  return data.joinByDate < data.endDate;
}, {
  message: 'Join by date must be before the end date',
  path: ['joinByDate'],
});

type CreateChallengeFormData = z.infer<typeof createChallengeSchema>;

interface CreateChallengeFormProps {
  onSuccess?: (challengeId: string, invitationCode: string) => void;
  onCancel?: () => void;
}

export default function CreateChallengeForm({ onSuccess, onCancel }: CreateChallengeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<CreateChallengeFormData>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      name: '',
      description: '',
      participantLimit: 5,
    },
  });

  const onSubmit = async (data: CreateChallengeFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const createChallenge = httpsCallable(functions, 'createChallenge');
      
      const result = await createChallenge({
        name: data.name,
        description: data.description,
        endDate: data.endDate.toISOString(),
        joinByDate: data.joinByDate.toISOString(),
        targetWeight: data.targetWeight,
        startWeight: data.startWeight,
        goalType: data.goalType,
        participantLimit: data.participantLimit,
      });

      const response = result.data as {
        success: boolean;
        challengeId: string;
        invitationCode: string;
        message: string;
      };

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.challengeId, response.invitationCode);
        } else {
          router.push(`/challenges/${response.challengeId}`);
        }
      } else {
        setError('Failed to create challenge. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Error creating challenge:', err);
      setError(err instanceof Error ? err.message : 'Failed to create challenge. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Challenge</CardTitle>
        <CardDescription>
          Set up a new weight challenge and invite friends to join you on your fitness journey.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Challenge Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Summer Weight Loss Challenge" {...field} />
                  </FormControl>
                  <FormDescription>
                    Choose a motivating name for your challenge
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your challenge goals, rules, or motivation..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about your challenge to motivate participants
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Goal Type */}
            <FormField
              control={form.control}
              name="goalType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your goal type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="lose">Weight Loss</SelectItem>
                      <SelectItem value="gain">Weight Gain</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose whether this is a weight loss or weight gain challenge
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weight Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Starting Weight (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="70.0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Target Weight (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="65.0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="joinByDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Join By Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Last date for new participants to join
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When the challenge will end
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Participant Limit */}
            <FormField
              control={form.control}
              name="participantLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Participant Limit</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="2"
                      max="10"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of participants (2-10)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Challenge...
                  </>
                ) : (
                  'Create Challenge'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 