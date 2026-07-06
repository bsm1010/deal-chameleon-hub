import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Restaurant from "@/pages/Restaurant";
import City from "@/pages/City";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { ProtectedRoute, OwnerRoute } from "@/components/ProtectedRoute";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import RestaurantProfile from "@/pages/dashboard/RestaurantProfile";
import MenuBuilder from "@/pages/dashboard/MenuBuilder";

const queryClient = new QueryClient();

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/restaurant/:id" element={<PublicLayout><Restaurant /></PublicLayout>} />
            <Route path="/city/:city" element={<PublicLayout><City /></PublicLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <OwnerRoute>
                    <DashboardLayout />
                  </OwnerRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="profile" element={<RestaurantProfile />} />
              <Route path="menu" element={<MenuBuilder />} />
            </Route>
            <Route
              path="*"
              element={
                <PublicLayout>
                  <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-[#FF6B35] mb-4">404</h1>
                      <p className="text-gray-600 mb-4">الصفحة غير موجودة</p>
                      <a href="/" className="text-[#FF6B35] hover:underline">العودة للرئيسية</a>
                    </div>
                  </div>
                </PublicLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
