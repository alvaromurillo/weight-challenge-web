'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Scale, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedFetch';

const weightLogSchema = z.object({
  weight: z.number()
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight must be less than 500 kg'),
  unit: z.enum(['kg', 'lbs']),
  loggedAt: z.date({
    required_error: 'Please select a date and time',
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)'),
});

type WeightLogFormData = z.infer<typeof weightLogSchema>;

interface WeightLogFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function WeightLogForm({ onSuccess, onCancel }: WeightLogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const api = useAuthenticatedApi();

  const form = useForm<WeightLogFormData>({
    resolver: zodResolver(weightLogSchema),
    defaultValues: {
      weight: undefined,
      unit: 'kg',
      loggedAt: new Date(),
      time: format(new Date(), 'HH:mm'),
    },
  });

  const onSubmit = async (data: WeightLogFormData) => {
    setIsSubmitting(true);
    try {
      // Combine date and time
      const [hours, minutes] = data.time.split(':').map(Number);
      const loggedAt = new Date(data.loggedAt);
      loggedAt.setHours(hours, minutes, 0, 0);

      // Convert weight to kg if needed
      const weightInKg = data.unit === 'lbs' ? data.weight * 0.453592 : data.weight;

      const response = await api.post('/api/weight-logs', {
        weight: weightInKg,
        unit: 'kg', // Always store in kg
        loggedAt: loggedAt.toISOString(),
      }) as { data?: { weightLog?: any } };

      // Show success message
      if (response.data?.weightLog) {
        console.log('✅ Weight logged successfully');
      }

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error logging weight:', error);
      // You might want to show a toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Log Weight
        </CardTitle>
        <CardDescription>
          Record your current weight - it will be available across all your challenges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Weight Input */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Enter weight"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Selection */}
            <FormField
              control={form.control}
              name="loggedAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
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
                        onSelect={(date) => {
                          field.onChange(date);
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Selection */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Logging...' : 'Log Weight'}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 