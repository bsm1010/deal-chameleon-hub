import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
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
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-card bg-card p-6 shadow-sm border border-border">
            <h3 className="font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-primary">1,234</p>
          </div>
          <div className="rounded-card bg-card p-6 shadow-sm border border-border">
            <h3 className="font-semibold mb-2">Tutors</h3>
            <p className="text-3xl font-bold text-primary">89</p>
          </div>
          <div className="rounded-card bg-card p-6 shadow-sm border border-border">
            <h3 className="font-semibold mb-2">Courses</h3>
            <p className="text-3xl font-bold text-primary">245</p>
          </div>
          <div className="rounded-card bg-card p-6 shadow-sm border border-border">
            <h3 className="font-semibold mb-2">Revenue</h3>
            <p className="text-3xl font-bold text-primary">2.4M DZD</p>
          </div>
        </div>
      </main>
    </div>
  );
}
