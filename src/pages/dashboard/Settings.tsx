import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerRestaurant } from "@/hooks/useRestaurant";
import { supabase } from "@/lib/supabase";
import { UserIcon, TrashIcon, AlertTriangleIcon, EyeIcon, StarIcon } from "@/lib/icons";

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { data: restaurant } = useOwnerRestaurant(user?.id);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("تم تحديث الملف الشخصي");
      queryClient.invalidateQueries({ queryKey: ["owner-restaurant", user?.id] });
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (data) queryClient.setQueryData(["profile", user?.id], data);
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });

  const updateEmailMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
    },
    onSuccess: () => toast.success("تم إرسال رابط التأكيد إلى بريدك الإلكتروني"),
    onError: () => toast.error("حدث خطأ أثناء تحديث البريد"),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) throw new Error("كلمتا المرور غير متطابقتين");
      if (password.length < 6) throw new Error("كلمة المرور قصيرة جداً");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث كلمة المرور");
      setPassword("");
      setConfirmPassword("");
    },
    onError: (e: Error) => toast.error(e.message || "حدث خطأ"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      if (!restaurant) return;
      const { error } = await supabase.from("restaurants").update({ is_active: !restaurant.is_active }).eq("id", restaurant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم التحديث");
      queryClient.invalidateQueries({ queryKey: ["owner-restaurant", user?.id] });
    },
  });

  const toggleReviewsMutation = useMutation({
    mutationFn: async () => {
      if (!restaurant) return;
      const { error } = await supabase.from("restaurants").update({ reviews_enabled: !restaurant.reviews_enabled }).eq("id", restaurant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم التحديث");
      queryClient.invalidateQueries({ queryKey: ["owner-restaurant", user?.id] });
    },
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: async () => {
      if (!restaurant) return;
      const { error } = await supabase.from("restaurants").delete().eq("id", restaurant.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("تم حذف المطعم بنجاح");
      setShowDeleteModal(false);
      await signOut();
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1A1A2E]">الإعدادات</h1>

      {/* Account Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <UserIcon className="h-5 w-5 text-[#FF6B35]" />
          <h2 className="font-bold text-[#1A1A2E]">إعدادات الحساب</h2>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">الاسم الكامل</label>
          <div className="flex gap-3">
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" />
            <button onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending || !fullName.trim()}
              className="px-6 py-2.5 bg-[#FF6B35] text-white rounded-lg text-sm font-bold hover:bg-[#e55a2b] disabled:opacity-50 transition-colors">
              {updateProfileMutation.isPending ? "..." : "حفظ"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">البريد الإلكتروني</label>
          <div className="flex gap-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" />
            <button onClick={() => updateEmailMutation.mutate()} disabled={updateEmailMutation.isPending || !email.trim()}
              className="px-6 py-2.5 bg-[#1A1A2E] text-white rounded-lg text-sm font-bold hover:bg-[#2a2a4e] disabled:opacity-50 transition-colors">
              {updateEmailMutation.isPending ? "..." : "تحديث"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">كلمة المرور الجديدة</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" placeholder="6 أحرف على الأقل" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">تأكيد كلمة المرور</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} dir="ltr"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" placeholder="أعد إدخال كلمة المرور" />
          {password && confirmPassword && password !== confirmPassword && (
            <p className="text-red-500 text-xs mt-1">كلمتا المرور غير متطابقتين</p>
          )}
        </div>
        <button onClick={() => updatePasswordMutation.mutate()} disabled={updatePasswordMutation.isPending || !password || !confirmPassword || password !== confirmPassword}
          className="px-6 py-2.5 bg-[#1A1A2E] text-white rounded-lg text-sm font-bold hover:bg-[#2a2a4e] disabled:opacity-50 transition-colors">
          {updatePasswordMutation.isPending ? "..." : "تحديث كلمة المرور"}
        </button>
      </div>

      {/* Restaurant Settings */}
      {restaurant && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-[#1A1A2E] mb-2">إعدادات المطعم</h2>

          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <EyeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-bold text-[#1A1A2E]">إظهار المطعم</p>
                <p className="text-xs text-gray-400">ظهور في القائمة العامة للمطاعم</p>
              </div>
            </div>
            <button onClick={() => toggleActiveMutation.mutate()}
              className={`relative w-11 h-6 rounded-full transition-colors ${restaurant.is_active ? "bg-green-500" : "bg-gray-300"}`}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ right: restaurant.is_active ? "2px" : "22px" }} />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <StarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-bold text-[#1A1A2E]">التقييمات</p>
                <p className="text-xs text-gray-400">السماح للزبائن بكتابة تقييمات</p>
              </div>
            </div>
            <button onClick={() => toggleReviewsMutation.mutate()}
              className={`relative w-11 h-6 rounded-full transition-colors ${restaurant.reviews_enabled ? "bg-green-500" : "bg-gray-300"}`}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ right: restaurant.reviews_enabled ? "2px" : "22px" }} />
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      {restaurant && (
        <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangleIcon className="h-5 w-5 text-red-500" />
            <h2 className="font-bold text-red-600">منطقة الخطر</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            حذف المطعم سيؤدي إلى حذف جميع البيانات نهائياً: الملف الشخصي، القائمة، التقييمات، وجميع الإحصائيات. هذا الإجراء لا يمكن التراجع عنه.
          </p>
          <button onClick={() => setShowDeleteModal(true)}
            className="px-6 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors flex items-center gap-2">
            <TrashIcon className="h-4 w-4" />
            حذف المطعم
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangleIcon className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E]">حذف المطعم</h3>
            </div>
            <p className="text-sm text-gray-600">
              اكتب "<span className="font-bold text-red-500">حذف</span>" للتأكيد:
            </p>
            <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="حذف" dir="ltr" />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 text-sm">
                إلغاء
              </button>
              <button onClick={() => deleteRestaurantMutation.mutate()} disabled={deleteConfirmText !== "حذف" || deleteRestaurantMutation.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {deleteRestaurantMutation.isPending ? "جاري الحذف..." : "حذف نهائياً"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
