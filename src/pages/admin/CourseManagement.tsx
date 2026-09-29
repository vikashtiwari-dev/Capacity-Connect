import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Shield, Trash2, Star, MessageSquare, Filter, AlertTriangle, Plus, X, Video, FileText, Clock, Eye, Check } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useCoursesStore } from "../../store/coursesStore";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";
import { useNotificationsStore } from "../../store/notificationsStore";
import { formatCourseDuration } from "../../utils/courseDuration";
import { CourseCategory, CourseLesson, Resource } from "../../types";
import { isProtectedProductionCourse, isRealAdmin, PRIMARY_ADMIN_EMAIL } from "../../utils/demoMode";

const ADMIN_THUMBNAIL_PRESETS = [
  { label: "Computer Science & IT", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80" },
  { label: "AI & Machine Learning", url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80" },
  { label: "MoES/IMD Satellite Meteorology", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80" },
  { label: "Ocean State Forecasting", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80" },
  { label: "Cloud & Distributed Systems", url: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80" },
  { label: "Cybersecurity & Governance", url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80" },
  { label: "Public Administration & Leadership", url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80" },
];

export const CourseManagement: React.FC = () => {
  const { courses, addCourse, updateCourse, deleteCourse, feedbacks, deleteFeedback, enrollments } = useCoursesStore();
  const { addToast } = useAppStore();
  const { addNotification } = useNotificationsStore();
  const { currentUser } = useAuthStore();
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending_approval" | "active">("all");

  // Create Course Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CourseCategory>("Technical");
  const [duration, setDuration] = useState("0 Mins");
  const [modulesCount, setModulesCount] = useState<number | "">("");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [trainerName, setTrainerName] = useState(currentUser?.name || "MoES Platform Admin");
  const [thumbnailUrl, setThumbnailUrl] = useState(ADMIN_THUMBNAIL_PRESETS[0].url);
  const [initialVideoUrl, setInitialVideoUrl] = useState("");
  const [initialVideoTitle, setInitialVideoTitle] = useState("");
  const [initialVideoDuration, setInitialVideoDuration] = useState("20 Mins");

  // Permanent course deletion state
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  const handleAdminCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingCourse) return;
    if (!title.trim()) return;

    setIsSubmittingCourse(true);
    const courseId = "c-" + Date.now();
    const courseTitle = title.trim();
    const modNum = typeof modulesCount === "number" && modulesCount > 0 ? modulesCount : undefined;
    const baseDuration = duration.trim() || "0 Mins";
    const initialDuration = modNum ? `${baseDuration} • ${modNum} Modules` : baseDuration;

    const initialLessons: CourseLesson[] = [];
    const initialResources: Resource[] = [];

    if (initialVideoUrl.trim()) {
      const lessonTitleClean = initialVideoTitle.trim() || "Module 1: Orientation & Foundations";
      let videoId = `v-${Date.now()}`;
      const ytMatch = initialVideoUrl.match(/(?:youtu\.be\/|watch\?v=|embed\/)([^#&?]{11})/);
      if (ytMatch && ytMatch[1]) {
        videoId = ytMatch[1];
      }

      const isDrive = initialVideoUrl.includes("drive.google.com");
      const isYt = !isDrive && (initialVideoUrl.includes("youtube.com") || initialVideoUrl.includes("youtu.be"));

      const firstLesson: CourseLesson = {
        id: `lesson-${Date.now()}-1`,
        lessonNumber: 1,
        title: lessonTitleClean,
        duration: initialVideoDuration.trim() || "20 Mins",
        youtubeUrl: initialVideoUrl.trim(),
        videoId,
        videoSource: isDrive ? "drive" : isYt ? "youtube" : "url",
        description: "Official introductory lecture approved by Platform Administration."
      };
      initialLessons.push(firstLesson);

      initialResources.push({
        id: "res-admin-video-" + Date.now(),
        courseId,
        title: `${firstLesson.title} (Video Lecture)`,
        type: "video",
        url: initialVideoUrl.trim(),
        uploadedAt: new Date().toISOString(),
        uploadedBy: trainerName,
        description: "Official course video lecture"
      });
    }

    const courseStatus = isRealAdmin(currentUser) ? "active" : "pending_approval";

    addCourse({
      id: courseId,
      title: courseTitle,
      description,
      category,
      duration: initialLessons.length > 0 ? initialVideoDuration.trim() || initialDuration : initialDuration,
      modules: modNum || (initialLessons.length > 0 ? 1 : undefined),
      level,
      status: courseStatus,
      trainerId: currentUser?.id || "admin-root",
      trainerName: trainerName.trim() || "MoES Platform Administration",
      thumbnail: thumbnailUrl.trim() || ADMIN_THUMBNAIL_PRESETS[0].url,
      createdAt: new Date().toISOString(),
      tags: [category, level, "Official Government Curriculum"],
      resources: initialResources,
      lessons: initialLessons
    });

    if (courseStatus === "active") {
      addNotification({
        title: `New Official Course: ${courseTitle}`,
        content: `Platform Administration has published a new certified ${category} program: "${courseTitle}".`,
        type: "new_content",
        pinned: true,
        author: trainerName.trim() || "MoES Administration"
      });
      addToast({
        title: "Course Curriculum Published",
        message: `"${courseTitle}" is now live in the global trainee catalog.`,
        type: "success"
      });
    } else {
      addNotification({
        title: `Sandbox Course Submitted: ${courseTitle}`,
        content: `A course submission "${courseTitle}" was created and awaits verification by Primary Admin (${PRIMARY_ADMIN_EMAIL}).`,
        type: "announcement",
        pinned: false,
        author: "Course Moderation Queue"
      });
      addToast({
        title: "Curriculum Submitted for Review",
        message: `"${courseTitle}" was created in Sandbox. It requires verification by the Primary Admin (${PRIMARY_ADMIN_EMAIL}) before publishing.`,
        type: "info"
      });
    }

    setShowCreateModal(false);
    setTitle("");
    setDescription("");
    setModulesCount("");
    setDuration("0 Mins");
    setInitialVideoUrl("");
    setInitialVideoTitle("");
    setThumbnailUrl(ADMIN_THUMBNAIL_PRESETS[0].url);
    setIsSubmittingCourse(false);
  };

  const filteredFeedbacks =
    selectedCourseFilter === "all"
      ? feedbacks
      : feedbacks.filter((f) => f.courseId === selectedCourseFilter);

  const avgPlatformRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
      : "5.0";

  const pendingCourses = courses.filter((c) => c.status === "pending_approval");
  const activeCourses = courses.filter((c) => c.status !== "pending_approval");

  const displayedCourses = courses.filter((c) => {
    if (statusFilter === "pending_approval") return c.status === "pending_approval";
    if (statusFilter === "active") return c.status !== "pending_approval";
    return true;
  });

  const handleApproveCourse = (course: any) => {
    // SECURITY: Only the Real Admin (e.g. vkt052005@gmail.com) can verify and approve courses into the live catalog
    if (!isRealAdmin(currentUser)) {
      addToast({
        title: "Admin Verification Required",
        message: `Teacher uploads and course submissions must be verified and approved by the Primary Platform Admin (${PRIMARY_ADMIN_EMAIL}).`,
        type: "warning"
      });
      return;
    }

    updateCourse(course.id, { status: "active" });
    addNotification({
      title: `New Curriculum Published: ${course.title}`,
      content: `${course.trainerName || "Faculty"} has published a new ${course.category} program: "${course.title}". Trainees can now enroll and start learning.`,
      type: "new_content",
      pinned: true,
      author: "MoES Platform Administration"
    });
    addToast({
      title: "Course Approved & Published",
      message: `"${course.title}" is now officially published to the trainee catalog.`,
      type: "success"
    });
  };

  const handleRejectCourse = (course: any) => {
    if (!isRealAdmin(currentUser)) {
      addToast({
        title: "Admin Action Required",
        message: `Course rejection is restricted to the Primary Platform Admin (${PRIMARY_ADMIN_EMAIL}).`,
        type: "warning"
      });
      return;
    }
    if (isProtectedProductionCourse(course)) {
      addToast({
        title: "Protected Course",
        message: "Production courses cannot be rejected or removed.",
        type: "warning"
      });
      return;
    }
    if (window.confirm(`Are you sure you want to reject the course "${course.title}" submitted by ${course.trainerName}? This will permanently remove it from the platform.`)) {
      deleteCourse(course.id);
      addNotification({
        title: `Course Submission Rejected: ${course.title}`,
        content: `The curriculum submission "${course.title}" was reviewed and rejected by Platform Administration.`,
        type: "announcement",
        pinned: false,
        author: "MoES Platform Administration"
      });
      addToast({
        title: "Course Rejected",
        message: `"${course.title}" has been rejected and removed from review queue.`,
        type: "info"
      });
    }
  };

  const handleConfirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    if (isProtectedProductionCourse(courseToDelete)) {
      addToast({
        title: "Protected Course",
        message: "Production courses cannot be deleted to protect platform content.",
        type: "warning"
      });
      setCourseToDelete(null);
      return;
    }
    setIsDeleting(true);
    try {
      deleteCourse(courseToDelete.id);
      addToast({
        title: "Course Permanently Deleted",
        message: `"${courseToDelete.title}" and all associated videos, student records, and enrollments have been permanently removed.`,
        type: "success"
      });
      setCourseToDelete(null);
    } catch (e) {
      addToast({
        title: "Deletion Failed",
        message: "Unable to delete course. Please try again.",
        type: "error"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout
      pageTitle="Course Quality & Moderation Queue"
      breadcrumbs={[
        { label: "Admin Dashboard", to: "/admin/dashboard" },
        { label: "Course Management" }
      ]}
    >
      <div className="space-y-6">
        {/* Quality Rating Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="card p-4 space-y-1">
            <span className="text-xs text-slate-400">Total Courses</span>
            <p className="text-2xl font-bold text-white">{courses.length}</p>
            <p className="text-[10px] text-slate-400 font-mono">{activeCourses.length} Live • {pendingCourses.length} Pending</p>
          </div>
          <div
            onClick={() => setStatusFilter("pending_approval")}
            className={`card p-4 space-y-1 cursor-pointer transition ${
              pendingCourses.length > 0
                ? "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10"
                : ""
            }`}
          >
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Approvals</span>
            </span>
            <p className="text-2xl font-bold text-amber-400">{pendingCourses.length}</p>
            <p className="text-[10px] text-slate-400 font-mono">
              {pendingCourses.length === 0 ? "Queue Empty • All Reviewed" : "Requires Admin Review"}
            </p>
          </div>
          <div className="card p-4 space-y-1">
            <span className="text-xs text-slate-400">Student Reviews</span>
            <p className="text-2xl font-bold text-[#2997ff]">{feedbacks.length}</p>
            <p className="text-[10px] text-slate-400 font-mono">Across all specializations</p>
          </div>
          <div className="card p-4 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Platform Quality Score</span>
            </span>
            <p className="text-2xl font-bold text-amber-300">
              {avgPlatformRating} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
            </p>
            <p className="text-[10px] text-slate-400 font-mono">Feedback verified</p>
          </div>
        </div>

        {/* Pending Approval Urgent Alert Banner */}
        {pendingCourses.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-black border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{pendingCourses.length} Course{pendingCourses.length > 1 ? "s" : ""} Awaiting Admin Approval</span>
                  <span className="badge text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-bold tracking-wider">
                    Action Required
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Instructors have submitted new curricula. Review the lessons and click "Approve & Publish" to make them live to trainees.
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatusFilter("pending_approval")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition cursor-pointer shrink-0 shadow-lg shadow-amber-500/20"
            >
              Filter Pending ({pendingCourses.length})
            </button>
          </div>
        )}

        {/* Courses List */}
        <div className="card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Course Curricula & Moderation Queue</h3>
              <p className="text-xs text-slate-400">Review instructor submissions and manage live catalog offerings</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="apple-btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Course</span>
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-white/5 pb-3">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white/10 text-white border border-white/15"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Courses ({courses.length})
            </button>
            <button
              onClick={() => setStatusFilter("pending_approval")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "pending_approval"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : pendingCourses.length > 0
                  ? "text-amber-400 hover:bg-amber-500/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Approval</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${pendingCourses.length > 0 ? "bg-amber-500/30 text-amber-200" : "bg-white/10 text-slate-400"}`}>
                {pendingCourses.length}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "active"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Published & Live ({activeCourses.length})</span>
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {displayedCourses.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">
                  {statusFilter === "pending_approval"
                    ? "No courses currently awaiting administrative review."
                    : "No courses found."}
                </p>
                <p className="text-[11px] text-slate-500">
                  {statusFilter === "pending_approval"
                    ? "All instructor submissions have been approved and published."
                    : "No curricula match the selected filter."}
                </p>
              </div>
            ) : (
              displayedCourses.map((c) => {
                const isPending = c.status === "pending_approval";
                const courseFbs = feedbacks.filter((f) => f.courseId === c.id);
                const hasRatings = courseFbs.length > 0 || (c.totalRatings && c.totalRatings > 0);
                const courseAvg =
                  courseFbs.length > 0
                    ? (courseFbs.reduce((acc, f) => acc + f.rating, 0) / courseFbs.length).toFixed(1)
                    : (c.totalRatings && c.totalRatings > 0 && c.rating)
                    ? c.rating.toFixed(1)
                    : null;

                return (
                  <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{c.title}</h4>
                        <span className="badge-blue text-[9px]">{c.category}</span>
                        {isPending ? (
                          <span className="badge text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-pulse" /> PENDING ADMIN REVIEW
                          </span>
                        ) : (
                          <span className="badge-green text-[9px]">LIVE IN CATALOG</span>
                        )}
                        {hasRatings ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{courseAvg}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({courseFbs.length} reviews)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400 text-[10px]">
                            <Star className="w-3 h-3 text-slate-500" />
                            <span>No ratings yet</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Instructor: <span className="text-slate-200 font-medium">{c.trainerName}</span> • Level: {c.level} • Duration: {formatCourseDuration(c)}
                        {c.lessons && c.lessons.length > 0 && ` • ${c.lessons.length} Videos`}
                        {c.resources && c.resources.length > 0 && ` • ${c.resources.length} Materials`}
                      </p>
                      {isPending && (
                        <p className="text-[11px] text-amber-300/80 italic">
                          Submitted by teacher awaiting verification. Trainees cannot see or enroll in this course until approved.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPending ? (
                        <>
                          <Link
                            to={`/trainee/course/${c.id}`}
                            target="_blank"
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                            title="Preview syllabus, videos & study materials"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#2997ff]" /> Preview
                          </Link>
                          {!isRealAdmin(currentUser) ? (
                            <button
                              type="button"
                              onClick={() => handleApproveCourse(c)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                              title={`Approval Locked: Requires Real Admin (${PRIMARY_ADMIN_EMAIL})`}
                            >
                              <Shield className="w-3.5 h-3.5 text-amber-400" />
                              <span>Verify (Real Admin Only)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApproveCourse(c)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                              title="Approve this course and publish to all trainees"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve & Publish
                            </button>
                          )}
                          {isRealAdmin(currentUser) && (
                            <button
                              onClick={() => handleRejectCourse(c)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="Reject and discard this course submission"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <Link
                            to={`/trainee/course/${c.id}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                            title="View in Catalog"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {isProtectedProductionCourse(c) ? (
                            <span className="text-[9.5px] text-slate-500 font-mono italic px-2">Protected</span>
                          ) : (
                            <button
                              onClick={() => setCourseToDelete(c)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg cursor-pointer transition"
                              title="Permanently Delete Course"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Student Quality Ratings & Feedback Governance Audit Table */}
        <div className="card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Student Quality Ratings & Feedback Governance Audit ({filteredFeedbacks.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Full transparency log of all student reviews and quality scores across instructors and courses.
              </p>
            </div>

            {/* Course Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                className="apple-input text-xs py-1 px-2.5 max-w-xs"
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
              >
                <option value="all">All Courses ({feedbacks.length} reviews)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="table-header">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Faculty / Trainer</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Student Feedback & Suggestions</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400 italic">
                      No student ratings found matching this filter.
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((fb) => (
                    <tr key={fb.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3">
                        <p className="font-bold text-white">{fb.traineeName}</p>
                        <p className="text-[10px] text-slate-400">ID: {fb.traineeId}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium">
                        {fb.courseTitle || courses.find((c) => c.id === fb.courseId)?.title || fb.courseId}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {fb.trainerName || courses.find((c) => c.id === fb.courseId)?.trainerName || "Faculty Instructor"}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= fb.rating ? "text-amber-400 fill-amber-400" : "text-slate-600"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-white text-[11px]">{fb.rating}.0</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-md">
                        <p className="line-clamp-3 leading-relaxed">{fb.comment}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => deleteFeedback(fb.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Delete / Moderate Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Permanent Course Deletion Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn overflow-y-auto">
          <div className="glass-panel p-6 sm:p-7 max-w-lg w-full border border-rose-500/30 shadow-2xl space-y-5 my-auto">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Permanently Delete Course?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This action cannot be undone. The course will be permanently removed from all student enrollments, faculty profiles, and cloud databases.
                </p>
              </div>
            </div>

            {/* Course Details Card */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[280px]">
                  {courseToDelete.title}
                </span>
                <span className="badge-blue text-[9px]">{courseToDelete.category}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                <div>
                  <span className="block text-[10px] text-slate-500">Instructor</span>
                  <span className="font-semibold text-white truncate block">{courseToDelete.trainerName}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Active Students</span>
                  <span className="font-semibold text-white">
                    {enrollments.filter((e) => e.courseId === courseToDelete.id).length}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Reviews & Ratings</span>
                  <span className="font-semibold text-white">
                    {feedbacks.filter((f) => f.courseId === courseToDelete.id).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Checklist */}
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200/90 space-y-1.5">
              <p className="font-semibold text-rose-300">The following will be permanently erased:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-300/80">
                <li>Course materials, video lessons, and transcripts</li>
                <li>All active student enrollments and completed certificates</li>
                <li>All student reviews, feedback, and quality ratings</li>
                <li>All associated quizzes, questionnaires, and student grade records</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                disabled={isDeleting}
                className="apple-btn-secondary text-xs px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCourse}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? "Deleting Permanently..." : "Permanently Delete Course"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── Modal: Admin Create Course Modal ────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn overflow-y-auto">
          <div className="glass-panel p-5 sm:p-7 max-w-xl w-full border border-white/20 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#2997ff]" />
                <div>
                  <h3 className="text-base font-bold text-white">Publish Course as Administrator</h3>
                  <p className="text-[11px] text-slate-400">Institutional curriculum & training modules for ministry officers</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminCreateCourse} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Course Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Numerical Weather Prediction & Atmospheric Modeling"
                  className="apple-input text-xs w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Comprehensive scope, prerequisites, and learning objectives..."
                  className="apple-input text-xs w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    className="apple-input text-xs w-full"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                  >
                    <option value="Technical">Technical (Software & Cloud)</option>
                    <option value="AI & Data">AI & Data Engineering</option>
                    <option value="MoES & IMD Operations">MoES & IMD Operations</option>
                    <option value="Atmospheric & Ocean Sciences">Atmospheric & Ocean Sciences</option>
                    <option value="Leadership">Leadership & Governance</option>
                    <option value="Compliance">Compliance & Security</option>
                    <option value="Domain">Domain Knowledge</option>
                    <option value="Soft Skills">Soft Skills & Public Service</option>
                    <option value="Communication">Communication & Reporting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Trainer / Faculty</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Kumar (IMD Senior Scientist)"
                    className="apple-input text-xs w-full"
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                  />
                </div>
              </div>

              {/* Course Thumbnail Selector */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  Course Visual Thumbnail
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ADMIN_THUMBNAIL_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setThumbnailUrl(preset.url)}
                      className={`relative rounded-lg overflow-hidden border text-left transition cursor-pointer group ${
                        thumbnailUrl === preset.url ? "border-[#2997ff] ring-2 ring-[#2997ff]/40" : "border-white/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-12 object-cover" />
                      <div className="p-1 bg-black/70 text-[9px] font-semibold text-white truncate">
                        {preset.label}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="pt-1">
                  <input
                    type="url"
                    placeholder="Or paste custom image URL (https://...)"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="apple-input text-xs w-full"
                  />
                </div>
              </div>

              {/* Optional First Video Lecture */}
              <div className="p-3 rounded-xl bg-[#0071e3]/5 border border-[#0071e3]/20 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2997ff]">
                  <Video className="w-4 h-4" />
                  <span>Attach First Video Lecture (Optional)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Lesson title (e.g. Module 1: System Overview)"
                    value={initialVideoTitle}
                    onChange={(e) => setInitialVideoTitle(e.target.value)}
                    className="apple-input text-xs w-full"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g. 20 Mins)"
                    value={initialVideoDuration}
                    onChange={(e) => setInitialVideoDuration(e.target.value)}
                    className="apple-input text-xs w-full"
                  />
                </div>
                <input
                  type="url"
                  placeholder="Paste YouTube or Google Drive Video URL"
                  value={initialVideoUrl}
                  onChange={(e) => setInitialVideoUrl(e.target.value)}
                  className="apple-input text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Duration Estimate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Hours"
                    className="apple-input text-xs w-full"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Number of Planned Modules
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="e.g. 6"
                    className="apple-input text-xs w-full"
                    value={modulesCount}
                    onChange={(e) => setModulesCount(e.target.value ? parseInt(e.target.value, 10) : "")}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  type="submit"
                  disabled={isSubmittingCourse}
                  className="apple-btn-primary flex-1 text-xs py-2 font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingCourse ? "Publishing Curriculum..." : "Publish Curriculum"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="apple-btn-secondary text-xs px-4 py-2 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default CourseManagement;
