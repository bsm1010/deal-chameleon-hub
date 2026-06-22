import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { motion } from "framer-motion";
import {
  Plus,
  Clock,
  Video,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface ScheduleSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  subject: string;
  level: string;
  price: number;
  max_students: number;
  enrolled_count: number;
  meeting_link: string | null;
  notes: string | null;
  status: string;
}

interface SlotForm {
  date: string;
  start_time: string;
  end_time: string;
  subject: string;
  level: string;
  price: number;
  max_students: number;
  meeting_link: string;
  notes: string;
}

const emptySlotForm: SlotForm = {
  date: "",
  start_time: "",
  end_time: "",
  subject: "",
  level: "secondary",
  price: 0,
  max_students: 1,
  meeting_link: "",
  notes: "",
};

const weekDayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function TeacherSchedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SlotForm>(emptySlotForm);

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
  const weekStartStr = formatDateISO(weekDays[0]);
  const weekEndStr = formatDateISO(weekDays[6]);

  const { data: slots, isLoading } = useQuery<ScheduleSlot[]>({
    queryKey: ["schedule-slots", user?.id, weekStartStr, weekEndStr],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("schedule_slots")
        .select("*")
        .eq("teacher_id", user.id)
        .gte("date", weekStartStr)
        .lte("date", weekEndStr)
        .order("date")
        .order("start_time");
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (formData: SlotForm) => {
      const { error } = await supabase.from("schedule_slots").insert({
        teacher_id: user!.id,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        subject: formData.subject,
        level: formData.level,
        price: formData.price,
        max_students: formData.max_students,
        meeting_link: formData.meeting_link || null,
        notes: formData.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-slots"] });
      toast.success("تمت إضافة الحصة بنجاح");
      setModalOpen(false);
      setForm(emptySlotForm);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة الحصة");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase.from("schedule_slots").delete().eq("id", slotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-slots"] });
      toast.success("تم حذف الحصة");
    },
  });

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const goToToday = () => {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  const slotsByDate = useMemo(() => {
    const map: Record<string, ScheduleSlot[]> = {};
    slots?.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [slots]);

  const today = formatDateISO(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">جدولي</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة حصصك الأسبوعية
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة حصة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={prevWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[200px] text-center">
              {weekDays[0].toLocaleDateString("ar-DZ", {
                month: "long",
                day: "numeric",
              })}{" "}
              —{" "}
              {weekDays[6].toLocaleDateString("ar-DZ", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            اليوم
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-t">
            {weekDays.map((day, i) => {
              const dateStr = formatDateISO(day);
              const isToday = dateStr === today;
              const daySlots = slotsByDate[dateStr] ?? [];

              return (
                <div
                  key={i}
                  className={`border-l last:border-l-0 min-h-[400px] ${
                    isToday ? "bg-primary/5" : ""
                  }`}
                >
                  <div
                    className={`text-center py-2 border-b ${
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50"
                    }`}
                  >
                    <p className="text-xs font-medium">{weekDayNames[i]}</p>
                    <p
                      className={`text-lg font-bold ${
                        isToday ? "" : "text-muted-foreground"
                      }`}
                    >
                      {day.getDate()}
                    </p>
                  </div>
                  <div className="p-1.5 space-y-1.5">
                    {isLoading ? (
                      <div className="h-16 rounded-lg bg-muted animate-pulse" />
                    ) : (
                      daySlots.map((slot) => (
                        <motion.div
                          key={slot.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="rounded-lg border bg-card p-2 text-xs space-y-1 group relative"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-0.5 left-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                            onClick={() => {
                              if (confirm("هل تريد حذف هذه الحصة؟")) {
                                deleteMutation.mutate(slot.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {slot.start_time} - {slot.end_time}
                          </div>
                          <p className="font-medium truncate">{slot.subject}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px] px-1">
                              {slot.level}
                            </Badge>
                            <span className="text-muted-foreground">
                              {slot.enrolled_count}/{slot.max_students}
                            </span>
                          </div>
                          {slot.meeting_link && (
                            <div className="flex items-center gap-1 text-primary">
                              <Video className="h-3 w-3" />
                              <span className="truncate">room</span>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                    {!isLoading && daySlots.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-[10px]">
                        لا حصص
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة حصة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>وقت البداية</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, start_time: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>وقت النهاية</Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, end_time: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>المادة</Label>
              <Input
                placeholder="مثال: رياضيات"
                value={form.subject}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subject: e.target.value }))
                }
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
              <Label>الحد الأقصى للطلاب</Label>
              <Input
                type="number"
                min={1}
                value={form.max_students}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    max_students: Math.max(1, Number(e.target.value)),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>رابط الاجتماع (اختياري)</Label>
              <Input
                placeholder="https://meet.google.com/..."
                value={form.meeting_link}
                onChange={(e) =>
                  setForm((p) => ({ ...p, meeting_link: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Textarea
                rows={2}
                placeholder="ملاحظات إضافية..."
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={
                createMutation.isPending ||
                !form.date ||
                !form.start_time ||
                !form.end_time ||
                !form.subject
              }
            >
              {createMutation.isPending ? "جاري الإضافة..." : "إضافة الحصة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
