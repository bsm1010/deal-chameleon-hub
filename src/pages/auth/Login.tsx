import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(t("auth.invalidCredentials", "Invalid email or password"));
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const redirectMap: Record<string, string> = {
        student: "/dashboard/student",
        teacher: "/dashboard/teacher",
        admin: "/admin",
      };

      toast.success(t("auth.welcomeBack", "Welcome back!"));
      navigate(redirectMap[profile?.role ?? "student"]);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary">
            معلم Moualim
          </Link>
        </div>

        <div className="rounded-[12px] bg-card p-8 shadow-sm border border-border">
          <h2 className="text-2xl font-bold mb-1">{t("auth.welcomeBack", "Welcome back")}</h2>
          <p className="text-muted-foreground mb-6">{t("auth.loginSubtitle", "Sign in to your account")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(v as boolean)}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer">
                  {t("auth.rememberMe", "Remember me")}
                </Label>
              </div>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                {t("auth.forgotPassword", "Forgot password?")}
              </Link>
            </div>

            <Button type="submit" className="w-full rounded-[8px]" disabled={loading}>
              {loading ? <Spinner size="sm" className="text-white" /> : t("auth.login")}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">{t("auth.or", "or")}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link to="/signup/student">
              <Button variant="outline" className="w-full rounded-[8px]">
                {t("auth.imStudent", "I'm a student — Sign up")}
              </Button>
            </Link>
            <Link to="/signup/teacher">
              <Button variant="outline" className="w-full rounded-[8px]">
                {t("auth.imTeacher", "I'm a teacher — Sign up")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
