import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary">معلم Moualim</Link>
        </div>

        <div className="rounded-card bg-card p-8 shadow-sm border border-border">
          <h2 className="text-2xl font-bold mb-6">{t("auth.login")}</h2>

          <form className="space-y-4">
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full rounded-button">
              {t("auth.login")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {t("auth.noAccount")}{" "}
            <Link to="/signup/student" className="text-primary hover:underline">
              {t("nav.signup")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
