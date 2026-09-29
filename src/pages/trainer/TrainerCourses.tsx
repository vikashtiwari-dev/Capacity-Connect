import React, { useState, useRef } from "react";
import {
  BookOpen, Plus, Trash2, CheckCircle2, Video, ShieldCheck,
  ShieldAlert, Play, X, ExternalLink, Film, UploadCloud,
  ChevronDown, ChevronUp, Clock, AlertTriangle, Sparkles, FileVideo,
  Star, MessageSquare, FileText, Presentation, FolderOpen, Paperclip, Download,
  Image, FileUp, Link as LinkIcon
} from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useCoursesStore } from "../../store/coursesStore";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { useNotificationsStore } from "../../store/notificationsStore";
import { AdaptiveVideoPlayer } from "../../components/video/AdaptiveVideoPlayer";
import { formatCourseDuration, extractMediaDuration } from "../../utils/courseDuration";
import { storeVideoBlob, uploadVideoToSupabase } from "../../utils/videoStorage";
import { isProtectedProductionCourse, isRealAdmin, PRIMARY_ADMIN_EMAIL } from "../../utils/demoMode";
import type { CourseCategory, CourseLesson, Resource } from "../../types";

export const THUMBNAIL_PRESETS = [
  {
    label: "💻 Full-Stack & Software Engineering",
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80"
  },
  {
    label: "🤖 AI, Machine Learning & Data Systems",
    url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80"
  },
  {
    label: "🛰️ Satellite Meteorology & Radar (MoES & IMD)",
    url: "https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?w=800&auto=format&fit=crop&q=80"
  },
  {
    label: "🌊 Ocean State Forecasting & Atmospheric Modeling",
    url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&auto=format&fit=crop&q=80"
  },
  {
    label: "☁️ Cloud Infrastructure & DevOps",
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80"
  },
  {
    label: "🔒 Cybersecurity & Defense",
    url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80"
  },
  {
    label: "🏛️ Strategic Leadership & Public Governance",
    url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop&q=80"
  }
];

export const TrainerCourses: React.FC = () => {
  const { courses, addCourse, updateCourse, deleteCourse, feedbacks, enrollments, addResource, deleteResource } = useCoursesStore();
  const { currentUser } = useAuthStore();
  const { addToast } = useAppStore();
  const { addNotification } = useNotificationsStore();

  // Permanent Delete Confirmation State
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  // Selected Course for reviews modal
  const [reviewsModalCourseId, setReviewsModalCourseId] = useState<string | null>(null);

  // Verification Gate: Legitimate trainers & admins can upload videos to their courses
  const isVerifiedTrainer = Boolean(
    currentUser?.role === "admin" ||
    currentUser?.isVerifiedByAdmin ||
    currentUser?.trainerProfile?.isVerifiedByAdmin
  );

  const [verificationRequested, setVerificationRequested] = useState(false);
  const [showUnverifiedModal, setShowUnverifiedModal] = useState(false);

  // New Course Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CourseCategory>("Technical");
  const [duration, setDuration] = useState("0 Mins");
  const [modulesCount, setModulesCount] = useState<number | "">("");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [thumbnailUrl, setThumbnailUrl] = useState(THUMBNAIL_PRESETS[0].url);
  const [initialVideoUrl, setInitialVideoUrl] = useState("");
  const [initialVideoTitle, setInitialVideoTitle] = useState("");
  const [initialVideoDuration, setInitialVideoDuration] = useState("20 Mins");
  const [initialResourceTitle, setInitialResourceTitle] = useState("");
  const [initialResourceUrl, setInitialResourceUrl] = useState("");
  const [initialResourceType, setInitialResourceType] = useState<"pdf" | "presentation" | "document" | "link">("pdf");

  // Study Material Upload Modal State
  const [showStudyMaterialModal, setShowStudyMaterialModal] = useState(false);
  const [studyMaterialCourseId, setStudyMaterialCourseId] = useState("");
  const [studyMaterialTitle, setStudyMaterialTitle] = useState("");
  const [studyMaterialType, setStudyMaterialType] = useState<"pdf" | "presentation" | "document" | "link">("pdf");
  const [studyMaterialUrl, setStudyMaterialUrl] = useState("");
  const [studyMaterialFileName, setStudyMaterialFileName] = useState("");
  const [expandedResourcesCourseId, setExpandedResourcesCourseId] = useState<string | null>(null);
  const studyFileInputRef = useRef<HTMLInputElement | null>(null);

  // Video Upload Modal State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState("20 Mins");
  const [isCalculatingDuration, setIsCalculatingDuration] = useState(false);
  const [videoSourceType, setVideoSourceType] = useState<"youtube" | "drive" | "url" | "file">("youtube");
  const [selectedFileBlob, setSelectedFileBlob] = useState<File | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [localVideoFileName, setLocalVideoFileName] = useState("");
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Video Lesson Manager State (Expanded course drawer & preview)
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [previewVideoLesson, setPreviewVideoLesson] = useState<CourseLesson | null>(null);

  const trainerId = currentUser?.id || "";
  const myCourses = courses.filter(
    (c) => c.trainerId === trainerId || (currentUser?.name && c.trainerName === currentUser.name)
  );

  // Available courses for attaching lessons/materials: instructor's authored courses, or all platform courses if admin/none authored yet
  const selectableCourses =
    currentUser?.role === "admin" || myCourses.length === 0
      ? courses
      : myCourses;

  // Request admin verification handler
  const handleRequestVerification = () => {
    if (verificationRequested) return;
    setVerificationRequested(true);

    addNotification({
      type: "alert",
      title: "Instructor Verification Requested",
      content: `${currentUser?.name || "A trainer"} (${currentUser?.email || "trainer"}) has requested Admin verification to unlock video lecture publishing.`,
      author: currentUser?.name || "Faculty Trainer",
      pinned: true,
      link: "/admin/users"
    });

    addToast({
      title: "Verification Request Dispatched",
      message: "Platform administrators have been notified to review and verify your faculty credentials.",
      type: "success"
    });

    setShowUnverifiedModal(false);
  };

  // Permanent course deletion handler
  const handleConfirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    if (isProtectedProductionCourse(courseToDelete)) {
      addToast({
        title: "Protected Course",
        message: "Production courses cannot be deleted.",
        type: "warning"
      });
      setCourseToDelete(null);
      return;
    }
    setIsDeletingCourse(true);
    try {
      deleteCourse(courseToDelete.id);
      addToast({
        title: "Course Permanently Deleted",
        message: `"${courseToDelete.title}" and all attached lessons, student records, and enrollments have been permanently deleted.`,
        type: "success"
      });
      setCourseToDelete(null);
    } catch (e) {
      addToast({
        title: "Deletion Error",
        message: "Failed to delete course. Please try again.",
        type: "error"
      });
    } finally {
      setIsDeletingCourse(false);
    }
  };

  // Open Video Upload Modal with Gate Check
  const handleOpenVideoModal = (preselectedCourseId?: string) => {
    if (!isVerifiedTrainer) {
      setShowUnverifiedModal(true);
      return;
    }

    if (selectableCourses.length === 0) {
      addToast({
        title: "Create a Course First",
        message: "You must create at least one course before attaching video lessons.",
        type: "warning"
      });
      setShowAddModal(true);
      return;
    }

    const initialId = preselectedCourseId || selectableCourses[0]?.id || "";
    setTargetCourseId(initialId);

    const targetCourse = courses.find((c) => c.id === initialId);
    const nextLessonNum = (targetCourse?.lessons?.length || 0) + 1;
    setLessonTitle(`Lesson ${nextLessonNum}: `);
    setVideoUrlInput("");
    setVideoDescription("");
    setLocalVideoFileName("");
    setShowVideoModal(true);
  };

  // Handle Local File Selection with automatic duration calculation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileBlob(file);
      setLocalVideoFileName(file.name);
      // Create local blob URL for instant preview & playback
      const objectUrl = URL.createObjectURL(file);
      setVideoUrlInput(objectUrl);
      if (!lessonTitle || lessonTitle.endsWith(": ")) {
        setLessonTitle(file.name.replace(/\.[^/.]+$/, ""));
      }

      // Automatically calculate duration of the selected video
      setIsCalculatingDuration(true);
      try {
        const calculated = await extractMediaDuration(file);
        setLessonDuration(calculated);
        addToast({
          title: "Video Duration Detected",
          message: `Calculated length: ${calculated}`,
          type: "info"
        });
      } catch (err) {
        console.error("Failed to extract duration", err);
      } finally {
        setIsCalculatingDuration(false);
      }
    }
  };

  // Handle URL Change with automatic duration probe if direct video
  const handleUrlChange = async (url: string) => {
    setVideoUrlInput(url);
    if (videoSourceType === "url" && (url.endsWith(".mp4") || url.endsWith(".webm") || url.includes("commondatastorage"))) {
      setIsCalculatingDuration(true);
      try {
        const calculated = await extractMediaDuration(url);
        setLessonDuration(calculated);
      } catch {
        // Keep current duration
      } finally {
        setIsCalculatingDuration(false);
      }
    }
  };

  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Create Course Handler
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmittingCourse) return;
    setIsSubmittingCourse(true);

      const modNum = typeof modulesCount === "number" && modulesCount > 0 ? modulesCount : undefined;
      const baseDuration = duration.trim() || "0 Mins";
      const initialDuration = modNum ? `${baseDuration} • ${modNum} Modules` : baseDuration;

      const trainerDisplayName = currentUser?.name || "Faculty Trainer";
      const courseTitle = title.trim();
      const courseId = "c-" + Date.now();

      // Optional initial video lesson
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
          description: "Initial foundational video lecture included during course publishing."
        };
        initialLessons.push(firstLesson);

        initialResources.push({
          id: "res-video-" + Date.now(),
          courseId,
          title: `${firstLesson.title} (Video Lecture)`,
          type: "video",
          url: initialVideoUrl.trim(),
          uploadedAt: new Date().toISOString(),
          uploadedBy: trainerDisplayName,
          description: "Course foundational video lecture"
        });
      }

      // Optional initial study material
      if (initialResourceUrl.trim()) {
        initialResources.push({
          id: "res-doc-" + Date.now(),
          courseId,
          title: initialResourceTitle.trim() || `${courseTitle} - Complete Study Material & Handbook`,
          type: initialResourceType,
          url: initialResourceUrl.trim(),
          uploadedAt: new Date().toISOString(),
          uploadedBy: trainerDisplayName,
          description: "Essential study material and syllabus uploaded with curriculum creation."
        });
      }

      const isTeacher = currentUser?.role !== "admin";
      const courseStatus = isTeacher ? "pending_approval" : "active";

      addCourse({
        id: courseId,
        title: courseTitle,
        description,
        category,
        duration: initialLessons.length > 0 ? initialVideoDuration.trim() || initialDuration : initialDuration,
        modules: modNum || (initialLessons.length > 0 ? 1 : undefined),
        level,
        status: courseStatus,
        trainerId,
        trainerName: trainerDisplayName,
        thumbnail: thumbnailUrl.trim() || THUMBNAIL_PRESETS[0].url,
        createdAt: new Date().toISOString(),
        tags: [category, level, "Capacity Building"],
        resources: initialResources,
        lessons: initialLessons
      });

      if (courseStatus === "active") {
        // Automatically broadcast notification: 'A teacher uploaded a course'
        addNotification({
          title: `New Curriculum Published: ${courseTitle}`,
          content: `${trainerDisplayName} has published a new ${category} curriculum: "${courseTitle}". Trainees can now enroll and start learning.`,
          type: "new_content",
          pinned: true,
          author: trainerDisplayName
        });
        addToast({
          title: "Course Published Successfully",
          message: "New curriculum published to catalog and trainees notified.",
          type: "success"
        });
      } else {
        // Automatically alert admin: 'Course submitted for review'
        addNotification({
          title: `Course Pending Admin Review: ${courseTitle}`,
          content: `${trainerDisplayName} has submitted a new ${category} curriculum "${courseTitle}" for administrative review before going live.`,
          type: "announcement",
          pinned: true,
          author: trainerDisplayName
        });
        addToast({
          title: "Course Submitted for Review",
          message: `Your course was submitted to the Primary Platform Admin (${PRIMARY_ADMIN_EMAIL}) for verification. It will appear in the catalog once approved.`,
          type: "info"
        });
      }

      setShowAddModal(false);
      setTitle("");
      setDescription("");
      setModulesCount("");
      setDuration("0 Mins");
      setInitialVideoUrl("");
      setInitialVideoTitle("");
      setInitialResourceTitle("");
      setInitialResourceUrl("");
      setThumbnailUrl(THUMBNAIL_PRESETS[0].url);
      setIsSubmittingCourse(false);
    };

    // Handle Study Material Upload
    const handleUploadStudyMaterial = (e: React.FormEvent) => {
      e.preventDefault();
      if (!studyMaterialCourseId || !studyMaterialTitle.trim() || !studyMaterialUrl.trim()) {
        addToast({
          title: "Missing Details",
          message: "Please specify resource title and document link/file.",
          type: "error"
        });
        return;
      }

      const course = courses.find((c) => c.id === studyMaterialCourseId);
      if (!course) return;

      const newResource: Resource = {
        id: "res-" + Date.now(),
        courseId: course.id,
        title: studyMaterialTitle.trim(),
        type: studyMaterialType,
        url: studyMaterialUrl.trim(),
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser?.name || "Faculty Trainer",
        description: `Uploaded for ${course.title}`
      };

      const updatedResources = [...(course.resources || []), newResource];
      updateCourse(course.id, { resources: updatedResources });

      setShowStudyMaterialModal(false);
      setStudyMaterialTitle("");
      setStudyMaterialUrl("");
      setStudyMaterialFileName("");
      setExpandedResourcesCourseId(course.id);
      addToast({
        title: "Study Material Uploaded",
        message: `"${newResource.title}" has been attached to ${course.title}.`,
        type: "success"
      });
    };

    // Handle Delete Resource
    const handleDeleteResource = (courseId: string, resourceId: string) => {
      const course = courses.find((c) => c.id === courseId);
      if (!course || !course.resources) return;

      const updatedResources = course.resources.filter((r) => r.id !== resourceId);
      updateCourse(courseId, { resources: updatedResources });
      addToast({
        title: "Resource Removed",
        message: "Study material has been detached from course.",
        type: "info"
      });
    };

  // Submit Video Lesson Upload with IndexedDB persistence for local files
  const handleUploadVideoLesson = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerifiedTrainer) {
      setShowUnverifiedModal(true);
      return;
    }

    if (!targetCourseId || !lessonTitle.trim() || !videoUrlInput.trim()) {
      addToast({
        title: "Missing Video Details",
        message: "Please specify lesson title and video URL / file.",
        type: "error"
      });
      return;
    }

    const course = courses.find((c) => c.id === targetCourseId);
    if (!course) return;

    const existingLessons = course.lessons || [];
    const lessonNumber = existingLessons.length + 1;
    const lessonId = "lesson-" + Date.now();

    let persistentUrl = videoUrlInput.trim();

    // If local file was uploaded, store it in Supabase Storage with IndexedDB fallback
    if (videoSourceType === "file" && selectedFileBlob) {
      setIsUploadingVideo(true);
      try {
        const storageKey = `vid-${course.id}-${lessonId}`;
        const cloudUrl = await uploadVideoToSupabase(storageKey, selectedFileBlob);
        if (cloudUrl) {
          persistentUrl = cloudUrl;
        } else {
          await storeVideoBlob(storageKey, selectedFileBlob);
          persistentUrl = `indexeddb://${storageKey}`;
        }
      } catch (err) {
        console.warn("Failed to upload video to Supabase Storage, fallback to IndexedDB", err);
      } finally {
        setIsUploadingVideo(false);
      }
    }

    // Extract YouTube ID if applicable
    let videoId = `v-${Date.now()}`;
    const ytMatch = persistentUrl.match(/(?:youtu\.be\/|watch\?v=|embed\/)([^#&?]{11})/);
    if (ytMatch && ytMatch[1]) {
      videoId = ytMatch[1];
    }

    const newLesson: CourseLesson = {
      id: lessonId,
      lessonNumber,
      title: lessonTitle.trim(),
      duration: lessonDuration.trim() || "20 Mins",
      youtubeUrl: persistentUrl,
      videoId,
      videoSource: videoSourceType,
      description: videoDescription.trim() || undefined
    };

    const newResource: Resource = {
      id: "res-video-" + Date.now(),
      courseId: course.id,
      title: `${newLesson.title} (Video Lecture)`,
      type: "video",
      url: persistentUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser?.name || "Faculty Trainer",
      description: videoDescription.trim() || "Course video lecture uploaded by instructor."
    };

    const updatedLessons = [...existingLessons, newLesson];
    const updatedResources = [...(course.resources || []), newResource];

    // Recalculate dynamic course duration
    const courseWithNewLesson: typeof course = {
      ...course,
      lessons: updatedLessons
    };
    const updatedDuration = formatCourseDuration(courseWithNewLesson);

    updateCourse(course.id, {
      lessons: updatedLessons,
      resources: updatedResources,
      duration: updatedDuration
    });

    setShowVideoModal(false);
    setExpandedCourseId(course.id);
    addToast({
      title: "Video Lesson Uploaded & Published",
      message: `"${newLesson.title}" (${newLesson.duration}) has been appended to ${course.title}. Total course length: ${updatedDuration}.`,
      type: "success"
    });
  };

  // Delete Video Lesson
  const handleDeleteLesson = (courseId: string, lessonId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course || !course.lessons) return;

    const filteredLessons = course.lessons
      .filter((l) => l.id !== lessonId)
      .map((l, idx) => ({ ...l, lessonNumber: idx + 1 }));

    const updatedCourse: typeof course = {
      ...course,
      lessons: filteredLessons
    };
    const updatedDuration = formatCourseDuration(updatedCourse);

    updateCourse(courseId, {
      lessons: filteredLessons,
      duration: updatedDuration
    });

    addToast({
      title: "Video Lesson Removed",
      message: "Lesson removed and course duration recalculated.",
      type: "info"
    });
  };

  return (
    <DashboardLayout
      pageTitle="Course Curriculum & Video Studio"
      breadcrumbs={[
        { label: "Trainer Dashboard", to: "/trainer/dashboard" },
        { label: "Manage Courses" }
      ]}
    >
      <div className="space-y-6">
        {/* Verification Status Banner */}
        {!isVerifiedTrainer ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Video Publishing: Pending Admin Verification</h4>
                  <span className="badge-yellow text-[9px] font-bold">UNVERIFIED FACULTY</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Only teachers that have been verified by an Administrator can upload videos and publish multimedia lectures. You can author course syllabi, but video uploading remains locked until verified.
                </p>
              </div>
            </div>
            <button
              onClick={handleRequestVerification}
              disabled={verificationRequested}
              className="apple-btn-secondary text-xs px-4 py-2 font-semibold text-amber-300 border-amber-500/40 hover:bg-amber-500/20 shrink-0 cursor-pointer"
            >
              {verificationRequested ? "Verification Requested ✓" : "Request Admin Verification"}
            </button>
          </div>
        ) : (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Verified Faculty Instructor</span>
                  <span className="badge-green text-[8px] font-bold">VIDEO STUDIO UNLOCKED</span>
                </p>
                <p className="text-[11px] text-slate-300">You are verified by Platform Administration to author, upload, and embed video lessons directly into your curricula.</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenVideoModal()}
              className="apple-btn-primary text-xs px-3.5 py-1.5 font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" /> Upload Video
            </button>
          </div>
        )}

        {/* Page Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Your Authored Courses ({myCourses.length})</h3>
            <p className="text-xs text-slate-400">Design syllabus, upload slide decks, and publish verified video recordings</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenVideoModal()}
              className={
                "text-xs px-4 py-2 font-bold flex items-center gap-1.5 rounded-xl transition cursor-pointer " +
                (isVerifiedTrainer
                  ? "bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-md shadow-blue-500/20"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-amber-300 hover:border-amber-500/40")
              }
            >
              <Video className="w-4 h-4" />
              <span>Upload Video Lesson</span>
              {!isVerifiedTrainer && <span className="text-[9px] text-amber-400 font-mono">(Locked)</span>}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="apple-btn-secondary text-xs px-4 py-2 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Course
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        {myCourses.length === 0 ? (
          <div className="card p-12 text-center space-y-3 border-dashed border-white/20">
            <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Courses Created Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You have not published any courses yet. Click "Create Course" above to author your first curriculum.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map((c) => {
              const videoCount = c.lessons?.length || 0;
              const isExpanded = expandedCourseId === c.id;
              return (
                <div key={c.id} className="glass-card p-5 space-y-4 flex flex-col justify-between border-white/10">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="badge-blue text-[9px]">{c.category}</span>
                      <div className="flex items-center gap-1.5">
                        {c.status === "pending_approval" ? (
                          <span className="badge text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-amber-400 animate-pulse" /> Review Pending
                          </span>
                        ) : (
                          <span className="badge text-[9px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Published
                          </span>
                        )}
                        <span className="badge text-[9px] bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Film className="w-3 h-3" /> {videoCount} {videoCount === 1 ? "Video" : "Videos"}
                        </span>
                        <span className="badge-gray text-[9px]">{c.level}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{c.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{c.description}</p>
                      {c.status === "pending_approval" && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200/90 flex items-start gap-2">
                          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                          <div className="space-y-0.5">
                            <p className="font-semibold text-amber-300">Under Administrator Review</p>
                            <p className="text-[10px] text-amber-200/70 leading-relaxed">
                              This curriculum is awaiting admin approval before being made visible to trainees in the catalog.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Student Quality Rating & Reviews trigger */}
                    {(() => {
                      const courseFbs = feedbacks.filter((f) => f.courseId === c.id);
                      const hasRatings = courseFbs.length > 0 || (c.totalRatings && c.totalRatings > 0);
                      const avgRating =
                        courseFbs.length > 0
                          ? (courseFbs.reduce((acc, f) => acc + f.rating, 0) / courseFbs.length).toFixed(1)
                          : (c.totalRatings && c.totalRatings > 0 && c.rating)
                          ? c.rating.toFixed(1)
                          : null;
                      return (
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setReviewsModalCourseId(c.id)}
                            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition cursor-pointer"
                            title="Click to view student reviews"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {hasRatings ? (
                              <>
                                <span className="font-bold">{avgRating}</span>
                                <span className="text-[11px] text-slate-400">({courseFbs.length} student reviews)</span>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400">No ratings yet (0 reviews)</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewsModalCourseId(c.id)}
                            className="text-[11px] text-[#2997ff] hover:underline font-medium cursor-pointer"
                          >
                            View Reviews
                          </button>
                        </div>
                      );
                    })()}

                    {/* Expand Video Lessons Manager Drawer */}
                    <div className="pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setExpandedCourseId(isExpanded ? null : c.id)}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-[11px] font-semibold text-slate-300 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-[#2997ff]" />
                          <span>Curriculum Videos ({videoCount})</span>
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {/* Expanded Lessons List */}
                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {videoCount === 0 ? (
                            <p className="text-[11px] text-slate-500 italic text-center py-3">
                              No videos uploaded to this course yet.
                            </p>
                          ) : (
                            c.lessons?.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs hover:border-white/15 transition group"
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <span className="w-4 h-4 rounded bg-[#0071e3]/20 text-[#2997ff] text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {lesson.lessonNumber}
                                  </span>
                                  <div className="truncate">
                                    <p className="font-semibold text-white truncate text-[11.5px]">{lesson.title}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{lesson.duration}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => setPreviewVideoLesson(lesson)}
                                    className="p-1 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                                    title="Play Preview"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLesson(c.id, lesson.id)}
                                    className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                    title="Delete Lesson"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}

                          <button
                            onClick={() => handleOpenVideoModal(c.id)}
                            className="w-full mt-2 py-1.5 px-3 rounded-lg border border-dashed border-[#2997ff]/40 hover:bg-[#0071e3]/10 text-[11px] font-bold text-[#2997ff] flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Video Lesson
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expand Study Materials Drawer */}
                    <div className="pt-1.5 border-t border-white/5">
                      {(() => {
                        const isResExpanded = expandedResourcesCourseId === c.id;
                        const studyMaterials = (c.resources || []).filter((r) => r.type !== "video");
                        const matCount = studyMaterials.length;

                        return (
                          <div>
                            <button
                              type="button"
                              onClick={() => setExpandedResourcesCourseId(isResExpanded ? null : c.id)}
                              className="w-full py-1.5 px-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-[11px] font-semibold text-slate-300 flex items-center justify-between transition cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Study Materials & Handbooks ({matCount})</span>
                              </span>
                              {isResExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {isResExpanded && (
                              <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                {matCount === 0 ? (
                                  <p className="text-[11px] text-slate-500 italic text-center py-3">
                                    No study materials attached to this course yet.
                                  </p>
                                ) : (
                                  studyMaterials.map((res) => (
                                    <div
                                      key={res.id}
                                      className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs hover:border-white/15 transition group"
                                    >
                                      <div className="flex items-center gap-2 truncate pr-2">
                                        <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                                          {res.type === "pdf" ? "PDF" : res.type === "presentation" ? "PPT" : "DOC"}
                                        </div>
                                        <div className="truncate">
                                          <p className="font-semibold text-white truncate text-[11.5px]">{res.title}</p>
                                          <span className="text-[9.5px] text-slate-400 capitalize">{res.type}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <a
                                          href={res.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-1 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                                          title="Open / Download"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </a>
                                        <button
                                          onClick={() => handleDeleteResource(c.id, res.id)}
                                          className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                          title="Delete Material"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setStudyMaterialCourseId(c.id);
                                    setStudyMaterialTitle("");
                                    setStudyMaterialUrl("");
                                    setStudyMaterialFileName("");
                                    setShowStudyMaterialModal(true);
                                  }}
                                  className="w-full mt-2 py-1.5 px-3 rounded-lg border border-dashed border-emerald-500/40 hover:bg-emerald-500/10 text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1.5 transition cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Upload Study Material
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">{formatCourseDuration(c)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setStudyMaterialCourseId(c.id);
                          setStudyMaterialTitle("");
                          setStudyMaterialUrl("");
                          setStudyMaterialFileName("");
                          setShowStudyMaterialModal(true);
                        }}
                        className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> +Material
                      </button>
                      <button
                        onClick={() => handleOpenVideoModal(c.id)}
                        className="text-xs text-[#2997ff] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" /> +Video
                      </button>
                      {isProtectedProductionCourse(c) ? (
                        <span className="text-[9.5px] text-slate-500 font-mono italic px-2">Protected</span>
                      ) : (
                        <button
                          onClick={() => setCourseToDelete(c)}
                          className="text-rose-400 hover:text-rose-300 transition p-1 cursor-pointer"
                          title="Permanently Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal 1: Upload Video Lesson ────────────────────────────────────────── */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn overflow-y-auto">
          <div className="glass-panel p-5 sm:p-7 max-w-lg w-full border border-white/20 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0071e3]/20 flex items-center justify-center text-[#2997ff]">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Upload Course Video Lesson</h3>
                  <p className="text-xs text-slate-400">Verified Instructor Publishing Studio</p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadVideoLesson} className="space-y-3.5 text-xs">
              {/* Target Course */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Target Course Curriculum <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVideoModal(false);
                      setShowAddModal(true);
                    }}
                    className="text-[11px] text-[#2997ff] hover:underline font-semibold cursor-pointer"
                  >
                    + Create New Course
                  </button>
                </div>
                <select
                  required
                  value={targetCourseId}
                  onChange={(e) => setTargetCourseId(e.target.value)}
                  className="apple-input text-xs w-full cursor-pointer bg-slate-900 text-white"
                >
                  {selectableCourses.length === 0 ? (
                    <option value="" disabled>
                      No courses available — click "Create New Course" first
                    </option>
                  ) : (
                    selectableCourses.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.title} ({c.lessons?.length || 0} existing lessons • {c.trainerName})
                      </option>
                    ))
                  )}
                </select>
                {selectableCourses.length === 0 && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    No courses found yet. Please create a curriculum first to attach lessons.
                  </p>
                )}
              </div>

              {/* Lesson Title & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lesson Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master React Hooks & State Management"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="apple-input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Duration</span>
                    {isCalculatingDuration && (
                      <span className="text-[10px] text-[#2997ff] flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-2.5 h-2.5" /> Calculating...
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 25:40 or 20 Mins"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(e.target.value)}
                    className="apple-input text-xs w-full"
                  />
                </div>
              </div>

              {/* Video Source Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Video Source Method <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVideoSourceType("youtube");
                      setVideoUrlInput("");
                      setLocalVideoFileName("");
                      setSelectedFileBlob(null);
                    }}
                    className={
                      "py-2 px-2 rounded-xl font-semibold border text-center transition cursor-pointer text-xs " +
                      (videoSourceType === "youtube"
                        ? "bg-[#0071e3]/20 border-[#2997ff] text-white ring-1 ring-[#2997ff]"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white")
                    }
                  >
                    YouTube Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoSourceType("drive");
                      setVideoUrlInput("");
                      setLocalVideoFileName("");
                      setSelectedFileBlob(null);
                    }}
                    className={
                      "py-2 px-2 rounded-xl font-semibold border text-center transition cursor-pointer text-xs " +
                      (videoSourceType === "drive"
                        ? "bg-[#0071e3]/20 border-[#2997ff] text-white ring-1 ring-[#2997ff]"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white")
                    }
                  >
                    Google Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoSourceType("url");
                      setVideoUrlInput("");
                      setLocalVideoFileName("");
                      setSelectedFileBlob(null);
                    }}
                    className={
                      "py-2 px-2 rounded-xl font-semibold border text-center transition cursor-pointer text-xs " +
                      (videoSourceType === "url"
                        ? "bg-[#0071e3]/20 border-[#2997ff] text-white ring-1 ring-[#2997ff]"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white")
                    }
                  >
                    Direct MP4 / CDN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoSourceType("file");
                      setVideoUrlInput("");
                      setLocalVideoFileName("");
                    }}
                    className={
                      "py-2 px-2 rounded-xl font-semibold border text-center transition cursor-pointer text-xs " +
                      (videoSourceType === "file"
                        ? "bg-[#0071e3]/20 border-[#2997ff] text-white ring-1 ring-[#2997ff]"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white")
                    }
                  >
                    Upload File
                  </button>
                </div>
              </div>

              {/* Video Input depending on source */}
              {videoSourceType === "youtube" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    YouTube Video or Playlist URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://www.youtube.com/watch?v=WXk7yDqsKxs or playlist link"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="apple-input text-xs w-full"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    Supports single YouTube videos, timestamped links, and playlist series.
                  </p>
                </div>
              )}

              {videoSourceType === "drive" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Google Drive Video Share Link <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://drive.google.com/file/d/1A2B3C4D5E.../view?usp=sharing"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="apple-input text-xs w-full"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    Paste any Google Drive share link (set access to "Anyone with the link"). The player automatically embeds it securely for students.
                  </p>
                </div>
              )}

              {videoSourceType === "url" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Direct Video Stream URL (.mp4 / .webm) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                    value={videoUrlInput}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="apple-input text-xs w-full"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    Direct HTTPS link to an MP4 or WebM video file.
                  </p>
                </div>
              )}

              {videoSourceType === "file" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Local Video File (.mp4, .webm) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 border border-dashed border-white/20 hover:border-[#2997ff]/60 rounded-xl bg-white/[0.02] text-center cursor-pointer transition space-y-2"
                  >
                    <UploadCloud className="w-8 h-8 text-[#2997ff] mx-auto" />
                    {localVideoFileName ? (
                      <div>
                        <p className="text-xs font-bold text-white">{localVideoFileName}</p>
                        <p className="text-[10px] text-emerald-400">File selected & ready for preview</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-300">Click to choose a video file from your computer</p>
                        <p className="text-[10px] text-slate-500">MP4, WebM formats supported</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lesson Summary & Key Concepts (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Outline topics covered, key code snippets, or takeaways..."
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="apple-input text-xs w-full resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="submit"
                  disabled={!videoUrlInput.trim() || isUploadingVideo}
                  className="apple-btn-primary flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingVideo ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading to Cloud Storage...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5" /> Publish Video Lesson
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="apple-btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Unverified Teacher Restriction Alert ─────────────────────────── */}
      {showUnverifiedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn">
          <div className="glass-panel p-6 max-w-md w-full border border-amber-500/30 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">Admin Verification Required</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Only faculty members verified by an Administrator can upload videos and author new curriculum media. This quality control ensures institutional standards across all enrolled trainees.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-left space-y-1">
              <p className="text-[11px] font-bold text-slate-200">How to get verified:</p>
              <ul className="text-[10.5px] text-slate-400 space-y-1 list-disc list-inside">
                <li>Click "Request Admin Verification" below.</li>
                <li>Your request will be recorded in the Admin Governance ledger.</li>
                <li>An administrator will review your faculty profile and grant upload authority.</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleRequestVerification}
                disabled={verificationRequested}
                className="apple-btn-primary flex-1 py-2 text-xs font-bold cursor-pointer"
              >
                {verificationRequested ? "Request Sent ✓" : "Request Admin Verification"}
              </button>
              <button
                type="button"
                onClick={() => setShowUnverifiedModal(false)}
                className="apple-btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Video Player Preview Modal ───────────────────────────────────── */}
      {previewVideoLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl animate-fadeIn">
          <div className="glass-panel max-w-3xl w-full border border-white/20 shadow-2xl overflow-hidden space-y-3">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#2997ff]" />
                <h4 className="text-xs font-bold text-white truncate max-w-md">
                  Lesson #{previewVideoLesson.lessonNumber}: {previewVideoLesson.title}
                </h4>
              </div>
              <button
                onClick={() => setPreviewVideoLesson(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 pb-4">
              <AdaptiveVideoPlayer
                videoUrl={previewVideoLesson.youtubeUrl}
                title={previewVideoLesson.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 4: Create Course Modal ────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn overflow-y-auto">
          <div className="glass-panel p-5 sm:p-7 max-w-xl w-full border border-white/20 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#2997ff]" />
                <div>
                  <h3 className="text-base font-bold text-white">Publish New Course Curriculum</h3>
                  <p className="text-[11px] text-slate-400">Create course, assign thumbnail, and optionally attach initial lecture & study materials</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Course Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radar Meteorology & Extreme Weather Diagnostics"
                  className="apple-input text-xs w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Course Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Provide syllabus overview, objectives, and prerequisites..."
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty Level</label>
                  <select
                    className="apple-input text-xs w-full"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Course Thumbnail Selector */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  Course Visual Thumbnail
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {THUMBNAIL_PRESETS.map((preset) => (
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
                <p className="text-[10.5px] text-slate-400">
                  You can immediately attach your first lecture so trainees can start viewing right away.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Lesson title (e.g. Module 1: Introduction)"
                    value={initialVideoTitle}
                    onChange={(e) => setInitialVideoTitle(e.target.value)}
                    className="apple-input text-xs w-full"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g. 25 Mins)"
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

              {/* Optional Initial Study Material */}
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <FileText className="w-4 h-4" />
                  <span>Attach Syllabus or Study Material (Optional)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Document Title (e.g. Course Handbook & Syllabus)"
                    value={initialResourceTitle}
                    onChange={(e) => setInitialResourceTitle(e.target.value)}
                    className="apple-input text-xs sm:col-span-2 w-full"
                  />
                  <select
                    value={initialResourceType}
                    onChange={(e) => setInitialResourceType(e.target.value as any)}
                    className="apple-input text-xs w-full"
                  >
                    <option value="pdf">PDF</option>
                    <option value="presentation">Presentation (PPT)</option>
                    <option value="document">Document (DOC)</option>
                    <option value="link">Web Link</option>
                  </select>
                </div>
                <input
                  type="url"
                  placeholder="Paste Cloud Storage / Google Drive / Public PDF URL"
                  value={initialResourceUrl}
                  onChange={(e) => setInitialResourceUrl(e.target.value)}
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
                    placeholder="e.g. 2 Hours, 45 Mins"
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
                    placeholder="e.g. 5"
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
                  onClick={() => setShowAddModal(false)}
                  className="apple-btn-secondary text-xs px-4 py-2 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 5: Upload Study Material Modal ─────────────────────────────────── */}
      {showStudyMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn overflow-y-auto">
          <div className="glass-panel p-5 sm:p-6 max-w-lg w-full border border-white/20 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Upload Study Material</h3>
                  <p className="text-xs text-slate-400">PDFs, slide decks, documents & reference links</p>
                </div>
              </div>
              <button
                onClick={() => setShowStudyMaterialModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadStudyMaterial} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Target Course <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStudyMaterialModal(false);
                      setShowAddModal(true);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    + Create New Course
                  </button>
                </div>
                <select
                  required
                  value={studyMaterialCourseId}
                  onChange={(e) => setStudyMaterialCourseId(e.target.value)}
                  className="apple-input text-xs w-full cursor-pointer bg-slate-900 text-white"
                >
                  {selectableCourses.length === 0 ? (
                    <option value="" disabled>
                      No courses available — click "Create New Course" first
                    </option>
                  ) : (
                    selectableCourses.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.title} • {c.trainerName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Material Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Satellite Meteorology Reference Manual (Vol 1)"
                  value={studyMaterialTitle}
                  onChange={(e) => setStudyMaterialTitle(e.target.value)}
                  className="apple-input text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Document Format</label>
                  <select
                    value={studyMaterialType}
                    onChange={(e) => setStudyMaterialType(e.target.value as any)}
                    className="apple-input text-xs w-full"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="presentation">Presentation Slide (.ppt / .pptx)</option>
                    <option value="document">Handbook / Document (.docx / .txt)</option>
                    <option value="link">Web Reference Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Or Upload File
                  </label>
                  <input
                    ref={studyFileInputRef}
                    type="file"
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setStudyMaterialFileName(f.name);
                        if (!studyMaterialTitle) {
                          setStudyMaterialTitle(f.name.replace(/\.[^/.]+$/, ""));
                        }
                        const url = URL.createObjectURL(f);
                        setStudyMaterialUrl(url);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => studyFileInputRef.current?.click()}
                    className="apple-btn-secondary text-xs w-full py-2 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{studyMaterialFileName ? "Replace File" : "Choose File"}</span>
                  </button>
                </div>
              </div>

              {studyMaterialFileName && (
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300">
                  <span className="truncate">{studyMaterialFileName}</span>
                  <span className="text-[10px] text-slate-400">Attached</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document URL / Cloud Link <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/... or https://example.com/handbook.pdf"
                  value={studyMaterialUrl}
                  onChange={(e) => setStudyMaterialUrl(e.target.value)}
                  className="apple-input text-xs w-full"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button type="submit" className="apple-btn-primary flex-1 text-xs py-2 font-bold cursor-pointer">
                  Attach Study Material
                </button>
                <button
                  type="button"
                  onClick={() => setShowStudyMaterialModal(false)}
                  className="apple-btn-secondary text-xs px-4 py-2 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Student Quality Ratings & Feedback Reviews Modal ─────────── */}
      {reviewsModalCourseId && (() => {
        const modalCourse = courses.find((c) => c.id === reviewsModalCourseId);
        const modalFeedbacks = feedbacks.filter((f) => f.courseId === reviewsModalCourseId);
        const hasRatings = modalFeedbacks.length > 0 || (modalCourse?.totalRatings && modalCourse.totalRatings > 0);
        const modalAvg =
          modalFeedbacks.length > 0
            ? (modalFeedbacks.reduce((acc, f) => acc + f.rating, 0) / modalFeedbacks.length).toFixed(1)
            : (modalCourse?.totalRatings && modalCourse.totalRatings > 0 && modalCourse.rating)
            ? modalCourse.rating.toFixed(1)
            : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn overflow-y-auto">
            <div className="glass-panel p-5 sm:p-6 max-w-xl w-full border border-white/20 shadow-2xl space-y-4 my-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Student Reviews: {modalCourse?.title}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Direct feedback from students enrolled in your course • {hasRatings ? (
                      <>Average: <strong className="text-amber-300">{modalAvg} / 5.0</strong> ({modalFeedbacks.length} ratings)</>
                    ) : (
                      <span>No student ratings yet</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewsModalCourseId(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {modalFeedbacks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 italic">
                    No student reviews recorded for this course yet.
                  </div>
                ) : (
                  modalFeedbacks.map((fb) => (
                    <div key={fb.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white text-xs">{fb.traineeName}</p>
                          <p className="text-[10px] text-slate-400">{new Date(fb.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= fb.rating ? "text-amber-400 fill-amber-400" : "text-slate-600"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-white ml-1">{fb.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{fb.comment}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setReviewsModalCourseId(null)}
                  className="apple-btn-secondary text-xs px-4 py-2 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Modal 4: Permanent Course Deletion Confirmation ──────────────────────── */}
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
                  This action is irreversible. The course will be permanently wiped across all student dashboards, cloud databases, and portal records.
                </p>
              </div>
            </div>

            {/* Course Summary Card */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[280px]">
                  {courseToDelete.title}
                </span>
                <span className="badge-blue text-[9px]">{courseToDelete.category}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                <div>
                  <span className="block text-[10px] text-slate-500">Lessons</span>
                  <span className="font-semibold text-white">{courseToDelete.lessons?.length || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Enrolled Students</span>
                  <span className="font-semibold text-white">
                    {enrollments.filter((e) => e.courseId === courseToDelete.id).length}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Student Reviews</span>
                  <span className="font-semibold text-white">
                    {feedbacks.filter((f) => f.courseId === courseToDelete.id).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Checklist */}
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200/90 space-y-1.5">
              <p className="font-semibold text-rose-300">The following data will be permanently erased:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-300/80">
                <li>All uploaded video lectures, transcripts, and media files</li>
                <li>All active student enrollments, progress markers, and certificates</li>
                <li>All student quality ratings and feedback reviews</li>
                <li>All linked course quizzes, questionnaires, and student test results</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                disabled={isDeletingCourse}
                className="apple-btn-secondary text-xs px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCourse}
                disabled={isDeletingCourse}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeletingCourse ? "Deleting Permanently..." : "Permanently Delete Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TrainerCourses;
