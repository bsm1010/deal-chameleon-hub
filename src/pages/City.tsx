import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Restaurant } from "@/types";

const CATEGORY_FILTERS = [
  "الكل",
  "فاست فود",
  "مشاوي",
  "بيتزا",
  "كافيه",
  "مطعم عائلي",
  "حلويات",
] as const;

type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

const PER_PAGE = 12;

function useCityRestaurants(city: string, category: CategoryFilter, page: number) {
  return useQuery({
    queryKey: ["city-restaurants", city, category, page],
    queryFn: async () => {
      let query = supabase
        .from("restaurants")
        .select("*", { count: "exact" })
        .eq("wilaya", city)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (category !== "الكل") {
        query = query.eq("category", category);
      }

      const from = (page - 1) * PER_PAGE;
      const to = from + PER_PAGE - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      return { data: data as Restaurant[], count: count ?? 0 };
    },
  });
}

function StarRating() {
  return (
    <div className="flex items-center gap-0.5 text-[#FF6B35]">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-4 h-4 fill-current"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 mr-1">4.5</span>
    </div>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <a
      href={`/restaurant/${restaurant.id}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      <div className="relative h-48 bg-gray-200 rounded-t-xl overflow-hidden">
        {restaurant.cover_photo ? (
          <img
            src={restaurant.cover_photo}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-12 h-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <span className="absolute top-3 right-3 bg-[#FF6B35] text-white text-xs font-bold px-3 py-1 rounded-full">
          {restaurant.category}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg mb-1">{restaurant.name}</h3>
        <p className="text-sm text-gray-500 mb-2">
          {restaurant.commune ? `${restaurant.commune}، ` : ""}
          {restaurant.wilaya}
        </p>
        <StarRating />
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200 rounded-t-xl" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function City() {
  const { city } = useParams<{ city: string }>();
  const decodedCity = city ? decodeURIComponent(city) : "";
  const [category, setCategory] = useState<CategoryFilter>("الكل");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useCityRestaurants(decodedCity, category, page);

  const totalPages = data ? Math.ceil(data.count / PER_PAGE) : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8F8F8]">
      {/* HEADER */}
      <section className="bg-gradient-to-b from-orange-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#FF6B35] transition-colors mb-6 text-sm"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            العودة للرئيسية
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A2E] mb-2">
            مطاعم في {decodedCity}
          </h1>
          <p className="text-gray-500 text-base sm:text-lg">
            تصفح أفضل المطاعم المتاحة في {decodedCity}
          </p>
        </div>
      </section>

      {/* CATEGORY FILTER BAR */}
      <section className="sticky top-0 z-10 bg-[#F8F8F8]/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
                  category === cat
                    ? "bg-[#FF6B35] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* RESTAURANT GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-gray-500">
            حدث خطأ أثناء تحميل البيانات. حاول مرة أخرى.
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="text-gray-500 text-lg mb-4">لا توجد مطاعم في هذه المدينة حالياً</p>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 bg-[#FF6B35] text-white rounded-lg font-medium hover:bg-[#e55a2b] transition-colors"
            >
              تصفح المطاعم في مدن أخرى
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.data.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  السابق
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? "bg-[#FF6B35] text-white"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
