import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Star, MessageSquare, Send, User } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  student_name: string;
  student_avatar: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  teacher_reply: string | null;
}

interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export default function TeacherReviews() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ["teacher-reviews", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: courses } = await supabase
        .from("courses")
        .select("id")
        .eq("teacher_id", user.id);

      const courseIds = courses?.map((c) => c.id) ?? [];
      if (courseIds.length === 0) return [];

      const { data } = await supabase
        .from("reviews")
        .select("id, student_name, student_avatar, rating, comment, created_at, teacher_reply")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });

      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const { data: overallRating } = useQuery({
    queryKey: ["teacher-overall-rating", user?.id],
    queryFn: async () => {
      if (!user?.id) return { average: 0, count: 0 };
      const { data: courses } = await supabase
        .from("courses")
        .select("id")
        .eq("teacher_id", user.id);

      const courseIds = courses?.map((c) => c.id) ?? [];
      if (courseIds.length === 0) return { average: 0, count: 0 };

      const { data } = await supabase
        .from("reviews")
        .select("rating")
        .in("course_id", courseIds);

      if (!data || data.length === 0) return { average: 0, count: 0 };

      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      return { average: Math.round(avg * 10) / 10, count: data.length };
    },
    enabled: !!user?.id,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ teacher_reply: reply })
        .eq("id", reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-reviews"] });
      toast.success("تم نشر ردك");
      setReplyingTo(null);
      setReplyText("");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء نشر الرد");
    },
  });

  const breakdown: RatingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews?.forEach((r) => {
    const key = Math.min(5, Math.max(1, Math.round(r.rating))) as keyof RatingBreakdown;
    breakdown[key]++;
  });

  const totalReviews = reviews?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تقييماتي</h1>
        <p className="text-sm text-muted-foreground mt-1">
          مراجعة تقييمات الطلاب وردودك
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-primary mb-2">
                {overallRating?.average ?? 0}
              </div>
              <div className="flex items-center justify-center gap-1 mb-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(overallRating?.average ?? 0)
                        ? "text-amber-500 fill-amber-500"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {totalReviews} تقييم
              </p>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star as keyof RatingBreakdown];
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-3 text-center">
                      {star}
                    </span>
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <Progress value={pct} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-6 text-left">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              جاري التحميل...
            </div>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={review.student_avatar ?? undefined} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">
                              {review.student_name}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {Array.from({ length: 5 }, (_, j) => (
                                <Star
                                  key={j}
                                  className={`h-3.5 w-3.5 ${
                                    j < review.rating
                                      ? "text-amber-500 fill-amber-500"
                                      : "text-muted"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-muted-foreground mr-1">
                                {new Date(review.created_at).toLocaleDateString("ar-DZ")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {review.comment && (
                          <p className="text-sm mt-2 text-muted-foreground">
                            {review.comment}
                          </p>
                        )}

                        {review.teacher_reply && (
                          <div className="mt-3 rounded-lg bg-primary/5 border border-primary/10 p-3">
                            <p className="text-xs font-medium text-primary mb-1">
                              ردك
                            </p>
                            <p className="text-sm">{review.teacher_reply}</p>
                          </div>
                        )}

                        {!review.teacher_reply && (
                          <div className="mt-3">
                            {replyingTo === review.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  rows={2}
                                  placeholder="اكتب ردك هنا..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      replyMutation.mutate({
                                        reviewId: review.id,
                                        reply: replyText.trim(),
                                      })
                                    }
                                    disabled={
                                      replyMutation.isPending || !replyText.trim()
                                    }
                                    className="gap-1"
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                    نشر الرد
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText("");
                                    }}
                                  >
                                    إلغاء
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-primary"
                                onClick={() => setReplyingTo(review.id)}
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                رد
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Star className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">لا توجد تقييمات بعد</p>
                <p className="text-sm mt-1">
                  ستظهر تقييمات الطلاب هنا بعد شرائهم لدوراتك
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
