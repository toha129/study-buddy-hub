import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, AlertCircle, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Todos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("");

  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const addTodoMutation = useMutation({
    mutationFn: async (newTodo: { title: string; description?: string; deadline?: string; priority: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('todos')
        .insert([{ ...newTodo, user_id: user.id }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast({ title: "Success", description: "Task added successfully!" });
      setTitle("");
      setDescription("");
      setDeadline("");
      setPriority("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast({ title: "Success", description: "Task deleted successfully!" });
    },
  });

  const toggleCompletedMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && priority) {
      addTodoMutation.mutate({ 
        title, 
        description: description || undefined, 
        deadline: deadline || undefined, 
        priority 
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive";
      case "medium": return "text-secondary";
      case "low": return "text-muted-foreground";
      default: return "text-foreground";
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive/10 border-destructive/30";
      case "medium": return "bg-secondary/10 border-secondary/30";
      case "low": return "bg-muted/50 border-border/30";
      default: return "bg-card";
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Task Manager
          </h1>
          <p className="text-muted-foreground">Stay organized with your daily tasks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 bg-card border-border/40 glow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add New Task
              </CardTitle>
              <CardDescription>Create a new to-do item</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTodo} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    placeholder="What needs to be done?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-input border-border/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Additional details"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-input border-border/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority} required>
                    <SelectTrigger className="bg-input border-border/40">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="bg-input border-border/40"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 glow-primary"
                  disabled={addTodoMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addTodoMutation.isPending ? "Adding..." : "Add Task"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {todos.length === 0 ? (
              <Card className="bg-card border-border/40">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No tasks yet. Add your first task!
                </CardContent>
              </Card>
            ) : (
              todos.map((todo) => {
                const deadline = todo.deadline ? new Date(todo.deadline) : null;
                const today = new Date();
                const isOverdue = deadline && deadline < today && !todo.completed;

                return (
                  <Card
                    key={todo.id}
                    className={`border ${getPriorityBg(todo.priority)} hover:border-primary/50 transition-all duration-300 glow-card hover:glow-primary ${
                      todo.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => toggleCompletedMutation.mutate({ id: todo.id, completed: todo.completed })}
                          className="mt-1 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />

                        <div className="flex-1 space-y-2">
                          <h3 className={`text-lg font-semibold ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className="text-sm text-muted-foreground">{todo.description}</p>
                          )}

                          <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-1 text-sm ${getPriorityColor(todo.priority)}`}>
                              <AlertCircle className="h-4 w-4" />
                              <span className="capitalize">{todo.priority} Priority</span>
                            </div>

                            {deadline && (
                              <div className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                                <Clock className="h-4 w-4" />
                                {deadline.toLocaleDateString()}
                                {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTodoMutation.mutate(todo.id)}
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
        </div>
      </main>
    </div>
  );
};

export default Todos;
