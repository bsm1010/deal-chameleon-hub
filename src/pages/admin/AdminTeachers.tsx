import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/Spinner";
import { CheckCircle, XCircle, Search } from "lucide-react";
import { toast } from "sonner";

interface Teacher {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  subjects: string[];
  wilaya: string | null;
  verification_status: string;
  verified_at: string | null;
  created_at: string;
  avatar_url: string | null;
}

async function fetchTeachers(status?: string): Promise<Teacher[]> {
  let query = supabase.from("profiles" as any).select("*").eq("role", "teacher");
  if (status) {
    query = query.eq("verification_status", status);
  }
  query = query.order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Teacher[];
}

export default function AdminTeachers() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const statusMap: Record<string, string | undefined> = {
    pending: "pending",
    approved: "approved",
    rejected: "rejected",
  };

  const { data: teachers, isLoading } = useQuery({
    queryKey: ["admin-teachers", activeTab],
    queryFn: () => fetchTeachers(statusMap[activeTab]),
  });

  const approveMutation = useMutation({
    mutationFn: async (teacher: Teacher) => {
      const { error: updateError } = await supabase
        .from("profiles" as any)
        .update({ verification_status: "approved", verified_at: new Date().toISOString() })
        .eq("id", teacher.id);
      if (updateError) throw updateError;

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: teacher.user_id,
        title: "تم قبول طلبك",
        message: "تهانينا! تم قبول حسابك كمدرس على منصة معلم.",
        type: "info",
      });
      if (notifError) throw notifError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      toast.success("تم قبول المدرس بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء قبول المدرس");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ teacher, reason }: { teacher: Teacher; reason: string }) => {
      const { error: updateError } = await supabase
        .from("profiles" as any)
        .update({ verification_status: "rejected" })
        .eq("id", teacher.id);
      if (updateError) throw updateError;

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: teacher.user_id,
        title: "تم رفض طلبك",
        message: reason || "تم رفض طلب التسجيل كمدرس. يمكنك إعادة التسجيل بمعلومات محدثة.",
        type: "warning",
      });
      if (notifError) throw notifError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedTeacherId(null);
      toast.success("تم رفض المدرس");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء رفض المدرس");
    },
  });

  const filteredTeachers = teachers?.filter(
    (teacher) =>
      teacher.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReject = () => {
    if (!selectedTeacherId) return;
    const teacher = teachers?.find((t) => t.id === selectedTeacherId);
    if (teacher) {
      rejectMutation.mutate({ teacher, reason: rejectReason });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">{t("admin.teachers", "إدارة المدرسون")}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">{t("admin.pendingApprovals", "قيد المراجعة")}</TabsTrigger>
          <TabsTrigger value="approved">{t("admin.approved", "مفعّلون")}</TabsTrigger>
          <TabsTrigger value="rejected">{t("admin.rejected", "مرفوضون")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو البريد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>المواد</TableHead>
              <TableHead>الولاية</TableHead>
              <TableHead>تاريخ التسجيل</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t("common.noData", "لا توجد بيانات")}
                </TableCell>
              </TableRow>
            ) : (
              filteredTeachers?.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {teacher.avatar_url ? (
                          <img src={teacher.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          teacher.full_name?.charAt(0)
                        )}
                      </div>
                      {teacher.full_name}
                    </div>
                  </TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects?.slice(0, 2).map((sub) => (
                        <Badge key={sub} variant="outline" className="text-xs">
                          {sub}
                        </Badge>
                      ))}
                      {(teacher.subjects?.length ?? 0) > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(teacher.subjects?.length ?? 0) - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{teacher.wilaya || "-"}</TableCell>
                  <TableCell>
                    {new Date(teacher.created_at).toLocaleDateString("ar-DZ")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {activeTab === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveMutation.mutate(teacher)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 ml-1" />
                            {t("admin.approve", "قبول")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedTeacherId(teacher.id);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 ml-1" />
                            {t("admin.reject", "رفض")}
                          </Button>
                        </>
                      )}
                      {activeTab === "approved" && (
                        <Badge variant="default" className="bg-green-100 text-green-700">
                          مفعّل
                        </Badge>
                      )}
                      {activeTab === "rejected" && (
                        <Badge variant="destructive">مرفوض</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض المدرس</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              أدخل سبب رفض هذا المدرس. سيتم إرسال هذا السبب إليه كإشعار.
            </p>
            <Textarea
              placeholder="سبب الرفض..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t("common.cancel", "إلغاء")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "جاري الرفض..." : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
