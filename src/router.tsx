import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";

const MoualimLanding = lazy(() => import("@/pages/moualim/Landing"));
const Browse = lazy(() => import("@/pages/moualim/Browse"));
const TutorProfile = lazy(() => import("@/pages/moualim/TutorProfile"));
const CourseDetail = lazy(() => import("@/pages/moualim/CourseDetail"));
const Login = lazy(() => import("@/pages/moualim/Login"));
const SignupStudent = lazy(() => import("@/pages/moualim/SignupStudent"));
const SignupTeacher = lazy(() => import("@/pages/moualim/SignupTeacher"));
const StudentDashboard = lazy(() => import("@/pages/moualim/StudentDashboard"));
const TeacherDashboard = lazy(() => import("@/pages/moualim/TeacherDashboard"));
const AdminDashboard = lazy(() => import("@/pages/moualim/AdminDashboard"));
const NotFound = lazy(() => import("@/pages/moualim/NotFound"));

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
  {
    path: "/",
    element: (
      <LazyPage>
        <MoualimLanding />
      </LazyPage>
    ),
  },
  {
    path: "/browse",
    element: (
      <LazyPage>
        <Browse />
      </LazyPage>
    ),
  },
  {
    path: "/tutor/:id",
    element: (
      <LazyPage>
        <TutorProfile />
      </LazyPage>
    ),
  },
  {
    path: "/course/:id",
    element: (
      <LazyPage>
        <CourseDetail />
      </LazyPage>
    ),
  },
  {
    path: "/login",
    element: (
      <LazyPage>
        <Login />
      </LazyPage>
    ),
  },
  {
    path: "/signup/student",
    element: (
      <LazyPage>
        <SignupStudent />
      </LazyPage>
    ),
  },
  {
    path: "/signup/teacher",
    element: (
      <LazyPage>
        <SignupTeacher />
      </LazyPage>
    ),
  },
  {
    path: "/dashboard/student",
    element: (
      <LazyPage>
        <StudentDashboard />
      </LazyPage>
    ),
  },
  {
    path: "/dashboard/teacher",
    element: (
      <LazyPage>
        <TeacherDashboard />
      </LazyPage>
    ),
  },
  {
    path: "/admin",
    element: (
      <LazyPage>
        <AdminDashboard />
      </LazyPage>
    ),
  },
  {
    path: "*",
    element: (
      <LazyPage>
        <NotFound />
      </LazyPage>
    ),
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
