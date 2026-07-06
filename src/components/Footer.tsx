import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer dir="rtl" className="font-[Inter]" style={{ backgroundColor: "#1A1A2E", color: "#ffffff" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">

          {/* Logo + tagline */}
          <div className="max-w-xs">
            <span className="text-2xl font-bold" style={{ color: "#FF6B35" }}>
              Menuly
            </span>
            <p className="mt-3 text-sm leading-relaxed opacity-70">
              اكتشف أحسن المطاعم في الجزائر
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <Link
                to="/"
                className="text-sm opacity-70 transition-opacity hover:opacity-100"
              >
                الرئيسية
              </Link>
              <Link
                to="/restaurants"
                className="text-sm opacity-70 transition-opacity hover:opacity-100"
              >
                المطاعم
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="text-sm opacity-70 transition-opacity hover:opacity-100"
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/about"
                className="text-sm opacity-70 transition-opacity hover:opacity-100"
              >
               关于我们
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 text-center text-sm opacity-50"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          © 2026 Menuly. جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  );
}
