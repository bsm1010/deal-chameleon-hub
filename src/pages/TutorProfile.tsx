import { useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Star,
  Users,
  BookOpen,
  Clock,
  MapPin,
  BadgeCheck,
  Calendar,
  ArrowRight,
} from "lucide-react";

interface TutorProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  subjects: string[];
  wilaya: string | null;
  experience_years: number | null;
  verified: boolean;
  diploma: string | null;
  languages: string[] | null;
  average_rating: number | null;
  total_students: number | null;
  total_courses: number | null;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  lessons_count: number;
  hours_count: number;
  students_count: number;
  subject: string;
  level: string;
}

interface SessionSlot {
  id: string;
  date: string;
  time: string;
  subject: string;
  price: number;
  max_spots: number;
  booked_spots: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  student_name: string;
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
              : "fill-muted text-muted"
          }
        />
      ))}
    </div>
  );
}

function TutorProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-8 w-32" />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="rounded-card bg-card p-8 shadow-sm border border-border">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Skeleton className="h-[120px] w-[120px] rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
                <div className="flex gap-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-36 rounded-full" />
                  <Skeleton className="h-10 w-32 rounded-full" />
                </div>
              </div>
            </div>
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </main>
    </div>
  );
}

export default function TutorProfile() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const coursesRef = useRef<HTMLDivElement>(null);

  const {
    data: tutor,
    isLoading: tutorLoading,
    error: tutorError,
  } = useQuery({
    queryKey: ["tutor-profile", id],
    queryFn: async () => {
      if (!id) throw new Error("No tutor ID");
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, user_id, full_name, avatar_url, bio, subjects, wilaya, experience_years, verified, diploma, languages, average_rating, total_students, total_courses"
        )
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as TutorProfile;
    },
    enabled: !!id,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["tutor-courses", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("courses")
        .select(
          "id, title, description, thumbnail_url, price, lessons_count, hours_count, students_count, subject, level"
        )
        .eq("teacher_id", id)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Course[];
    },
    enabled: !!id,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["tutor-sessions", id],
    queryFn: async () => {
      if (!id) return [];
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("session_slots")
        .select("id, date, time, subject, price, max_spots, booked_spots")
        .eq("teacher_id", id)
        .gte("date", today)
        .eq("is_available", true)
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      if (error) throw error;
      return data as SessionSlot[];
    },
    enabled: !!id,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["tutor-reviews", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, profiles!student_id(full_name)")
        .eq("teacher_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        student_name: r.profiles?.full_name ?? "طالب",
      })) as Review[];
    },
    enabled: !!id,
  });

  if (tutorLoading) return <TutorProfileSkeleton />;

  if (tutorError || !tutor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{t("common.notFound")}</h2>
          <p className="text-muted-foreground">
            لم يتم العثور على المدرس
          </p>
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

  const totalReviews = reviews?.length ?? 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (r) => reviews?.filter((rev) => rev.rating === r).length ?? 0
  );

  const scrollToCourses = () => {
    coursesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="text-2xl font-bold text-primary">
            معلم Moualim
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/browse"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("nav.browse")}
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* HEADER */}
          <div className="rounded-card bg-card p-8 shadow-sm border border-border">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="h-[120px] w-[120px] border-2 border-primary/20">
                <AvatarImage src={tutor.avatar_url ?? undefined} alt={tutor.full_name} />
                <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                  {getInitials(tutor.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">{tutor.full_name}</h1>
                  {tutor.verified && (
                    <Badge variant="secondary" className="gap-1">
                      <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                      {t("tutor.verified")}
                    </Badge>
                  )}
                </div>
                {tutor.bio && (
                  <p className="text-muted-foreground line-clamp-2">
                    {tutor.bio}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-foreground">
                      {tutor.average_rating?.toFixed(1) ?? "—"}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {t("tutor.students", {
                      count: tutor.total_students ?? 0,
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {t("tutor.coursesCount", {
                      count: tutor.total_courses ?? 0,
                    })}
                  </span>
                  {tutor.experience_years != null && tutor.experience_years > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {t("tutor.experience", {
                        years: tutor.experience_years,
                      })}
                    </span>
                  )}
                </div>
                {tutor.subjects && tutor.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tutor.subjects.map((s) => (
                      <Badge key={s} variant="outline">
                        {t(`subjects.${s}`)}
                      </Badge>
                    ))}
                  </div>
                )}
                {tutor.wilaya && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {tutor.wilaya}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button onClick={scrollToCourses} size="lg">
                    {t("tutor.bookSession")}
                  </Button>
                  <Button variant="outline" onClick={scrollToCourses} size="lg">
                    {t("tutor.viewCourses")}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* TABS: BIO / COURSES / SESSIONS / REVIEWS */}
          <Tabs defaultValue="bio" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="bio">{t("tutor.about")}</TabsTrigger>
              <TabsTrigger value="courses">{t("tutor.courses")}</TabsTrigger>
              <TabsTrigger value="sessions">{t("tutor.sessions")}</TabsTrigger>
              <TabsTrigger value="reviews">{t("tutor.reviews")}</TabsTrigger>
            </TabsList>

            {/* BIO SECTION */}
            <TabsContent value="bio">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      {t("tutor.about")}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {tutor.bio || "لا توجد نبذة متاحة."}
                    </p>
                  </div>
                  {tutor.diploma && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        الشهادة / الدبلومة
                      </h4>
                      <p className="text-muted-foreground">{tutor.diploma}</p>
                    </div>
                  )}
                  {tutor.languages && tutor.languages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        {t("tutor.language")}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {tutor.languages.map((lang) => (
                          <Badge key={lang} variant="secondary">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* COURSES SECTION */}
            <TabsContent value="courses" ref={coursesRef}>
              <div className="space-y-6">
                <h2 className="text-xl font-bold">{t("tutor.courses")}</h2>
                {coursesLoading ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i}>
                        <Skeleton className="h-40 w-full rounded-t-xl" />
                        <CardContent className="p-4 space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : courses && courses.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {courses.map((course) => (
                      <Link key={course.id} to={`/course/${course.id}`}>
                        <Card className="overflow-hidden hover:shadow-md transition-shadow">
                          {course.thumbnail_url ? (
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="h-40 w-full object-cover"
                            />
                          ) : (
                            <div className="h-40 w-full bg-muted flex items-center justify-center">
                              <BookOpen className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                          <CardContent className="p-4 space-y-2">
                            <h3 className="font-semibold line-clamp-1">
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {course.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {t(`subjects.${course.subject}`)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {t(`levels.${course.level}`)}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{course.lessons_count} {t("course.lessons")}</span>
                                <span>{course.hours_count} {t("course.hours")}</span>
                                <span>{course.students_count} طالب</span>
                              </div>
                              <span className="text-lg font-bold text-primary">
                                {course.price > 0
                                  ? `${course.price.toLocaleString("ar-DZ")} DA`
                                  : t("browse.free")}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    {t("common.noData")}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* SESSIONS SECTION */}
            <TabsContent value="sessions">
              <div className="space-y-6">
                <h2 className="text-xl font-bold">{t("tutor.sessions")}</h2>
                {sessionsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                          <Skeleton className="h-10 w-24 rounded-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : sessions && sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map((slot) => {
                      const spotsLeft = (slot.max_spots ?? 1) - (slot.booked_spots ?? 0);
                      return (
                        <Card key={slot.id}>
                          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="font-semibold">
                                  {new Date(slot.date).toLocaleDateString("ar-DZ", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                                <span className="text-muted-foreground">
                                  {slot.time}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {t(`subjects.${slot.subject}`)}
                                </Badge>
                                <span>
                                  {slot.price.toLocaleString("ar-DZ")} DA
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {t("tutor.spotsLeft", { count: spotsLeft })}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              disabled={spotsLeft <= 0}
                            >
                              {spotsLeft > 0
                                ? t("tutor.bookNow")
                                : "محجوز"}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    {t("tutor.noSessions")}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* REVIEWS SECTION */}
            <TabsContent value="reviews">
              <div className="space-y-6">
                <h2 className="text-xl font-bold">{t("tutor.reviews")}</h2>
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <>
                    {/* Overall Rating + Breakdown */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                          <div className="text-center">
                            <div className="text-5xl font-bold text-primary">
                              {(
                                reviews.reduce((sum, r) => sum + r.rating, 0) /
                                totalReviews
                              ).toFixed(1)}
                            </div>
                            <StarRating
                              rating={Math.round(
                                reviews.reduce((sum, r) => sum + r.rating, 0) /
                                  totalReviews
                              )}
                              size={20}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              {totalReviews} تقييم
                            </p>
                          </div>
                          <div className="flex-1 space-y-2 w-full">
                            {[5, 4, 3, 2, 1].map((star, idx) => {
                              const count = ratingCounts[idx];
                              const pct =
                                totalReviews > 0
                                  ? Math.round((count / totalReviews) * 100)
                                  : 0;
                              return (
                                <div
                                  key={star}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <span className="w-8 text-end">{star}★</span>
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-yellow-400 rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="w-8 text-muted-foreground text-xs">
                                    {count}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Review Cards */}
                    <div className="space-y-4">
                      {reviews.slice(0, 5).map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(review.student_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-sm">
                                    {review.student_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      review.created_at
                                    ).toLocaleDateString("ar-DZ")}
                                  </span>
                                </div>
                                <StarRating rating={review.rating} size={14} />
                                {review.comment && (
                                  <p className="text-sm text-muted-foreground pt-1">
                                    {review.comment}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    {t("common.noData")}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
