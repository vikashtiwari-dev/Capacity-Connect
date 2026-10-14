import React, { useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { purgeLocalDeviceData } from "./utils/purgeLocalStorage";
import { useAuthStore } from "./store/authStore";
import { useNotificationsStore } from "./store/notificationsStore";
import { useCoursesStore } from "./store/coursesStore";
import { useAssessmentsStore } from "./store/assessmentsStore";
import { useUsersStore } from "./store/usersStore";
import { useLiveSessionsStore } from "./store/liveSessionsStore";
import { useAttendanceStore } from "./store/attendanceStore";
import { useAuditStore } from "./store/auditStore";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

// ── Lazy-loaded Public Pages ─────────────────────────────────────
const HomePage = React.lazy(() => import("./pages/public/HomePage").then(m => ({ default: m.HomePage })));
const LoginPage = React.lazy(() => import("./pages/public/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import("./pages/public/RegisterPage").then(m => ({ default: m.RegisterPage })));
const VerifyIdentityPage = React.lazy(() => import("./pages/public/VerifyIdentityPage").then(m => ({ default: m.VerifyIdentityPage })));
const NotFoundPage = React.lazy(() => import("./pages/public/NotFoundPage").then(m => ({ default: m.NotFoundPage })));

// ── Lazy-loaded Trainee Pages ─────────────────────────────────────
const TraineeDashboard = React.lazy(() => import("./pages/trainee/TraineeDashboard").then(m => ({ default: m.TraineeDashboard })));
const TraineeProfile = React.lazy(() => import("./pages/trainee/TraineeProfile").then(m => ({ default: m.TraineeProfile })));
const CourseCatalog = React.lazy(() => import("./pages/trainee/CourseCatalog").then(m => ({ default: m.CourseCatalog })));
const CourseDetail = React.lazy(() => import("./pages/trainee/CourseDetail").then(m => ({ default: m.CourseDetail })));
const Assessments = React.lazy(() => import("./pages/trainee/Assessments").then(m => ({ default: m.Assessments })));
const TakeAssessment = React.lazy(() => import("./pages/trainee/TakeAssessment").then(m => ({ default: m.TakeAssessment })));
const Certificates = React.lazy(() => import("./pages/trainee/Certificates").then(m => ({ default: m.Certificates })));
const FeedbackPage = React.lazy(() => import("./pages/trainee/Feedback").then(m => ({ default: m.FeedbackPage })));
const TraineeLiveClasses = React.lazy(() => import("./pages/trainee/TraineeLiveClasses").then(m => ({ default: m.TraineeLiveClasses })));

// ── Lazy-loaded Trainer Pages ─────────────────────────────────────
const TrainerDashboard = React.lazy(() => import("./pages/trainer/TrainerDashboard"));
const TrainerProfile = React.lazy(() => import("./pages/trainer/TrainerProfile"));
const TrainerLibrary = React.lazy(() => import("./pages/trainer/TrainerLibrary"));
const Questionnaires = React.lazy(() => import("./pages/trainer/Questionnaires"));
const TrainerReports = React.lazy(() => import("./pages/trainer/TrainerReports"));
const TrainerCourses = React.lazy(() => import("./pages/trainer/TrainerCourses"));
const TrainerLiveClasses = React.lazy(() => import("./pages/trainer/TrainerLiveClasses").then(m => ({ default: m.TrainerLiveClasses })));

// ── Lazy-loaded Admin Pages ───────────────────────────────────────
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = React.lazy(() => import("./pages/admin/UserManagement"));
const CourseManagement = React.lazy(() => import("./pages/admin/CourseManagement"));
const CompetencyMapping = React.lazy(() => import("./pages/admin/CompetencyMapping"));
const AdminNotifications = React.lazy(() => import("./pages/admin/AdminNotifications"));
const AdminReports = React.lazy(() => import("./pages/admin/AdminReports"));
const AdminProfile = React.lazy(() => import("./pages/admin/AdminProfile"));

// ── Full-screen loading spinner shown while a lazy chunk is loading ──
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const { loadFromStorage, verifyCurrentSession } = useAuthStore();
  const { load: loadNotifications } = useNotificationsStore();
  const { load: loadCourses } = useCoursesStore();
  const { load: loadAssessments } = useAssessmentsStore();
  const { load: loadUsers } = useUsersStore();
  const { load: loadLiveSessions } = useLiveSessionsStore();
  const { load: loadAttendance } = useAttendanceStore();
  const { load: loadAuditLogs } = useAuditStore();

  useEffect(() => {
    // Purge local mock and device storage cache so platform is 100% cloud-driven
    purgeLocalDeviceData();

    loadFromStorage();
    loadNotifications();
    loadCourses();
    loadAssessments();
    loadUsers();
    loadLiveSessions();
    loadAttendance();
    loadAuditLogs();

    // Cross-tab session eviction listener (for multi-tab / cross-window sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cc_session_eviction" && e.newValue) {
        try {
          const { userId, email } = JSON.parse(e.newValue);
          const current = useAuthStore.getState().currentUser;
          if (
            current &&
            (current.id === userId || (email && current.email?.toLowerCase() === email.toLowerCase()))
          ) {
            useAuthStore.getState().logout();
            window.location.href = "/login?removed=true";
          }
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorage);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel("cc_auth_channel");
        bc.onmessage = (msg) => {
          if (msg.data?.type === "SESSION_EVICTED") {
            const current = useAuthStore.getState().currentUser;
            if (
              current &&
              (current.id === msg.data.userId || (msg.data.email && current.email?.toLowerCase() === msg.data.email.toLowerCase()))
            ) {
              useAuthStore.getState().logout();
              window.location.href = "/login?removed=true";
            }
          }
        };
      } catch (err) {}
    }

    // Tab focus re-verification: verify account hasn't been revoked while tab was in background
    const handleFocus = () => {
      verifyCurrentSession();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      if (bc) bc.close();
    };
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify/id" element={<VerifyIdentityPage />} />
          <Route path="/auth/qr" element={<VerifyIdentityPage />} />

          {/* Role Short Aliases */}
          <Route path="/trainee" element={<Navigate to="/trainee/dashboard" replace />} />
          <Route path="/trainer" element={<Navigate to="/trainer/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Trainee Routes */}
          <Route path="/trainee/dashboard" element={
            <ProtectedRoute allowedRoles={["trainee"]}>
              <TraineeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/trainee/live-classes" element={
            <ProtectedRoute allowedRoles={["trainee"]}>
              <TraineeLiveClasses />
            </ProtectedRoute>
          } />
          <Route path="/trainee/profile" element={
            <ProtectedRoute allowedRoles={["trainee"]}>
              <TraineeProfile />
            </ProtectedRoute>
          } />
          {/* Course Catalog (Publicly browseable by all visitors; login required to watch/enroll) */}
          <Route path="/courses" element={<CourseCatalog />} />
          <Route path="/trainee/courses" element={<CourseCatalog />} />

          {/* Watch Course / Lecture Studio (Protected — requires login) */}
          <Route path="/trainee/course/:id" element={
            <ProtectedRoute allowedRoles={["trainee"]}>
              <CourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/trainee/library" element={
            <ProtectedRoute allowedRoles={["trainee", "trainer", "admin"]}>
              <TrainerLibrary />
            </ProtectedRoute>
          } />
          <Route path="/trainee/assessments" element={
            <ProtectedRoute allowedRoles={["trainee"]}>
              <Assessments />
            </ProtectedRoute>
          } />
          <Route path="/trainee/assessment/:id" element={
            <ProtectedRoute allowedRoles={["trainee"]}>
              <TakeAssessment />
            </ProtectedRoute>
          } />
          <Route path="/trainee/certificates" element={
            <ProtectedRoute allowedRoles={["trainee"]}>
              <Certificates />
            </ProtectedRoute>
          } />
          <Route path="/trainee/feedback" element={
            <ProtectedRoute allowedRoles={["trainee"]}>
              <FeedbackPage />
            </ProtectedRoute>
          } />

          {/* Trainer Routes */}
          <Route path="/trainer/dashboard" element={
            <ProtectedRoute allowedRoles={["trainer"]}>
              <TrainerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/trainer/live-classes" element={
            <ProtectedRoute allowedRoles={["trainer"]}>
              <TrainerLiveClasses />
            </ProtectedRoute>
          } />
          <Route path="/trainer/profile" element={
            <ProtectedRoute allowedRoles={["trainer"]}>
              <TrainerProfile />
            </ProtectedRoute>
          } />
          <Route path="/trainer/courses" element={
            <ProtectedRoute allowedRoles={["trainer"]}>
              <TrainerCourses />
            </ProtectedRoute>
          } />
          <Route path="/trainer/library" element={
            <ProtectedRoute allowedRoles={["trainer"]}>
              <TrainerLibrary />
            </ProtectedRoute>
          } />
          <Route path="/trainer/questionnaires" element={
            <ProtectedRoute allowedRoles={["trainer"]}>
              <Questionnaires />
            </ProtectedRoute>
          } />
          <Route path="/trainer/reports" element={
            <ProtectedRoute allowedRoles={["trainer"]}>
              <TrainerReports />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/courses" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CourseManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/competency" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CompetencyMapping />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminNotifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminProfile />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminReports />
            </ProtectedRoute>
          } />

          {/* Zero-404 Fault-Tolerant Wildcard Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <SpeedInsights />
    </BrowserRouter>
  );
}

export default App;
