'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Edit2, Trash2, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WeightLog } from '@/types';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedFetch';

interface WeightLogHistoryProps {
  challengeId: string;
  onEdit?: (log: WeightLog) => void;
  refreshTrigger?: number;
}

export default function WeightLogHistory({ challengeId, onEdit, refreshTrigger }: WeightLogHistoryProps) {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useAuthenticatedApi();

  const fetchWeightLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await api.get(`/api/weight-logs?challengeId=${challengeId}`);
      if (result.success) {
        setWeightLogs(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch weight logs');
      }
    } catch (error) {
      console.error('Error fetching weight logs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch weight logs');
    } finally {
      setIsLoading(false);
    }
  }, [challengeId, api]);

  useEffect(() => {
    fetchWeightLogs();
  }, [fetchWeightLogs, refreshTrigger]);

  const handleDelete = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this weight log?')) {
      return;
    }

    try {
      await api.delete(`/api/weight-logs/${logId}`);
      // Refresh the list
      fetchWeightLogs();
    } catch (error) {
      console.error('Error deleting weight log:', error);
      alert('Failed to delete weight log');
    }
  };

  const getWeightTrend = (currentWeight: number, previousWeight?: number) => {
    if (!previousWeight) return null;
    
    const difference = currentWeight - previousWeight;
    if (Math.abs(difference) < 0.1) return null;
    
    return {
      direction: difference > 0 ? 'up' : 'down',
      amount: Math.abs(difference),
    };
  };

  const formatWeight = (weight: number, unit: string) => {
    return `${weight.toFixed(1)} ${unit}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading weight history...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Weight History
        </CardTitle>
        <CardDescription>
          {weightLogs.length === 0 
            ? 'No weight logs yet. Start logging to track your progress!'
            : `${weightLogs.length} weight log${weightLogs.length === 1 ? '' : 's'}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {weightLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No weight logs yet</p>
            <p className="text-sm">Start logging your weight to track your progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weightLogs.map((log, index) => {
              const previousLog = weightLogs[index + 1];
              const trend = getWeightTrend(log.weight, previousLog?.weight);
              
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {formatWeight(log.weight, log.unit)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.loggedAt), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.loggedAt), 'h:mm a')}
                      </div>
                    </div>
                    
                    {trend && (
                      <div className="flex items-center gap-1">
                        {trend.direction === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        )}
                        <Badge 
                          variant={trend.direction === 'down' ? 'default' : 'secondary'}
                          className={trend.direction === 'down' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {trend.direction === 'down' ? '-' : '+'}
                          {formatWeight(trend.amount, log.unit)}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(log)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(log.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 