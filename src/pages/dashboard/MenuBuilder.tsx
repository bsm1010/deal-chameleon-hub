import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Restaurant, MenuCategory, MenuItem } from "@/types";

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

function useMenuCategories(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["menu_categories", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("order_index");
      if (error) return [];
      return (data ?? []) as MenuCategory[];
    },
    enabled: !!restaurantId,
  });
}

function useMenuItems(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["menu_items", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("order_index");
      if (error) return [];
      return (data ?? []) as MenuItem[];
    },
    enabled: !!restaurantId,
  });
}

interface LocalCategory extends MenuCategory {
  items: LocalItem[];
  _deleted?: boolean;
  _new?: boolean;
}

interface LocalItem extends MenuItem {
  _dirty?: boolean;
  _deleted?: boolean;
  _new?: boolean;
}

function BuilderSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-40" />
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MenuBuilder() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading: loadingRestaurant } = useOwnerRestaurant(user?.id);
  const { data: remoteCategories, isLoading: loadingCategories } = useMenuCategories(restaurant?.id);
  const { data: remoteItems, isLoading: loadingItems } = useMenuItems(restaurant?.id);

  const [localCategories, setLocalCategories] = useState<LocalCategory[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (remoteCategories && remoteItems) {
      const cats: LocalCategory[] = remoteCategories.map((cat) => ({
        ...cat,
        items: remoteItems
          .filter((item) => item.category_id === cat.id)
          .map((item) => ({ ...item, _dirty: false, _deleted: false })),
      }));
      setLocalCategories(cats);
    }
  }, [remoteCategories, remoteItems]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!restaurant) return;

      for (const cat of localCategories) {
        if (cat._deleted) {
          if (!cat._new) {
            await supabase.from("menu_items").delete().eq("category_id", cat.id);
            await supabase.from("menu_categories").delete().eq("id", cat.id);
          }
          continue;
        }

        let catId = cat.id;

        if (cat._new) {
          const { data: newCat, error: catErr } = await supabase
            .from("menu_categories")
            .insert({
              restaurant_id: restaurant.id,
              name: cat.name,
              order_index: cat.order_index,
            })
            .select()
            .single();
          if (catErr) throw catErr;
          catId = newCat.id;
        } else {
          await supabase
            .from("menu_categories")
            .update({ name: cat.name, order_index: cat.order_index })
            .eq("id", cat.id);
        }

        for (const item of cat.items) {
          if (item._deleted) {
            if (!item._new) {
              await supabase.from("menu_items").delete().eq("id", item.id);
            }
            continue;
          }

          const itemPayload = {
            category_id: catId,
            restaurant_id: restaurant.id,
            name: item.name,
            description: item.description || null,
            price: item.price,
            photo: item.photo || null,
            is_available: item.is_available,
            order_index: item.order_index,
          };

          if (item._new) {
            const { error } = await supabase.from("menu_items").insert(itemPayload);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("menu_items")
              .update(itemPayload)
              .eq("id", item.id);
            if (error) throw error;
          }
        }
      }
    },
    onSuccess: async () => {
      toast.success("تم حفظ القائمة بنجاح");
      setHasChanges(false);
      await queryClient.invalidateQueries({ queryKey: ["menu_categories", restaurant?.id] });
      await queryClient.invalidateQueries({ queryKey: ["menu_items", restaurant?.id] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء الحفظ. حاول مرة أخرى.");
    },
  });

  function addCategory() {
    const name = prompt("اسم القسم الجديد:");
    if (!name?.trim()) return;

    const newCat: LocalCategory = {
      id: `new-${Date.now()}`,
      restaurant_id: restaurant?.id ?? "",
      name: name.trim(),
      order_index: localCategories.length,
      _new: true,
      items: [],
    };

    setLocalCategories((prev) => [...prev, newCat]);
    setHasChanges(true);
  }

  function deleteCategory(catIndex: number) {
    if (!confirm("هل أنت متأكد من حذف هذا القسم وجميع أطباقه؟")) return;
    setLocalCategories((prev) =>
      prev.map((cat, i) => (i === catIndex ? { ...cat, _deleted: true } : cat))
    );
    setHasChanges(true);
  }

  function updateCategoryName(catIndex: number, name: string) {
    setLocalCategories((prev) =>
      prev.map((cat, i) => (i === catIndex ? { ...cat, name } : cat))
    );
    setHasChanges(true);
  }

  function addItem(catIndex: number) {
    const newItem: LocalItem = {
      id: `new-${Date.now()}`,
      category_id: localCategories[catIndex].id,
      restaurant_id: restaurant?.id ?? "",
      name: "",
      description: null,
      price: 0,
      photo: null,
      is_available: true,
      order_index: localCategories[catIndex].items.length,
      _new: true,
      _dirty: true,
    };

    setLocalCategories((prev) =>
      prev.map((cat, i) =>
        i === catIndex ? { ...cat, items: [...cat.items, newItem] } : cat
      )
    );
    setHasChanges(true);
  }

  function updateItem(catIndex: number, itemIndex: number, field: keyof LocalItem, value: string | number | boolean | null) {
    setLocalCategories((prev) =>
      prev.map((cat, ci) => {
        if (ci !== catIndex) return cat;
        return {
          ...cat,
          items: cat.items.map((item, ii) =>
            ii === itemIndex ? { ...item, [field]: value, _dirty: true } : item
          ),
        };
      })
    );
    setHasChanges(true);
  }

  function deleteItem(catIndex: number, itemIndex: number) {
    setLocalCategories((prev) =>
      prev.map((cat, ci) => {
        if (ci !== catIndex) return cat;
        return {
          ...cat,
          items: cat.items.map((item, ii) =>
            ii === itemIndex ? { ...item, _deleted: true } : item
          ),
        };
      })
    );
    setHasChanges(true);
  }

  function moveItem(catIndex: number, itemIndex: number, direction: -1 | 1) {
    setLocalCategories((prev) =>
      prev.map((cat, ci) => {
        if (ci !== catIndex) return cat;
        const newItems = [...cat.items];
        const targetIndex = itemIndex + direction;
        if (targetIndex < 0 || targetIndex >= newItems.length) return cat;
        const temp = newItems[itemIndex];
        newItems[itemIndex] = newItems[targetIndex];
        newItems[targetIndex] = temp;
        return {
          ...cat,
          items: newItems.map((item, i) => ({ ...item, order_index: i })),
        };
      })
    );
    setHasChanges(true);
  }

  const isLoading = authLoading || loadingRestaurant || loadingCategories || loadingItems;

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F8F8F8] p-6 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <BuilderSkeleton />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F8F8F8]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl p-8 text-center">
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
            <h2 className="text-xl font-bold text-gray-800 mb-2">أنشئ ملف مطعمك أولاً</h2>
            <p className="text-gray-500 mb-6">
              تحتاج إلى إنشاء ملف مطعم قبل بناء القائمة
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

  const visibleCategories = localCategories.filter((cat) => !cat._deleted);

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8F8F8]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">بناء القائمة</h1>
          {hasChanges && (
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#e55a2b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </button>
          )}
        </div>

        {/* ADD CATEGORY BUTTON */}
        <button
          onClick={addCategory}
          className="w-full mb-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
        >
          + إضافة قسم
        </button>

        {/* CATEGORIES */}
        {visibleCategories.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-lg">أضف أقساماً لبناء قائمتك</p>
          </div>
        )}

        {localCategories.map((cat, catIndex) => {
          if (cat._deleted) return null;
          const visibleItems = cat.items.filter((item) => !item._deleted);

          return (
            <div key={cat.id} className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
              {/* Category Header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateCategoryName(catIndex, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent bg-white"
                  placeholder="اسم القسم"
                />
                <button
                  onClick={() => deleteCategory(catIndex)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="حذف القسم"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Items */}
              <div className="p-4 space-y-4">
                {visibleItems.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">لا توجد أطباق بعد</p>
                )}

                {cat.items.map((item, itemIndex) => {
                  if (item._deleted) return null;

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-100 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        {/* Photo preview */}
                        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                        <div className="flex-1 space-y-2">
                          <input
                            type="url"
                            value={item.photo ?? ""}
                            onChange={(e) => updateItem(catIndex, itemIndex, "photo", e.target.value || null)}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                            placeholder="رابط الصورة (اختياري)"
                            dir="ltr"
                          />

                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(catIndex, itemIndex, "name", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                            placeholder="اسم الطبق"
                          />

                          <textarea
                            value={item.description ?? ""}
                            onChange={(e) => updateItem(catIndex, itemIndex, "description", e.target.value || null)}
                            rows={2}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none"
                            placeholder="وصف الطبق (اختياري)"
                          />

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={item.price || ""}
                                onChange={(e) => updateItem(catIndex, itemIndex, "price", parseInt(e.target.value) || 0)}
                                className="w-28 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                                placeholder="السعر"
                                dir="ltr"
                              />
                              <span className="text-xs text-gray-500">دج</span>
                            </div>

                            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={item.is_available}
                                onChange={(e) => updateItem(catIndex, itemIndex, "is_available", e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                              />
                              متوفر
                            </label>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveItem(catIndex, itemIndex, -1)}
                            disabled={itemIndex === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="تحريك لأعلى"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveItem(catIndex, itemIndex, 1)}
                            disabled={itemIndex === visibleItems.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="تحريك لأسفل"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteItem(catIndex, itemIndex)}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            title="حذف الطبق"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add item button */}
                <button
                  onClick={() => addItem(catIndex)}
                  className="w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-gray-400 text-sm font-medium hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
                >
                  + إضافة طبق
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
