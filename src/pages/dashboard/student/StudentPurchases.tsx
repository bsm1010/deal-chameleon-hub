import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CreditCard, BookOpen, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/Spinner";
import StudentLayout from "./StudentLayout";

export default function StudentPurchases() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  const { data: purchases, isLoading } = useQuery({
    queryKey: ["student-purchases", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("payments")
        .select("*, courses(title), teacher:profiles!payments_teacher_id_fkey(full_name)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const filteredPurchases = purchases?.filter((p) => {
    if (activeTab === "courses") return p.type === "course";
    if (activeTab === "sessions") return p.type === "session";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">مدفوع</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">قيد الانتظار</Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-600 border-red-200">فشل</Badge>;
      case "refunded":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">مسترجع</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">مشترياتي</h1>
          <p className="text-muted-foreground mt-1">سجل مشترياتك ودفعاتك</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="courses">دورات</TabsTrigger>
            <TabsTrigger value="sessions">حصص</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
              </div>
            ) : filteredPurchases?.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CreditCard className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    لا توجد مشتريات بعد
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>العنصر</TableHead>
                      <TableHead>المعلم</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases?.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          {new Date(purchase.created_at).toLocaleDateString("ar-DZ")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {purchase.type === "course" ? (
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>
                              {purchase.type === "course"
                                ? purchase.courses?.title
                                : `حصة - ${purchase.subject ?? ""}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(purchase.teacher as Record<string, unknown>)?.full_name as string}
                        </TableCell>
                        <TableCell className="font-medium">
                          {purchase.amount?.toLocaleString()} دج
                        </TableCell>
                        <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
}
