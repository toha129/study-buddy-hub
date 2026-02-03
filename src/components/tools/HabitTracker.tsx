import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Flame, CheckCircle2, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Habit {
  id: string;
  user_id: string;
  name: string;
  streak: number;
  last_completed: string | null;
  created_at: string;
}

interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
}

const HabitTracker = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newHabit, setNewHabit] = useState("");

  // Fetch habits
  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Habit[];
    },
  });

  // Fetch today's completions
  const { data: completions = [] } = useQuery({
    queryKey: ['habit-completions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('completed_date', today);
      
      if (error) throw error;
      return data as HabitCompletion[];
    },
  });

  // Add habit mutation
  const addHabitMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('habits')
        .insert([{ user_id: user.id, name, streak: 0 }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setNewHabit("");
      toast({ title: "Habit added!", description: "Start building your streak!" });
    },
  });

  // Toggle habit completion
  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, isCompleted }: { habitId: string; isCompleted: boolean }) => {
      const today = new Date().toISOString().split('T')[0];
      
      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('habit_id', habitId)
          .eq('completed_date', today);
        
        if (error) throw error;
      } else {
        // Add completion
        const { error } = await supabase
          .from('habit_completions')
          .insert([{ habit_id: habitId, completed_date: today }]);
        
        if (error) throw error;

        // Update streak
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          const newStreak = habit.last_completed === yesterdayStr ? habit.streak + 1 : 1;
          
          await supabase
            .from('habits')
            .update({ streak: newStreak, last_completed: today })
            .eq('id', habitId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit-completions'] });
    },
  });

  // Delete habit mutation
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({ title: "Habit deleted" });
    },
  });

  const isHabitCompletedToday = (habitId: string) => {
    return completions.some(c => c.habit_id === habitId);
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabit.trim()) {
      addHabitMutation.mutate(newHabit.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Habit Form */}
      <form onSubmit={handleAddHabit} className="flex gap-2">
        <Input
          placeholder="New habit (e.g., Study 30 minutes)"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          className="flex-1 bg-background border-border/40"
        />
        <Button type="submit" disabled={addHabitMutation.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Add Habit
        </Button>
      </form>

      {/* Habits List */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <Card className="bg-muted/30 border-border/40">
            <CardContent className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No habits yet. Add your first habit to start building streaks!</p>
            </CardContent>
          </Card>
        ) : (
          habits.map((habit) => {
            const completed = isHabitCompletedToday(habit.id);
            return (
              <Card
                key={habit.id}
                className={`transition-all duration-300 ${
                  completed
                    ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30"
                    : "bg-card border-border/40 hover:border-primary/30"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleHabitMutation.mutate({
                            habitId: habit.id,
                            isCompleted: completed,
                          })
                        }
                        className={completed ? "text-green-500" : "text-muted-foreground"}
                      >
                        {completed ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Circle className="h-6 w-6" />
                        )}
                      </Button>
                      
                      <div className="flex-1">
                        <h4 className={`font-semibold ${completed ? "line-through text-muted-foreground" : ""}`}>
                          {habit.name}
                        </h4>
                        {habit.streak > 0 && (
                          <div className="flex items-center gap-1 text-sm text-orange-500 mt-1">
                            <Flame className="h-4 w-4" />
                            <span className="font-bold">{habit.streak} day streak!</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteHabitMutation.mutate(habit.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Stats */}
      {habits.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{habits.length}</div>
              <div className="text-xs text-muted-foreground">Total Habits</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {completions.length}
              </div>
              <div className="text-xs text-muted-foreground">Completed Today</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-500">
                {Math.max(...habits.map(h => h.streak), 0)}
              </div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;

