import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function Browse() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">معلم Moualim</h1>
          <nav className="flex items-center gap-4">
            <a href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.login")}
            </a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("common.search") + "..."} className="ps-9" />
          </div>
          <Button variant="outline">{t("common.filter")}</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-card bg-card p-6 shadow-sm border border-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  T{i}
                </div>
                <div>
                  <h3 className="font-semibold">Tutor {i}</h3>
                  <p className="text-sm text-muted-foreground">Mathematics</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Experienced tutor with 5+ years of teaching...
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">1500 DZD/h</span>
                <Button size="sm" className="rounded-button">{t("nav.browse")}</Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
