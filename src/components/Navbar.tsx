import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Home, BookOpen, CheckSquare, Calendar, Moon, Sparkles, LogOut, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate("/auth");
    }
  };
  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-lg glow-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Study Buddy
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            <Button variant="ghost" asChild className="text-foreground/80 hover:text-foreground hover:bg-primary/10">
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-foreground/80 hover:text-foreground hover:bg-primary/10">
              <Link to="/quizzes" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Quizzes
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-foreground/80 hover:text-foreground hover:bg-primary/10">
              <Link to="/todos" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-foreground/80 hover:text-foreground hover:bg-primary/10">
              <Link to="/subjects" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Subjects
              </Link>
            </Button>

            <Button variant="ghost" asChild className="text-foreground/80 hover:text-foreground hover:bg-primary/10">
              <Link to="/sleep" className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Sleep
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-foreground/80 hover:text-foreground hover:bg-primary/10">
              <Link to="/groups" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Groups
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-foreground/80 hover:text-foreground hover:bg-primary/10">
              <Link to="/tools" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Tools
              </Link>
            </Button>
          </div>

          {user ? (
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-primary/50 hover:bg-primary/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          ) : (
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
