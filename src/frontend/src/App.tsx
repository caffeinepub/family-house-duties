import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TaskList } from './components/TaskList';
import { DinnerRota } from './components/DinnerRota';
import { CalendarView } from './components/CalendarView';
import { People } from './components/People';
import { LoginScreen } from './components/LoginScreen';
import { TodayFocus } from './components/TodayFocus';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { Skeleton } from '@/components/ui/skeleton';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  const isAuthenticated = !!identity;

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen items-center justify-center">
          <Skeleton className="h-32 w-64" />
        </div>
      </ThemeProvider>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LoginScreen />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show main app
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <TodayFocus />
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="tasks">Task List</TabsTrigger>
              <TabsTrigger value="dinner">Dinner Rota</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks">
              <TaskList />
            </TabsContent>
            <TabsContent value="dinner">
              <DinnerRota />
            </TabsContent>
            <TabsContent value="calendar">
              <CalendarView />
            </TabsContent>
            <TabsContent value="people">
              <People />
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
