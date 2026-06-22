import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, User, Star, Video } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/hooks/use-toast";
import StudentLayout from "./StudentLayout";

export default function StudentSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("upcoming");

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["student-sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("booked_sessions")
        .select("*, teacher:profiles!booked_sessions_teacher_id_fkey(full_name, avatar_url)")
        .eq("student_id", user.id)
        .order("scheduled_at", { ascending: activeTab === "upcoming" });
      return data ?? [];
    },
    enabled: !!user,
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from("booked_sessions")
        .update({ status: "in_progress" })
        .eq("id", sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-sessions"] });
      toast({ title: "تم الانضمام للحصة بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء الانضمام", variant: "destructive" });
    },
  });

  const now = new Date();
  const filteredSessions = sessions?.filter((s) => {
    const sessionDate = new Date(s.scheduled_at);
    if (activeTab === "upcoming") return sessionDate >= now && s.status !== "completed";
    return sessionDate < now || s.status === "completed";
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">مؤكدة</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">مكتملة</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">جارية</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-600 border-red-200">ملغاة</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">حصصي</h1>
          <p className="text-muted-foreground mt-1">إدارة حصصك المباشرة مع المعلمين</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="upcoming">القادمة</TabsTrigger>
            <TabsTrigger value="past">السابقة</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
              </div>
            ) : filteredSessions?.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    {activeTab === "upcoming" ? "لا توجد حصص قادمة" : "لا توجد حصص سابقة"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSessions?.map((session, i) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-6 w-6 text-primary" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                {(session.teacher as Record<string, unknown>)?.full_name as string}
                              </h3>
                              {getStatusBadge(session.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(session.scheduled_at).toLocaleDateString("ar-DZ", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(session.scheduled_at).toLocaleTimeString("ar-DZ", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <Badge variant="outline">{session.subject}</Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <p className="font-bold text-primary">{session.price?.toLocaleString()} دج</p>
                            {activeTab === "upcoming" && session.status === "confirmed" && (
                              <Button
                                size="sm"
                                onClick={() => joinSessionMutation.mutate(session.id)}
                                disabled={joinSessionMutation.isPending}
                              >
                                <Video className="h-4 w-4 ml-1" />
                                الانضمام للحصة
                              </Button>
                            )}
                            {activeTab === "past" && session.status === "completed" && !session.reviewed && (
                              <Button size="sm" variant="outline">
                                <Star className="h-4 w-4 ml-1" />
                                إضافة تقييم
                              </Button>
                            )}
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
