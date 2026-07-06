import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerRestaurant } from "@/hooks/useRestaurant";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, WILAYAS, DAYS_AR, EMPTY_HOURS } from "@/types";
import type { DayHours } from "@/types";
import { StoreIcon, GlobeIcon, InstagramIcon, MapPinIcon, ClockIcon, ImageIcon, ExternalLinkIcon } from "@/lib/icons";

interface FormData {
  name: string;
  description: string;
  category: string;
  wilaya: string;
  commune: string;
  address: string;
  phone: string;
  website: string;
  instagram: string;
  opening_hours: Record<string, DayHours>;
  cover_photo: string;
  logo: string;
  latitude: string;
  longitude: string;
  is_active: boolean;
  reviews_enabled: boolean;
}

const EMPTY_FORM: FormData = {
  name: "", description: "", category: "", wilaya: "", commune: "", address: "",
  phone: "", website: "", instagram: "", opening_hours: {
    sat: { ...EMPTY_HOURS }, sun: { ...EMPTY_HOURS }, mon: { ...EMPTY_HOURS },
    tue: { ...EMPTY_HOURS }, wed: { ...EMPTY_HOURS }, thu: { ...EMPTY_HOURS }, fri: { ...EMPTY_HOURS },
  },
  cover_photo: "", logo: "", latitude: "", longitude: "", is_active: true, reviews_enabled: true,
};

function InputField({ label, required, error, icon, ...props }: { label: string; required?: boolean; error?: string; icon?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input {...props} className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-colors ${error ? "border-red-400 bg-red-50" : "border-gray-200"} ${icon ? "pl-10" : ""} ${props.className ?? ""}`} />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function RestaurantProfile() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: restaurant, isLoading: loadingRestaurant } = useOwnerRestaurant(user?.id);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    if (restaurant) {
      let hours: Record<string, DayHours> = { ...EMPTY_FORM.opening_hours };
      try {
        if (restaurant.opening_hours) {
          const parsed = JSON.parse(restaurant.opening_hours);
          hours = { ...hours, ...parsed };
        }
      } catch {}
      setForm({
        name: restaurant.name ?? "", description: restaurant.description ?? "",
        category: restaurant.category ?? "", wilaya: restaurant.wilaya ?? "",
        commune: restaurant.commune ?? "", address: restaurant.address ?? "",
        phone: restaurant.phone ?? "", website: restaurant.website ?? "",
        instagram: restaurant.instagram ?? "", opening_hours: hours,
        cover_photo: restaurant.cover_photo ?? "", logo: restaurant.logo ?? "",
        latitude: restaurant.latitude != null ? String(restaurant.latitude) : "",
        longitude: restaurant.longitude != null ? String(restaurant.longitude) : "",
        is_active: restaurant.is_active ?? true, reviews_enabled: restaurant.reviews_enabled ?? true,
      });
    }
  }, [restaurant]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("غير مصرح");
      const payload = {
        owner_id: user.id, name: form.name.trim(), description: form.description.trim() || null,
        category: form.category, wilaya: form.wilaya, commune: form.commune.trim() || null,
        address: form.address.trim() || null, phone: form.phone.trim() || null,
        website: form.website.trim() || null, instagram: form.instagram.trim() || null,
        opening_hours: JSON.stringify(form.opening_hours),
        cover_photo: form.cover_photo.trim() || null, logo: form.logo.trim() || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        is_active: form.is_active, reviews_enabled: form.reviews_enabled,
      };
      if (restaurant) {
        const { error } = await supabase.from("restaurants").update(payload).eq("id", restaurant.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("restaurants").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("تم حفظ الملف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["owner-restaurant", user?.id] });
    },
    onError: () => toast.error("حدث خطأ أثناء الحفظ"),
  });

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) e.name = "اسم المطعم مطلوب";
    if (!form.category) e.category = "اختر التصنيف";
    if (!form.wilaya) e.wilaya = "اختر الولاية";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  }

  function handleChange(field: keyof FormData, value: string | boolean | Record<string, DayHours>) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function handleFileUpload(field: "cover_photo" | "logo", file: File) {
    if (!restaurant) { toast.error("أنشئ ملف المطعم أولاً"); return; }
    setUploadingField(field);
    try {
      const ext = file.name.split(".").pop();
      const path = `${restaurant.id}/${field}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("restaurant-media").upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("restaurant-media").getPublicUrl(path);
      handleChange(field, urlData.publicUrl);
      toast.success("تم رفع الصورة بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingField(null);
    }
  }

  if (authLoading || loadingRestaurant) {
    return <div className="space-y-6"><div className="h-8 bg-gray-200 rounded w-48 animate-pulse" /><div className="bg-white rounded-2xl h-96 animate-pulse" /></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">
          {restaurant ? "تعديل ملف المطعم" : "إنشاء ملف المطعم"}
        </h1>
        <div className="flex items-center gap-3">
          {restaurant && (
            <a href={`/restaurant/${restaurant.id}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors">
              <ExternalLinkIcon className="h-4 w-4" /> معاينة
            </a>
          )}
          <button type="submit" disabled={mutation.isPending}
            className="px-8 py-2.5 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#e55a2b] transition-colors disabled:opacity-50 text-sm">
            {mutation.isPending ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>

      {/* Section 1: Basic Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <StoreIcon className="h-5 w-5 text-[#FF6B35]" />
          <h2 className="font-bold text-[#1A1A2E]">المعلومات الأساسية</h2>
        </div>
        <InputField label="اسم المطعم" required error={errors.name} value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="اسم مطعمك" />
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">الوصف</label>
          <textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] resize-none transition-colors" placeholder="وصف مختصر لمطعمك..." />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">التصنيف <span className="text-red-500">*</span></label>
          <select value={form.category} onChange={(e) => handleChange("category", e.target.value)}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] transition-colors ${errors.category ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
            <option value="">اختر التصنيف</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>
        <InputField label="رقم الهاتف" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="0555 55 55 55" dir="ltr" />
        <InputField label="الموقع الإلكتروني" value={form.website} onChange={(e) => handleChange("website", e.target.value)} placeholder="https://..." dir="ltr" icon={<GlobeIcon className="h-4 w-4 text-gray-400" />} />
        <InputField label="حساب إنستغرام" value={form.instagram} onChange={(e) => handleChange("instagram", e.target.value)} placeholder="@restaurant" dir="ltr" icon={<InstagramIcon className="h-4 w-4 text-gray-400" />} />
      </div>

      {/* Section 2: Location */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPinIcon className="h-5 w-5 text-[#FF6B35]" />
          <h2 className="font-bold text-[#1A1A2E]">الموقع</h2>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">الولاية <span className="text-red-500">*</span></label>
          <select value={form.wilaya} onChange={(e) => handleChange("wilaya", e.target.value)}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] transition-colors ${errors.wilaya ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
            <option value="">اختر الولاية</option>
            {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          {errors.wilaya && <p className="text-red-500 text-xs mt-1">{errors.wilaya}</p>}
        </div>
        <InputField label="البلدية" value={form.commune} onChange={(e) => handleChange("commune", e.target.value)} placeholder="البلدية" />
        <InputField label="العنوان التفصيلي" value={form.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="العنوان الكامل" />
        <div className="grid grid-cols-2 gap-4">
          <InputField label="خط العرض" value={form.latitude} onChange={(e) => handleChange("latitude", e.target.value)} placeholder="36.7538" dir="ltr" />
          <InputField label="خط الطول" value={form.longitude} onChange={(e) => handleChange("longitude", e.target.value)} placeholder="3.0588" dir="ltr" />
        </div>
        {form.latitude && form.longitude && (
          <div className="rounded-lg overflow-hidden h-48 border border-gray-200">
            <iframe
              src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed`}
              className="w-full h-full border-0" loading="lazy" title="Map"
            />
          </div>
        )}
      </div>

      {/* Section 3: Opening Hours */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ClockIcon className="h-5 w-5 text-[#FF6B35]" />
          <h2 className="font-bold text-[#1A1A2E]">ساعات العمل</h2>
        </div>
        {DAYS_AR.map(({ key, label }) => {
          const day = form.opening_hours[key];
          return (
            <div key={key} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
              <span className="w-20 text-sm font-bold text-[#1A1A2E]">{label}</span>
              <button type="button" onClick={() => {
                const hours = { ...form.opening_hours };
                hours[key] = { ...hours[key], open: !hours[key].open };
                handleChange("opening_hours", hours);
              }}
                className={`relative w-11 h-6 rounded-full transition-colors ${day.open ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all`} style={{ right: day.open ? "2px" : "22px" }} />
              </button>
              {day.open ? (
                <div className="flex items-center gap-2">
                  <input type="time" value={day.from} onChange={(e) => {
                    const hours = { ...form.opening_hours };
                    hours[key] = { ...hours[key], from: e.target.value };
                    handleChange("opening_hours", hours);
                  }} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" dir="ltr" />
                  <span className="text-gray-400 text-sm">إلى</span>
                  <input type="time" value={day.to} onChange={(e) => {
                    const hours = { ...form.opening_hours };
                    hours[key] = { ...hours[key], to: e.target.value };
                    handleChange("opening_hours", hours);
                  }} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" dir="ltr" />
                </div>
              ) : (
                <span className="text-sm text-gray-400">مغلق</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Section 4: Media */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="h-5 w-5 text-[#FF6B35]" />
          <h2 className="font-bold text-[#1A1A2E]">الوسائط</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">صورة الغلاف</label>
            <div className="relative">
              <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-[#FF6B35] transition-colors">
                {form.cover_photo ? (
                  <img src={form.cover_photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="h-8 w-8 mb-1" />
                    <span className="text-xs">اضغط للرفع</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload("cover_photo", f); }} />
              {uploadingField === "cover_photo" && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                  <div className="h-6 w-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input type="url" value={form.cover_photo} onChange={(e) => handleChange("cover_photo", e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs mt-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" placeholder="أو أدخل رابط الصورة" dir="ltr" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">الشعار</label>
            <div className="relative">
              <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-[#FF6B35] transition-colors flex items-center justify-center">
                {form.logo ? (
                  <img src={form.logo} alt="" className="w-24 h-24 object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="h-8 w-8 mb-1" />
                    <span className="text-xs">اضغط للرفع</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload("logo", f); }} />
              {uploadingField === "logo" && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                  <div className="h-6 w-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input type="url" value={form.logo} onChange={(e) => handleChange("logo", e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs mt-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" placeholder="أو أدخل رابط الشعار" dir="ltr" />
          </div>
        </div>

        {form.cover_photo && form.logo && (
          <div className="mt-4">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">معاينة الصفحة العامة</label>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <div className="h-32 relative">
                <img src={form.cover_photo} alt="" className="w-full h-full object-cover" />
                <div className="absolute -bottom-8 right-4">
                  <div className="w-16 h-16 rounded-xl bg-white shadow-lg overflow-hidden border-2 border-white">
                    <img src={form.logo} alt="" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
              <div className="pt-10 p-4">
                <h3 className="font-bold text-[#1A1A2E]">{form.name || "اسم المطعم"}</h3>
                <p className="text-xs text-gray-500">{form.category}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-[#1A1A2E]">الإعدادات</h2>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-[#1A1A2E]">إظهار المطعم في القائمة العامة</span>
          <button type="button" onClick={() => handleChange("is_active", !form.is_active)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? "bg-green-500" : "bg-gray-300"}`}>
            <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ right: form.is_active ? "2px" : "22px" }} />
          </button>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-[#1A1A2E]">تفعيل التقييمات</span>
          <button type="button" onClick={() => handleChange("reviews_enabled", !form.reviews_enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.reviews_enabled ? "bg-green-500" : "bg-gray-300"}`}>
            <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ right: form.reviews_enabled ? "2px" : "22px" }} />
          </button>
        </div>
      </div>
    </form>
  );
}
