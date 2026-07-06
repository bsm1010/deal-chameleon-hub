import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerRestaurant } from "@/hooks/useRestaurant";
import { supabase } from "@/lib/supabase";
import { StarIcon, ReplyIcon, ArrowUpDownIcon } from "@/lib/icons";
import type { Review, ReviewReply } from "@/types";

function useReviews(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });
      return (data ?? []) as Review[];
    },
    enabled: !!restaurantId,
  });
}

function useReviewReplies(reviewIds: string[]) {
  return useQuery({
    queryKey: ["review-replies", reviewIds],
    queryFn: async () => {
      if (reviewIds.length === 0) return {};
      const { data } = await supabase
        .from("review_replies")
        .select("*")
        .in("review_id", reviewIds);
      const grouped: Record<string, ReviewReply[]> = {};
      (data ?? []).forEach((r) => {
        if (!grouped[r.review_id]) grouped[r.review_id] = [];
        grouped[r.review_id].push(r);
      });
      return grouped;
    },
    enabled: reviewIds.length > 0,
  });
}

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <StarIcon key={s} className={`${cls} ${s <= rating ? "text-yellow-400" : "text-gray-200"}`} filled={s <= rating} />
      ))}
    </div>
  );
}

export default function Reviews() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: restaurant } = useOwnerRestaurant(user?.id);
  const { data: reviews = [] } = useReviews(restaurant?.id);

  const reviewIds = useMemo(() => reviews.map((r) => r.id), [reviews]);
  const { data: repliesMap = {} } = useReviewReplies(reviewIds);

  const [filter, setFilter] = useState<"all" | "5" | "4" | "3">("all");
  const [sort, setSort] = useState<"newest" | "highest" | "lowest">("newest");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const replyMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!replyText.trim()) throw new Error("الرد مطلوب");
      const { error } = await supabase.from("review_replies").insert({
        review_id: reviewId, owner_name: user?.user_metadata?.full_name || "المالك", reply: replyText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إرسال الرد");
      setReplyingTo(null);
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["review-replies", reviewIds] });
    },
    onError: () => toast.error("حدث خطأ أثناء إرسال الرد"),
  });

  const avgRating = reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;

  let filtered = [...reviews];
  if (filter === "5") filtered = filtered.filter((r) => r.rating === 5);
  else if (filter === "4") filtered = filtered.filter((r) => r.rating === 4);
  else if (filter === "3") filtered = filtered.filter((r) => r.rating <= 3);

  if (sort === "newest") filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  else if (sort === "highest") filtered.sort((a, b) => b.rating - a.rating);
  else if (sort === "lowest") filtered.sort((a, b) => a.rating - b.rating);

  if (!restaurant) {
    return <div className="bg-white rounded-2xl p-8 text-center text-gray-500">أنشئ ملف مطعمك أولاً</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-[#1A1A2E]">التقييمات</h1>

      {/* Average */}
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-[#1A1A2E]">{avgRating || "—"}</p>
          <StarDisplay rating={Math.round(avgRating)} />
          <p className="text-xs text-gray-500 mt-1">{reviews.length} تقييم</p>
        </div>
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500 w-4">{star}</span>
                <StarIcon className="h-3 w-3 text-yellow-400" filled />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-6 text-left">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
          {(["all", "5", "4", "3"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${filter === f ? "bg-[#FF6B35] text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              {f === "all" ? "الكل" : f === "3" ? "3 وأقل" : `${f} نجوم`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ArrowUpDownIcon className="h-4 w-4" />
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]">
            <option value="newest">الأحدث</option>
            <option value="highest">الأعلى تقييماً</option>
            <option value="lowest">الأدنى تقييماً</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">
          <StarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{reviews.length === 0 ? "لا توجد تقييمات بعد" : "لا توجد تقييمات تطابق الفلتر"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => {
            const replies = repliesMap[review.id] || [];
            return (
              <div key={review.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35] font-bold text-sm">
                      {review.customer_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1A1A2E]">{review.customer_name}</p>
                      <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" })}</p>
                    </div>
                  </div>
                  <StarDisplay rating={review.rating} size="sm" />
                </div>

                {review.comment && <p className="text-sm text-gray-700 mb-3">{review.comment}</p>}

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-3">
                    {replies.map((reply) => (
                      <div key={reply.id}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[#FF6B35]">{reply.owner_name}</span>
                          <span className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleDateString("ar-DZ")}</span>
                        </div>
                        <p className="text-sm text-gray-700">{reply.reply}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === review.id ? (
                  <div className="flex gap-2">
                    <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                      placeholder="اكتب ردك..."
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                      onKeyDown={(e) => { if (e.key === "Enter") replyMutation.mutate(review.id); }} />
                    <button onClick={() => replyMutation.mutate(review.id)} disabled={replyMutation.isPending}
                      className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-bold hover:bg-[#e55a2b] disabled:opacity-50">
                      إرسال
                    </button>
                    <button onClick={() => { setReplyingTo(null); setReplyText(""); }}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setReplyingTo(review.id); setReplyText(""); }}
                    className="flex items-center gap-1.5 text-xs text-[#FF6B35] hover:text-[#e55a2b] font-medium">
                    <ReplyIcon className="h-3.5 w-3.5" /> رد
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
