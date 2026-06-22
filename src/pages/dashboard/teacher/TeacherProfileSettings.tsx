import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import {
  User,
  Save,
  Upload,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface ProfileForm {
  full_name: string;
  bio: string;
  avatar_url: string;
  phone: string;
  wilaya: string;
  subjects: string;
  levels: string[];
  experience_years: number;
  diploma: string;
}

export default function TeacherProfileSettings() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: teacherProfile, isLoading } = useQuery({
    queryKey: ["teacher-profile-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const [form, setForm] = useState<ProfileForm>({
    full_name: "",
    bio: "",
    avatar_url: "",
    phone: "",
    wilaya: "",
    subjects: "",
    levels: [],
    experience_years: 0,
    diploma: "",
  });

  useEffect(() => {
    if (profile || teacherProfile) {
      setForm({
        full_name: profile?.full_name ?? "",
        bio: teacherProfile?.bio ?? profile?.bio ?? "",
        avatar_url: profile?.avatar_url ?? "",
        phone: teacherProfile?.phone ?? profile?.phone ?? "",
        wilaya: teacherProfile?.wilaya ?? profile?.wilaya ?? "",
        subjects: teacherProfile?.subjects ?? "",
        levels: teacherProfile?.levels ?? [],
        experience_years: teacherProfile?.experience_years ?? 0,
        diploma: teacherProfile?.diploma ?? "",
      });
    }
  }, [profile, teacherProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (formData: ProfileForm) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          avatar_url: formData.avatar_url || null,
          phone: formData.phone || null,
          wilaya: formData.wilaya || null,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      const { data: existing } = await supabase
        .from("teacher_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      const teacherData = {
        user_id: user.id,
        bio: formData.bio,
        phone: formData.phone || null,
        wilaya: formData.wilaya || null,
        subjects: formData.subjects,
        levels: formData.levels,
        experience_years: formData.experience_years,
        diploma: formData.diploma,
      };

      if (existing) {
        const { error } = await supabase
          .from("teacher_profiles")
          .update(teacherData)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("teacher_profiles")
          .insert(teacherData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-profile-settings"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-profile"] });
      toast.success("تم حفظ التغييرات بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حفظ التغييرات");
    },
  });

  const toggleLevel = (level: string) => {
    setForm((prev) => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter((l) => l !== level)
        : [...prev.levels, level],
    }));
  };

  const initials = form.full_name
    ? form.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "??";

  const isVerified = teacherProfile?.verification_status === "verified";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ملفي الشخصي</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة معلوماتك الشخصية وملفك العام
          </p>
        </div>
        {user?.id && (
          <Button variant="outline" asChild className="gap-2">
            <Link to={`/tutor/${user.id}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
              معاينة الملف
            </Link>
          </Button>
        )}
      </div>

      {isVerified && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
        >
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">
              حسابك موثّق
            </p>
            <p className="text-xs text-emerald-600">
              حسابك تمت مراجعته وتم التحقق منه بنجاح
            </p>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          جاري التحميل...
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={form.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Label>رابط الصورة الشخصية</Label>
                  <Input
                    placeholder="https://example.com/avatar.jpg"
                    value={form.avatar_url}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, avatar_url: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, full_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    dir="ltr"
                    placeholder="0XXX XX XX XX"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الولاية</Label>
                <Input
                  value={form.wilaya}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, wilaya: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>نبذة عني</Label>
                <Textarea
                  rows={4}
                  placeholder="اكتب نبذة مختصرة عنك كمعلم..."
                  value={form.bio}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bio: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                المعلومات التعليمية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>المواد التي تُدرّس</Label>
                <Input
                  placeholder="مثال: رياضيات، فيزياء، علوم"
                  value={form.subjects}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subjects: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>المستوى الدراسي</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "primary", label: "ابتدائي" },
                    { value: "middle", label: "متوسط" },
                    { value: "secondary", label: "ثانوي" },
                    { value: "university", label: "جامعي" },
                  ].map((level) => (
                    <Button
                      key={level.value}
                      variant={
                        form.levels.includes(level.value) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => toggleLevel(level.value)}
                      className="rounded-full"
                    >
                      {level.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>سنوات الخبرة</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.experience_years || ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        experience_years: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الشهادة / التكوين</Label>
                  <Input
                    placeholder="مثال: ماستر في الرياضيات"
                    value={form.diploma}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, diploma: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => updateProfileMutation.mutate(form)}
              disabled={updateProfileMutation.isPending || !form.full_name.trim()}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
