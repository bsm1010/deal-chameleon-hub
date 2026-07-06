import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, WILAYAS } from "@/types";
import type { Restaurant } from "@/types";

function useOwnerRestaurant(userId: string | undefined) {
  return useQuery({
    queryKey: ["owner-restaurant", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", userId)
        .single();
      if (error) return null;
      return data as Restaurant;
    },
    enabled: !!userId,
  });
}

interface FormData {
  name: string;
  description: string;
  category: string;
  wilaya: string;
  commune: string;
  address: string;
  phone: string;
  opening_hours: string;
  cover_photo: string;
  logo: string;
  latitude: string;
  longitude: string;
}

const EMPTY_FORM: FormData = {
  name: "",
  description: "",
  category: "",
  wilaya: "",
  commune: "",
  address: "",
  phone: "",
  opening_hours: "",
  cover_photo: "",
  logo: "",
  latitude: "",
  longitude: "",
};

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="bg-white rounded-2xl p-6 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        ))}
        <div className="h-12 bg-gray-200 rounded w-40" />
      </div>
    </div>
  );
}

export default function RestaurantProfile() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading: loadingRestaurant } = useOwnerRestaurant(user?.id);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name ?? "",
        description: restaurant.description ?? "",
        category: restaurant.category ?? "",
        wilaya: restaurant.wilaya ?? "",
        commune: restaurant.commune ?? "",
        address: restaurant.address ?? "",
        phone: restaurant.phone ?? "",
        opening_hours: restaurant.opening_hours ?? "",
        cover_photo: restaurant.cover_photo ?? "",
        logo: restaurant.logo ?? "",
        latitude: restaurant.latitude != null ? String(restaurant.latitude) : "",
        longitude: restaurant.longitude != null ? String(restaurant.longitude) : "",
      });
    }
  }, [restaurant]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("غير مصرح");

      const payload = {
        owner_id: user.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        wilaya: form.wilaya,
        commune: form.commune.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        opening_hours: form.opening_hours.trim() || null,
        cover_photo: form.cover_photo.trim() || null,
        logo: form.logo.trim() || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        is_active: restaurant?.is_active ?? true,
      };

      if (restaurant) {
        const { error } = await supabase
          .from("restaurants")
          .update(payload)
          .eq("id", restaurant.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("restaurants")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("تم حفظ الملف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["owner-restaurant", user?.id] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء الحفظ. حاول مرة أخرى.");
    },
  });

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = "اسم المطعم مطلوب";
    }
    if (!form.category) {
      newErrors.category = "اختر التصنيف";
    }
    if (!form.wilaya) {
      newErrors.wilaya = "اختر الولاية";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  }

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  if (authLoading || loadingRestaurant) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F8F8F8] p-6 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8F8F8]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-8">
          {restaurant ? "تعديل ملف المطعم" : "إنشاء ملف المطعم"}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              اسم المطعم <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-colors ${
                errors.name ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
              placeholder="اسم مطعمك"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">الوصف</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none transition-colors"
              placeholder="وصف مختصر لمطعمك..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              التصنيف <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-colors ${
                errors.category ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            >
              <option value="">اختر التصنيف</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Wilaya */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              الولاية <span className="text-red-500">*</span>
            </label>
            <select
              value={form.wilaya}
              onChange={(e) => handleChange("wilaya", e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-colors ${
                errors.wilaya ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            >
              <option value="">اختر الولاية</option>
              {WILAYAS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
            {errors.wilaya && <p className="text-red-500 text-xs mt-1">{errors.wilaya}</p>}
          </div>

          {/* Commune */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">البلدية</label>
            <input
              type="text"
              value={form.commune}
              onChange={(e) => handleChange("commune", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-colors"
              placeholder="البلدية"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">العنوان</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-colors"
              placeholder="العنوان التفصيلي"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">رقم الهاتف</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-colors"
              placeholder="0555 55 55 55"
              dir="ltr"
            />
          </div>

          {/* Opening hours */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">ساعات العمل</label>
            <input
              type="text"
              value={form.opening_hours}
              onChange={(e) => handleChange("opening_hours", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-colors"
              placeholder="مثال: 9 صباحاً - 11 مساءً"
            />
          </div>

          {/* Cover photo */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">رابط صورة الغلاف</label>
            <input
              type="url"
              value={form.cover_photo}
              onChange={(e) => handleChange("cover_photo", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-colors"
              placeholder="https://example.com/photo.jpg"
              dir="ltr"
            />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">رابط الشعار</label>
            <input
              type="url"
              value={form.logo}
              onChange={(e) => handleChange("logo", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-colors"
              placeholder="https://example.com/logo.png"
              dir="ltr"
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">خط العرض</label>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => handleChange("latitude", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-colors"
                placeholder="36.7538"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">خط الطول</label>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => handleChange("longitude", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-colors"
                placeholder="3.0588"
                dir="ltr"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full sm:w-auto px-8 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#e55a2b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending
                ? "جاري الحفظ..."
                : restaurant
                  ? "حفظ التعديلات"
                  : "إنشاء الملف"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
