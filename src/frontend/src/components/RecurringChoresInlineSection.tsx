import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Repeat, Plus, User, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useGetAllRecurringChores } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { groupRecurringChoresByWeekday, getTimelineLabel } from '../utils/recurringChoresPreview';
import { Principal } from '@icp-sdk/core/principal';

interface RecurringChoresInlineSectionProps {
  onManageClick: () => void;
}

export function RecurringChoresInlineSection({ onManageClick }: RecurringChoresInlineSectionProps) {
  const { data: chores = [], isLoading } = useGetAllRecurringChores();
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPrincipal = (principal: Principal) => {
    const str = principal.toString();
    return str.slice(0, 5) + '...' + str.slice(-3);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const groupedChores = groupRecurringChoresByWeekday(chores);
  const hasChores = chores.length > 0;
  const hasMoreThanThree = groupedChores.length > 3;
  const displayedGroups = isExpanded ? groupedChores : groupedChores.slice(0, 3);

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg mb-1.5">
              <Repeat className="h-5 w-5 text-primary flex-shrink-0" />
              <span>Recurring Chores</span>
            </CardTitle>
            {hasChores && (
              <p className="text-sm text-muted-foreground">
                Chores that automatically appear on their scheduled day
              </p>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onManageClick}
            className="gap-2 flex-shrink-0"
          >
            <Settings className="h-4 w-4" />
            {hasChores ? 'Manage' : 'Add'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!hasChores ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Repeat className="h-8 w-8 text-primary/60" />
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Set up recurring chores to automatically track weekly, fortnightly, or monthly tasks
            </p>
            <Button onClick={onManageClick} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add recurring chore
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              {displayedGroups.map((group) => (
                <div 
                  key={group.weekday.toString()} 
                  className="rounded-lg border bg-card p-3 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-semibold">
                      {group.weekdayLabel}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {group.chores.length} {group.chores.length === 1 ? 'chore' : 'chores'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {group.chores.map((chore) => (
                      <div 
                        key={chore.id.toString()} 
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{chore.name}</p>
                            <Badge variant="outline" className="text-xs font-normal">
                              {getTimelineLabel(chore.timeline)}
                            </Badge>
                            {chore.paused && (
                              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                Paused
                              </Badge>
                            )}
                          </div>
                          {chore.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {chore.description}
                            </p>
                          )}
                        </div>
                        {chore.assignedTo && (
                          <Badge variant="outline" className="text-xs font-normal flex-shrink-0">
                            <User className="mr-1 h-3 w-3" />
                            {formatPrincipal(chore.assignedTo)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {hasMoreThanThree && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {groupedChores.length - 3} more day{groupedChores.length - 3 !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
