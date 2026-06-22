import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/Spinner";
import StudentLayout from "./StudentLayout";

export default function StudentCourses() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("in_progress");

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["student-courses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("course_enrollments")
        .select("*, courses(title, thumbnail_url, category, teacher:profiles!courses_teacher_id_fkey(full_name, avatar_url))")
        .eq("student_id", user.id)
        .order("enrolled_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const filteredCourses = enrollments?.filter((e) => {
    if (activeTab === "completed") return e.completed;
    if (activeTab === "in_progress") return !e.completed;
    return true;
  });

  return (
    <StudentLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">دوراتي</h1>
          <p className="text-muted-foreground mt-1">تابع تقدمك في جميع دوراتك</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="in_progress">قيد التعلم</TabsTrigger>
            <TabsTrigger value="completed">مكتملة</TabsTrigger>
            <TabsTrigger value="all">كل الدورات</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
              </div>
            ) : filteredCourses?.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    {activeTab === "completed"
                      ? "لم تكمل أي دورة بعد"
                      : activeTab === "in_progress"
                      ? "لا توجد دورات قيد التعلم"
                      : "لم تشترك في أي دورة بعد"}
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/browse">تصفح الدورات</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses?.map((enrollment, i) => (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                      <div className="aspect-video bg-muted relative">
                        {enrollment.courses?.thumbnail_url ? (
                          <img
                            src={enrollment.courses.thumbnail_url}
                            alt={enrollment.courses.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                          </div>
                        )}
                        {enrollment.completed && (
                          <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
                            مكتملة
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2 text-xs">
                            {enrollment.courses?.category}
                          </Badge>
                          <h3 className="font-semibold mb-1 line-clamp-1">
                            {enrollment.courses?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {(enrollment.courses?.teacher as Record<string, unknown>)?.full_name as string}
                          </p>
                        </div>
                        <div>
                          <Progress value={enrollment.progress ?? 0} className="h-2 mb-2" />
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {enrollment.progress ?? 0}% مكتمل
                            </p>
                            <Button size="sm" asChild>
                              <Link to={`/course/${enrollment.course_id}/learn`}>
                                <Play className="h-4 w-4 ml-1" />
                                متابعة التعلم
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
}
