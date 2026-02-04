import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Background3D from "@/components/3d/Background3D";

const Auth = () => {
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Check if user is already logged in and redirect to dashboard
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("User already logged in, redirecting to dashboard...");
        navigate("/");
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (rememberMe) {
      localStorage.setItem("remembered_email", email);
    } else {
      localStorage.removeItem("remembered_email");
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email Not Verified",
            description: "Please check your email for the verification link.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Welcome Back!",
          description: "Logged in successfully.",
        });
        navigate("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage = error.message || "An unknown error occurred";

      if (error.message?.includes("fetch")) {
        errorMessage = "Connection failed. Please check if Supabase is active and your internet connection is working.";
      } else if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Please verify your email before logging in.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        toast({
          title: "Success! 🚀",
          description: "Account created and logged in!",
        });
        navigate("/");
      } else {
        toast({
          title: "Account Created! ✨",
          description: "Please sign in with your new credentials.",
        });
        setIsSignUpActive(false);
      }
    } catch (error: any) {
      console.error("Signup error:", error);

      let errorMessage = error.message || "An unknown error occurred";

      if (error.message?.includes("fetch")) {
        errorMessage = "Connection failed. Please check if Supabase is active and your internet connection is working.";
      } else if (error.message?.includes("already registered")) {
        errorMessage = "This email is already registered. Please sign in instead.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`auth-body flex items-center justify-center min-h-screen flex-col relative overflow-hidden`}>
      <Background3D />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');

        .auth-body {
          /* background removed to show 3D canvas */
          font-family: 'Montserrat', sans-serif;
          position: relative;
        }

        .container {
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 14px 28px rgba(0,0,0,0.25), 
              0 10px 10px rgba(0,0,0,0.22);
          position: relative;
          overflow: hidden;
          width: 768px;
          max-width: 100%;
          min-height: 480px;
          z-index: 10; /* Ensure it stays above 3D background */
        }

        .form-container {
          position: absolute;
          top: 0;
          height: 100%;
          transition: all 0.6s ease-in-out;
        }

        .sign-in-container {
          left: 0;
          width: 50%;
          z-index: 2;
        }

        .container.right-panel-active .sign-in-container {
          transform: translateX(100%);
        }

        .sign-up-container {
          left: 0;
          width: 50%;
          opacity: 0;
          z-index: 1;
        }

        .container.right-panel-active .sign-up-container {
          transform: translateX(100%);
          opacity: 1;
          z-index: 5;
          animation: show 0.6s;
        }

        @keyframes show {
          0%, 49.99% {
            opacity: 0;
            z-index: 1;
          }
          50%, 100% {
            opacity: 1;
            z-index: 5;
          }
        }

        .overlay-container {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          overflow: hidden;
          transition: transform 0.6s ease-in-out;
          z-index: 100;
        }

        .container.right-panel-active .overlay-container {
          transform: translateX(-100%);
        }

        .overlay {
          background-color: #0f1012;
          background-image: 
            linear-gradient(45deg, #151515 25%, transparent 25%, transparent 75%, #151515 75%, #151515), 
            linear-gradient(45deg, #151515 25%, transparent 25%, transparent 75%, #151515 75%, #151515);
          background-position: 0 0, 10px 10px;
          background-size: 20px 20px;
          color: #FFFFFF;
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
          border-left: 1px solid #333;
        }

        .container.right-panel-active .overlay {
          transform: translateX(50%);
        }

        .overlay-panel {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 40px;
          text-align: center;
          top: 0;
          height: 100%;
          width: 50%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }

        .overlay-left {
          transform: translateX(-20%);
        }

        .container.right-panel-active .overlay-left {
          transform: translateX(0);
        }

        .overlay-right {
          right: 0;
          transform: translateX(0);
        }

        .container.right-panel-active .overlay-right {
          transform: translateX(20%);
        }

        .social-container {
          margin: 20px 0;
        }

        .social-container a {
          border: 1px solid #DDDDDD;
          border-radius: 50%;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          margin: 0 5px;
          height: 40px;
          width: 40px;
          color: #333;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        
        .social-container a:hover {
            background-color: #eee;
        }

        form {
          background-color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 50px;
          height: 100%;
          text-align: center;
        }

        input {
          background-color: #eee;
          border: none;
          padding: 12px 15px;
          margin: 8px 0;
          width: 100%;
          border-radius: 4px;
          outline: none;
          color: #333; /* Ensuring text is visible */
        }

        .btn-custom {
          border-radius: 20px;
          border: 1px solid #512DA8;
          background-color: #512DA8;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: bold;
          padding: 12px 45px;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: transform 80ms ease-in, background-color 0.3s;
          cursor: pointer;
          margin-top: 10px;
        }

        .btn-custom:active {
          transform: scale(0.95);
        }

        .btn-custom:focus {
          outline: none;
        }

        .btn-custom.ghost {
          background-color: transparent;
          border-color: #FFFFFF;
        }
        
        .btn-custom.ghost:hover {
          background-color: rgba(255,255,255,0.1);
        }

        h1 {
            font-weight: bold;
            margin: 0;
            color: #333;
        }
        
        .overlay h1 {
            color: #fff;
        }

        p {
            font-size: 14px;
            font-weight: 100;
            line-height: 20px;
            letter-spacing: 0.5px;
            margin: 20px 0 30px;
            color: #333;
        }
        
        .overlay p {
            color: #fff;
        }

        span {
            font-size: 12px;
        }
      `}</style>

      <div className={`container ${isSignUpActive ? "right-panel-active" : ""}`} id="container">
        {/* Sign Up Form */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignup}>
            <h1 className="text-2xl mb-2">Create Account</h1>
            <div className="social-container">
              <a href="#" className="social">F</a>
              <a href="#" className="social">G</a>
              <a href="#" className="social">L</a>
            </div>
            <span className="text-muted-foreground mb-2">or use your email for registration</span>
            <input
              type="text"
              placeholder="Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
            <button className="btn-custom" disabled={isLoading}>
              {isLoading ? "Creating..." : "Sign Up"}
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleLogin}>
            <h1 className="text-2xl mb-2">Sign in</h1>
            <div className="social-container">
              <a href="#" className="social">F</a>
              <a href="#" className="social">G</a>
              <a href="#" className="social">L</a>
            </div>
            <span className="text-muted-foreground mb-2">or use your account</span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex items-center justify-between w-full my-2 text-xs text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer hover:text-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-auto m-0"
                />
                Remember me
              </label>
              <a href="#" className="hover:underline">Forgot your password?</a>
            </div>
            <button className="btn-custom" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Overlay */}
        <div className="overlay-container">
          <div className="overlay">

            {/* Left Panel (Visible during Sign Up) */}
            <div className="overlay-panel overlay-left">
              <h1 className="text-3xl font-bold mb-4">Innovation Starts Here</h1>
              <p className="mb-4 text-gray-300 italic">"Code is like humor. When you have to explain it, it’s bad." - Cory House</p>

              <div className="mt-8 p-4 border border-white/10 rounded-xl bg-black/20 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1 opacity-70">Developed By</p>
                <h3 className="font-bold text-lg tracking-wide text-white">S.M. Toha</h3>
                <p className="text-[10px] text-gray-400 font-mono">CSE, Daffodil International University</p>
              </div>

              <button
                className="btn-custom ghost mt-12"
                onClick={() => setIsSignUpActive(false)}
              >
                Access Account
              </button>
            </div>

            {/* Right Panel (Visible during Login) */}
            <div className="overlay-panel overlay-right">
              <h1 className="text-3xl font-bold mb-4">Limitless Potential</h1>
              <p className="mb-4 text-gray-300 italic">"The only way to do great work is to love what you do." - Steve Jobs</p>

              <div className="mt-8 p-4 border border-white/10 rounded-xl bg-black/20 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1 opacity-70">Developed By</p>
                <h3 className="font-bold text-lg tracking-wide text-white">S.M. Toha</h3>
                <p className="text-[10px] text-gray-400 font-mono">CSE, Daffodil International University</p>
              </div>

              <button
                className="btn-custom ghost mt-12"
                onClick={() => setIsSignUpActive(true)}
              >
                Create Account
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="mt-8 text-center pt-5 relative z-10">
        <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded-full border border-white/10">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Auth;
