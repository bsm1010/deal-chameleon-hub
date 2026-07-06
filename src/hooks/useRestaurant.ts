import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Restaurant, MenuCategory, MenuItem } from "@/types";

export function useOwnerRestaurant(userId: string | undefined) {
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

export function useMenuCategories(restaurantId: string | undefined) {
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

export function useMenuItems(restaurantId: string | undefined) {
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
