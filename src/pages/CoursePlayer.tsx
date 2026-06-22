import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/Spinner";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  BookOpen,
  Clock,
} from "lucide-react";

interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  position: number;
}

interface CourseLesson {
  id: string;
  section_id: string;
  title: string;
  video_url: string;
  duration: number;
  position: number;
}

interface CourseData {
  id: string;
  title: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress_percent: number;
}

interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
}

interface FlattenedLesson extends CourseLesson {
  sectionTitle: string;
  sectionId: string;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CoursePlayer() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const completionShownRef = useRef<Set<string>>(new Set());

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [sectionCompletionAnim, setSectionCompletionAnim] = useState<string | null>(null);
  const [lessonNotes, setLessonNotes] = useState("");



  const fetchCourse = useCallback(async (): Promise<CourseData> => {
    const { data, error } = await supabase
      .from("courses" as any)
      .select("id, title")
      .eq("id", courseId)
      .single();
    if (error) throw error;
    return data as unknown as CourseData;
  }, [courseId]);

  const fetchSections = useCallback(async (): Promise<CourseSection[]> => {
    const { data, error } = await supabase
      .from("course_sections" as any)
      .select("id, course_id, title, position")
      .eq("course_id", courseId)
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as CourseSection[];
  }, [courseId]);

  const fetchLessons = useCallback(async (sections: CourseSection[]): Promise<CourseLesson[]> => {
    const sectionIds = sections.map((s) => s.id);
    if (sectionIds.length === 0) return [];
    const { data, error } = await supabase
      .from("course_lessons" as any)
      .select("id, section_id, title, video_url, duration, position")
      .in("section_id", sectionIds)
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as CourseLesson[];
  }, []);

  const fetchEnrollment = useCallback(async (): Promise<Enrollment | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("enrollments" as any)
      .select("id, user_id, course_id, progress_percent")
      .eq("course_id", courseId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as Enrollment | null;
  }, [courseId, user]);

  const fetchProgress = useCallback(async (): Promise<LessonProgress[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("lesson_progress" as any)
      .select("id, user_id, lesson_id, completed")
      .eq("user_id", user.id);
    if (error) throw error;
    return (data ?? []) as unknown as LessonProgress[];
  }, [user]);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: fetchCourse,
    enabled: !!courseId,
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["course-sections", courseId],
    queryFn: fetchSections,
    enabled: !!courseId,
  });

  const { data: rawLessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: () => fetchLessons(sections),
    enabled: !!courseId && sections.length > 0,
  });

  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ["enrollment", courseId, user?.id],
    queryFn: fetchEnrollment,
    enabled: !!courseId && !!user,
  });

  const { data: allProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ["lesson-progress", user?.id],
    queryFn: fetchProgress,
    enabled: !!user,
  });

  const completedLessonIds = useMemo(
    () => new Set(allProgress.filter((p) => p.completed).map((p) => p.lesson_id)),
    [allProgress]
  );

  const flattenedLessons = useMemo<FlattenedLesson[]>(() => {
    const sectionMap = new Map(sections.map((s) => [s.id, s.title]));
    return rawLessons.map((l) => ({
      ...l,
      sectionTitle: sectionMap.get(l.section_id) ?? "",
      sectionId: l.section_id,
    }));
  }, [rawLessons, sections]);

  const activeLesson = useMemo(
    () => flattenedLessons.find((l) => l.id === activeLessonId) ?? flattenedLessons[0] ?? null,
    [flattenedLessons, activeLessonId]
  );

  const activeLessonIndex = useMemo(
    () => flattenedLessons.findIndex((l) => l.id === activeLesson?.id),
    [flattenedLessons, activeLesson]
  );

  const totalLessons = flattenedLessons.length;
  const completedCount = flattenedLessons.filter((l) => completedLessonIds.has(l.id)).length;

  const sectionsWithLessons = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      lessons: flattenedLessons.filter((l) => l.section_id === section.id),
    }));
  }, [sections, flattenedLessons]);

  const sectionCompletionMap = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    for (const section of sections) {
      const lessons = flattenedLessons.filter((l) => l.section_id === section.id);
      map[section.id] = {
        total: lessons.length,
        completed: lessons.filter((l) => completedLessonIds.has(l.id)).length,
      };
    }
    return map;
  }, [sections, flattenedLessons, completedLessonIds]);

  useEffect(() => {
    if (activeLesson && !activeLessonId) {
      setActiveLessonId(activeLesson.id);
    }
  }, [activeLesson, activeLessonId]);

  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("lesson_progress" as any)
        .upsert(
          { user_id: user.id, lesson_id: lessonId, completed: true },
          { onConflict: "user_id,lesson_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["enrollment", courseId, user?.id] });
    },
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: async (percent: number) => {
      if (!user || !enrollment) return;
      const { error } = await supabase
        .from("enrollments" as any)
        .update({ progress_percent: percent })
        .eq("id", enrollment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", courseId, user?.id] });
    },
  });

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !activeLesson) return;
    const ct = video.currentTime;
    const dur = video.duration;
    setCurrentTime(ct);
    if (dur > 0 && ct / dur >= 0.9 && !completedLessonIds.has(activeLesson.id)) {
      markCompleteMutation.mutate(activeLesson.id);
      const newCompleted = flattenedLessons.filter(
        (l) => l.section_id === activeLesson.sectionId && completedLessonIds.has(l.id)
      ).length + 1;
      const sectionTotal = flattenedLessons.filter(
        (l) => l.section_id === activeLesson.sectionId
      ).length;
      if (newCompleted === sectionTotal && sectionTotal > 0) {
        setSectionCompletionAnim(activeLesson.sectionId);
        setTimeout(() => setSectionCompletionAnim(null), 3000);
      }
      const totalNow = flattenedLessons.filter(
        (l) => completedLessonIds.has(l.id) || l.id === activeLesson.id
      ).length;
      const pct = Math.round((totalNow / totalLessons) * 100);
      updateEnrollmentMutation.mutate(pct);
    }
  }, [
    activeLesson,
    completedLessonIds,
    flattenedLessons,
    totalLessons,
    markCompleteMutation,
    updateEnrollmentMutation,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onDurationChange = () => setDuration(video.duration);
    const onLoadedMetadata = () => setDuration(video.duration);
    const onEnded = () => setIsPlaying(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeLesson) return;
    video.pause();
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [activeLesson?.id, courseId]);

  const lessonNotesKey = activeLesson
    ? `moualim-notes-${courseId}-${activeLesson.id}`
    : "";

  useEffect(() => {
    if (!activeLesson) return;
    try {
      setLessonNotes(localStorage.getItem(lessonNotesKey) ?? "");
    } catch {
      setLessonNotes("");
    }
  }, [activeLesson?.id, lessonNotesKey]);

  useEffect(() => {
    if (!lessonNotesKey) return;
    try {
      localStorage.setItem(lessonNotesKey, lessonNotes);
    } catch {
      // ignore
    }
  }, [lessonNotes, lessonNotesKey]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    if (val === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      const bar = progressRef.current;
      if (!video || !bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      video.currentTime = pct * duration;
    },
    [duration]
  );

  const changeSpeed = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = document.getElementById("player-container");
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const goToLesson = useCallback(
    (offset: number) => {
      const idx = flattenedLessons.findIndex((l) => l.id === activeLesson?.id);
      const nextIdx = idx + offset;
      if (nextIdx >= 0 && nextIdx < flattenedLessons.length) {
        setActiveLessonId(flattenedLessons[nextIdx].id);
      }
    },
    [flattenedLessons, activeLesson]
  );

  const hasAccess = !enrollmentLoading && enrollment !== null;
  const isLoading = authLoading || courseLoading || sectionsLoading || lessonsLoading || enrollmentLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!enrollment || !hasAccess) {
    navigate(`/course/${courseId}`, { replace: true });
    return null;
  }

  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 shrink-0 z-10">
        <Link
          to={`/course/${courseId}`}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-sm font-semibold truncate px-8">
            {course?.title ?? t("common.loading")}
          </h1>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-[300px] border-l border-border bg-card flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-bold truncate mb-3">{course?.title}</h2>
            <Progress value={progressPercent} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground text-center">
              {t("course.player.progress", {
                completed: completedCount,
                total: totalLessons,
              })}
            </p>
          </div>

          <ScrollArea className="flex-1">
            <Accordion type="multiple" className="w-full">
              {sectionsWithLessons.map((section) => {
                const comp = sectionCompletionMap[section.id];
                const allDone = comp && comp.total > 0 && comp.completed === comp.total;

                return (
                  <AccordionItem key={section.id} value={section.id} className="border-b border-border">
                    <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                      <div className="flex items-center gap-2 flex-1 text-right">
                        {allDone && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                        <span className="truncate">{section.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground ms-2 shrink-0">
                        {comp?.completed}/{comp?.total}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-0">
                      <ul className="space-y-0">
                        {section.lessons.map((lesson) => {
                          const isActive = lesson.id === activeLesson?.id;
                          const isDone = completedLessonIds.has(lesson.id);

                          return (
                            <li key={lesson.id}>
                              <button
                                onClick={() => setActiveLessonId(lesson.id)}
                                className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm transition-colors text-right ${
                                  isActive
                                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                                    : "hover:bg-muted/50 text-foreground"
                                }`}
                              >
                                <span className="shrink-0">
                                  {isDone ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </span>
                                <span className="flex-1 truncate text-right">{lesson.title}</span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {formatTime(lesson.duration)}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-black">
          {activeLesson ? (
            <>
              <div id="player-container" className="relative flex-1 bg-black flex items-center justify-center min-h-0">
                {sectionCompletionAnim && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 pointer-events-none animate-in fade-in">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎉</div>
                      <p className="text-white text-xl font-bold">أحسنت! أكملت القسم</p>
                      <p className="text-white/70 text-sm mt-1">استمر في التقدم</p>
                    </div>
                  </div>
                )}

                <video
                  ref={videoRef}
                  src={activeLesson.video_url}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  playsInline
                />

                <button
                  onClick={togglePlay}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-transparent group"
                  tabIndex={-1}
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPlaying ? (
                      <Pause className="h-8 w-8 text-white" fill="white" />
                    ) : (
                      <Play className="h-8 w-8 text-white ms-1" fill="white" />
                    )}
                  </div>
                </button>

                <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                  <div
                    ref={progressRef}
                    className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer group mb-3 hover:h-2.5 transition-all"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full bg-primary rounded-full relative"
                      style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-white">
                    <button onClick={togglePlay} className="hover:text-primary transition-colors">
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </button>

                    <div
                      className="relative"
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                      <button onClick={toggleMute} className="hover:text-primary transition-colors">
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </button>
                      {showVolumeSlider && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 rounded-lg p-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-1 accent-primary cursor-pointer"
                            style={{ writingMode: "vertical-lr", direction: "rtl", height: 80 }}
                          />
                        </div>
                      )}
                    </div>

                    <span className="text-xs text-white/80 tabular-nums">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    <div className="flex-1" />

                    <div className="relative">
                      <button
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="text-xs font-medium hover:text-primary transition-colors px-2 py-1 rounded bg-white/10"
                      >
                        {playbackSpeed}x
                      </button>
                      {showSpeedMenu && (
                        <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-lg">
                          {SPEED_OPTIONS.map((speed) => (
                            <button
                              key={speed}
                              onClick={() => changeSpeed(speed)}
                              className={`block w-full px-4 py-2 text-sm text-left hover:bg-white/20 transition-colors ${
                                playbackSpeed === speed ? "text-primary font-semibold" : "text-white"
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button onClick={toggleFullscreen} className="hover:text-primary transition-colors">
                      {isFullscreen ? (
                        <Minimize className="h-5 w-5" />
                      ) : (
                        <Maximize className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-card border-t border-border p-4 shrink-0">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="h-5 w-5 text-primary shrink-0" />
                  <h2 className="text-lg font-bold truncate">{activeLesson.title}</h2>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(activeLesson.duration)}
                  </span>
                  {completedLessonIds.has(activeLesson.id) && (
                    <span className="flex items-center gap-1 text-xs text-green-500 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      مكتمل
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToLesson(-1)}
                    disabled={activeLessonIndex <= 0}
                    className="rounded-full"
                  >
                    <ChevronRight className="h-4 w-4 ms-1" />
                    {t("course.player.previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToLesson(1)}
                    disabled={activeLessonIndex >= flattenedLessons.length - 1}
                    className="rounded-full"
                  >
                    {t("course.player.next")}
                    <ChevronLeft className="h-4 w-4 me-1" />
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">{t("course.player.notes")}</label>
                  <Textarea
                    value={lessonNotes}
                    onChange={(e) => setLessonNotes(e.target.value)}
                    placeholder="اكتب ملاحظاتك هنا..."
                    className="min-h-[100px] bg-background"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white">
              <p className="text-muted-foreground">{t("common.noData")}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
