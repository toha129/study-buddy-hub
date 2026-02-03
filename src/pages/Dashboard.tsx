import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckSquare, Calendar, Clock, Target, Play, Pause, RotateCcw, Timer, ChevronRight, Bot, Bell, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Background3D from "@/components/3d/Background3D";
import Card3D from "@/components/3d/Card3D";
import AIChatTerminal from "@/components/AIChatTerminal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";

  const [studyTime, setStudyTime] = useState(1500);
  const [initialTime, setInitialTime] = useState(1500);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [totalStudyTime, setTotalStudyTime] = useState(() => {
    const saved = localStorage.getItem('sb_total_study_time');
    return saved ? parseInt(saved) : 0;
  });

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Timer Edit State
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editMinutes, setEditMinutes] = useState("25");

  const handleTimerUpdate = () => {
    const minutes = parseInt(editMinutes);
    if (!isNaN(minutes) && minutes > 0) {
      setInitialTime(minutes * 60);
      setStudyTime(minutes * 60);
    }
    setIsEditingTimer(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && studyTime > 0) {
      interval = setInterval(() => {
        setStudyTime((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            const newTotal = totalStudyTime + initialTime;
            setTotalStudyTime(newTotal);
            localStorage.setItem('sb_total_study_time', newTotal.toString());
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTimerRunning, studyTime, initialTime, totalStudyTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Supabase Data Fetching
  const { data: activeQuizzes = [] } = useQuery({
    queryKey: ['active-quizzes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('quizzes')
        .select('title, id')
        .eq('user_id', user.id)
        .eq('completed', false)
        .limit(3);
      return (data || []) as unknown as { title: string; id: string }[];
    },
  });

  const { data: pendingTodos = [] } = useQuery({
    queryKey: ['pending-todos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('todos')
        .select('task, id, due_date')
        .eq('user_id', user.id)
        .eq('completed', false)
        .limit(3);
      return (data || []) as unknown as { task: string; id: string; due_date?: string }[];
    },
  });

  const notifications = [
    ...activeQuizzes.map(q => ({ type: 'quiz', title: `Quiz Pending: ${q.title}`, id: q.id })),
    ...pendingTodos.map(t => ({ type: 'todo', title: `Task Due: ${t.task}`, id: t.id }))
  ];

  return (
    <div className="min-h-screen relative font-sans text-foreground overflow-hidden">
      <Background3D />
      <Navbar />

      {/* AI Chat Modal */}
      <AIChatTerminal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      <main className="container mx-auto px-4 py-8 space-y-8 animate-fade-in relative z-10">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="space-y-2">
            <p className="text-xs font-bold text-accent uppercase tracking-[0.2em] animate-pulse">System Status: Online</p>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-lg">
              {greeting}
            </h1>
          </div>
        </section>

        {/* Modular 3D Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 auto-rows-[minmax(200px,auto)]">

          {/* AI Assistant Card - Placed prominently */}
          <Card3D className="col-span-1 md:col-span-2" intensity={15} depth={40}>
            <div
              onClick={() => setIsChatOpen(true)}
              className="h-full vibe-card p-0 flex flex-row items-stretch cursor-pointer group border-primary/50 shadow-[0_0_20px_rgba(112,0,255,0.15)] hover:shadow-[0_0_40px_rgba(112,0,255,0.4)] transition-all"
            >
              <div className="w-24 bg-primary/10 flex items-center justify-center border-r border-primary/20 group-hover:bg-primary/20 transition-colors">
                <Bot className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  AI Neural Tutor
                  <span className="text-[10px] bg-primary text-black px-2 py-0.5 rounded-sm font-bold uppercase tracking-widest">Beta</span>
                </h3>
                <p className="text-sm text-gray-400">
                  Ask complex questions, generate study plans, or just chat.
                  <span className="text-primary block mt-1 font-mono text-xs">&gt; Click to initialize sequence...</span>
                </p>
              </div>
            </div>
          </Card3D>

          {/* Notifications Card - Replaces old Stat Cards */}
          <Card3D className="col-span-1 md:col-span-2" intensity={20} depth={50}>
            <div className="h-full vibe-card p-6 flex flex-col group">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-black/50 rounded-xl border border-accent/30 shadow-[0_0_15px_rgba(255,0,128,0.3)]">
                  <Bell className="h-5 w-5 text-accent animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Recent Notifications</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">
                    {notifications.length} Pending Actions
                  </p>
                </div>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[150px] pr-2 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">All caught up! No pending tasks.</p>
                  </div>
                ) : (
                  notifications.map((note: any) => (
                    <div key={`${note.type}-${note.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      {note.type === 'quiz' ? (
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#00ff00]" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#00f0ff]" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-200 font-medium truncate">{note.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{note.type === 'quiz' ? 'Quiz Assessment' : 'Task Deadline'}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card3D>

          {/* Hero Timer */}
          <Card3D className="col-span-1 md:col-span-2 row-span-2" intensity={10} depth={80}>
            <div className="h-full vibe-card bg-gradient-to-br from-gray-900 to-black p-8 flex flex-col justify-center items-center relative">
              {/* Decorative Rings */}
              <div className="absolute inset-0 border-[1px] border-white/5 rounded-2xl m-2" />
              <div className="absolute inset-0 border-[1px] border-white/5 rounded-2xl m-4" />

              <div className="z-20 text-center w-full max-w-md">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6 border border-primary/20">
                  Focus Mode
                </span>

                <div className="inset-panel p-8 mb-8 bg-black/80 border-primary/10">
                  {isEditingTimer ? (
                    <div className="flex items-center justify-center gap-2">
                      <Input
                        type="number"
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(e.target.value)}
                        className="text-center text-4xl w-32 bg-transparent border-b-2 border-primary border-t-0 border-x-0 rounded-none focus-visible:ring-0 text-white font-mono"
                        autoFocus
                        onBlur={handleTimerUpdate}
                        onKeyDown={(e) => e.key === 'Enter' && handleTimerUpdate()}
                      />
                      <span className="text-gray-500 font-mono text-xl">min</span>
                    </div>
                  ) : (
                    <div
                      onClick={() => !isTimerRunning && setIsEditingTimer(true)}
                      className={`text-7xl font-mono font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] ${!isTimerRunning ? 'cursor-pointer hover:text-primary hover:drop-shadow-[0_0_15px_rgba(112,0,255,0.5)] transition-all' : ''}`}
                      title="Click to edit duration"
                    >
                      {formatTime(studyTime)}
                    </div>
                  )}
                </div>

                <div className="flex gap-6 justify-center">
                  <Button
                    size="lg"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="h-16 px-10 rounded-xl bg-primary hover:bg-primary/80 text-white font-bold text-lg shadow-[0_0_20px_rgba(112,0,255,0.4)] border border-white/10 transition-all hover:scale-105 active:scale-95"
                  >
                    {isTimerRunning ? <Pause /> : <Play />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => { setStudyTime(initialTime); setIsTimerRunning(false); }}
                    className="h-16 w-16 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                  >
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          </Card3D>

          {/* Stat Card: Goal */}
          <Card3D className="col-span-1" intensity={20} depth={50}>
            <div className="h-full vibe-card p-6 flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-black/50 rounded-xl border border-accent/30 shadow-[0_0_15px_rgba(255,0,128,0.3)]">
                  <Target className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div className="mt-4 inset-panel p-4">
                <div className="flex items-end gap-2 mb-1">
                  <p className="text-4xl font-bold text-white">0%</p>
                  <span className="text-xs text-green-400 font-bold mb-1.5">+2%</span>
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Weekly Goal</p>
              </div>
            </div>
          </Card3D>

          {/* Stat Card: Hours */}
          <Card3D className="col-span-1" intensity={20} depth={50}>
            <div className="h-full vibe-card p-6 flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-black/50 rounded-xl border border-white/10">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 inset-panel p-4">
                <p className="text-4xl font-bold text-white mb-1">{formatTime(totalStudyTime).split(':')[0]}h</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Studied Today</p>
              </div>
            </div>
          </Card3D>

          {/* Action Cards */}
          <div className="col-span-1 md:col-span-3 lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Practice Quiz', icon: BookOpen, color: 'text-primary', link: '/quizzes' },
              { title: 'New Task', icon: CheckSquare, color: 'text-secondary', link: '/todos' },
              { title: 'Manage Subjects', icon: Calendar, color: 'text-accent', link: '/subjects' }
            ].map((item, idx) => (
              <Card3D key={idx} intensity={15} depth={30}>
                <Link to={item.link} className="block h-full">
                  <div className="h-full vibe-card p-6 flex items-center justify-between hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer">
                    <div className="flex items-center gap-6">
                      <div className="p-5 inset-panel bg-black/40">
                        <item.icon className={`h-8 w-8 ${item.color}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-white">{item.title}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Access Module</p>
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-gray-500" />
                  </div>
                </Link>
              </Card3D>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
