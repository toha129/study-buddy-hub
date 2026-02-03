import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Quizzes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("");

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true});
      
      if (error) throw error;
      return data || [];
    },
  });

  const addQuizMutation = useMutation({
    mutationFn: async (newQuiz: { subject: string; date: string; time: string; type: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('quizzes')
        .insert([{ ...newQuiz, user_id: user.id }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast({ title: "Success", description: "Quiz added successfully!" });
      setSubject("");
      setDate("");
      setTime("");
      setType("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast({ title: "Success", description: "Quiz deleted successfully!" });
    },
  });

  const toggleCompletedMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('quizzes')
        .update({ completed: !completed })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });

  const handleAddQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject && date && time && type) {
      addQuizMutation.mutate({ subject, date, time, type });
    }
  };

  const getTimeRemaining = (quizDate: string, quizTime: string) => {
    const now = new Date();
    const quizDateTime = new Date(`${quizDate}T${quizTime}`);
    const diff = quizDateTime.getTime() - now.getTime();
    
    if (diff < 0) return "Passed";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Quiz Tracker
          </h1>
          <p className="text-muted-foreground">Manage your upcoming quizzes and assessments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 bg-card border-border/40 glow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add New Quiz
              </CardTitle>
              <CardDescription>Schedule your next assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddQuiz} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Data Structures"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-input border-border/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-input border-border/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-input border-border/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={setType} required>
                    <SelectTrigger className="bg-input border-border/40">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Midterm">Midterm</SelectItem>
                      <SelectItem value="Final">Final</SelectItem>
                      <SelectItem value="Quiz">Quiz</SelectItem>
                      <SelectItem value="Assignment">Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 glow-primary"
                  disabled={addQuizMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {addQuizMutation.isPending ? "Adding..." : "Add Quiz"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {quizzes.length === 0 ? (
              <Card className="bg-card border-border/40">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No quizzes yet. Add your first quiz!
                </CardContent>
              </Card>
            ) : (
              quizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  className={`border transition-all duration-300 ${
                    quiz.completed
                      ? 'bg-muted/30 border-border/20'
                      : 'bg-card border-border/40 hover:border-primary/50 glow-card hover:glow-primary'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className={`font-semibold text-lg ${quiz.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {quiz.subject}
                        </h4>
                        <p className="text-sm text-muted-foreground">{quiz.type}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <Clock className="h-4 w-4" />
                          {getTimeRemaining(quiz.date, quiz.time)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(quiz.date).toLocaleDateString()} at {quiz.time}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={quiz.completed ? "outline" : "default"}
                          onClick={() => toggleCompletedMutation.mutate({ id: quiz.id, completed: quiz.completed })}
                        >
                          {quiz.completed ? "Undo" : "Complete"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteQuizMutation.mutate(quiz.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Quizzes;
