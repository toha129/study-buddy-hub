import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Clock, Calendar, TrendingUp, Play, Square, Trash2, BedDouble, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface SleepSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const SleepTracker = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDuration, setCurrentDuration] = useState(0);
  const [notes, setNotes] = useState("");

  // Goals State (Persisted in LocalStorage)
  const [targetHours, setTargetHours] = useState(() => parseFloat(localStorage.getItem('sb_sleep_goal_hours') || "8"));
  const [bedTime, setBedTime] = useState(() => localStorage.getItem('sb_sleep_goal_bedtime') || "23:00");
  const [wakeTime, setWakeTime] = useState(() => localStorage.getItem('sb_sleep_goal_waketime') || "07:00");

  useEffect(() => {
    localStorage.setItem('sb_sleep_goal_hours', targetHours.toString());
    localStorage.setItem('sb_sleep_goal_bedtime', bedTime);
    localStorage.setItem('sb_sleep_goal_waketime', wakeTime);
  }, [targetHours, bedTime, wakeTime]);

  // Fetch active sleep session
  const { data: activeSession } = useQuery({
    queryKey: ['active-sleep-session'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('sleep_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as SleepSession | null;
    },
    refetchInterval: 1000,
  });

  // Fetch sleep history (Last 30 days for better analysis)
  const { data: sleepHistory = [] } = useQuery({
    queryKey: ['sleep-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('sleep_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .order('start_time', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as SleepSession[];
    },
  });

  // Timer Logic
  useEffect(() => {
    if (activeSession) {
      const startTime = new Date(activeSession.start_time).getTime();
      const now = Date.now();
      const duration = Math.floor((now - startTime) / 1000);
      setCurrentDuration(duration);
    } else {
      setCurrentDuration(0);
    }
  }, [activeSession]);

  // Mutations
  const startSleepMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from('sleep_sessions').insert([{
        user_id: user.id,
        start_time: new Date().toISOString(),
        is_active: true,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sleep-session'] });
      toast({ title: "Goodnight! 🌙", description: "Tracking started. Sweet dreams!" });
    },
    onError: (error: any) => {
      console.error(error);
      toast({ title: "Error", description: error.message || "Failed to start tracking", variant: "destructive" });
    },
  });

  const stopSleepMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error("No active session");
      const endTime = new Date();
      const startTime = new Date(activeSession.start_time);
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const { error } = await supabase.from('sleep_sessions').update({
        end_time: endTime.toISOString(),
        duration_seconds: durationSeconds,
        is_active: false,
        notes: notes || null,
      }).eq('id', activeSession.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sleep-session'] });
      queryClient.invalidateQueries({ queryKey: ['sleep-history'] });
      setNotes("");
      toast({ title: "Good Morning! ☀️", description: "Sleep session saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSleepMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('sleep_sessions').delete().eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-history'] });
      toast({ title: "Deleted", description: "Session removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Analysis Logic
  const calculateAnalysis = () => {
    if (sleepHistory.length === 0) return null;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = sleepHistory.filter(s => new Date(s.start_time) >= sevenDaysAgo);

    if (recentSessions.length === 0) return null;

    const avgSeconds = recentSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / recentSessions.length;
    const avgHours = avgSeconds / 3600;
    const debt = targetHours - avgHours;

    let advice = "";
    let status: 'good' | 'warning' | 'critical' = 'good';

    if (avgHours < 5) {
      advice = "You are severely sleep deprived. Your cognitive performance is likely dropping. Prioritize 7-8 hours tonight.";
      status = 'critical';
    } else if (debt > 1) {
      advice = `You're averaging ${avgHours.toFixed(1)}h, missing your ${targetHours}h goal. Try going to bed by ${bedTime} consistently.`;
      status = 'warning';
    } else {
      advice = "Excellent work! Your sleep schedule is effectively fueling your studies.";
      status = 'good';
    }

    return { avgHours, debt, advice, status, count: recentSessions.length };
  };

  const analysis = calculateAnalysis();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Sleep Lab
            </h1>
            <p className="text-muted-foreground">Optimize your rest for maximum brain power</p>
          </div>

          {/* Goal Setter */}
          <div className="flex bg-card p-2 rounded-xl border border-border/50 gap-4 items-center shadow-lg">
            <div className="flex flex-col px-2">
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Bedtime</span>
              <input
                type="time"
                value={bedTime}
                onChange={e => setBedTime(e.target.value)}
                className="bg-transparent border-none text-sm font-mono focus:ring-0 p-0"
              />
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col px-2">
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Wake Up</span>
              <input
                type="time"
                value={wakeTime}
                onChange={e => setWakeTime(e.target.value)}
                className="bg-transparent border-none text-sm font-mono focus:ring-0 p-0"
              />
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col px-2">
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Goal</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  value={targetHours}
                  onChange={e => setTargetHours(parseFloat(e.target.value))}
                  className="bg-transparent border-none text-sm font-mono focus:ring-0 p-0 w-8"
                />
                <span className="text-xs">h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insight Panel */}
        {analysis && (
          <Card className={`border-l-4 ${analysis.status === 'critical' ? 'border-l-red-500' : analysis.status === 'warning' ? 'border-l-yellow-500' : 'border-l-green-500'} bg-card/50`}>
            <CardContent className="p-6 flex items-start gap-4">
              <div className={`p-3 rounded-full ${analysis.status === 'critical' ? 'bg-red-500/10 text-red-500' : analysis.status === 'warning' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>
                {analysis.status === 'critical' ? <AlertCircle className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Weekly Sleep Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.advice}</p>
                <div className="flex gap-4 mt-2 text-xs font-mono">
                  <span className="text-primary">Avg: {analysis.avgHours.toFixed(1)}h</span>
                  <span className={`${analysis.debt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {analysis.debt > 0 ? `Debt: -${analysis.debt.toFixed(1)}h` : `Surplus: +${Math.abs(analysis.debt).toFixed(1)}h`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Timer Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Moon className="h-32 w-32" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Live Tracker
              </CardTitle>
              <CardDescription>
                {activeSession ? "Tracking your rest pattern..." : "Ready to recharge?"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 relative z-10">
              <div className="text-center py-8">
                <div className={`text-6xl md:text-7xl font-mono font-bold tracking-tight ${activeSession ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-muted-foreground/30'}`}>
                  {formatDuration(currentDuration)}
                </div>
                {activeSession && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                    Recording Sleep Data
                  </div>
                )}
              </div>

              {activeSession ? (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Optional: Note any pre-sleep thoughts..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-black/20 border-white/5 resize-none h-20"
                  />
                  <Button onClick={() => stopSleepMutation.mutate()} className="w-full h-14 text-lg bg-red-500/80 hover:bg-red-600">
                    <Square className="mr-2 h-5 w-5 fill-current" /> Stop Sleeping
                  </Button>
                </div>
              ) : (
                <Button onClick={() => startSleepMutation.mutate()} className="w-full h-14 text-lg bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                  <Moon className="mr-2 h-5 w-5" /> Start Sleep
                </Button>
              )}
            </CardContent>
          </Card>

          {/* History List */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Last 30 days log</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {sleepHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BedDouble className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No logs found.</p>
                  </div>
                ) : (
                  sleepHistory.map(session => (
                    <div key={session.id} className="group flex items-center justify-between p-4 rounded-xl bg-card hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                      <div className="flex gap-4 items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${(session.duration_seconds || 0) / 3600 >= targetHours
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-orange-500/10 text-orange-500'
                          }`}>
                          {(session.duration_seconds || 0) / 3600 >= targetHours ? <CheckCircle2 className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-lg">
                            {formatDuration(session.duration_seconds || 0)}
                          </div>
                          <div className="text-xs text-muted-foreground flex gap-2">
                            <span>{formatDateTime(session.start_time)}</span>
                            {session.notes && <span className="text-white/50 max-w-[150px] truncate border-l border-white/10 pl-2">{session.notes}</span>}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => deleteSleepMutation.mutate(session.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SleepTracker;
