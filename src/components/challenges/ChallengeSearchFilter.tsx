'use client';

import { useState } from 'react';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { ChallengeFilters } from '@/lib/challenges';

interface ChallengeSearchFilterProps {
  filters: ChallengeFilters;
  onFiltersChange: (filters: ChallengeFilters) => void;
  resultsCount?: number;
}

export function ChallengeSearchFilter({ 
  filters, 
  onFiltersChange, 
  resultsCount 
}: ChallengeSearchFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const updateFilters = (updates: Partial<ChallengeFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      status: 'all',
      archived: 'active',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = 
    filters.searchTerm !== '' || 
    filters.status !== 'all' || 
    filters.archived !== 'active' || 
    filters.sortBy !== 'createdAt' || 
    filters.sortOrder !== 'desc';

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
      default: return 'All';
    }
  };

  const getSortLabel = (sortBy: string) => {
    switch (sortBy) {
      case 'name': return 'Name';
      case 'createdAt': return 'Created Date';
      case 'startDate': return 'Start Date';
      case 'endDate': return 'End Date';
      case 'participants': return 'Participants';
      default: return 'Created Date';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or creator&apos;s email..."
            className="w-full"
            value={filters.searchTerm}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
          />
          {filters.searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => updateFilters({ searchTerm: '' })}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex gap-2">
          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value: ChallengeFilters['status']) => 
              updateFilters({ status: value })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Archived Filter */}
          <Select
            value={filters.archived}
            onValueChange={(value: ChallengeFilters['archived']) => 
              updateFilters({ archived: value })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Archived" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Controls */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Sort
                {filters.sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort by</label>
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value: ChallengeFilters['sortBy']) => 
                        updateFilters({ sortBy: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="createdAt">Created Date</SelectItem>
                        <SelectItem value="startDate">Start Date</SelectItem>
                        <SelectItem value="endDate">End Date</SelectItem>
                        <SelectItem value="participants">Participants</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Order</label>
                    <Select
                      value={filters.sortOrder}
                      onValueChange={(value: ChallengeFilters['sortOrder']) => 
                        updateFilters({ sortOrder: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.searchTerm}"
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilters({ searchTerm: '' })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {getStatusLabel(filters.status)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilters({ status: 'all' })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.archived !== 'active' && (
            <Badge variant="secondary" className="gap-1">
              Archived: {filters.archived === 'all' ? 'All' : 'Archived'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilters({ archived: 'active' })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {(filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') && (
            <Badge variant="secondary" className="gap-1">
              Sort: {getSortLabel(filters.sortBy)} ({filters.sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilters({ sortBy: 'createdAt', sortOrder: 'desc' })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      {resultsCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {resultsCount === 0 ? (
            'No challenges found'
          ) : resultsCount === 1 ? (
            '1 challenge found'
          ) : (
            `${resultsCount} challenges found`
          )}
        </div>
      )}
    </div>
  );
} 