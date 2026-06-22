import { useState, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Star,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  X,
  Play,
  Clock,
  Users,
  BadgeCheck,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ITEMS_PER_PAGE = 12;

const SUBJECTS = [
  "math",
  "physics",
  "biology",
  "arabic",
  "french",
  "english",
  "historyGeo",
  "philosophy",
  "cs",
] as const;

const LEVELS = [
  "primaire",
  "moyen",
  "lycee_1",
  "lycee_2",
  "lycee_3_bac",
  "universite",
] as const;

const SUBJECT_COLORS: Record<string, string> = {
  math: "bg-blue-100 text-blue-800",
  physics: "bg-purple-100 text-purple-800",
  biology: "bg-green-100 text-green-800",
  arabic: "bg-amber-100 text-amber-800",
  french: "bg-sky-100 text-sky-800",
  english: "bg-rose-100 text-rose-800",
  historyGeo: "bg-orange-100 text-orange-800",
  philosophy: "bg-indigo-100 text-indigo-800",
  cs: "bg-teal-100 text-teal-800",
};

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  price: number;
  subject: string;
  level: string;
  language: string;
  lessons_count: number;
  total_duration_minutes: number;
  average_rating: number;
  reviews_count: number;
  teacher_id: string;
  teacher?: { full_name: string; avatar_url: string | null };
  created_at: string;
  is_published: boolean;
}

interface TutorProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  subjects: string[];
  hourly_rate: number;
  average_rating: number;
  reviews_count: number;
  languages: string[];
  is_verified: boolean;
  bio: string;
  next_available_slot: string | null;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

function TutorCardSkeleton() {
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}

function CourseCard({ course, t }: { course: Course; t: (key: string) => string }) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins > 0 ? mins + "min" : ""}`;
    return `${mins}min`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        to={`/course/${course.id}`}
        className="group block rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-200"
      >
        <div className="relative h-40 bg-muted overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Play className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <Badge
            variant="secondary"
            className={`absolute top-2 right-2 text-xs ${SUBJECT_COLORS[course.subject] || ""}`}
          >
            {t(`subjects.${course.subject}`)}
          </Badge>
          {course.price === 0 && (
            <Badge
              variant="secondary"
              className="absolute top-2 left-2 bg-green-500 text-white text-xs"
            >
              {t("browse.free")}
            </Badge>
          )}
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          {course.teacher && (
            <p className="text-xs text-muted-foreground">
              {course.teacher.full_name}
            </p>
          )}
          <StarRating
            rating={course.average_rating || 0}
            count={course.reviews_count || 0}
          />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.lessons_count} {t("course.lessons")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(course.total_duration_minutes || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Badge variant="outline" className="text-xs">
              {t(`levels.${course.level}`)}
            </Badge>
            {course.price > 0 ? (
              <span className="font-bold text-sm text-primary">
                {course.price.toLocaleString()} DA
              </span>
            ) : (
              <span className="font-bold text-sm text-green-600">
                {t("browse.free")}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function TutorCard({ tutor, t }: { tutor: TutorProfile; t: (key: string) => string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        to={`/tutor/${tutor.id}`}
        className="group block rounded-xl border p-4 hover:shadow-lg transition-all duration-200"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="relative">
            {tutor.avatar_url ? (
              <img
                src={tutor.avatar_url}
                alt={tutor.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            {tutor.is_verified && (
              <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 text-blue-500 fill-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
              {tutor.full_name}
            </h3>
            <StarRating
              rating={tutor.average_rating || 0}
              count={tutor.reviews_count || 0}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {tutor.subjects?.slice(0, 3).map((subject) => (
            <Badge
              key={subject}
              variant="secondary"
              className={`text-xs ${SUBJECT_COLORS[subject] || ""}`}
            >
              {t(`subjects.${subject}`)}
            </Badge>
          ))}
          {tutor.subjects && tutor.subjects.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{tutor.subjects.length - 3}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">
            {tutor.hourly_rate?.toLocaleString()} DA / {t("tutor.bookSession")}
          </span>
          {tutor.next_available_slot && (
            <span className="text-xs text-muted-foreground">
              {t("browse.availableFrom", {
                time: new Date(tutor.next_available_slot).toLocaleDateString("ar-DZ"),
              })}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function Browse() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeTab = (searchParams.get("tab") as "courses" | "tutors") || "courses";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "rating";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const subjects = searchParams.get("subject")?.split(",").filter(Boolean) || [];
  const levels = searchParams.get("level")?.split(",").filter(Boolean) || [];
  const minPrice = parseInt(searchParams.get("priceMin") || "0", 10);
  const maxPrice = parseInt(searchParams.get("priceMax") || "5000", 10);
  const ratingFilter = searchParams.get("rating") || "all";
  const languages = searchParams.get("lang")?.split(",").filter(Boolean) || [];

  const setParam = useCallback(
    (key: string, value: string | string[] | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === null || (Array.isArray(value) && value.length === 0)) {
          next.delete(key);
        } else if (Array.isArray(value)) {
          next.set(key, value.join(","));
        } else {
          next.set(key, value);
        }
        next.set("page", "1");
        return next;
      });
    },
    [setSearchParams]
  );

  const toggleArrayParam = useCallback(
    (key: string, value: string) => {
      const current = searchParams.get(key)?.split(",").filter(Boolean) || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setParam(key, next.length > 0 ? next : null);
    },
    [searchParams, setParam]
  );

  const clearAllFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["browse-courses", search, sort, subjects, levels, minPrice, maxPrice, ratingFilter, languages, page],
    queryFn: async () => {
      let query = supabase
        .from("courses")
        .select("*, teacher:teacher_profiles!courses_teacher_id_fkey(full_name, avatar_url)", { count: "exact" })
        .eq("is_published", true);

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (subjects.length > 0) {
        query = query.in("subject", subjects);
      }
      if (levels.length > 0) {
        query = query.in("level", levels);
      }
      if (minPrice > 0) {
        query = query.gte("price", minPrice);
      }
      if (maxPrice < 5000) {
        query = query.lte("price", maxPrice);
      }
      if (ratingFilter === "4") {
        query = query.gte("average_rating", 4);
      } else if (ratingFilter === "5") {
        query = query.gte("average_rating", 5);
      }
      if (languages.length > 0) {
        query = query.in("language", languages);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      if (sort === "rating") {
        query = query.order("average_rating", { ascending: false });
      } else if (sort === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sort === "cheapest") {
        query = query.order("price", { ascending: true });
      } else if (sort === "expensive") {
        query = query.order("price", { ascending: false });
      }

      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as Course[] || [], count: count || 0 };
    },
    enabled: activeTab === "courses",
  });

  const { data: tutorsData, isLoading: tutorsLoading } = useQuery({
    queryKey: ["browse-tutors", search, sort, subjects, ratingFilter, languages, page],
    queryFn: async () => {
      let query = supabase
        .from("teacher_profiles")
        .select("*, profiles!teacher_profiles_user_id_fkey(full_name, avatar_url)", { count: "exact" })
        .eq("verification_status", "approved");

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`);
      }
      if (subjects.length > 0) {
        query = query.overlaps("subjects", subjects);
      }
      if (ratingFilter === "4") {
        query = query.gte("average_rating", 4);
      } else if (ratingFilter === "5") {
        query = query.gte("average_rating", 5);
      }
      if (languages.length > 0) {
        query = query.overlaps("languages", languages);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      if (sort === "rating") {
        query = query.order("average_rating", { ascending: false });
      } else if (sort === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sort === "cheapest") {
        query = query.order("hourly_rate", { ascending: true });
      } else if (sort === "expensive") {
        query = query.order("hourly_rate", { ascending: false });
      }

      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      const mapped = (data || []).map((tutor: any) => ({
        ...tutor,
        full_name: tutor.full_name || tutor.profiles?.full_name || "",
        avatar_url: tutor.avatar_url || tutor.profiles?.avatar_url,
      })) as TutorProfile[];

      return { data: mapped, count: count || 0 };
    },
    enabled: activeTab === "tutors",
  });

  const isLoading = activeTab === "courses" ? coursesLoading : tutorsLoading;
  const results = activeTab === "courses" ? coursesData : tutorsData;
  const items = results?.data || [];
  const totalCount = results?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const FilterSidebar = ({ className = "" }: { className?: string }) => (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="font-semibold text-sm mb-3">{t("browse.filters")}</h3>
        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setParam("tab", "courses")}
            className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
              activeTab === "courses"
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            }`}
          >
            {t("browse.coursesTab")}
          </button>
          <button
            onClick={() => setParam("tab", "tutors")}
            className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
              activeTab === "tutors"
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            }`}
          >
            {t("browse.sessionsTab")}
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">{t("browse.subjectFilter")}</h4>
        <div className="space-y-2">
          {SUBJECTS.map((subject) => (
            <label
              key={subject}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <Checkbox
                checked={subjects.includes(subject)}
                onCheckedChange={() => toggleArrayParam("subject", subject)}
              />
              {t(`subjects.${subject}`)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">{t("browse.levelFilter")}</h4>
        <div className="space-y-2">
          {LEVELS.map((level) => (
            <label
              key={level}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <Checkbox
                checked={levels.includes(level)}
                onCheckedChange={() => toggleArrayParam("level", level)}
              />
              {t(`levels.${level}`)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">{t("browse.priceFilter")}</h4>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="0"
            value={minPrice || ""}
            onChange={(e) => setParam("priceMin", e.target.value || "0")}
            className="h-8 text-sm"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="5000"
            value={maxPrice || ""}
            onChange={(e) => setParam("priceMax", e.target.value || "5000")}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">{t("browse.ratingFilter")}</h4>
        <RadioGroup
          value={ratingFilter}
          onValueChange={(value) => setParam("rating", value)}
          className="space-y-2"
        >
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <RadioGroupItem value="all" />
            {t("browse.allRatings")}
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <RadioGroupItem value="4" />
            ★ 4 {t("browse.ratingAbove4")}
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <RadioGroupItem value="5" />
            ★ 5 {t("browse.ratingAbove5")}
          </label>
        </RadioGroup>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">{t("browse.languageFilter")}</h4>
        <div className="space-y-2">
          {[
            { key: "ar", label: t("browse.langArabic") },
            { key: "fr", label: t("browse.langFrench") },
            { key: "bilingual", label: t("browse.langBilingual") },
          ].map((lang) => (
            <label
              key={lang.key}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <Checkbox
                checked={languages.includes(lang.key)}
                onCheckedChange={() => toggleArrayParam("lang", lang.key)}
              />
              {lang.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => setMobileFiltersOpen(false)}>
          {t("browse.apply")}
        </Button>
        <Button variant="ghost" onClick={clearAllFilters}>
          {t("browse.clearAll")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("browse.search")}
                  value={search}
                  onChange={(e) => setParam("search", e.target.value || null)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sort}
                  onChange={(e) => setParam("sort", e.target.value)}
                  className="h-10 px-3 rounded-lg border bg-background text-sm"
                >
                  <option value="rating">{t("browse.highestRated")}</option>
                  <option value="newest">{t("browse.newest")}</option>
                  <option value="cheapest">{t("browse.cheapest")}</option>
                  <option value="expensive">{t("browse.mostExpensive")}</option>
                </select>

                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      {t("browse.filters")}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh]">
                    <SheetHeader>
                      <SheetTitle>{t("browse.filters")}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 overflow-y-auto max-h-[calc(85vh-80px)]">
                      <FilterSidebar />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {t("browse.results", { count: totalCount })}
            </p>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    {activeTab === "courses" ? <CourseCardSkeleton /> : <TutorCardSkeleton />}
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("browse.noResults")}</h3>
                <p className="text-muted-foreground text-sm mb-4">{t("browse.noResults")}</p>
                <Button variant="outline" onClick={clearAllFilters}>
                  {t("browse.clearAll")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item: any) => (
                    activeTab === "courses" ? (
                      <CourseCard key={item.id} course={item} t={t} />
                    ) : (
                      <TutorCard key={item.id} tutor={item} t={t} />
                    )
                  ))}
                </AnimatePresence>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setParam("page", String(page - 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                  {t("common.previous")}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setParam("page", String(page + 1))}
                >
                  {t("common.next")}
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
