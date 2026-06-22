import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  Star,
  BookOpen,
  Plus,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

interface TeacherStats {
  total_earnings: number;
  total_students: number;
  average_rating: number;
  total_courses: number;
}

interface RecentSale {
  id: string;
  student_name: string;
  item_name: string;
  amount: number;
  created_at: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["teacher-profile-full", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<TeacherStats>({
    queryKey: ["teacher-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return { total_earnings: 0, total_students: 0, average_rating: 0, total_courses: 0 };
      }

      const { data: courses } = await supabase
        .from("courses")
        .select("id, price")
        .eq("teacher_id", user.id);

      const courseIdList = courses?.map((c) => c.id) ?? [];

      const { count: studentCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .in("course_id", courseIdList.length > 0 ? courseIdList : ["__none__"]);

      const { data: ratingData } = await supabase
        .from("reviews")
        .select("rating")
        .in("course_id", courseIdList.length > 0 ? courseIdList : ["__none__"]);

      const { data: earningsData } = await supabase
        .from("transactions")
        .select("net_amount")
        .eq("teacher_id", user.id)
        .eq("status", "completed");

      const totalEarnings = earningsData?.reduce((sum, t) => sum + (t.net_amount ?? 0), 0) ?? 0;
      const avgRating =
        ratingData && ratingData.length > 0
          ? ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length
          : 0;

      return {
        total_earnings: totalEarnings,
        total_students: studentCount ?? 0,
        average_rating: Math.round(avgRating * 10) / 10,
        total_courses: courses?.length ?? 0,
      };
    },
    enabled: !!user?.id,
  });

  const { data: recentSales } = useQuery<RecentSale[]>({
    queryKey: ["recent-sales", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("transactions")
        .select("id, student_name, item_name, amount, created_at")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const isPending = profile?.verification_status === "pending";

  const statCards = [
    {
      title: "إجمالي الأرباح",
      value: `${(stats?.total_earnings ?? 0).toLocaleString()} دج`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "إجمالي الطلاب",
      value: stats?.total_students ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "متوسط التقييم",
      value: stats?.average_rating ?? 0,
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "عدد الدورات",
      value: stats?.total_courses ?? 0,
      icon: BookOpen,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-6">
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              حسابك قيد المراجعة
            </p>
            <p className="text-xs text-amber-600">
              سيتم تفعيل حسابك بعد مراجعة المستندات. يمكنك تصفح لوحة التحكم أثناء الانتظار.
            </p>
          </div>
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            قيد المراجعة
          </Badge>
        </motion.div>
      )}

      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground text-sm mt-1">
          مرحباً بك في لوحة تحكم المعلم
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">
                      {statsLoading ? "—" : card.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              مبيعاتي الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales && recentSales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>الدورة / الحصة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {sale.student_name}
                      </TableCell>
                      <TableCell>{sale.item_name}</TableCell>
                      <TableCell>{sale.amount?.toLocaleString()} دج</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(sale.created_at).toLocaleDateString("ar-DZ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <DollarSign className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">لا توجد مبيعات بعد</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/dashboard/teacher/courses">
              <Button className="w-full justify-start gap-2" size="lg">
                <Plus className="h-4 w-4" />
                إنشاء دورة جديدة
              </Button>
            </Link>
            <Link to="/dashboard/teacher/schedule">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                size="lg"
              >
                <Plus className="h-4 w-4" />
                إضافة حصة جديدة
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
