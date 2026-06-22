import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/Spinner";
import { Search } from "lucide-react";

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  wilaya: string | null;
  created_at: string;
  avatar_url: string | null;
  role: string;
}

async function fetchStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from("profiles" as any)
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Student[];
}

export default function AdminStudents() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: fetchStudents,
  });

  const filteredStudents = students?.filter(
    (student) =>
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">{t("admin.students", "إدارة الطلاب")}</h1>

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
              <TableHead>الولاية</TableHead>
              <TableHead>تاريخ التسجيل</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t("common.noData", "لا توجد بيانات")}
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents?.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {student.avatar_url ? (
                          <img src={student.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          student.full_name?.charAt(0)
                        )}
                      </div>
                      {student.full_name}
                    </div>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.wilaya || "-"}</TableCell>
                  <TableCell>
                    {new Date(student.created_at).toLocaleDateString("ar-DZ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      نشط
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
