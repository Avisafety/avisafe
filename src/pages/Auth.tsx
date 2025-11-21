import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Chrome } from "lucide-react";
import droneBackground from "@/assets/drone-background.png";
const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vennligst fyll ut alle felt");
      return;
    }
    if (!isLogin && !fullName) {
      toast.error("Vennligst fyll ut fullt navn");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const {
          data,
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        if (data.user) {
          // Check if user is approved
          const {
            data: profileData
          } = await supabase.from("profiles").select("approved").eq("id", data.user.id).maybeSingle();
          if (profileData && !(profileData as any).approved) {
            await supabase.auth.signOut();
            toast.error("Din konto venter på godkjenning fra administrator");
            return;
          }
          toast.success("Innlogging vellykket!");
          navigate("/");
        }
      } else {
        const {
          data,
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName
            }
          }
        });
        if (error) throw error;
        if (data.user) {
          toast.success("Konto opprettet! Venter på godkjenning fra administrator.");
          setEmail("");
          setPassword("");
          setFullName("");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "En feil oppstod");
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'Kunne ikke logge inn med Google');
      setLoading(false);
    }
  };
  return <div className="min-h-screen relative flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 z-0" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${droneBackground})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed"
    }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="bg-card/95 backdrop-blur-sm border-border/50">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Sikkerhetsstyringssystem</CardTitle>
                <CardDescription className="text-primary">Drone Operations</CardDescription>
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-xl">
                {isLogin ? "Logg inn" : "Opprett konto"}
              </CardTitle>
              <CardDescription>
                {isLogin ? "Skriv inn dine innloggingsdetaljer" : "Fyll ut skjemaet for å opprette en konto"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && <div className="space-y-2">
                  <Label htmlFor="fullName">Fullt navn</Label>
                  <Input id="fullName" type="text" placeholder="Ola Nordmann" value={fullName} onChange={e => setFullName(e.target.value)} required={!isLogin} />
                </div>}
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input id="email" type="email" placeholder="din@epost.no" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passord</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Behandler..." : isLogin ? "Logg inn" : "Opprett konto"}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>

            <div className="text-center text-sm">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
                {isLogin ? "Har du ikke konto? Opprett en her" : "Har du allerede konto? Logg inn her"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Auth;