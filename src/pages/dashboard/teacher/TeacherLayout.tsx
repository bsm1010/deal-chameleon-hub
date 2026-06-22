import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookOpen,
  Calendar,
  DollarSign,
  Star,
  User,
  LogOut,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface TeacherProfileData {
  verification_status: string | null;
}

const navItems = [
  { to: "/dashboard/teacher", icon: Home, label: "لوحة التحكم", end: true },
  { to: "/dashboard/teacher/courses", icon: BookOpen, label: "دوراتي" },
  { to: "/dashboard/teacher/schedule", icon: Calendar, label: "جدولي" },
  { to: "/dashboard/teacher/earnings", icon: DollarSign, label: "أرباحي" },
  { to: "/dashboard/teacher/reviews", icon: Star, label: "تقييماتي" },
  { to: "/dashboard/teacher/profile", icon: User, label: "ملفي الشخصي" },
];

export default function TeacherLayout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: teacherData } = useQuery<TeacherProfileData | null>({
    queryKey: ["teacher-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("teacher_profiles")
        .select("verification_status")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "??";

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <aside className="hidden lg:flex lg:flex-col w-72 border-l border-border bg-card">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            م
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight">معلم</h1>
            <p className="text-sm text-muted-foreground truncate">
              {profile?.full_name ?? "المعلم"}
            </p>
          </div>
          {teacherData?.verification_status === "verified" && (
            <Badge variant="default" className="gap-1 text-xs">
              <ShieldCheck className="h-3 w-3" />
              موثّق
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-4 border-b border-border bg-card px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              م
            </div>
            <span className="font-bold">معلم</span>
          </div>
          <div className="flex-1" />
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={typeof window !== "undefined" ? window.location.pathname : ""}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
