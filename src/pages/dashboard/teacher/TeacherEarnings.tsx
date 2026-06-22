import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Send,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

interface EarningRow {
  id: string;
  created_at: string;
  student_name: string;
  item_name: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
}

interface PayoutRow {
  id: string;
  created_at: string;
  amount: number;
  ccp_number: string;
  status: string;
}

export default function TeacherEarnings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [ccpNumber, setCcpNumber] = useState("");

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["earnings-summary", user?.id],
    queryFn: async () => {
      if (!user?.id) return { available: 0, processing: 0, total: 0 };

      const { data: transactions } = await supabase
        .from("transactions")
        .select("net_amount, status")
        .eq("teacher_id", user.id);

      const available =
        transactions
          ?.filter((t) => t.status === "completed")
          .reduce((sum, t) => sum + (t.net_amount ?? 0), 0) ?? 0;

      const { data: payouts } = await supabase
        .from("payouts")
        .select("amount, status")
        .eq("teacher_id", user.id);

      const pendingPayouts =
        payouts
          ?.filter((p) => p.status === "pending" || p.status === "processing")
          .reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;

      const total = transactions
        ?.filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + (t.net_amount ?? 0), 0) ?? 0;

      return {
        available: Math.max(0, available - pendingPayouts),
        processing: pendingPayouts,
        total,
      };
    },
    enabled: !!user?.id,
  });

  const { data: transactions, isLoading: txLoading } = useQuery<EarningRow[]>({
    queryKey: ["earnings-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const { data: payouts, isLoading: payoutsLoading } = useQuery<PayoutRow[]>({
    queryKey: ["payouts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("payouts")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const payoutMutation = useMutation({
    mutationFn: async ({ amount, ccp }: { amount: number; ccp: string }) => {
      const { error } = await supabase.from("payouts").insert({
        teacher_id: user!.id,
        amount,
        ccp_number: ccp,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      queryClient.invalidateQueries({ queryKey: ["earnings-summary"] });
      toast.success("تم إرسال طلب السحب بنجاح");
      setPayoutModalOpen(false);
      setPayoutAmount("");
      setCcpNumber("");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إرسال طلب السحب");
    },
  });

  const summaryCards = [
    {
      title: "متاح للسحب",
      value: summary?.available ?? 0,
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "قيد المعالجة",
      value: summary?.processing ?? 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "إجمالي المكتسب",
      value: summary?.total ?? 0,
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  const payoutStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-700 border-0">مكتمل</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 border-0">قيد المعالجة</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-0">قيد الانتظار</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 border-0">مرفوض</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">أرباحي</h1>
        <p className="text-sm text-muted-foreground mt-1">
          متابعة أرباحك وطلبات السحب
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">
                      {summaryLoading ? "—" : card.value.toLocaleString()} دج
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => setPayoutModalOpen(true)}
          className="gap-2"
          disabled={(summary?.available ?? 0) <= 0}
        >
          <Send className="h-4 w-4" />
          طلب سحب
        </Button>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">المعاملات</TabsTrigger>
          <TabsTrigger value="payouts">سجل السحوبات</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              {txLoading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  جاري التحميل...
                </div>
              ) : transactions && transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الطالب</TableHead>
                      <TableHead>الدورة / الحصة</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>الرسوم (10%)</TableHead>
                      <TableHead>صافي المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString("ar-DZ")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {tx.student_name}
                        </TableCell>
                        <TableCell>{tx.item_name}</TableCell>
                        <TableCell>{tx.amount?.toLocaleString()} دج</TableCell>
                        <TableCell className="text-destructive">
                          -{tx.fee?.toLocaleString()} دج
                        </TableCell>
                        <TableCell className="font-medium text-emerald-600">
                          {tx.net_amount?.toLocaleString()} دج
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <DollarSign className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">لا توجد معاملات بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardContent className="p-0">
              {payoutsLoading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  جاري التحميل...
                </div>
              ) : payouts && payouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>رقم CCP</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(payout.created_at).toLocaleDateString("ar-DZ")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {payout.amount?.toLocaleString()} دج
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payout.ccp_number}
                        </TableCell>
                        <TableCell>{payoutStatusBadge(payout.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Wallet className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">لا توجد سحوبات بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={payoutModalOpen} onOpenChange={setPayoutModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>طلب سحب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-4 text-sm">
              <p className="text-muted-foreground">المبلغ المتاح للسحب</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {(summary?.available ?? 0).toLocaleString()} دج
              </p>
            </div>
            <div className="space-y-2">
              <Label>المبلغ المراد سحبه (دج)</Label>
              <Input
                type="number"
                min={1}
                max={summary?.available ?? 0}
                placeholder="0"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم حساب CCP</Label>
              <Input
                placeholder="أدخل رقم حساب CCP"
                value={ccpNumber}
                onChange={(e) => setCcpNumber(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setPayoutModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                const amt = Number(payoutAmount);
                if (!amt || amt <= 0) {
                  toast.error("أدخل مبلغ صحيح");
                  return;
                }
                if (amt > (summary?.available ?? 0)) {
                  toast.error("المبلغ أكبر من المتاح");
                  return;
                }
                if (!ccpNumber.trim()) {
                  toast.error("أدخل رقم حساب CCP");
                  return;
                }
                payoutMutation.mutate({ amount: amt, ccp: ccpNumber.trim() });
              }}
              disabled={payoutMutation.isPending}
            >
              {payoutMutation.isPending ? "جاري الإرسال..." : "إرسال طلب السحب"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
