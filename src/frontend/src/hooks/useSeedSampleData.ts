import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { toast } from 'sonner';
import { Timeline } from '../backend';

export function useSeedSampleData() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      if (!identity) throw new Error('User not authenticated');

      const currentPrincipal = identity.getPrincipal();

      // Step 1: Ensure a People Profile exists for the current principal
      try {
        await actor.getProfile(currentPrincipal);
      } catch (error) {
        // Profile doesn't exist, create one
        await actor.upsertProfile({
          principal: currentPrincipal,
          displayName: 'Demo User',
          color: '#FF6B35',
        });
      }

      // Step 2: Add sample tasks
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const nsPerMs = 1_000_000;

      // Task due today
      const taskId1 = await actor.addTask({
        name: 'Take out the trash',
        description: 'Remember to separate recyclables',
        dueDate: BigInt(now * nsPerMs),
        assignedTo: currentPrincipal,
      });

      // Task due tomorrow
      await actor.addTask({
        name: 'Water the plants',
        description: 'All indoor and outdoor plants',
        dueDate: BigInt((now + oneDayMs) * nsPerMs),
        assignedTo: currentPrincipal,
      });

      // Task due in 3 days
      await actor.addTask({
        name: 'Grocery shopping',
        description: 'Check the shopping list on the fridge',
        dueDate: BigInt((now + 3 * oneDayMs) * nsPerMs),
        assignedTo: undefined,
      });

      // Task due in 5 days
      await actor.addTask({
        name: 'Clean the bathroom',
        description: 'Deep clean including tiles and mirrors',
        dueDate: BigInt((now + 5 * oneDayMs) * nsPerMs),
        assignedTo: currentPrincipal,
      });

      // Task without due date
      await actor.addTask({
        name: 'Organize garage',
        description: 'Sort and label storage boxes',
        dueDate: undefined,
        assignedTo: undefined,
      });

      // Task that will be marked as completed
      const completedTaskId = await actor.addTask({
        name: 'Vacuum living room',
        description: 'Already done!',
        dueDate: BigInt((now - oneDayMs) * nsPerMs),
        assignedTo: currentPrincipal,
      });

      // Mark one task as completed
      await actor.toggleTaskCompletion(completedTaskId);

      // Step 3: Create recurring chores
      // Daily chore
      await actor.createRecurringChore({
        name: 'Feed the pets',
        description: 'Morning and evening',
        weekday: 0n, // Will appear every day regardless
        timeline: Timeline.daily,
        assignedTo: currentPrincipal,
      });

      // Weekly chores on different days
      await actor.createRecurringChore({
        name: 'Mow the lawn',
        description: 'Front and back yard',
        weekday: 6n, // Saturday
        timeline: Timeline.weeklies,
        assignedTo: currentPrincipal,
      });

      await actor.createRecurringChore({
        name: 'Laundry day',
        description: 'Wash, dry, and fold',
        weekday: 3n, // Wednesday
        timeline: Timeline.weeklies,
        assignedTo: undefined,
      });

      // Fortnightly chore
      await actor.createRecurringChore({
        name: 'Change bed sheets',
        description: 'All bedrooms',
        weekday: 0n, // Sunday
        timeline: Timeline.fortnightly,
        assignedTo: currentPrincipal,
      });

      // Monthly chore
      await actor.createRecurringChore({
        name: 'Clean windows',
        description: 'Inside and outside',
        weekday: 1n, // Monday
        timeline: Timeline.monthly,
        assignedTo: undefined,
      });

      // Step 4: Assign dinner rota for current week
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
      const daysToMonday = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + daysToMonday);

      const cookNames = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Casey'];
      const mealDescriptions = [
        'Spaghetti Bolognese',
        'Chicken Stir-fry',
        'Homemade Pizza',
        'Taco Tuesday',
        'Fish and Chips',
        'Vegetable Curry',
        'Sunday Roast',
      ];

      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dayKey = date.toISOString().split('T')[0];
        const cookName = cookNames[i % cookNames.length];
        const mealDescription = mealDescriptions[i % mealDescriptions.length];

        await actor.assignCookingDay({
          day: dayKey,
          cook: undefined,
          cookName: cookName,
          description: mealDescription,
        });
      }
    },
    onSuccess: () => {
      // Invalidate all relevant caches
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-chores'] });
      queryClient.invalidateQueries({ queryKey: ['cooking-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['people-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['people-profile'] });

      toast.success('Sample data added successfully');
    },
    onError: (error: any) => {
      console.error('Failed to populate sample data:', error);
      toast.error('Failed to create sample data');
    },
  });
}
