import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TeacherDashboard() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="text-2xl font-bold text-primary">معلم Moualim</Link>
          <Button variant="ghost" size="sm">{t("nav.logout")}</Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t("nav.dashboard")} — {t("auth.teacher")}</h1>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-card bg-card p-6 shadow-sm border border-border">
            <h3 className="font-semibold mb-2">My Courses</h3>
            <p className="text-3xl font-bold text-primary">5</p>
          </div>
          <div className="rounded-card bg-card p-6 shadow-sm border border-border">
            <h3 className="font-semibold mb-2">Students</h3>
            <p className="text-3xl font-bold text-primary">120</p>
          </div>
          <div className="rounded-card bg-card p-6 shadow-sm border border-border">
            <h3 className="font-semibold mb-2">Revenue</h3>
            <p className="text-3xl font-bold text-primary">180,000 DZD</p>
          </div>
        </div>
      </main>
    </div>
  );
}
