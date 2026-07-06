import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerRestaurant, useMenuCategories, useMenuItems } from "@/hooks/useRestaurant";
import { supabase } from "@/lib/supabase";
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, GripIcon, StoreIcon, UtensilsIcon } from "@/lib/icons";
import type { MenuCategory, MenuItem } from "@/types";

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

export default function MenuBuilder() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading: loadingRestaurant } = useOwnerRestaurant(user?.id);
  const { data: remoteCategories, isLoading: loadingCategories } = useMenuCategories(restaurant?.id);
  const { data: remoteItems, isLoading: loadingItems } = useMenuItems(restaurant?.id);

  const [localCategories, setLocalCategories] = useState<LocalCategory[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedCat, setSelectedCat] = useState<number>(0);
  const [editingItem, setEditingItem] = useState<{ catIndex: number; itemIndex: number } | null>(null);

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
            .from("menu_categories").insert({ restaurant_id: restaurant.id, name: cat.name, order_index: cat.order_index }).select().single();
          if (catErr) throw catErr;
          catId = newCat.id;
        } else {
          await supabase.from("menu_categories").update({ name: cat.name, order_index: cat.order_index }).eq("id", cat.id);
        }
        for (const item of cat.items) {
          if (item._deleted) {
            if (!item._new) await supabase.from("menu_items").delete().eq("id", item.id);
            continue;
          }
          const payload = {
            category_id: catId, restaurant_id: restaurant.id, name: item.name,
            description: item.description || null, price: item.price, photo: item.photo || null,
            is_available: item.is_available, order_index: item.order_index,
          };
          if (item._new) {
            const { error } = await supabase.from("menu_items").insert(payload);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("menu_items").update(payload).eq("id", item.id);
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
    onError: () => toast.error("حدث خطأ أثناء الحفظ"),
  });

  function addCategory() {
    const name = prompt("اسم القسم الجديد:");
    if (!name?.trim()) return;
    setLocalCategories((prev) => [...prev, {
      id: `new-${Date.now()}`, restaurant_id: restaurant?.id ?? "",
      name: name.trim(), order_index: prev.length, _new: true, items: [],
    }]);
    setHasChanges(true);
  }

  function deleteCategory(catIndex: number) {
    if (!confirm("هل أنت متأكد من حذف هذا القسم وجميع أطباقه؟")) return;
    setLocalCategories((prev) => prev.map((cat, i) => i === catIndex ? { ...cat, _deleted: true } : cat));
    setHasChanges(true);
  }

  function updateCategoryName(catIndex: number, name: string) {
    setLocalCategories((prev) => prev.map((cat, i) => i === catIndex ? { ...cat, name } : cat));
    setHasChanges(true);
  }

  function moveCategory(catIndex: number, dir: -1 | 1) {
    setLocalCategories((prev) => {
      const arr = [...prev];
      const target = catIndex + dir;
      if (target < 0 || target >= arr.length) return prev;
      const temp = arr[catIndex];
      arr[catIndex] = arr[target];
      arr[target] = temp;
      return arr.map((c, i) => ({ ...c, order_index: i }));
    });
    setHasChanges(true);
  }

  function addItem(catIndex: number) {
    const newItem: LocalItem = {
      id: `new-${Date.now()}`, category_id: localCategories[catIndex].id,
      restaurant_id: restaurant?.id ?? "", name: "", description: null,
      price: 0, photo: null, is_available: true,
      order_index: localCategories[catIndex].items.length, _new: true, _dirty: true,
    };
    setLocalCategories((prev) => prev.map((cat, i) =>
      i === catIndex ? { ...cat, items: [...cat.items, newItem] } : cat
    ));
    setHasChanges(true);
    setEditingItem({ catIndex, itemIndex: localCategories[catIndex].items.length });
  }

  function updateItem(catIndex: number, itemIndex: number, field: keyof LocalItem, value: string | number | boolean | null) {
    setLocalCategories((prev) => prev.map((cat, ci) => {
      if (ci !== catIndex) return cat;
      return { ...cat, items: cat.items.map((item, ii) => ii === itemIndex ? { ...item, [field]: value, _dirty: true } : item) };
    }));
    setHasChanges(true);
  }

  function deleteItem(catIndex: number, itemIndex: number) {
    if (!confirm("هل أنت متأكد من حذف هذا الطبق؟")) return;
    setLocalCategories((prev) => prev.map((cat, ci) => {
      if (ci !== catIndex) return cat;
      return { ...cat, items: cat.items.map((item, ii) => ii === itemIndex ? { ...item, _deleted: true } : item) };
    }));
    setEditingItem(null);
    setHasChanges(true);
  }

  function moveItem(catIndex: number, itemIndex: number, dir: -1 | 1) {
    setLocalCategories((prev) => prev.map((cat, ci) => {
      if (ci !== catIndex) return cat;
      const items = [...cat.items];
      const target = itemIndex + dir;
      if (target < 0 || target >= items.length) return cat;
      [items[itemIndex], items[target]] = [items[target], items[itemIndex]];
      return { ...cat, items: items.map((item, i) => ({ ...item, order_index: i })) };
    }));
    setHasChanges(true);
  }

  const isLoading = authLoading || loadingRestaurant || loadingCategories || loadingItems;

  if (isLoading) {
    return <div className="space-y-6"><div className="h-8 bg-gray-200 rounded w-40 animate-pulse" /><div className="bg-white rounded-xl h-64 animate-pulse" /></div>;
  }

  if (!restaurant) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center max-w-lg mx-auto mt-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-orange-50 rounded-full flex items-center justify-center">
          <StoreIcon className="h-10 w-10 text-[#FF6B35]" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">أنشئ ملف مطعمك أولاً</h2>
        <p className="text-gray-500 mb-6">تحتاج إلى إنشاء ملف مطعم قبل بناء القائمة</p>
        <Link to="/dashboard/profile" className="inline-block px-8 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#e55a2b] transition-colors">
          إنشاء ملف المطعم
        </Link>
      </div>
    );
  }

  const visibleCategories = localCategories.filter((cat) => !cat._deleted);
  const activeCat = visibleCategories[selectedCat];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">قائمتي</h1>
        {hasChanges && (
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
            className="px-6 py-2.5 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#e55a2b] transition-colors disabled:opacity-50 text-sm">
            {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
          </button>
        )}
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Left: Categories */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-2">
          <button onClick={addCategory} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors text-sm flex items-center justify-center gap-2">
            <PlusIcon className="h-4 w-4" />
            إضافة قسم
          </button>
          {visibleCategories.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">أضف أقساماً لبناء قائمتك</div>
          )}
          {visibleCategories.map((cat, vi) => {
            const realIndex = localCategories.indexOf(cat);
            const isActive = vi === selectedCat;
            const visibleItemCount = cat.items.filter((i) => !i._deleted).length;
            return (
              <div key={cat.id} className={`flex items-center gap-1 p-3 rounded-xl cursor-pointer transition-colors ${isActive ? "bg-[#FF6B35] text-white" : "bg-white text-[#1A1A2E] hover:bg-gray-50"}`} onClick={() => setSelectedCat(vi)}>
                <GripIcon className="h-4 w-4 flex-shrink-0 opacity-40" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{cat.name}</p>
                  <p className="text-xs opacity-60">{visibleItemCount} طبق</p>
                </div>
                <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => moveCategory(realIndex, -1)} className="p-0.5 opacity-40 hover:opacity-100"><ChevronUpIcon className="h-3 w-3" /></button>
                  <button onClick={() => moveCategory(realIndex, 1)} className="p-0.5 opacity-40 hover:opacity-100"><ChevronDownIcon className="h-3 w-3" /></button>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteCategory(realIndex); }} className="p-1 opacity-40 hover:opacity-100">
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right: Items */}
        <div className="flex-1 space-y-4">
          {activeCat ? (
            <>
              <div className="flex items-center gap-3">
                <input type="text" value={activeCat.name}
                  onChange={(e) => {
                    const realIndex = localCategories.indexOf(activeCat);
                    updateCategoryName(realIndex, e.target.value);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeCat.items.filter((i) => !i._deleted).map((item) => {
                  const realItemIndex = activeCat.items.indexOf(item);
                  const realCatIndex = localCategories.indexOf(activeCat);
                  const isEditing = editingItem?.catIndex === realCatIndex && editingItem?.itemIndex === realItemIndex;
                  return (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="h-40 bg-gray-100 relative">
                        {item.photo ? (
                          <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" /><circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5" /><polyline points="21 15 16 10 5 21" strokeWidth="1.5" /></svg>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1">
                          <button onClick={() => moveItem(realCatIndex, realItemIndex, -1)} disabled={realItemIndex === 0} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center disabled:opacity-30"><ChevronUpIcon className="h-3.5 w-3.5" /></button>
                          <button onClick={() => moveItem(realCatIndex, realItemIndex, 1)} disabled={realItemIndex === activeCat.items.filter((i) => !i._deleted).length - 1} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center disabled:opacity-30"><ChevronDownIcon className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button onClick={() => setEditingItem(isEditing ? null : { catIndex: realCatIndex, itemIndex: realItemIndex })} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-[#FF6B35]">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button onClick={() => deleteItem(realCatIndex, realItemIndex)} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-red-500">
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {!item.is_available && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">غير متوفر</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-[#1A1A2E]">{item.name || "بدون اسم"}</h3>
                            {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                          </div>
                          <span className="text-[#FF6B35] font-bold text-sm">{item.price} دج</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => addItem(localCategories.indexOf(activeCat))}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors text-sm flex items-center justify-center gap-2">
                <PlusIcon className="h-4 w-4" />
                إضافة طبق
              </button>
            </>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400">
              <UtensilsIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">اختر قسماً من القائمة اليمنى</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Item Modal */}
      {editingItem && (() => {
        const cat = localCategories[editingItem.catIndex];
        const item = cat?.items[editingItem.itemIndex];
        if (!cat || !item || item._deleted) return null;
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingItem(null)}>
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#1A1A2E]">تعديل الطبق</h2>
                  <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">رابط الصورة</label>
                  <input type="url" value={item.photo ?? ""} onChange={(e) => updateItem(editingItem.catIndex, editingItem.itemIndex, "photo", e.target.value || null)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" placeholder="https://..." dir="ltr" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">اسم الطبق <span className="text-red-500">*</span></label>
                  <input type="text" value={item.name} onChange={(e) => updateItem(editingItem.catIndex, editingItem.itemIndex, "name", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" placeholder="اسم الطبق" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">الوصف</label>
                  <textarea value={item.description ?? ""} onChange={(e) => updateItem(editingItem.catIndex, editingItem.itemIndex, "description", e.target.value || null)} rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] resize-none" placeholder="وصف الطبق..." />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">السعر (دج) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" value={item.price || ""} onChange={(e) => updateItem(editingItem.catIndex, editingItem.itemIndex, "price", parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" placeholder="0" dir="ltr" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div className={`relative w-11 h-6 rounded-full transition-colors ${item.is_available ? "bg-green-500" : "bg-gray-300"}`}
                        onClick={() => updateItem(editingItem.catIndex, editingItem.itemIndex, "is_available", !item.is_available)}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.is_available ? "right-0.5" : "right-5.5"}`} style={{ right: item.is_available ? "2px" : "22px" }} />
                      </div>
                      <span className="text-sm text-gray-700">{item.is_available ? "متوفر" : "غير متوفر"}</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditingItem(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm">
                    إلغاء
                  </button>
                  <button onClick={() => setEditingItem(null)} className="flex-1 py-2.5 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#e55a2b] transition-colors text-sm">
                    تم
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
