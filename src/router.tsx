import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const MoualimLanding = lazy(() => import("@/pages/moualim/Landing"));
const Browse = lazy(() => import("@/pages/Browse"));
const TutorProfile = lazy(() => import("@/pages/TutorProfile"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const CoursePlayer = lazy(() => import("@/pages/CoursePlayer"));
const Login = lazy(() => import("@/pages/auth/Login"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const SignupStudent = lazy(() => import("@/pages/auth/StudentSignup"));
const SignupTeacher = lazy(() => import("@/pages/auth/TeacherSignup"));
const Contact = lazy(() => import("@/pages/Contact"));
const PurchaseSuccess = lazy(() => import("@/pages/purchase/PurchaseSuccess"));
const PurchaseFailed = lazy(() => import("@/pages/purchase/PurchaseFailed"));
const NotFound = lazy(() => import("@/pages/moualim/NotFound"));

const StudentLayout = lazy(() => import("@/pages/dashboard/student/StudentLayout"));
const StudentDashboard = lazy(() => import("@/pages/dashboard/student/StudentDashboard"));
const StudentCourses = lazy(() => import("@/pages/dashboard/student/StudentCourses"));
const StudentSessions = lazy(() => import("@/pages/dashboard/student/StudentSessions"));
const StudentPurchases = lazy(() => import("@/pages/dashboard/student/StudentPurchases"));
const StudentSettings = lazy(() => import("@/pages/dashboard/student/StudentSettings"));

const TeacherLayout = lazy(() => import("@/pages/dashboard/teacher/TeacherLayout"));
const TeacherDashboard = lazy(() => import("@/pages/dashboard/teacher/TeacherDashboard"));
const TeacherCourses = lazy(() => import("@/pages/dashboard/teacher/TeacherCourses"));
const TeacherSchedule = lazy(() => import("@/pages/dashboard/teacher/TeacherSchedule"));
const TeacherEarnings = lazy(() => import("@/pages/dashboard/teacher/TeacherEarnings"));
const TeacherReviews = lazy(() => import("@/pages/dashboard/teacher/TeacherReviews"));
const TeacherProfileSettings = lazy(() => import("@/pages/dashboard/teacher/TeacherProfileSettings"));

const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminTeachers = lazy(() => import("@/pages/admin/AdminTeachers"));
const AdminPayouts = lazy(() => import("@/pages/admin/AdminPayouts"));
const AdminCourses = lazy(() => import("@/pages/admin/AdminCourses"));
const AdminNotifications = lazy(() => import("@/pages/admin/AdminNotifications"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Spinner size="lg" />
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  { path: "/", element: <LazyPage><MoualimLanding /></LazyPage> },
  { path: "/browse", element: <LazyPage><Browse /></LazyPage> },
  { path: "/tutor/:id", element: <LazyPage><TutorProfile /></LazyPage> },
  { path: "/course/:id", element: <LazyPage><CourseDetail /></LazyPage> },
  { path: "/course/:id/learn", element: <LazyPage><CoursePlayer /></LazyPage> },
  { path: "/login", element: <LazyPage><Login /></LazyPage> },
  { path: "/forgot-password", element: <LazyPage><ForgotPassword /></LazyPage> },
  { path: "/signup/student", element: <LazyPage><SignupStudent /></LazyPage> },
  { path: "/signup/teacher", element: <LazyPage><SignupTeacher /></LazyPage> },
  { path: "/contact", element: <LazyPage><Contact /></LazyPage> },
  { path: "/purchase/success", element: <LazyPage><PurchaseSuccess /></LazyPage> },
  { path: "/purchase/failed", element: <LazyPage><PurchaseFailed /></LazyPage> },
  {
    path: "/dashboard/student",
    element: <LazyPage><ProtectedRoute allowedRoles={["student"]}><StudentLayout /></ProtectedRoute></LazyPage>,
    children: [
      { index: true, element: <LazyPage><StudentDashboard /></LazyPage> },
      { path: "courses", element: <LazyPage><StudentCourses /></LazyPage> },
      { path: "sessions", element: <LazyPage><StudentSessions /></LazyPage> },
      { path: "purchases", element: <LazyPage><StudentPurchases /></LazyPage> },
      { path: "settings", element: <LazyPage><StudentSettings /></LazyPage> },
    ],
  },
  {
    path: "/dashboard/teacher",
    element: <LazyPage><ProtectedRoute allowedRoles={["teacher"]}><TeacherLayout /></ProtectedRoute></LazyPage>,
    children: [
      { index: true, element: <LazyPage><TeacherDashboard /></LazyPage> },
      { path: "courses", element: <LazyPage><TeacherCourses /></LazyPage> },
      { path: "schedule", element: <LazyPage><TeacherSchedule /></LazyPage> },
      { path: "earnings", element: <LazyPage><TeacherEarnings /></LazyPage> },
      { path: "reviews", element: <LazyPage><TeacherReviews /></LazyPage> },
      { path: "profile", element: <LazyPage><TeacherProfileSettings /></LazyPage> },
    ],
  },
  {
    path: "/admin",
    element: <LazyPage><ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute></LazyPage>,
    children: [
      { index: true, element: <LazyPage><AdminDashboard /></LazyPage> },
      { path: "teachers", element: <LazyPage><AdminTeachers /></LazyPage> },
      { path: "payouts", element: <LazyPage><AdminPayouts /></LazyPage> },
      { path: "courses", element: <LazyPage><AdminCourses /></LazyPage> },
      { path: "notifications", element: <LazyPage><AdminNotifications /></LazyPage> },
    ],
  },
  { path: "*", element: <LazyPage><NotFound /></LazyPage> },
]);

export default function AppRouter() {
  return <createBrowserRouter.Component router={router} />;
}
