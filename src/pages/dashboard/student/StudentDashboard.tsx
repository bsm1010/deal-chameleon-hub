import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Award,
  Flame,
  ArrowLeft,
  Play,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/Spinner";
import StudentLayout from "./StudentLayout";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

export default function StudentDashboard() {
  const { user, profile } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["student-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("*, courses(*)")
        .eq("student_id", user.id);

      const completedCourses = enrollments?.filter((e) => e.completed).length ?? 0;
      const totalHours = enrollments?.reduce((acc, e) => acc + (e.hours_learned ?? 0), 0) ?? 0;
      const certificates = enrollments?.filter((e) => e.certificate_issued).length ?? 0;

      const { data: streak } = await supabase
        .from("student_streaks")
        .select("current_streak")
        .eq("student_id", user.id)
        .single();

      return {
        completedCourses,
        totalHours,
        certificates,
        streakDays: streak?.current_streak ?? 0,
      };
    },
    enabled: !!user,
  });

  const { data: continueLearning, isLoading: continueLoading } = useQuery({
    queryKey: ["student-continue-learning", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("course_enrollments")
        .select("*, courses(title, thumbnail_url, teacher:profiles!courses_teacher_id_fkey(full_name))")
        .eq("student_id", user.id)
        .eq("completed", false)
        .order("last_accessed_at", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: recentCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ["student-recent-courses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("course_enrollments")
        .select("*, courses(title, thumbnail_url, teacher:profiles!courses_teacher_id_fkey(full_name))")
        .eq("student_id", user.id)
        .order("last_accessed_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: upcomingSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["student-upcoming-sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("booked_sessions")
        .select("*, teacher:profiles!booked_sessions_teacher_id_fkey(full_name, avatar_url)")
        .eq("student_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(3);
      return data ?? [];
    },
    enabled: !!user,
  });

  const isLoading = statsLoading || continueLoading || coursesLoading || sessionsLoading;

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </StudentLayout>
    );
  }

  const statCards = [
    { label: "دورات مكتملة", value: stats?.completedCourses ?? 0, icon: BookOpen, color: "text-blue-500" },
    { label: "ساعة تعلم", value: stats?.totalHours ?? 0, icon: Clock, color: "text-green-500" },
    { label: "شهادة", value: stats?.certificates ?? 0, icon: Award, color: "text-yellow-500" },
    { label: "يوم متتالي", value: stats?.streakDays ?? 0, icon: Flame, color: "text-orange-500" },
  ];

  return (
    <StudentLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold">
            مرحباً {profile?.full_name}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            واصل رحلة التعلم củaك
          </p>
        </motion.div>

        {continueLearning && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">تابع التعلم</p>
                    <h3 className="text-lg font-semibold mb-2">
                      {continueLearning.courses?.title}
                    </h3>
                    <Progress value={continueLearning.progress ?? 0} className="h-2 mb-1" />
                    <p className="text-xs text-muted-foreground">
                      {continueLearning.progress ?? 0}% مكتمل
                    </p>
                  </div>
                  <Button asChild>
                    <Link to={`/course/${continueLearning.course_id}/learn`}>
                      <Play className="h-4 w-4 ml-2" />
                      متابعة التعلم
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} custom={i + 1} variants={fadeUp} initial="hidden" animate="visible">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">دوراتي</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/student/courses">
                عرض الكل
                <ArrowLeft className="h-4 w-4 mr-1" />
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {recentCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-muted relative">
                  {course.courses?.thumbnail_url ? (
                    <img
                      src={course.courses.thumbnail_url}
                      alt={course.courses.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-1">{course.courses?.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {(course.courses?.teacher as Record<string, unknown>)?.full_name as string}
                  </p>
                  <Progress value={course.progress ?? 0} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">{course.progress ?? 0}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">الحصص القادمة</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/student/sessions">
                عرض الكل
                <ArrowLeft className="h-4 w-4 mr-1" />
              </Link>
            </Button>
          </div>
          {upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">لا توجد حصص قادمة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {(session.teacher as Record<string, unknown>)?.full_name as string}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.scheduled_at).toLocaleDateString("ar-DZ", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge variant="outline">{session.subject}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </StudentLayout>
  );
}
