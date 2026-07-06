import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/");
    setMobileOpen(false);
  }

  return (
    <nav dir="rtl" className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-1.5">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
            </svg>
            <span className="text-2xl font-bold text-[#FF6B35]">Menuly</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-[#1A1A2E] hover:text-[#FF6B35] transition-colors">الرئيسية</Link>
            <Link to="/" className="text-sm font-medium text-[#1A1A2E] hover:text-[#FF6B35] transition-colors">المطاعم</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm font-medium text-[#1A1A2E]">{profile?.full_name}</span>
                <Link to="/dashboard" className="text-sm font-medium text-[#1A1A2E] hover:text-[#FF6B35] transition-colors">لوحة التحكم</Link>
                <button onClick={handleLogout} className="text-sm font-medium text-[#1A1A2E] hover:text-[#FF6B35] transition-colors">تسجيل الخروج</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-[#1A1A2E] hover:text-[#FF6B35] transition-colors">تسجيل الدخول</Link>
                <Link to="/register" className="text-sm font-medium px-4 py-2 rounded-lg text-white bg-[#FF6B35] hover:opacity-90 transition-opacity">إنشاء حساب</Link>
              </>
            )}
          </div>

          <button className="md:hidden flex flex-col justify-center items-center w-10 h-10" onClick={() => setMobileOpen(!mobileOpen)}>
            <span className="block w-5 h-0.5 mb-1 bg-[#1A1A2E] transition-all" style={{ transform: mobileOpen ? "rotate(45deg) translate(2px, 2px)" : "none" }} />
            <span className="block w-5 h-0.5 mb-1 bg-[#1A1A2E] transition-all" style={{ opacity: mobileOpen ? 0 : 1 }} />
            <span className="block w-5 h-0.5 bg-[#1A1A2E] transition-all" style={{ transform: mobileOpen ? "rotate(-45deg) translate(2px, -2px)" : "none" }} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-2">
            <Link to="/" className="block text-sm font-medium py-2 text-[#1A1A2E] hover:text-[#FF6B35]" onClick={() => setMobileOpen(false)}>الرئيسية</Link>
            {user ? (
              <>
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <span className="block text-sm font-medium py-1 text-[#1A1A2E]">{profile?.full_name}</span>
                  <Link to="/dashboard" className="block text-sm font-medium py-2 text-[#1A1A2E] hover:text-[#FF6B35]" onClick={() => setMobileOpen(false)}>لوحة التحكم</Link>
                  <button onClick={handleLogout} className="block text-sm font-medium py-2 text-[#1A1A2E] hover:text-[#FF6B35]">تسجيل الخروج</button>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
                <Link to="/login" className="block text-sm font-medium py-2 text-[#1A1A2E] hover:text-[#FF6B35]" onClick={() => setMobileOpen(false)}>تسجيل الدخول</Link>
                <Link to="/register" className="block text-sm font-medium px-4 py-2 rounded-lg text-white text-center bg-[#FF6B35]" onClick={() => setMobileOpen(false)}>إنشاء حساب</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
