import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, BarChart3, Users, GraduationCapIcon, Wallet, BookOpen, Bell, LogOut } from "lucide-react";

const navItems = [
  { to: "/admin", icon: BarChart3, labelKey: "admin.stats", end: true },
  { to: "/admin/teachers", icon: Users, labelKey: "admin.teachers" },
  { to: "/admin/students", icon: GraduationCapIcon, labelKey: "admin.students" },
  { to: "/admin/payouts", icon: Wallet, labelKey: "admin.payouts" },
  { to: "/admin/courses", icon: BookOpen, labelKey: "admin.courses" },
  { to: "/admin/notifications", icon: Bell, labelKey: "admin.notifications" },
];

export default function AdminLayout() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <aside className="w-64 border-l border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-primary">{t("app.name", "معلم")}</h1>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Admin
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
