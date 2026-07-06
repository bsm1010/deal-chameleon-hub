import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerRestaurant } from "@/hooks/useRestaurant";
import { supabase } from "@/lib/supabase";
import { BarChartIcon, TrendingUpIcon, CalendarIcon, EyeIcon, StarIcon } from "@/lib/icons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, type PieLabelRenderProps } from "recharts";

function useViewAnalytics(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["view-analytics", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data } = await supabase
        .from("menu_views")
        .select("viewed_at")
        .eq("restaurant_id", restaurantId)
        .gte("viewed_at", thirtyDaysAgo.toISOString())
        .order("viewed_at");
      if (!data) return [];
      const grouped: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        grouped[d.toISOString().split("T")[0]] = 0;
      }
      data.forEach((v) => {
        const day = v.viewed_at.split("T")[0];
        grouped[day] = (grouped[day] || 0) + 1;
      });
      return Object.entries(grouped).map(([date, count]) => ({
        date: date.slice(5),
        count,
      }));
    },
    enabled: !!restaurantId,
  });
}

function useCategoryViews(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["category-views", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data } = await supabase
        .from("menu_views")
        .select("category_id")
        .eq("restaurant_id", restaurantId)
        .not("category_id", "is", null);
      if (!data || data.length === 0) return [];
      const counts: Record<string, number> = {};
      data.forEach((v) => { counts[v.category_id] = (counts[v.category_id] || 0) + 1; });
      const { data: cats } = await supabase.from("menu_categories").select("id, name").eq("restaurant_id", restaurantId);
      const catMap: Record<string, string> = {};
      cats?.forEach((c) => { catMap[c.id] = c.name; });
      return Object.entries(counts).map(([id, count]) => ({ name: catMap[id] || "غير معروف", value: count }));
    },
    enabled: !!restaurantId,
  });
}

function useTopItems(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["top-items", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data } = await supabase
        .from("menu_views")
        .select("item_id")
        .eq("restaurant_id", restaurantId)
        .not("item_id", "is", null);
      if (!data || data.length === 0) return [];
      const counts: Record<string, number> = {};
      data.forEach((v) => { counts[v.item_id] = (counts[v.item_id] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const { data: items } = await supabase.from("menu_items").select("id, name").eq("restaurant_id", restaurantId);
      const itemMap: Record<string, string> = {};
      items?.forEach((i) => { itemMap[i.id] = i.name; });
      return sorted.map(([id, count]) => ({ name: itemMap[id] || "غير معروف", views: count }));
    },
    enabled: !!restaurantId,
  });
}

function useMapClickAnalytics(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["map-click-analytics", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data } = await supabase
        .from("map_clicks")
        .select("clicked_at")
        .eq("restaurant_id", restaurantId)
        .gte("clicked_at", thirtyDaysAgo.toISOString())
        .order("clicked_at");
      if (!data) return [];
      const grouped: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        grouped[d.toISOString().split("T")[0]] = 0;
      }
      data.forEach((v) => {
        const day = v.clicked_at.split("T")[0];
        grouped[day] = (grouped[day] || 0) + 1;
      });
      return Object.entries(grouped).map(([date, count]) => ({ date: date.slice(5), count }));
    },
    enabled: !!restaurantId,
  });
}

const COLORS = ["#FF6B35", "#1A1A2E", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#6366F1"];

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">{icon}</div>
        <div>
          <p className="text-2xl font-bold text-[#1A1A2E]">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { user, loading: authLoading } = useAuth();
  const { data: restaurant, isLoading: loadingRestaurant } = useOwnerRestaurant(user?.id);
  const { data: viewData = [] } = useViewAnalytics(restaurant?.id);
  const { data: categoryData = [] } = useCategoryViews(restaurant?.id);
  const { data: topItems = [] } = useTopItems(restaurant?.id);
  const { data: mapClickData = [] } = useMapClickAnalytics(restaurant?.id);

  const isLoading = authLoading || loadingRestaurant;

  if (isLoading) {
    return <div className="space-y-6"><div className="h-8 bg-gray-200 rounded w-40 animate-pulse" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />)}</div></div>;
  }

  if (!restaurant) {
    return <div className="bg-white rounded-2xl p-8 text-center text-gray-500">أنشئ ملف مطعمك أولاً</div>;
  }

  const totalViewsAllTime = viewData.reduce((sum, d) => sum + d.count, 0);
  const bestDay = viewData.reduce((best, d) => d.count > best.count ? d : best, { date: "", count: 0 });
  const mostViewed = topItems.length > 0 ? topItems[0].name : "—";
  const topCategory = categoryData.length > 0 ? categoryData.reduce((a, b) => a.value > b.value ? a : b).name : "—";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1A1A2E]">الإحصائيات</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<EyeIcon className="h-5 w-5 text-[#FF6B35]" />} label="إجمالي المشاهدات" value={totalViewsAllTime} />
        <SummaryCard icon={<CalendarIcon className="h-5 w-5 text-blue-500" />} label="أفضل يوم" value={bestDay.date.slice(5) || "—"} />
        <SummaryCard icon={<StarIcon className="h-5 w-5 text-yellow-500" />} label="الأكثر مشاهدة" value={mostViewed} />
        <SummaryCard icon={<BarChartIcon className="h-5 w-5 text-green-500" />} label="القسم الأعلى" value={topCategory} />
      </div>

      {/* Views over 30 days */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUpIcon className="h-5 w-5 text-[#FF6B35]" />
          <h3 className="font-bold text-[#1A1A2E]">مشاهدات آخر 30 يوم</h3>
        </div>
        {viewData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={viewData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#FF6B35" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات بعد</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category donut */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-[#1A1A2E] mb-4">الأقسام الأكثر مشاهدة</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={(props: PieLabelRenderProps) => `${props.name ?? ""} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات</div>
          )}
        </div>

        {/* Top items bar */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-[#1A1A2E] mb-4">أكثر 5 أطباق مشاهدة</h3>
          {topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="views" fill="#FF6B35" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* Map clicks */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
          <h3 className="font-bold text-[#1A1A2E]">نقرات الخريطة (آخر 30 يوم)</h3>
        </div>
        {mapClickData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mapClickData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات بعد</div>
        )}
      </div>
    </div>
  );
}
