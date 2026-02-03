import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Repeat, Plus, User, Settings } from 'lucide-react';
import { useGetAllRecurringChores } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { groupRecurringChoresByWeekday } from '../utils/recurringChoresPreview';
import { Principal } from '@icp-sdk/core/principal';

interface RecurringChoresInlineSectionProps {
  onManageClick: () => void;
}

export function RecurringChoresInlineSection({ onManageClick }: RecurringChoresInlineSectionProps) {
  const { data: chores = [], isLoading } = useGetAllRecurringChores();

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

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Repeat className="h-5 w-5 text-primary" />
            Recurring Chores
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onManageClick}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {chores.length === 0 ? (
          <div className="text-center py-6">
            <Repeat className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground mb-3">
              No recurring chores set up yet
            </p>
            <Button onClick={onManageClick} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Recurring Chore
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Weekly chores that automatically appear on their scheduled day
            </p>
            
            <div className="space-y-2">
              {groupedChores.slice(0, 3).map((group) => (
                <div 
                  key={group.weekday.toString()} 
                  className="rounded-lg border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-semibold">
                      {group.weekdayLabel}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {group.chores.length} {group.chores.length === 1 ? 'chore' : 'chores'}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {group.chores.map((chore) => (
                      <div 
                        key={chore.id.toString()} 
                        className="flex items-start justify-between gap-2 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{chore.name}</p>
                          {chore.description && (
                            <p className="text-xs text-muted-foreground truncate">
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
            
            {groupedChores.length > 3 && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                +{groupedChores.length - 3} more day{groupedChores.length - 3 !== 1 ? 's' : ''} with chores
              </p>
            )}
            
            <Button 
              onClick={onManageClick} 
              variant="secondary" 
              size="sm" 
              className="w-full gap-2"
            >
              <Settings className="h-4 w-4" />
              View All & Manage
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
