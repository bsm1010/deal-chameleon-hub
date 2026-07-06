import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  HomeIcon, UtensilsIcon, StoreIcon, BarChartIcon, StarIcon,
  QrCodeIcon, SettingsIcon, LogOutIcon, BellIcon,
} from "@/lib/icons";

const sidebarItems = [
  { to: "/dashboard", icon: HomeIcon, label: "نظرة عامة", exact: true },
  { to: "/dashboard/menu", icon: UtensilsIcon, label: "قائمتي" },
  { to: "/dashboard/profile", icon: StoreIcon, label: "ملف المطعم" },
  { to: "/dashboard/analytics", icon: BarChartIcon, label: "الإحصائيات" },
  { to: "/dashboard/reviews", icon: StarIcon, label: "التقييمات" },
  { to: "/dashboard/qrcode", icon: QrCodeIcon, label: "رمز QR" },
  { to: "/dashboard/settings", icon: SettingsIcon, label: "الإعدادات" },
];

const mobileBottomItems = [
  { to: "/dashboard", icon: HomeIcon, label: "الرئيسية", exact: true },
  { to: "/dashboard/menu", icon: UtensilsIcon, label: "القائمة" },
  { to: "/dashboard/analytics", icon: BarChartIcon, label: "الإحصائيات" },
  { to: "/dashboard/reviews", icon: StarIcon, label: "التقييمات" },
  { to: "/dashboard/settings", icon: SettingsIcon, label: "إعدادات" },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "نظرة عامة",
  "/dashboard/menu": "قائمتي",
  "/dashboard/profile": "ملف المطعم",
  "/dashboard/analytics": "الإحصائيات",
  "/dashboard/reviews": "التقييمات",
  "/dashboard/qrcode": "رمز QR",
  "/dashboard/settings": "الإعدادات",
};

export default function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const basePath = "/" + (location.pathname.split("/").filter(Boolean)[1] ?? "");
  const pageTitle = pageTitles[basePath] || pageTitles[location.pathname] || "لوحة التحكم";

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col md:flex-row" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex lg:flex w-64 bg-[#1A1A2E] text-white flex-col fixed inset-y-0 right-0 z-30">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="text-xl font-bold text-[#FF6B35]">Menuly</Link>
          <p className="text-xs text-gray-400 mt-1 truncate">{profile?.full_name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && location.pathname !== "/dashboard";
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  active ? "bg-[#FF6B35] text-white" : "text-gray-300 hover:bg-white/10"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 w-full text-sm font-medium"
          >
            <LogOutIcon className="h-5 w-5 flex-shrink-0" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-[#1A1A2E] text-white h-14 flex items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold text-[#FF6B35]">Menuly</Link>
        <div className="flex items-center gap-3">
          <button className="relative p-2">
            <BellIcon className="h-5 w-5 text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B35] rounded-full" />
          </button>
          {profile?.full_name && (
            <span className="text-xs text-gray-300 max-w-[80px] truncate">{profile.full_name}</span>
          )}
          {profile?.full_name && (
            <div className="w-8 h-8 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-xs font-bold">
              {profile.full_name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 h-16">
        <div className="flex items-center justify-around h-full px-2">
          {mobileBottomItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && location.pathname !== "/dashboard";
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                  active ? "text-[#FF6B35]" : "text-gray-400"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 md:mr-64">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-gray-100 h-16 px-6 sticky top-0 z-20">
          <h1 className="text-lg font-bold text-[#1A1A2E]">{pageTitle}</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <BellIcon className="h-5 w-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF6B35] rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              {profile?.full_name && (
                <span className="text-sm font-medium text-[#1A1A2E]">{profile.full_name}</span>
              )}
              {profile?.full_name && (
                <div className="w-9 h-9 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-sm font-bold">
                  {profile.full_name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="md:hidden h-14" />

        {/* Page Content */}
        <main className="p-4 sm:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
