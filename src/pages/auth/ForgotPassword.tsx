import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(t("auth.error", "Something went wrong"));
    } else {
      setSent(true);
      toast.success(t("auth.resetEmailSent", "Reset email sent!"));
    }

    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-[12px] bg-card p-8 shadow-sm border border-border">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("auth.checkEmail", "Check your email")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("auth.resetLinkSent", "We've sent a password reset link to your email.")}
            </p>
            <Link to="/login">
              <Button variant="outline" className="rounded-[8px]">
                {t("nav.login")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary">معلم Moualim</Link>
        </div>

        <div className="rounded-[12px] bg-card p-8 shadow-sm border border-border">
          <h2 className="text-2xl font-bold mb-2">{t("auth.forgotPassword")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("auth.forgotPasswordDesc", "Enter your email and we'll send you a reset link.")}
          </p>

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

            <Button type="submit" className="w-full rounded-[8px]" disabled={loading}>
              {loading ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                t("auth.sendResetLink", "Send reset link")
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link to="/login" className="text-primary hover:underline">
              {t("common.back")} {t("nav.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
