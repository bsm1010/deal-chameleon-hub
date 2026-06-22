import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function MoualimLanding() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">معلم Moualim</h1>
          <nav className="flex items-center gap-4">
            <Link to="/browse" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.browse")}
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">{t("nav.login")}</Button>
            </Link>
            <Link to="/signup/student">
              <Button size="sm">{t("nav.signup")}</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-24 text-center">
          <h2 className="text-5xl font-bold tracking-tight mb-6">
            {t("landing.hero")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("landing.subtitle")}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/browse">
              <Button size="lg" className="rounded-button">
                {t("landing.browse")}
                <ArrowRight className="ms-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-card bg-card p-8 shadow-sm border border-border">
              <div className="text-3xl mb-4">🎓</div>
              <h3 className="text-lg font-semibold mb-2">دورات فيديو</h3>
              <p className="text-muted-foreground">courses pré-enregistrés par des tuteurs qualifiés</p>
            </div>
            <div className="rounded-card bg-card p-8 shadow-sm border border-border">
              <div className="text-3xl mb-4">📹</div>
              <h3 className="text-lg font-semibold mb-2">جلوس مباشرة</h3>
              <p className="text-muted-foreground">Sessions live interactives avec vos tuteurs</p>
            </div>
            <div className="rounded-card bg-card p-8 shadow-sm border border-border">
              <div className="text-3xl mb-4">🇩🇿</div>
              <h3 className="text-lg font-semibold mb-2">جزائري 100%</h3>
              <p className="text-muted-foreground">Plateforme entièrement algérienne</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Moualim — All rights reserved
        </div>
      </footer>
    </div>
  );
}
