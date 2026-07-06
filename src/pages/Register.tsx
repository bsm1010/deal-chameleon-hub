import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type UserRole = "customer" | "owner";

export default function Register() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }

    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: selectedRole,
        },
      },
    });

    if (error) {
      toast.error(error.message || "فشل إنشاء الحساب. حاول مرة أخرى.");
      setLoading(false);
      return;
    }

    if (data.user) {
      if (selectedRole === "owner") {
        toast.success("تم إنشاء الحساب بنجاح! أكمل إعداد ملفك الشخصي.");
        navigate("/dashboard/profile");
      } else {
        toast.success("تم إنشاء الحساب بنجاح!");
        navigate("/");
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-full bg-[#FF6B35] flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-2xl font-bold text-[#1A1A2E]">Menuly</span>
        </Link>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#1A1A2E] text-center mb-6">
          إنشاء حساب جديد
        </h1>

        {/* Role selection cards */}
        {!selectedRole && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setSelectedRole("customer")}
              className="bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-3 hover:border-[#FF6B35] hover:shadow-md transition-all cursor-pointer group"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform">
                🍽️
              </span>
              <span className="text-sm font-semibold text-[#1A1A2E]">
                أنا زبون
              </span>
              <span className="text-xs text-gray-400">
                استكشف المطاعم والقوائم
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("owner")}
              className="bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-3 hover:border-[#FF6B35] hover:shadow-md transition-all cursor-pointer group"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform">
                👨‍🍳
              </span>
              <span className="text-sm font-semibold text-[#1A1A2E]">
                أنا صاحب مطعم
              </span>
              <span className="text-xs text-gray-400">
                أدر مطعمك وقوائمك
              </span>
            </button>
          </div>
        )}

        {/* Registration form */}
        {selectedRole && (
          <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 p-8">
            {/* Selected role badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 bg-orange-50 text-[#FF6B35] rounded-full px-3 py-1 text-xs font-semibold">
                <span>{selectedRole === "customer" ? "🍽️" : "👨‍🍳"}</span>
                <span>
                  {selectedRole === "customer" ? "حساب زبون" : "حساب صاحب مطعم"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                تغيير
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  الاسم الكامل
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors"
                  placeholder="محمد أمين"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  كلمة المرور
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  تأكيد كلمة المرور
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[12px] bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-semibold py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
              </button>
            </form>
          </div>
        )}

        {/* Login link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          لديك حساب بالفعل؟{" "}
          <Link
            to="/login"
            className="text-[#FF6B35] font-semibold hover:underline"
          >
            سجّل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
