import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Star,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  subject: string;
  level: string;
  price: number;
  status: "draft" | "published" | "archived";
  thumbnail_url: string | null;
  enrolled_count: number;
  average_rating: number;
  created_at: string;
}

interface CourseForm {
  title: string;
  subject: string;
  level: string;
  price: number;
  description: string;
  thumbnail_url: string | null;
  status: "draft" | "published";
  sections: { title: string; lessons: { title: string; duration: string }[] }[];
}

const emptyForm: CourseForm = {
  title: "",
  subject: "",
  level: "secondary",
  price: 0,
  description: "",
  thumbnail_url: null,
  status: "draft",
  sections: [],
};

export default function TeacherCourses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CourseForm>(emptyForm);

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["teacher-courses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (formData: CourseForm) => {
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          teacher_id: user!.id,
          title: formData.title,
          subject: formData.subject,
          level: formData.level,
          price: formData.price,
          description: formData.description,
          thumbnail_url: formData.thumbnail_url,
          status: formData.status,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      for (let si = 0; si < formData.sections.length; si++) {
        const section = formData.sections[si];
        const { data: sectionData, error: sectionError } = await supabase
          .from("course_sections")
          .insert({
            course_id: course.id,
            title: section.title,
            position: si,
          })
          .select()
          .single();

        if (sectionError) throw sectionError;

        for (let li = 0; li < section.lessons.length; li++) {
          const lesson = section.lessons[li];
          const { error: lessonError } = await supabase.from("course_lessons").insert({
            section_id: sectionData.id,
            title: lesson.title,
            duration: lesson.duration,
            position: li,
          });
          if (lessonError) throw lessonError;
        }
      }

      return course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      toast.success("تم إنشاء الدورة بنجاح");
      setModalOpen(false);
      setForm(emptyForm);
      setStep(1);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إنشاء الدورة");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ courseId, newStatus }: { courseId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("courses")
        .update({ status: newStatus })
        .eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      toast.success("تم تحديث الحالة");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      toast.success("تم حذف الدورة");
    },
  });

  const addSection = () => {
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: "", lessons: [] }],
    }));
  };

  const addLesson = (sectionIndex: number) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        lessons: [...sections[sectionIndex].lessons, { title: "", duration: "" }],
      };
      return { ...prev, sections };
    });
  };

  const updateSectionTitle = (index: number, value: string) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      sections[index] = { ...sections[index], title: value };
      return { ...prev, sections };
    });
  };

  const updateLessonTitle = (sectionIndex: number, lessonIndex: number, value: string) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      const lessons = [...sections[sectionIndex].lessons];
      lessons[lessonIndex] = { ...lessons[lessonIndex], title: value };
      sections[sectionIndex] = { ...sections[sectionIndex], lessons };
      return { ...prev, sections };
    });
  };

  const updateLessonDuration = (sectionIndex: number, lessonIndex: number, value: string) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      const lessons = [...sections[sectionIndex].lessons];
      lessons[lessonIndex] = { ...lessons[lessonIndex], duration: value };
      sections[sectionIndex] = { ...sections[sectionIndex], lessons };
      return { ...prev, sections };
    });
  };

  const removeSection = (index: number) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const removeLesson = (sectionIndex: number, lessonIndex: number) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        lessons: sections[sectionIndex].lessons.filter((_, i) => i !== lessonIndex),
      };
      return { ...prev, sections };
    });
  };

  const canNext = () => {
    if (step === 1) return form.title.trim().length > 0 && form.subject.trim().length > 0;
    if (step === 2) return true;
    if (step === 3) return true;
    return true;
  };

  const handleSubmit = () => {
    createMutation.mutate(form);
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "published":
        return <Badge className="bg-emerald-100 text-emerald-700 border-0">منشورة</Badge>;
      case "draft":
        return <Badge variant="secondary">مسودة</Badge>;
      case "archived":
        return <Badge variant="outline">مؤرشفة</Badge>;
      default:
        return <Badge variant="secondary">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">دوراتي</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة الدورات التعليمية
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إنشاء دورة جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              جاري التحميل...
            </div>
          ) : courses && courses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الصورة</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الطلاب</TableHead>
                  <TableHead>التقييم</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="h-12 w-16 rounded-lg bg-muted overflow-hidden">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.subject} · {course.level}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {course.enrolled_count ?? 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        {course.average_rating?.toFixed(1) ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {course.price?.toLocaleString()} دج
                    </TableCell>
                    <TableCell>{statusLabel(course.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={course.status === "published"}
                          onCheckedChange={(checked) =>
                            toggleStatusMutation.mutate({
                              courseId: course.id,
                              newStatus: checked ? "published" : "draft",
                            })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذه الدورة؟")) {
                              deleteMutation.mutate(course.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">لا توجد دورات بعد</p>
              <p className="text-sm mt-1">ابدأ بإنشاء دورتك الأولى</p>
              <Button
                className="mt-4 gap-2"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                إنشاء دورة جديدة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء دورة جديدة</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    step >= s ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mb-4">
            الخطوة {step} من 4
          </p>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>عنوان الدورة</Label>
                  <Input
                    placeholder="مثال: شرح الجبر للسنة الثالثة متوسط"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>المادة</Label>
                  <Input
                    placeholder="مثال: رياضيات"
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المستوى</Label>
                    <Select
                      value={form.level}
                      onValueChange={(v) => setForm((p) => ({ ...p, level: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">ابتدائي</SelectItem>
                        <SelectItem value="middle">متوسط</SelectItem>
                        <SelectItem value="secondary">ثانوي</SelectItem>
                        <SelectItem value="university">جامعي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>السعر (دج)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.price || ""}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, price: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>وصف الدورة</Label>
                  <Textarea
                    rows={3}
                    placeholder="وصف مختصر للدورة..."
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>صورة الغلاف</Label>
                  <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">اضغط لرفع الصورة</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG حتى 2MB
                    </p>
                    {form.thumbnail_url && (
                      <div className="mt-4">
                        <img
                          src={form.thumbnail_url}
                          alt="Preview"
                          className="h-32 rounded-lg mx-auto object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <Input
                    className="mt-2"
                    placeholder="أو أدخل رابط الصورة"
                    value={form.thumbnail_url ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, thumbnail_url: e.target.value || null }))
                    }
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Label>المادة الدراسية</Label>
                  <Button variant="outline" size="sm" onClick={addSection} className="gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    إضافة قسم
                  </Button>
                </div>
                {form.sections.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    لم تضف أقساماً بعد. يمكنك نشر الدورة بدون محتوى وإضافته لاحقاً.
                  </p>
                )}
                {form.sections.map((section, si) => (
                  <Card key={si}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder={`القسم ${si + 1}`}
                          value={section.title}
                          onChange={(e) => updateSectionTitle(si, e.target.value)}
                          className="font-medium"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive shrink-0"
                          onClick={() => removeSection(si)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {section.lessons.map((lesson, li) => (
                        <div key={li} className="flex items-center gap-2 mr-6">
                          <Input
                            placeholder={`الدرس ${li + 1}`}
                            value={lesson.title}
                            onChange={(e) =>
                              updateLessonTitle(si, li, e.target.value)
                            }
                            className="flex-1"
                          />
                          <Input
                            placeholder="المدة"
                            value={lesson.duration}
                            onChange={(e) =>
                              updateLessonDuration(si, li, e.target.value)
                            }
                            className="w-24"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground shrink-0"
                            onClick={() => removeLesson(si, li)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-primary"
                        onClick={() => addLesson(si)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        إضافة درس
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-medium">نشر الدورة فوراً</p>
                      <p className="text-sm text-muted-foreground">
                        ستظهر الدورة للطلاب بعد النشر
                      </p>
                    </div>
                    <Switch
                      checked={form.status === "published"}
                      onCheckedChange={(checked) =>
                        setForm((p) => ({
                          ...p,
                          status: checked ? "published" : "draft",
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border p-4 space-y-2">
                  <p className="font-medium text-sm">ملخص الدورة</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">العنوان:</span>{" "}
                      {form.title}
                    </div>
                    <div>
                      <span className="text-muted-foreground">المادة:</span>{" "}
                      {form.subject}
                    </div>
                    <div>
                      <span className="text-muted-foreground">المستوى:</span>{" "}
                      {form.level}
                    </div>
                    <div>
                      <span className="text-muted-foreground">السعر:</span>{" "}
                      {form.price.toLocaleString()} دج
                    </div>
                    <div>
                      <span className="text-muted-foreground">الأقسام:</span>{" "}
                      {form.sections.length}
                    </div>
                    <div>
                      <span className="text-muted-foreground">الدروس:</span>{" "}
                      {form.sections.reduce((sum, s) => sum + s.lessons.length, 0)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => (step === 1 ? setModalOpen(false) : setStep((s) => s - 1))}
              className="gap-1"
            >
              <ChevronRight className="h-4 w-4" />
              {step === 1 ? "إلغاء" : "السابق"}
            </Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="gap-1"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="gap-1">
                {createMutation.isPending ? "جاري النشر..." : "نشر الدورة"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
