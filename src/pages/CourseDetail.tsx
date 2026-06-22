import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Star,
  Users,
  BookOpen,
  Clock,
  Lock,
  Play,
  CheckCircle,
  Globe,
  Award,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  PlayCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface Course {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  subject: string;
  education_level: string;
  price: number;
  thumbnail_url: string | null;
  trailer_url: string | null;
  is_published: boolean;
  is_free: boolean;
  total_duration_minutes: number;
  total_lessons: number;
  language: string;
  rating: number;
  total_reviews: number;
  total_students: number;
  created_at: string;
  updated_at: string;
}

interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  position: number;
  lessons?: CourseLesson[];
}

interface CourseLesson {
  id: string;
  section_id: string;
  course_id: string;
  title: string;
  video_url: string | null;
  duration_minutes: number;
  position: number;
  is_free_preview: boolean;
}

interface TeacherInfo {
  full_name: string;
  avatar_url: string | null;
  rating: number;
  total_reviews: number;
  years_experience: number;
}

interface Enrollment {
  id: string;
  progress_percent: number;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours} ساعة ${mins} دقيقة`;
  if (hours > 0) return `${hours} ساعة`;
  return `${mins} دقيقة`;
}

function formatHours(minutes: number): string {
  const hours = (minutes / 60).toFixed(1);
  return hours;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted-foreground/30"
          }
        />
      ))}
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-6 w-48" />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<CourseLesson | null>(null);
  const [previewVideoOpen, setPreviewVideoOpen] = useState(false);

  const { data: course, isLoading, error } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      if (!id) throw new Error("No course ID");
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Course;
    },
    enabled: !!id,
  });

  const { data: sections } = useQuery({
    queryKey: ["course-sections", id],
    queryFn: async () => {
      if (!id) return [];
      const { data: secs, error: secErr } = await supabase
        .from("course_sections")
        .select("*")
        .eq("course_id", id)
        .order("position");
      if (secErr) throw secErr;

      const { data: lessons, error: lessErr } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", id)
        .order("position");
      if (lessErr) throw lessErr;

      return (secs || []).map((sec) => ({
        ...sec,
        lessons: (lessons || []).filter((l) => l.section_id === sec.id),
      })) as CourseSection[];
    },
    enabled: !!id,
  });

  const { data: teacher } = useQuery({
    queryKey: ["course-teacher", course?.teacher_id],
    queryFn: async () => {
      if (!course?.teacher_id) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", course.teacher_id)
        .single();

      const { data: tp } = await supabase
        .from("teacher_profiles")
        .select("rating, total_reviews, years_experience")
        .eq("id", course.teacher_id)
        .single();

      return { ...profile, ...tp } as TeacherInfo;
    },
    enabled: !!course?.teacher_id,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", id, user?.id],
    queryFn: async () => {
      if (!id || !user) return null;
      const { data, error } = await supabase
        .from("enrollments")
        .select("id, progress_percent")
        .eq("course_id", id)
        .eq("student_id", user.id)
        .single();
      if (error) return null;
      return data as Enrollment;
    },
    enabled: !!id && !!user,
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!user || !course) throw new Error("Not authenticated");
      const amount = course.is_free ? 0 : course.price;
      const platformFee = Math.round(amount * 0.1);
      const teacherEarnings = amount - platformFee;

      const { data: purchase, error: purchaseErr } = await supabase
        .from("purchases")
        .insert({
          student_id: user.id,
          course_id: course.id,
          teacher_id: course.teacher_id,
          amount,
          platform_fee: platformFee,
          teacher_earnings: teacherEarnings,
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (purchaseErr) throw purchaseErr;

      const { error: enrollErr } = await supabase
        .from("enrollments")
        .insert({
          student_id: user.id,
          course_id: course.id,
          purchase_id: purchase.id,
        });
      if (enrollErr) throw enrollErr;

      return purchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["course", id] });
      setPurchaseOpen(false);
      toast.success(t("course.success"));
      navigate(`/course/${id}/learn`);
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const handleCtaClick = () => {
    if (enrollment) {
      navigate(`/course/${id}/learn`);
      return;
    }
    if (!user) {
      navigate(`/login?redirect=/course/${id}`);
      return;
    }
    if (course?.is_free) {
      purchaseMutation.mutate();
      return;
    }
    setPurchaseOpen(true);
  };

  const handlePreviewLesson = (lesson: CourseLesson) => {
    setPreviewLesson(lesson);
    setPreviewVideoOpen(true);
  };

  const languageMap: Record<string, string> = {
    ar: t("browse.langArabic"),
    fr: t("browse.langFrench"),
    ar_fr: t("browse.langBilingual"),
  };

  if (isLoading) return <CourseDetailSkeleton />;

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{t("common.notFound")}</h2>
          <p className="text-muted-foreground">{t("common.notFoundDesc")}</p>
          <Link to="/browse">
            <Button variant="outline">
              <ArrowRight className="me-2 h-4 w-4" />
              {t("common.backToHome")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const descriptionText = course.description || "";
  const shortDescription = descriptionText.length > 150
    ? descriptionText.slice(0, 150) + "..."
    : descriptionText;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="text-2xl font-bold text-primary">
            معلم Moualim
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/browse">{t("nav.home")}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/browse?subject=${course.subject}`}>
                        {t(`subjects.${course.subject}`)}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      {course.title}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
                  {course.title}
                </h1>

                {course.description && (
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {descriptionExpanded ? descriptionText : shortDescription}
                    {descriptionText.length > 150 && (
                      <button
                        onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                        className="me-1 text-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        {descriptionExpanded ? t("common.back") : t("common.viewMore")}
                        {descriptionExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"
              >
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">
                    {Number(course.rating || 0).toFixed(1)}
                  </span>
                  <span>({course.total_reviews} تقييم)</span>
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.total_students} طالب
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {course.total_lessons} {t("course.lessons")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatHours(course.total_duration_minutes)} {t("course.hours")}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {languageMap[course.language] || course.language}
                </span>
              </motion.div>

              <p className="text-sm text-muted-foreground">
                {t("course.lastUpdated")}{" "}
                {new Date(course.updated_at).toLocaleDateString("ar-DZ", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <Separator />

              {teacher && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Link
                    to={`/tutor/${course.teacher_id}`}
                    className="group block"
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border-2 border-primary/20">
                            <AvatarImage
                              src={teacher.avatar_url ?? undefined}
                              alt={teacher.full_name}
                            />
                            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                              {getInitials(teacher.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                              {teacher.full_name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium text-foreground">
                                {Number(teacher.rating || 0).toFixed(1)}
                              </span>
                              <span>({teacher.total_reviews} تقييم)</span>
                            </div>
                            {teacher.years_experience > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {teacher.years_experience} سنة خبرة
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )}

              {descriptionText.length > 150 && descriptionExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-bold">وصف الدورة</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {descriptionText}
                  </p>
                </motion.div>
              )}

              <Separator />

              <div className="space-y-4">
                <h2 className="text-xl font-bold">{t("course.curriculum")}</h2>
                <p className="text-sm text-muted-foreground">
                  {course.total_lessons} {t("course.lessons")} •{" "}
                  {formatDuration(course.total_duration_minutes)}
                </p>

                {!sections || sections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("common.noData")}
                  </div>
                ) : (
                  <Accordion type="multiple" className="w-full space-y-2">
                    {sections.map((section, sIdx) => (
                      <AccordionItem
                        key={section.id}
                        value={section.id}
                        className="border border-border rounded-lg px-4"
                      >
                        <AccordionTrigger className="py-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full me-4">
                            <span className="font-semibold text-start">
                              {section.title}
                            </span>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {section.lessons?.length || 0} درس
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="space-y-1">
                            {section.lessons?.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors group"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {lesson.is_free_preview ? (
                                    <button
                                      onClick={() => handlePreviewLesson(lesson)}
                                      className="shrink-0 text-primary hover:text-primary/80 transition-colors"
                                    >
                                      <PlayCircle className="h-5 w-5" />
                                    </button>
                                  ) : enrollment ? (
                                    <Play className="h-5 w-5 text-muted-foreground shrink-0" />
                                  ) : (
                                    <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                                  )}
                                  <span className="text-sm truncate">
                                    {lesson.title}
                                  </span>
                                  {lesson.is_free_preview && !enrollment && (
                                    <Badge
                                      variant="secondary"
                                      className="shrink-0 text-xs bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                                      onClick={() => handlePreviewLesson(lesson)}
                                    >
                                      {t("course.freePreview")}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0 ms-3">
                                  {lesson.duration_minutes} دقيقة
                                </span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl border border-border overflow-hidden bg-card shadow-sm"
                >
                  {course.thumbnail_url ? (
                    <div className="relative aspect-video bg-muted">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      {course.trailer_url && !enrollment && (
                        <button
                          onClick={() => {
                            setPreviewLesson({
                              id: "trailer",
                              section_id: "",
                              course_id: course.id,
                              title: "Trailer",
                              video_url: course.trailer_url,
                              duration_minutes: 0,
                              position: 0,
                              is_free_preview: true,
                            });
                            setPreviewVideoOpen(true);
                          }}
                          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                        >
                          <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="h-8 w-8 text-primary ms-1" />
                          </div>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Play className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    <div className="text-3xl font-bold text-primary">
                      {course.is_free
                        ? t("browse.free")
                        : `${course.price.toLocaleString("ar-DZ")} DA`}
                    </div>

                    <Button
                      size="lg"
                      className="w-full text-lg py-6"
                      onClick={handleCtaClick}
                      disabled={purchaseMutation.isPending}
                    >
                      {purchaseMutation.isPending
                        ? t("common.loading")
                        : enrollment
                          ? t("course.continueLearning")
                          : course.is_free
                            ? t("course.freeEnroll")
                            : t("course.buyNow")}
                    </Button>

                    {!enrollment && !course.is_free && (
                      <p className="text-center text-xs text-muted-foreground">
                        {t("course.purchaseDesc")}
                      </p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-bold text-lg">{t("course.whatYouLearn")}</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>فهم المفاهيم والأساسيات في {t(`subjects.${course.subject}`)}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>حل المسائل والتمارين بثقة</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>التحضير الجيد لامتحانات {t(`levels.${course.education_level}`)}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>تطوير مهارات التحليل والتفكير النقدي</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card>
                    <CardContent className="p-6 space-y-3">
                      <h3 className="font-bold text-lg">{t("course.courseIncludes")}</h3>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm">
                          <PlayCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                          <span>{t("course.includesVideo", { count: course.total_lessons })}</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm">
                          <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                          <span>
                            {t("course.includesHours", {
                              count: formatHours(course.total_duration_minutes),
                            })}
                          </span>
                        </li>
                        <li className="flex items-center gap-3 text-sm">
                          <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                          <span>{t("course.includesLifetime")}</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm">
                          <Award className="h-5 w-5 text-muted-foreground shrink-0" />
                          <span>{t("course.includesCert")}</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("course.purchaseConfirm")}</DialogTitle>
            <DialogDescription>{t("course.purchaseDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{course.title}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-bold text-lg">
              <span>المبلغ الإجمالي</span>
              <span className="text-primary">
                {course.price.toLocaleString("ar-DZ")} DA
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPurchaseOpen(false)}
              disabled={purchaseMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? t("common.loading") : t("course.payNow")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewVideoOpen} onOpenChange={setPreviewVideoOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          {previewLesson?.video_url ? (
            <div className="aspect-video w-full bg-black">
              <video
                src={previewLesson.video_url}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">{t("common.noData")}</span>
            </div>
          )}
          <div className="p-4">
            <h4 className="font-semibold">{previewLesson?.title}</h4>
            {previewLesson?.is_free_preview && !enrollment && (
              <p className="text-sm text-muted-foreground mt-1">
                هذه معاينة مجانية — اشترِ الدورة للوصول إلى جميع الدروس
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
