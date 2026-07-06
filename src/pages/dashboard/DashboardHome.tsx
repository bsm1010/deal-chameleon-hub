import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerRestaurant, useMenuItems } from "@/hooks/useRestaurant";
import { supabase } from "@/lib/supabase";
import { EyeIcon, MapPinIcon, StarIcon, ExternalLinkIcon, EditIcon, QrCodeIcon, StoreIcon, UserIcon } from "@/lib/icons";
import type { Review } from "@/types";

function useTodayViews(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["today-views", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("menu_views")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId)
        .gte("viewed_at", today.toISOString());
      return count ?? 0;
    },
    enabled: !!restaurantId,
  });
}

function useWeekViews(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["week-views", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return 0;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count } = await supabase
        .from("menu_views")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId)
        .gte("viewed_at", weekAgo.toISOString());
      return count ?? 0;
    },
    enabled: !!restaurantId,
  });
}

function useMapClicks(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["map-clicks", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return 0;
      const { count } = await supabase
        .from("map_clicks")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId);
      return count ?? 0;
    },
    enabled: !!restaurantId,
  });
}

function useAvgRating(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["avg-rating", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return 0;
      const { data } = await supabase
        .from("reviews")
        .select("rating")
        .eq("restaurant_id", restaurantId);
      if (!data || data.length === 0) return 0;
      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      return Math.round((sum / data.length) * 10) / 10;
    },
    enabled: !!restaurantId,
  });
}

function useRecentActivity(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["recent-activity", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data: reviews } = await supabase
        .from("reviews")
        .select("id, customer_name, rating, created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(10);
      return (reviews ?? []) as Pick<Review, "id" | "customer_name" | "rating" | "created_at">[];
    },
    enabled: !!restaurantId,
  });
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1A1A2E]">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <StarIcon key={s} className={`h-4 w-4 ${s <= rating ? "text-yellow-400" : "text-gray-200"}`} filled={s <= rating} />
      ))}
    </div>
  );
}

export default function DashboardHome() {
  const { user, loading: authLoading } = useAuth();
  const { data: restaurant, isLoading: loadingRestaurant } = useOwnerRestaurant(user?.id);
  const { data: menuItems, isLoading: loadingMenu } = useMenuItems(restaurant?.id);
  const { data: todayViews = 0 } = useTodayViews(restaurant?.id);
  const { data: weekViews = 0 } = useWeekViews(restaurant?.id);
  const { data: mapClicks = 0 } = useMapClicks(restaurant?.id);
  const { data: avgRating = 0 } = useAvgRating(restaurant?.id);
  const { data: activities = [] } = useRecentActivity(restaurant?.id);

  const isLoading = authLoading || loadingRestaurant || loadingMenu;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-orange-50 rounded-full flex items-center justify-center">
          <StoreIcon className="h-10 w-10 text-[#FF6B35]" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">ابدأ بإنشاء ملف مطعمك</h2>
        <p className="text-gray-500 mb-6">أنشئ ملف مطعمك ليتمكن الزبائن من العثور عليه</p>
        <Link to="/dashboard/profile" className="inline-block px-8 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#e55a2b] transition-colors">
          إنشاء ملف المطعم
        </Link>
      </div>
    );
  }

  const totalItems = menuItems?.length ?? 0;
  const itemsWithPhotos = menuItems?.filter((i) => i.photo).length ?? 0;
  const completionPct = totalItems > 0 ? Math.round((itemsWithPhotos / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">نظرة عامة</h1>
        <p className="text-gray-500 text-sm mt-1">مرحباً بك في {restaurant.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<EyeIcon className="h-5 w-5 text-[#FF6B35]" />} label="مشاهدات اليوم" value={todayViews} color="bg-[#FF6B35]/10" />
        <StatCard icon={<EyeIcon className="h-5 w-5 text-blue-500" />} label="مشاهدات الأسبوع" value={weekViews} color="bg-blue-50" />
        <StatCard icon={<MapPinIcon className="h-5 w-5 text-green-500" />} label="نقرات الخريطة" value={mapClicks} color="bg-green-50" />
        <StatCard icon={<StarIcon className="h-5 w-5 text-yellow-500" />} label="متوسط التقييم" value={avgRating || "—"} color="bg-yellow-50" />
      </div>

      <div>
        <h2 className="text-lg font-bold text-[#1A1A2E] mb-3">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a href={`/restaurant/${restaurant.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#FF6B35] text-white rounded-xl p-4 font-bold hover:bg-[#e55a2b] transition-colors text-sm">
            <ExternalLinkIcon className="h-4 w-4" />
            عرض صفحتي
          </a>
          <Link to="/dashboard/menu" className="flex items-center justify-center gap-2 bg-[#1A1A2E] text-white rounded-xl p-4 font-bold hover:bg-[#2a2a4e] transition-colors text-sm">
            <EditIcon className="h-4 w-4" />
            تعديل القائمة
          </Link>
          <Link to="/dashboard/qrcode" className="flex items-center justify-center gap-2 bg-white text-[#1A1A2E] rounded-xl p-4 font-bold border-2 border-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors text-sm">
            <QrCodeIcon className="h-4 w-4" />
            إنشاء رمز QR
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#1A1A2E]">اكتمال القائمة</h3>
          <span className="text-sm text-gray-500">{completionPct}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#FF6B35] rounded-full transition-all" style={{ width: `${completionPct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {totalItems === 0
            ? "أضف أطباقاً لقائمتك لتبدأ"
            : itemsWithPhotos < totalItems
              ? `أضف صوراً لـ ${totalItems - itemsWithPhotos} طبق للوصول إلى 100%`
              : "قائمة مكتملة! جميع الأطباق لها صور"}
        </p>
      </div>

      {activities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-[#1A1A2E]">آخر النشاطات</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-4 w-4 text-[#FF6B35]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1A1A2E]">
                    <span className="font-bold">{a.customer_name}</span>
                    {" "}تقييم جديد
                  </p>
                  <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString("ar-DZ")}</p>
                </div>
                <StarRating rating={a.rating} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
