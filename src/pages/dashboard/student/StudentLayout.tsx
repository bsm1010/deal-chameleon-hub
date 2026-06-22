import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookOpen,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { key: "dashboard", label: "لوحة التحكم", icon: Home, path: "/dashboard/student" },
  { key: "courses", label: "دوراتي", icon: BookOpen, path: "/dashboard/student/courses" },
  { key: "sessions", label: "حصصي", icon: Calendar, path: "/dashboard/student/sessions" },
  { key: "purchases", label: "مشترياتي", icon: CreditCard, path: "/dashboard/student/purchases" },
  { key: "settings", label: "إعداداتي", icon: Settings, path: "/dashboard/student/settings" },
];

interface StudentLayoutProps {
  children: ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "?";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link to="/" className="text-2xl font-bold text-primary">معلم</Link>
      </div>

      <div className="px-6 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name}</p>
            <Badge variant="secondary" className="mt-1 text-xs gap-1">
              <Star className="h-3 w-3 fill-current" />
              طالب
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {isMobile ? (
        <>
          <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="text-xl font-bold text-primary">معلم</Link>
            <div className="w-10" />
          </div>

          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/50"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.aside
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: "spring", damping: 25, stiffness: 250 }}
                  className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border"
                >
                  <div className="absolute top-3 right-3">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  {sidebarContent}
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          <main className="flex-1 pt-16 px-4 pb-6">
            {children}
          </main>
        </>
      ) : (
        <>
          <aside className="w-64 border-l border-border bg-background h-screen sticky top-0 overflow-y-auto flex-shrink-0">
            {sidebarContent}
          </aside>
          <main className="flex-1 px-6 py-6 overflow-y-auto">
            {children}
          </main>
        </>
      )}
    </div>
  );
}
