'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Scale, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const weightEntrySchema = z.object({
  weight: z.coerce.number()
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight must be less than 500 kg'),
  unit: z.enum(['kg', 'lbs']),
  loggedAt: z.date({
    required_error: 'Please select a date',
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)'),
});

const bulkWeightLogSchema = z.object({
  entries: z.array(weightEntrySchema).min(1, 'At least one entry is required'),
});

type BulkWeightLogFormData = z.infer<typeof bulkWeightLogSchema>;

interface BulkWeightLogFormProps {
  challengeId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BulkWeightLogForm({ challengeId, onSuccess, onCancel }: BulkWeightLogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0 });

  const form = useForm<BulkWeightLogFormData>({
    resolver: zodResolver(bulkWeightLogSchema),
    defaultValues: {
      entries: [
        {
          weight: 0,
          unit: 'kg' as const,
          loggedAt: new Date(),
          time: format(new Date(), 'HH:mm'),
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'entries',
  });

  const addEntry = () => {
    append({
      weight: 0,
      unit: 'kg' as const,
      loggedAt: new Date(),
      time: format(new Date(), 'HH:mm'),
    });
  };

  const removeEntry = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: BulkWeightLogFormData) => {
    setIsSubmitting(true);
    setSubmitProgress({ current: 0, total: data.entries.length });

    try {
      const results = [];
      
      for (let i = 0; i < data.entries.length; i++) {
        const entry = data.entries[i];
        setSubmitProgress({ current: i + 1, total: data.entries.length });

        // Combine date and time
        const [hours, minutes] = entry.time.split(':').map(Number);
        const loggedAt = new Date(entry.loggedAt);
        loggedAt.setHours(hours, minutes, 0, 0);

        // Convert weight to kg if needed
        const weightInKg = entry.unit === 'lbs' ? entry.weight * 0.453592 : entry.weight;

        const response = await fetch('/api/weight-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            challengeId,
            weight: weightInKg,
            unit: 'kg', // Always store in kg
            loggedAt: loggedAt.toISOString(),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Entry ${i + 1}: ${error.message || 'Failed to log weight'}`);
        }

        results.push(await response.json());
      }

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error logging weights:', error);
      // You might want to show a toast notification here
    } finally {
      setIsSubmitting(false);
      setSubmitProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Weight Entry
        </CardTitle>
        <CardDescription>
          Add multiple weight entries at once. Perfect for catching up on missed logs or importing historical data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Weight Entries */}
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium">Entry {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntry(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Weight Input */}
                    <FormField
                      control={form.control}
                      name={`entries.${index}.weight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Enter weight"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Unit Selection */}
                    <FormField
                      control={form.control}
                      name={`entries.${index}.unit`}
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
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="lbs">lbs</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date Selection */}
                    <FormField
                      control={form.control}
                      name={`entries.${index}.loggedAt`}
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
                                    format(field.value, 'MMM dd')
                                  ) : (
                                    <span>Pick date</span>
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
                      name={`entries.${index}.time`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
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
                  </div>
                </Card>
              ))}
            </div>

            {/* Add Entry Button */}
            <Button
              type="button"
              variant="outline"
              onClick={addEntry}
              className="w-full"
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Entry
            </Button>

            {/* Progress Indicator */}
            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Submitting entries...</span>
                  <span>{submitProgress.current} of {submitProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(submitProgress.current / submitProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Scale className="h-4 w-4 mr-2 animate-spin" />
                    Submitting {submitProgress.current}/{submitProgress.total}...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit All Entries ({fields.length})
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