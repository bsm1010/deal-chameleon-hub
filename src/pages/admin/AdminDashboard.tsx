import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, DollarSign, Clock, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface Stats {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalRevenue: number;
  pendingApprovals: number;
  pendingPayouts: number;
}

async function fetchStats(): Promise<Stats> {
  const [usersResult, teachersResult, studentsResult, pendingResult, coursesResult, payoutsResult] = await Promise.all([
    supabase.from("profiles" as any).select("id", { count: "exact", head: true }),
    supabase.from("profiles" as any).select("id", { count: "exact", head: true }).eq("role", "teacher"),
    supabase.from("profiles" as any).select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles" as any).select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
    supabase.from("courses" as any).select("id", { count: "exact", head: true }),
    supabase.from("payout_requests" as any).select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const courseCount = coursesResult.count ?? 0;

  return {
    totalUsers: usersResult.count ?? 0,
    totalTeachers: teachersResult.count ?? 0,
    totalStudents: studentsResult.count ?? 0,
    totalRevenue: courseCount * 1500,
    pendingApprovals: pendingResult.count ?? 0,
    pendingPayouts: payoutsResult.count ?? 0,
  };
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  const cards = [
    {
      title: t("admin.stats", "إجمالي المستخدمين"),
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      title: t("admin.teachers", "المدرسون"),
      value: stats?.totalTeachers ?? 0,
      icon: GraduationCap,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      title: t("admin.students", "الطلاب"),
      value: stats?.totalStudents ?? 0,
      icon: GraduationCap,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
    },
    {
      title: "الإيرادات",
      value: `${(stats?.totalRevenue ?? 0).toLocaleString()} دج`,
      icon: DollarSign,
      color: "text-yellow-600",
      bg: "bg-yellow-500/10",
    },
    {
      title: t("admin.pendingApprovals", "قيد المراجعة"),
      value: stats?.pendingApprovals ?? 0,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-500/10",
    },
    {
      title: "مدفوعات معلقة",
      value: stats?.pendingPayouts ?? 0,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">{t("admin.stats", "لوحة التحكم — الإحصائيات")}</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
