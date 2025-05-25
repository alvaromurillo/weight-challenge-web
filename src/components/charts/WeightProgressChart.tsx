'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { WeightLog } from '@/types';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeightProgressChartProps {
  weightLogs: WeightLog[];
  height?: number;
  showGoal?: boolean;
  goalWeight?: number;
}

export function WeightProgressChart({ 
  weightLogs, 
  height = 300,
  showGoal = false,
  goalWeight 
}: WeightProgressChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Sort weight logs by date
  const sortedLogs = [...weightLogs].sort((a, b) => 
    new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
  );

  // Prepare chart data
  const labels = sortedLogs.map(log => format(new Date(log.loggedAt), 'MMM dd'));
  const weights = sortedLogs.map(log => log.weight);
  
  // Calculate trend line (simple linear regression)
  const getTrendLine = () => {
    if (weights.length < 2) return [];
    
    const n = weights.length;
    const sumX = weights.reduce((sum, _, i) => sum + i, 0);
    const sumY = weights.reduce((sum, weight) => sum + weight, 0);
    const sumXY = weights.reduce((sum, weight, i) => sum + i * weight, 0);
    const sumXX = weights.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return weights.map((_, i) => slope * i + intercept);
  };

  const trendLine = getTrendLine();

  const data = {
    labels,
    datasets: [
      {
        label: 'Weight',
        data: weights,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.3,
      },
      ...(trendLine.length > 1 ? [{
        label: 'Trend',
        data: trendLine,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      }] : []),
      ...(showGoal && goalWeight ? [{
        label: 'Goal',
        data: new Array(labels.length).fill(goalWeight),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [10, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      }] : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: { dataset: { label?: string }; parsed: { y: number } }) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(1)} kg`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Weight (kg)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        beginAtZero: false,
        // Add some padding to the y-axis
        suggestedMin: Math.min(...weights) - 2,
        suggestedMax: Math.max(...weights) + 2,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      point: {
        hoverBackgroundColor: 'white',
      },
    },
  };

  if (sortedLogs.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ height }}
      >
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-medium mb-2">No weight data</div>
          <div className="text-sm">Start logging your weight to see progress</div>
        </div>
      </div>
    );
  }

  if (sortedLogs.length === 1) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {sortedLogs[0].weight} kg
          </div>
          <div className="text-sm text-muted-foreground">
            Logged on {format(new Date(sortedLogs[0].loggedAt), 'MMM dd, yyyy')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Log more weights to see progress chart
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
} 