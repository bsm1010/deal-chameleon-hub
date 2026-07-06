import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Restaurant, MenuItem } from "@/types";

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

function useRestaurantMenuItems(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["owner-menu-items", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId);
      if (error) return [];
      return (data ?? []) as MenuItem[];
    },
    enabled: !!restaurantId,
  });
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const { user, loading: authLoading } = useAuth();

  const { data: restaurant, isLoading: loadingRestaurant } = useOwnerRestaurant(user?.id);

  const { data: menuItems, isLoading: loadingMenu } = useRestaurantMenuItems(restaurant?.id);

  const isLoading = authLoading || loadingRestaurant || loadingMenu;

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F8F8F8] p-6 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F8F8F8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-8">لوحة التحكم</h1>

          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-orange-50 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">ابدأ بإنشاء ملف مطعمك</h2>
            <p className="text-gray-500 mb-6">
              أنشئ ملف مطعمك ليتمكن الزبائن من العثور عليه وتصفح قوائم الطعام
            </p>
            <Link
              to="/dashboard/profile"
              className="inline-block px-8 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#e55a2b] transition-colors"
            >
              إنشاء ملف المطعم
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalItems = menuItems?.length ?? 0;
  const isActive = restaurant.is_active;
  const availableItems = menuItems?.filter((item) => item.is_available).length ?? 0;

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8F8F8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">لوحة التحكم</h1>
        <p className="text-gray-500 mb-8">مرحباً {restaurant.name}</p>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF6B35]/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A1A2E]">{totalItems}</p>
                <p className="text-sm text-gray-500">إجمالي الأطباق</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A1A2E]">{isActive ? 1 : 0}</p>
                <p className="text-sm text-gray-500">المطاعم النشطة</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A1A2E]">{availableItems}</p>
                <p className="text-sm text-gray-500">الأطباق المتاحة</p>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <h2 className="text-lg font-bold text-[#1A1A2E] mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/dashboard/menu"
            className="bg-[#FF6B35] text-white rounded-xl p-5 font-bold text-center hover:bg-[#e55a2b] transition-colors shadow-sm"
          >
            تعديل القائمة
          </Link>

          <Link
            to="/dashboard/profile"
            className="bg-[#1A1A2E] text-white rounded-xl p-5 font-bold text-center hover:bg-[#2a2a4e] transition-colors shadow-sm"
          >
            تعديل الملف
          </Link>

          <Link
            to={`/restaurant/${restaurant.id}`}
            className="bg-white text-[#1A1A2E] rounded-xl p-5 font-bold text-center border-2 border-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors shadow-sm"
          >
            عرض صفحتي
          </Link>
        </div>
      </div>
    </div>
  );
}
