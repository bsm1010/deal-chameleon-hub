import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Restaurant as RestaurantType, MenuCategory, MenuItem } from "@/types";

function RestaurantSkeleton() {
  return (
    <div className="animate-pulse" dir="rtl">
      <div className="h-64 bg-gray-200 w-full" />
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        <div className="w-20 h-20 rounded-full bg-gray-300 border-4 border-white" />
        <div className="mt-3 space-y-2">
          <div className="h-7 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-40" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        {[1, 2].map((i) => (
          <div key={i}>
            <div className="h-5 bg-gray-200 rounded w-24 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex gap-3 p-3 bg-white rounded-lg">
                  <div className="w-[100px] h-[100px] bg-gray-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-28" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4" dir="rtl">
      <div className="text-6xl mb-4">🍽️</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">المطعم غير موجود</h1>
      <p className="text-gray-500 mb-6">يبدو أن هذا المطعم غير متوفر حالياً</p>
      <Link
        to="/"
        className="px-6 py-2 bg-[#FF6B35] text-white rounded-lg font-medium hover:bg-[#e55a2b] transition-colors"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}

export default function Restaurant() {
  const { id } = useParams<{ id: string }>();

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery<RestaurantType | null>({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!id,
  });

  const { data: categories, isLoading: loadingCategories } = useQuery<MenuCategory[]>({
    queryKey: ["menu_categories", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", id)
        .order("order_index");
      if (error) return [];
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: menuItems, isLoading: loadingItems } = useQuery<MenuItem[]>({
    queryKey: ["menu_items", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", id)
        .order("order_index");
      if (error) return [];
      return data ?? [];
    },
    enabled: !!id,
  });

  const isLoading = loadingRestaurant || loadingCategories || loadingItems;

  if (isLoading) return <RestaurantSkeleton />;

  if (!restaurant) return <NotFoundPage />;

  const itemsByCategory = (categories ?? []).map((cat) => ({
    ...cat,
    items: (menuItems ?? []).filter((item) => item.category_id === cat.id),
  }));

  const hasCoords =
    restaurant.latitude != null && restaurant.longitude != null;

  const embedUrl = hasCoords
    ? `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${restaurant.longitude}!3d${restaurant.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${restaurant.latitude},${restaurant.longitude}!5e0!3m2!1sar!2sdz!4v1`
    : null;

  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
    : null;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <section className="relative">
        <div className="relative h-64 bg-gray-200 overflow-hidden">
          {restaurant.cover_photo ? (
            <img
              src={restaurant.cover_photo}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#1A1A2E]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E]/90 via-[#1A1A2E]/30 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto px-4 relative -mt-16 z-10">
          {restaurant.logo ? (
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="w-20 h-20 rounded-full border-4 border-white object-cover bg-white shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-white bg-[#FF6B35] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {restaurant.name.charAt(0)}
            </div>
          )}

          <div className="mt-3">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{restaurant.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-[#FF6B35] text-white text-xs font-medium rounded-full">
                {restaurant.category}
              </span>
              <span className="text-white/80 text-sm">{restaurant.wilaya}</span>
              {restaurant.commune && (
                <span className="text-white/60 text-sm">• {restaurant.commune}</span>
              )}
            </div>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {restaurant.phone}
                </a>
              )}
              {restaurant.opening_hours && (
                <span className="text-white/70 text-sm">🕐 {restaurant.opening_hours}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MENU SECTION */}
      <section className="max-w-4xl mx-auto px-4 mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">قائمة الطعام</h2>

        {itemsByCategory.length === 0 && (
          <p className="text-gray-400 text-center py-8">لا توجد عناصر في القائمة حالياً</p>
        )}

        {itemsByCategory.map((cat) => (
          <div key={cat.id} className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 pb-2 border-b-2 border-[#FF6B35] mb-4">
              {cat.name}
            </h3>

            {cat.items.length === 0 && (
              <p className="text-gray-400 text-sm">لا توجد عناصر</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cat.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-[100px] h-[100px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-gray-800 truncate">{item.name}</h4>
                      {!item.is_available && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-medium rounded-full whitespace-nowrap">
                          غير متوفر
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-[#FF6B35] font-bold mt-2">{item.price} دج</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* MAP SECTION */}
      {(hasCoords || restaurant.address) && (
        <section className="max-w-4xl mx-auto px-4 mt-8 mb-12">
          <h2 className="text-xl font-bold text-gray-800 mb-4">الموقع</h2>

          {hasCoords && (
            <div className="w-full h-64 rounded-xl overflow-hidden mb-4 bg-gray-200">
              <iframe
                src={embedUrl!}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="خريطة الموقع"
              />
            </div>
          )}

          {!hasCoords && restaurant.address && (
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <p className="text-gray-600 text-sm">📍 {restaurant.address}</p>
            </div>
          )}

          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1A1A2E] text-white rounded-lg font-medium hover:bg-[#2a2a4e] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              الاتجاهات
            </a>
          )}
        </section>
      )}
    </div>
  );
}
