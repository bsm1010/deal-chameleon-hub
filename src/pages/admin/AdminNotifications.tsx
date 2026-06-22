import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send } from "lucide-react";

export default function AdminNotifications() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState("all");
  const [type, setType] = useState("info");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      let userIds: string[] = [];

      if (target === "all") {
        const { data: profiles, error } = await supabase
          .from("profiles" as any)
          .select("user_id");
        if (error) throw error;
        userIds = (profiles ?? []).map((p: any) => p.user_id);
      } else {
        const { data: profiles, error } = await supabase
          .from("profiles" as any)
          .select("user_id")
          .eq("role", target);
        if (error) throw error;
        userIds = (profiles ?? []).map((p: any) => p.user_id);
      }

      if (userIds.length === 0) {
        throw new Error("No users found");
      }

      const notifications = userIds.map((userId) => ({
        user_id: userId,
        title,
        message: body || null,
        type,
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);
      if (insertError) throw insertError;

      return { count: notifications.length };
    },
    onSuccess: (data) => {
      toast.success(`تم إرسال الإشعار إلى ${data.count} مستخدم`);
      setTitle("");
      setBody("");
      setTarget("all");
      setType("info");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إرسال الإشعار");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("العنوان مطلوب");
      return;
    }
    broadcastMutation.mutate();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">{t("admin.notifications", "إدارة الإشعارات")}</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("admin.broadcast", "إرسال إشعار جماعي")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الهدف</Label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الجميع</SelectItem>
                    <SelectItem value="student">{t("admin.students", "الطلاب")}</SelectItem>
                    <SelectItem value="teacher">{t("admin.teachers", "المدرسون")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>نوع الإشعار</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">معلومات</SelectItem>
                    <SelectItem value="warning">تحذير</SelectItem>
                    <SelectItem value="announcement">إعلان</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">العنوان *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الإشعار..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">النص</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="نص الإشعار..."
                rows={4}
              />
            </div>

            <Button type="submit" disabled={broadcastMutation.isPending} className="w-full">
              <Send className="w-4 h-4 ml-2" />
              {broadcastMutation.isPending ? "جاري الإرسال..." : "إرسال الإشعار"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
