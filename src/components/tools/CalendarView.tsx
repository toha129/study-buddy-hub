import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, BookOpen, CheckSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: "quiz" | "task" | "class";
  completed?: boolean;
}

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch quizzes
  const { data: quizzes = [] } = useQuery({
    queryKey: ['calendar-quizzes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['calendar-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
  });

  // Combine all events
  const allEvents: CalendarEvent[] = [
    ...quizzes.map(q => ({
      id: q.id,
      title: q.subject,
      date: q.date,
      time: q.time,
      type: 'quiz' as const,
      completed: q.completed,
    })),
    ...tasks.filter(t => t.deadline).map(t => ({
      id: t.id,
      title: t.title,
      date: t.deadline!,
      type: 'task' as const,
      completed: t.completed,
    })),
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return allEvents.filter(event => event.date === dateStr);
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {monthNames[month]} {year}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="bg-card border-border/40">
        <CardContent className="p-4">
          {/* Day Names */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(year, month, day);
              const events = getEventsForDate(date);
              const isSelected = selectedDate?.toDateString() === date.toDateString();

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square p-2 rounded-lg border transition-all ${
                    isToday(day)
                      ? "bg-primary/20 border-primary/50 font-bold"
                      : isSelected
                      ? "bg-secondary/20 border-secondary/50"
                      : "bg-muted/30 border-border/40 hover:border-primary/30"
                  }`}
                >
                  <div className="text-sm">{day}</div>
                  {events.length > 0 && (
                    <div className="flex gap-1 mt-1 justify-center flex-wrap">
                      {events.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            event.type === 'quiz'
                              ? 'bg-blue-500'
                              : event.type === 'task'
                              ? 'bg-green-500'
                              : 'bg-purple-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Events on {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>

          {selectedEvents.length === 0 ? (
            <Card className="bg-muted/30 border-border/40">
              <CardContent className="p-8 text-center text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events scheduled for this day</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => (
                <Card
                  key={event.id}
                  className={`border transition-all ${
                    event.completed
                      ? 'bg-muted/30 border-border/20'
                      : event.type === 'quiz'
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : event.type === 'task'
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-purple-500/10 border-purple-500/30'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        event.type === 'quiz'
                          ? 'bg-blue-500/20'
                          : event.type === 'task'
                          ? 'bg-green-500/20'
                          : 'bg-purple-500/20'
                      }`}>
                        {event.type === 'quiz' ? (
                          <BookOpen className="h-4 w-4 text-blue-500" />
                        ) : event.type === 'task' ? (
                          <CheckSquare className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-purple-500" />
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className={`font-semibold ${event.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-muted/50 capitalize">
                            {event.type}
                          </span>
                          {event.time && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </span>
                          )}
                          {event.completed && (
                            <span className="text-xs text-green-500">✓ Completed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <Card className="bg-muted/30 border-border/40">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Quizzes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Classes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;

