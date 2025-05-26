'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Scale, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { WeightLog } from '@/types';
import { updateWeightLog } from '@/lib/weight-logs';

const editWeightLogSchema = z.object({
  weight: z.number().min(20, 'Weight must be at least 20 kg').max(500, 'Weight must be less than 500 kg'),
  unit: z.enum(['kg', 'lbs']),
  loggedAt: z.date(),
});

type EditWeightLogFormData = z.infer<typeof editWeightLogSchema>;

interface EditWeightLogFormProps {
  weightLog: WeightLog;
  onSuccess?: (updatedLog: WeightLog) => void;
  onCancel?: () => void;
}

export default function EditWeightLogForm({ weightLog, onSuccess, onCancel }: EditWeightLogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditWeightLogFormData>({
    resolver: zodResolver(editWeightLogSchema),
    defaultValues: {
      weight: weightLog.weight,
      unit: weightLog.unit as 'kg' | 'lbs',
      loggedAt: new Date(weightLog.loggedAt),
    },
  });

  // Reset form when weightLog changes
  useEffect(() => {
    form.reset({
      weight: weightLog.weight,
      unit: weightLog.unit as 'kg' | 'lbs',
      loggedAt: new Date(weightLog.loggedAt),
    });
  }, [weightLog, form]);

  const onSubmit = async (data: EditWeightLogFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const updatedLog = await updateWeightLog(weightLog.id, {
        weight: data.weight,
        unit: data.unit,
        loggedAt: data.loggedAt,
        challengeId: weightLog.challengeId,
      });

      onSuccess?.(updatedLog);
    } catch (error) {
      console.error('Error updating weight log:', error);
      setError(error instanceof Error ? error.message : 'Failed to update weight log');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Edit Weight Log
        </CardTitle>
        <CardDescription>
          Update your weight entry for {format(new Date(weightLog.loggedAt), 'MMMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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

            <FormField
              control={form.control}
              name="loggedAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date & Time</FormLabel>
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
                            format(field.value, 'PPP p')
                          ) : (
                            <span>Pick a date and time</span>
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
                          if (date) {
                            // Preserve the time from the current value
                            const currentTime = field.value || new Date();
                            const newDate = new Date(date);
                            newDate.setHours(currentTime.getHours());
                            newDate.setMinutes(currentTime.getMinutes());
                            field.onChange(newDate);
                          }
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={field.value ? format(field.value, 'HH:mm') : ''}
                            onChange={(e) => {
                              if (e.target.value && field.value) {
                                const [hours, minutes] = e.target.value.split(':');
                                const newDate = new Date(field.value);
                                newDate.setHours(parseInt(hours), parseInt(minutes));
                                field.onChange(newDate);
                              }
                            }}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Weight Log
                  </>
                )}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
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