import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/Spinner";
import { CheckCircle, XCircle, Wallet } from "lucide-react";
import { toast } from "sonner";

interface PayoutRequest {
  id: string;
  teacher_id: string;
  teacher_name: string;
  amount: number;
  ccp_number: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
}

async function fetchPayouts(status?: string): Promise<PayoutRequest[]> {
  let query = supabase.from("payout_requests" as any).select("*");
  if (status) {
    query = query.eq("status", status);
  }
  query = query.order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as PayoutRequest[];
}

export default function AdminPayouts() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);

  const statusMap: Record<string, string | undefined> = {
    pending: "pending",
    processing: "processing",
    paid: "paid",
  };

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-payouts", activeTab],
    queryFn: () => fetchPayouts(statusMap[activeTab]),
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (payout: PayoutRequest) => {
      const { error: updateError } = await supabase
        .from("payout_requests" as any)
        .update({ status: "paid", processed_at: new Date().toISOString() })
        .eq("id", payout.id);
      if (updateError) throw updateError;

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: payout.teacher_id,
        title: "تم الدفع",
        message: `تم دفع مبلغ ${payout.amount.toLocaleString()} دج إلى حسابك CCP: ${payout.ccp_number}`,
        type: "info",
      });
      if (notifError) throw notifError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      toast.success("تم تحديث حالة الدفع");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الدفع");
    },
  });

  const processMutation = useMutation({
    mutationFn: async (payout: PayoutRequest) => {
      const { error } = await supabase
        .from("payout_requests" as any)
        .update({ status: "processing" })
        .eq("id", payout.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      toast.success("تم بدء معالجة السحب");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ payout, reason }: { payout: PayoutRequest; reason: string }) => {
      const { error: updateError } = await supabase
        .from("payout_requests" as any)
        .update({ status: "rejected", rejection_reason: reason })
        .eq("id", payout.id);
      if (updateError) throw updateError;

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: payout.teacher_id,
        title: "تم رفض طلب السحب",
        message: reason || "تم رفض طلب السحب الخاص بك.",
        type: "warning",
      });
      if (notifError) throw notifError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedPayoutId(null);
      toast.success("تم رفض طلب السحب");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء رفض الطلب");
    },
  });

  const handleReject = () => {
    if (!selectedPayoutId) return;
    const payout = payouts?.find((p) => p.id === selectedPayoutId);
    if (payout) {
      rejectMutation.mutate({ payout, reason: rejectReason });
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
      <h1 className="text-3xl font-bold mb-6">{t("admin.payouts", "إدارة المدفوعات")}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">طلبات جديدة</TabsTrigger>
          <TabsTrigger value="processing">قيد المعالجة</TabsTrigger>
          <TabsTrigger value="paid">مدفوعة</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المدرس</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>رقم CCP</TableHead>
              <TableHead>تاريخ الطلب</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t("common.noData", "لا توجد طلبات")}
                </TableCell>
              </TableRow>
            ) : (
              payouts?.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-medium">{payout.teacher_name}</TableCell>
                  <TableCell>
                    <span className="font-bold text-primary">
                      {payout.amount.toLocaleString()} دج
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{payout.ccp_number}</TableCell>
                  <TableCell>
                    {new Date(payout.created_at).toLocaleDateString("ar-DZ")}
                  </TableCell>
                  <TableCell>
                    {payout.status === "pending" && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        جديد
                      </Badge>
                    )}
                    {payout.status === "processing" && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        قيد المعالجة
                      </Badge>
                    )}
                    {payout.status === "paid" && (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        مدفوع
                      </Badge>
                    )}
                    {payout.status === "rejected" && (
                      <Badge variant="destructive">مرفوض</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {payout.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => processMutation.mutate(payout)}
                            disabled={processMutation.isPending}
                          >
                            <Wallet className="w-4 h-4 ml-1" />
                            معالجة
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => markAsPaidMutation.mutate(payout)}
                            disabled={markAsPaidMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 ml-1" />
                            {t("admin.markAsPaid", "تم الدفع")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedPayoutId(payout.id);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 ml-1" />
                            رفض
                          </Button>
                        </>
                      )}
                      {payout.status === "processing" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => markAsPaidMutation.mutate(payout)}
                          disabled={markAsPaidMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 ml-1" />
                          {t("admin.markAsPaid", "تم الدفع")}
                        </Button>
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
            <DialogTitle>رفض طلب السحب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              أدخل سبب رفض هذا الطلب. سيتم إرسال هذا السبب إلى المدرس كإشعار.
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
