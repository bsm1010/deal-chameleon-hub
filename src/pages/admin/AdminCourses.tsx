import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/Spinner";
import { Search, Trash2, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  description: string | null;
  price: number;
  status: string;
  students_count: number;
  created_at: string;
}

async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses" as any)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Course[];
}

export default function AdminCourses() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: fetchCourses,
  });

  const unpublishMutation = useMutation({
    mutationFn: async (course: Course) => {
      const newStatus = course.status === "published" ? "draft" : "published";
      const { error } = await supabase
        .from("courses" as any)
        .update({ status: newStatus })
        .eq("id", course.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("تم تحديث حالة الدورة");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الدورة");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from("courses" as any)
        .delete()
        .eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setDeleteDialogOpen(false);
      setSelectedCourseId(null);
      toast.success("تم حذف الدورة");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف الدورة");
    },
  });

  const filteredCourses = courses?.filter(
    (course) =>
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = () => {
    if (selectedCourseId) {
      deleteMutation.mutate(selectedCourseId);
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
      <h1 className="text-3xl font-bold mb-6">{t("admin.courses", "إدارة الدورات")}</h1>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالعنوان أو اسم المدرس..."
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
              <TableHead>المدرس</TableHead>
              <TableHead>العنوان</TableHead>
              <TableHead>الطلاب</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t("common.noData", "لا توجد دورات")}
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses?.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.teacher_name}</TableCell>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>{course.students_count ?? 0}</TableCell>
                  <TableCell>
                    {course.price === 0 ? (
                      <span className="text-green-600 font-medium">مجاني</span>
                    ) : (
                      <span className="font-bold">{course.price.toLocaleString()} دج</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {course.status === "published" ? (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        منشور
                      </Badge>
                    ) : (
                      <Badge variant="secondary">مسودة</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unpublishMutation.mutate(course)}
                        disabled={unpublishMutation.isPending}
                      >
                        {course.status === "published" ? (
                          <>
                            <EyeOff className="w-4 h-4 ml-1" />
                            إخفاء
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 ml-1" />
                            نشر
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        {t("common.delete", "حذف")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف الدورة</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            هل أنت متأكد من حذف هذه الدورة؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("common.cancel", "إلغاء")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
