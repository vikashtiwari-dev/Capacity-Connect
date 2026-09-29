import { create } from "zustand";
import type { Course, Enrollment, Certificate, Resource, Feedback, TraineeProfile, User } from "../types";
import { generateId, STORAGE_KEYS } from "../data/seed";
import { dbService } from "../services/db";
import { deleteVideoBlob } from "../utils/videoStorage";
import { useUsersStore } from "./usersStore";
import { useAuthStore } from "./authStore";
import { recordAuditEvent } from "./auditStore";
import { isProtectedProductionCourse, isRealAdmin } from "../utils/demoMode";

interface CoursesState {
  courses: Course[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  feedbacks: Feedback[];
  isSubscribed: boolean;
  load: () => void;
  initSubscription: () => void;
  enroll: (traineeId: string, courseId: string) => void;
  unenroll: (traineeId: string, courseId: string) => void;
  updateProgress: (enrollmentId: string, progress: number) => void;
  completeCourse: (
    traineeId: string,
    courseId: string,
    grade?: string,
    scorePercentage?: number,
    certData?: Partial<Certificate>
  ) => Certificate | undefined;
  addResource: (resource: Resource) => void;
  deleteResource: (courseId: string, resourceId: string) => void;
  addCourse: (course: Course) => void;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  addFeedback: (fb: Feedback) => void;
  deleteFeedback: (feedbackId: string) => void;
  getCourseFeedbacks: (courseId: string) => Feedback[];
  getTrainerFeedbacks: (trainerId: string) => Feedback[];
  isEnrolled: (traineeId: string, courseId: string) => boolean;
  getEnrollment: (traineeId: string, courseId: string) => Enrollment | undefined;
  getTraineeCertificates: (traineeId: string) => Certificate[];
  getTrainerCourses: (trainerId: string) => Course[];
}

const sanitizeCourses = (courses: Course[], feedbacks: Feedback[] = []): Course[] => {
  const seenIds = new Set<string>();
  const seenTitleTrainer = new Set<string>();

  return (courses || [])
    .filter((c) => {
      if (!c || !c.id) return false;
      if (seenIds.has(c.id)) return false;
      seenIds.add(c.id);

      const titleKey = `${c.trainerId || c.trainerName || ""}_${(c.title || "").trim().toLowerCase()}`;
      if (c.title && c.title.trim() && seenTitleTrainer.has(titleKey)) return false;
      if (c.title && c.title.trim()) seenTitleTrainer.add(titleKey);

      if (["c1", "c2", "c3", "c4", "c5", "c-raj-tiwari-dsa"].includes(c.id)) return false;
      const trainer = (c.trainerName || "").toLowerCase();
      if (trainer.includes("marcus vance") || trainer.includes("sarah chen") || trainer.includes("rajesh kumar") || trainer.includes("raj tiwari")) return false;
      if (c.trainerId === "u-trainer-official" && (c.title || "").toLowerCase().includes("data structures")) return false;
      const title = (c.title || "").toLowerCase();
      if (
        title.includes("advanced cloud infrastructure") ||
        title.includes("generative ai & llm systems") ||
        title.includes("strategic leadership") ||
        title.includes("cybersecurity governance") ||
        title.includes("executive communication")
      ) return false;
      return true;
    })
    .map((c) => {
      const courseFbs = feedbacks.filter((f) => f && f.courseId === c.id);
      if (courseFbs.length > 0) {
        const sum = courseFbs.reduce((acc, f) => acc + (f.rating || 0), 0);
        return {
          ...c,
          rating: Number((sum / courseFbs.length).toFixed(1)),
          totalRatings: courseFbs.length
        };
      }
      return {
        ...c,
        rating: 0,
        totalRatings: 0
      };
    });
};

const loadLocalEnrollments = (): Enrollment[] => {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem("cc_enrollments");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalEnrollments = (enrollments: Enrollment[]) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("cc_enrollments", JSON.stringify(enrollments));
    }
  } catch {}
};

const sanitizeEnrollments = (enrollments: any[]): Enrollment[] => {
  return (enrollments || [])
    .filter((e) => {
      if (!e || !e.courseId) return false;
      if (["c1", "c2", "c3", "c4", "c5", "c-raj-tiwari-dsa"].includes(e.courseId)) return false;
      return true;
    })
    .map((e) => ({
      ...e,
      traineeId: e.traineeId || e.userId || (e as any).user_id || "",
    }));
};

const mergeEnrollmentSources = (cloudEnrollments: Enrollment[]): Enrollment[] => {
  const local = loadLocalEnrollments();
  const userEnrolls: Enrollment[] = [];
  try {
    const allUsers = useUsersStore.getState().users;
    for (const u of allUsers) {
      const enrolledList: string[] = (u.traineeProfile as any)?.enrolledCourses || (u.traineeProfile as any)?.enrolled_courses || [];
      for (const cid of enrolledList) {
        userEnrolls.push({
          id: `enr-${u.id}-${cid}`,
          traineeId: u.id,
          courseId: cid,
          enrolledAt: new Date().toISOString(),
          progress: 0
        });
      }
    }
  } catch {}

  // Also include currentUser from authStore
  try {
    const authUser = useAuthStore.getState().currentUser;
    if (authUser) {
      const authList: string[] =
        (authUser.traineeProfile as any)?.enrolledCourses ||
        (authUser.traineeProfile as any)?.enrolled_courses ||
        [];
      for (const cid of authList) {
        userEnrolls.push({
          id: `enr-${authUser.id}-${cid}`,
          traineeId: authUser.id,
          courseId: cid,
          enrolledAt: new Date().toISOString(),
          progress: 0
        });
      }
    }
  } catch {}

  const mergedMap = new Map<string, Enrollment>();
  for (const e of [...local, ...userEnrolls, ...cloudEnrollments]) {
    if (e && (e.traineeId || (e as any).userId) && e.courseId) {
      const tid = e.traineeId || (e as any).userId;
      const key = `${tid}_${e.courseId}`;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, { ...e, traineeId: tid });
      }
    }
  }
  const result = Array.from(mergedMap.values());
  saveLocalEnrollments(result);
  return result;
};

const sanitizeFeedbacks = (feedbacks: Feedback[]): Feedback[] => {
  return (feedbacks || []).filter((f) => {
    if (!f || !f.id) return false;
    if (["fb-1", "fb-2", "fb-3", "fb-4"].includes(f.id)) return false;
    const comment = (f.comment || "").toLowerCase();
    if (
      comment.includes("world-class") ||
      comment.includes("pointers and memory management concepts were explained") ||
      comment.includes("concise yet powerful lectures on normalization") ||
      comment.includes("outstanding roadmap for binary trees")
    ) {
      return false;
    }
    return true;
  });
};

const sanitizeCertificates = (certificates: Certificate[]): Certificate[] => {
  return (certificates || []).filter((c) => {
    if (!c || !c.courseId) return false;
    if (c.courseId === "c-raj-tiwari-dsa") return false;
    return true;
  });
};

export const useCoursesStore = create<CoursesState>((set, get) => ({
  courses: [],
  enrollments: loadLocalEnrollments(),
  certificates: [],
  feedbacks: [],
  isSubscribed: false,

  initSubscription: () => {
    if (get().isSubscribed) return;
    set({ isSubscribed: true });

    // Real-time server sync listeners with 400ms debounce and lock to eliminate cascading render storms
    let refreshDebounce: any = null;
    let isRefreshing = false;

    const refreshAll = () => {
      if (refreshDebounce) clearTimeout(refreshDebounce);
      refreshDebounce = setTimeout(async () => {
        if (isRefreshing) return;
        isRefreshing = true;
        try {
          const [cloudCourses, cloudEnrollments, cloudFeedbacks, cloudCertificates] = await Promise.all([
            dbService.getAll<Course>("courses", 200),
            dbService.getAll<Enrollment>("enrollments"),
            dbService.getAll<Feedback>("feedbacks"),
            dbService.getAll<Certificate>("certificates"),
          ]);

          const validFeedbacks = sanitizeFeedbacks(cloudFeedbacks || []);
          const validCourses = sanitizeCourses(cloudCourses || [], validFeedbacks);
          const validEnrollments = sanitizeEnrollments(cloudEnrollments || []);
          const validCertificates = sanitizeCertificates(cloudCertificates || []);
          const finalEnrollments = mergeEnrollmentSources(validEnrollments);

          set({
            courses: validCourses,
            enrollments: finalEnrollments,
            feedbacks: validFeedbacks,
            certificates: validCertificates,
          });
        } catch (err) {
          console.warn("Could not sync courses from cloud:", err);
        } finally {
          isRefreshing = false;
        }
      }, 400);
    };

    dbService.subscribe("courses", () => refreshAll());
    dbService.subscribe("enrollments", () => refreshAll());
    dbService.subscribe("feedbacks", () => refreshAll());
    dbService.subscribe("certificates", () => refreshAll());
    dbService.subscribe("users", () => refreshAll());
  },

  load: () => {
    get().initSubscription();

    Promise.all([
      dbService.getAll<Course>("courses", 200),
      dbService.getAll<Enrollment>("enrollments"),
      dbService.getAll<Feedback>("feedbacks"),
      dbService.getAll<Certificate>("certificates")
    ]).then(([srvCourses, srvEnrollments, srvFeedbacks, srvCertificates]) => {
      const activeFeedbacks = sanitizeFeedbacks(srvFeedbacks || []);
      const activeCourses = sanitizeCourses(srvCourses || [], activeFeedbacks);
      const activeEnrollments = sanitizeEnrollments(srvEnrollments || []);
      const activeCertificates = sanitizeCertificates(srvCertificates || []);
      const finalEnrollments = mergeEnrollmentSources(activeEnrollments);

      set({
        courses: activeCourses,
        enrollments: finalEnrollments,
        feedbacks: activeFeedbacks,
        certificates: activeCertificates
      });

      if (useUsersStore.getState().users.length === 0) {
        useUsersStore.getState().load().then(() => {
          const fresh = mergeEnrollmentSources(get().enrollments);
          set({ enrollments: fresh });
        });
      }
    }).catch(() => {});
  },

  enroll: (traineeId, courseId) => {
    const { enrollments } = get();
    const already = enrollments.find(
      (e) => (e.traineeId === traineeId || (e as any).userId === traineeId) && e.courseId === courseId
    );
    if (already) return;

    const newEnrollment: Enrollment = {
      id: generateId("enr"),
      traineeId,
      courseId,
      enrolledAt: new Date().toISOString(),
      progress: 0
    };
    const updated = [...enrollments, newEnrollment];
    set({ enrollments: updated });
    saveLocalEnrollments(updated);

    // 1. Update currentUser in authStore and localStorage
    try {
      const authUser = useAuthStore.getState().currentUser;
      if (authUser && authUser.id === traineeId) {
        const existingAuthCourses: string[] =
          (authUser.traineeProfile as any)?.enrolledCourses ||
          (authUser.traineeProfile as any)?.enrolled_courses ||
          [];
        const updatedAuthCourses = Array.from(new Set([...existingAuthCourses, courseId]));
        const updatedAuthProfile: TraineeProfile = {
          qualifications: [],
          experience: [],
          skills: [],
          interests: [],
          certificates: [],
          bio: "",
          phone: "",
          department: "",
          designation: "",
          xpPoints: 0,
          streakDays: 0,
          completedCoursesCount: 0,
          badges: [],
          ...(authUser.traineeProfile || {}),
          enrolledCourses: updatedAuthCourses
        };
        const updatedAuthUser: User = { ...authUser, traineeProfile: updatedAuthProfile };
        useAuthStore.setState({ currentUser: updatedAuthUser });
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.user = updatedAuthUser;
            localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(parsed));
          }
        } catch {}
      }
    } catch {}

    // 2. Persist to usersStore & Supabase users table
    try {
      const allUsers = useUsersStore.getState().users;
      const targetUser = allUsers.find((u) => u.id === traineeId);
      const existingCourses: string[] =
        (targetUser?.traineeProfile as any)?.enrolledCourses ||
        (targetUser?.traineeProfile as any)?.enrolled_courses ||
        [];
      const enrolledCourses = Array.from(new Set([...existingCourses, courseId]));
      const updatedProfile: TraineeProfile = {
        qualifications: [],
        experience: [],
        skills: [],
        interests: [],
        certificates: [],
        bio: "",
        phone: "",
        department: "",
        designation: "",
        xpPoints: 0,
        streakDays: 0,
        completedCoursesCount: 0,
        badges: [],
        ...(targetUser?.traineeProfile || {}),
        enrolledCourses
      };

      if (targetUser) {
        useUsersStore.setState((state) => ({
          users: state.users.map((u) => (u.id === traineeId ? { ...u, traineeProfile: updatedProfile } : u))
        }));
      }

      dbService.update("users", traineeId, {
        trainee_profile: updatedProfile
      }).catch(() => {});
    } catch {}

    dbService.create("enrollments", newEnrollment).catch(() => {});

    try {
      const course = get().courses.find((c) => c.id === courseId);
      recordAuditEvent({
        actor: traineeId,
        role: "trainee",
        action: "COURSE_ENROLLED",
        target: course?.title || courseId,
        status: "SUCCESS"
      });
    } catch {}
  },

  unenroll: (traineeId, courseId) => {
    const { enrollments } = get();
    const target = enrollments.find(
      (e) => (e.traineeId === traineeId || (e as any).userId === traineeId) && e.courseId === courseId
    );
    const updated = enrollments.filter(
      (e) => !((e.traineeId === traineeId || (e as any).userId === traineeId) && e.courseId === courseId)
    );
    set({ enrollments: updated });
    saveLocalEnrollments(updated);

    // 1. Sync removal to authStore if current user
    try {
      const authUser = useAuthStore.getState().currentUser;
      if (authUser && authUser.id === traineeId) {
        const existingAuthCourses: string[] =
          (authUser.traineeProfile as any)?.enrolledCourses ||
          (authUser.traineeProfile as any)?.enrolled_courses ||
          [];
        const updatedAuthCourses = existingAuthCourses.filter((cid) => cid !== courseId);
        const updatedAuthProfile: TraineeProfile = {
          qualifications: [],
          experience: [],
          skills: [],
          interests: [],
          certificates: [],
          bio: "",
          phone: "",
          department: "",
          designation: "",
          xpPoints: 0,
          streakDays: 0,
          completedCoursesCount: 0,
          badges: [],
          ...(authUser.traineeProfile || {}),
          enrolledCourses: updatedAuthCourses
        };
        const updatedAuthUser: User = { ...authUser, traineeProfile: updatedAuthProfile };
        useAuthStore.setState({ currentUser: updatedAuthUser });
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.user = updatedAuthUser;
            localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(parsed));
          }
        } catch {}
      }
    } catch {}

    // 2. Sync removal to usersStore & Supabase users table
    try {
      const allUsers = useUsersStore.getState().users;
      const targetUser = allUsers.find((u) => u.id === traineeId);
      const existingCourses: string[] =
        (targetUser?.traineeProfile as any)?.enrolledCourses ||
        (targetUser?.traineeProfile as any)?.enrolled_courses ||
        [];
      const enrolledCourses = existingCourses.filter((cid) => cid !== courseId);
      const updatedProfile: TraineeProfile = {
        qualifications: [],
        experience: [],
        skills: [],
        interests: [],
        certificates: [],
        bio: "",
        phone: "",
        department: "",
        designation: "",
        xpPoints: 0,
        streakDays: 0,
        completedCoursesCount: 0,
        badges: [],
        ...(targetUser?.traineeProfile || {}),
        enrolledCourses
      };

      if (targetUser) {
        useUsersStore.setState((state) => ({
          users: state.users.map((u) => (u.id === traineeId ? { ...u, traineeProfile: updatedProfile } : u))
        }));
      }

      dbService.update("users", traineeId, {
        trainee_profile: updatedProfile
      }).catch(() => {});
    } catch {}

    dbService.removeEnrollment(traineeId, courseId, target?.id).catch(() => {});

    try {
      const course = get().courses.find((c) => c.id === courseId);
      recordAuditEvent({
        actor: traineeId,
        role: "trainee",
        action: "COURSE_UNENROLLED",
        target: course?.title || courseId,
        status: "SUCCESS"
      });
    } catch {}
  },

  updateProgress: (enrollmentId, progress) => {
    const { enrollments } = get();
    const updated = enrollments.map((e) => (e.id === enrollmentId ? { ...e, progress } : e));
    set({ enrollments: updated });
    saveLocalEnrollments(updated);
    dbService.update("enrollments", enrollmentId, { progress }).catch(() => {});
  },

  completeCourse: (traineeId, courseId, grade, scorePercentage, certData) => {
    const { enrollments, certificates, courses } = get();
    const updated = enrollments.map((e) =>
      (e.traineeId === traineeId || (e as any).userId === traineeId) && e.courseId === courseId
        ? { ...e, progress: 100, completedAt: new Date().toISOString() }
        : e
    );
    saveLocalEnrollments(updated);
    const targetEnrollment = updated.find(
      (e) => (e.traineeId === traineeId || (e as any).userId === traineeId) && e.courseId === courseId
    );
    if (targetEnrollment?.id) {
      dbService.update("enrollments", targetEnrollment.id, { progress: 100, completedAt: targetEnrollment.completedAt }).catch(() => {});
    }

    const course = courses.find((c) => c.id === courseId);
    try {
      recordAuditEvent({
        actor: traineeId,
        role: "trainee",
        action: "COURSE_COMPLETED",
        target: course?.title || courseId,
        status: "SUCCESS"
      });
    } catch {}
    const certExists = certificates.find((c) => c.traineeId === traineeId && c.courseId === courseId);

    if (course && !certExists) {
      const user = useUsersStore.getState().users.find((u) => u.id === traineeId);
      const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
      const certHash = certData?.certificateHash || `CC-CERT-${randomSuffix}`;
      const defaultGrade = scorePercentage !== undefined
        ? (scorePercentage >= 90 ? `Distinction (${scorePercentage}%)` : `Passed (${scorePercentage}%)`)
        : (grade || "Passed (100%)");

      const origin = typeof window !== "undefined" ? window.location.origin : "https://capacityconnect.org";
      const cert: Certificate = {
        id: certData?.id || generateId("cert"),
        traineeId,
        traineeName: certData?.traineeName || user?.name || "Student",
        courseId,
        courseTitle: course.title,
        issuedAt: certData?.issuedAt || new Date().toISOString(),
        trainerName: certData?.trainerName || course.trainerName,
        certificateHash: certHash,
        grade: certData?.grade || grade || defaultGrade,
        verificationUrl: certData?.verificationUrl || `${origin}/verify/id?cert=${encodeURIComponent(certHash)}&name=${encodeURIComponent(user?.name || "Student")}&course=${encodeURIComponent(course.title)}`
      };
      const updatedCerts = [...certificates, cert];
      set({ enrollments: updated, certificates: updatedCerts });
      dbService.create("certificates", cert).catch(() => {});
      return cert;
    } else {
      set({ enrollments: updated });
      return certExists;
    }
  },

  addResource: (resource) => {
    const { courses } = get();
    const updated = courses.map((c) =>
      c.id === resource.courseId ? { ...c, resources: [...(c.resources || []), resource] } : c
    );
    set({ courses: updated });
    const targetCourse = updated.find((c) => c.id === resource.courseId);
    if (targetCourse) {
      dbService.update("courses", resource.courseId, { resources: targetCourse.resources }).catch(() => {});
    }
  },

  deleteResource: (courseId, resourceId) => {
    const { courses } = get();
    const updated = courses.map((c) =>
      c.id === courseId ? { ...c, resources: (c.resources || []).filter((r) => r.id !== resourceId) } : c
    );
    set({ courses: updated });
    const targetCourse = updated.find((c) => c.id === courseId);
    if (targetCourse) {
      dbService.update("courses", courseId, { resources: targetCourse.resources }).catch(() => {});
    }
  },

  addCourse: (course) => {
    const { courses } = get();
    const currentUser = useAuthStore.getState().currentUser;
    // Prevent duplicate entries of the same course
    const exists = courses.some((c) => c.id === course.id || (c.title.trim().toLowerCase() === course.title.trim().toLowerCase() && c.trainerId === course.trainerId));
    if (exists) {
      console.warn("Course with identical ID or title/trainer already exists, skipping duplicate addition:", course.title);
      return;
    }

    // If not a verified platform administrator, course requires moderation queue approval
    let sanitizedCourse = { ...course };
    if (!isRealAdmin(currentUser)) {
      sanitizedCourse.status = "pending_approval";
    }

    const updated = [...courses, sanitizedCourse];
    set({ courses: updated });
    dbService.create("courses", sanitizedCourse).catch(() => {});
  },

  updateCourse: (courseId, updates) => {
    const { courses } = get();
    const targetCourse = courses.find((c) => c.id === courseId);
    const currentUser = useAuthStore.getState().currentUser;

    // CRITICAL: Only REAL ADMIN (e.g. vkt052005@gmail.com) can verify & approve courses into active state
    if (updates.status === "active" && targetCourse?.status === "pending_approval") {
      if (!isRealAdmin(currentUser)) {
        console.warn("[AdminAuth] Verification & approval restricted to Real Admin. Blocked for:", currentUser?.email);
        return;
      }
    }

    const updated = courses.map((c) => (c.id === courseId ? { ...c, ...updates } : c));
    set({ courses: updated });
    dbService.update("courses", courseId, updates).catch(() => {});
  },

  deleteCourse: (courseId) => {
    const { courses, enrollments, feedbacks, certificates } = get();
    const courseToDelete = courses.find((c) => c.id === courseId);
    const currentUser = useAuthStore.getState().currentUser;

    if (isProtectedProductionCourse(courseToDelete)) {
      console.warn("[Protected] Production course deletion blocked:", courseId);
      return;
    }

    // 1. Remove course from state
    const updatedCourses = courses.filter((c) => c.id !== courseId);

    // 3. Cascade remove enrollments
    const enrollmentsToRemove = enrollments.filter((e) => e.courseId === courseId);
    const updatedEnrollments = enrollments.filter((e) => e.courseId !== courseId);

    // 4. Cascade remove feedbacks
    const feedbacksToRemove = feedbacks.filter((f) => f.courseId === courseId);
    const updatedFeedbacks = feedbacks.filter((f) => f.courseId !== courseId);

    // 5. Cascade remove certificates
    const certsToRemove = certificates.filter((c) => c.courseId === courseId);
    const updatedCertificates = certificates.filter((c) => c.courseId !== courseId);

    set({
      courses: updatedCourses,
      enrollments: updatedEnrollments,
      feedbacks: updatedFeedbacks,
      certificates: updatedCertificates
    });

    // 6. Clean up stored video blobs from IndexedDB if any
    if (courseToDelete?.lessons) {
      for (const lesson of courseToDelete.lessons) {
        if (lesson.id) deleteVideoBlob(lesson.id).catch(() => {});
        if (lesson.videoId) deleteVideoBlob(lesson.videoId).catch(() => {});
      }
    }

    // 7. Cascade remove assessments and attempts for this course
    try {
      dbService.removeWhere("assessments", "course_id", courseId).catch(() => {});
    } catch (e) {}

    // 8. Cascade remove live sessions
    try {
      dbService.removeWhere("live_sessions", "course_id", courseId).catch(() => {});
    } catch (e) {}

    // 10. Permanently remove from central DB & cloud Supabase
    dbService.remove("courses", courseId).catch(() => {});
    enrollmentsToRemove.forEach((e) => dbService.remove("enrollments", e.id).catch(() => {}));
    feedbacksToRemove.forEach((f) => dbService.remove("feedbacks", f.id).catch(() => {}));
    certsToRemove.forEach((c) => dbService.remove("certificates", c.id).catch(() => {}));
  },

  addFeedback: (fb) => {
    const { feedbacks, courses, enrollments } = get();

    // Guard: Trainee MUST be enrolled in the course to rate it
    const isEnrolled = get().isEnrolled(fb.traineeId, fb.courseId);
    if (!isEnrolled) {
      console.warn("Feedback rejected: Trainee is not enrolled in course", fb.courseId);
      return;
    }

    // Upsert feedback: update existing rating if student previously reviewed this course
    const existingIndex = feedbacks.findIndex(
      (f) => f.courseId === fb.courseId && f.traineeId === fb.traineeId
    );
    let updatedFeedbacks: typeof feedbacks;
    if (existingIndex >= 0) {
      const existingId = feedbacks[existingIndex].id;
      const updatedItem = { ...fb, id: existingId };
      updatedFeedbacks = [...feedbacks];
      updatedFeedbacks[existingIndex] = updatedItem;
      dbService.update("feedbacks", existingId, updatedItem).catch(() => {});
    } else {
      updatedFeedbacks = [fb, ...feedbacks];
      dbService.create("feedbacks", fb).catch(() => {});
    }


    // Automatically recalculate the overall quality rating for this course directly from authentic student ratings
    const courseFeedbacks = updatedFeedbacks.filter((f) => f.courseId === fb.courseId);
    const sumRatings = courseFeedbacks.reduce((acc, f) => acc + f.rating, 0);
    const avgRating = Number((sumRatings / courseFeedbacks.length).toFixed(1));

    const updatedCourses = courses.map((c) => {
      if (c.id === fb.courseId) {
        return {
          ...c,
          rating: avgRating,
          totalRatings: courseFeedbacks.length
        };
      }
      return c;
    });

    set({ feedbacks: updatedFeedbacks, courses: updatedCourses });
    dbService.update("courses", fb.courseId, { rating: avgRating, totalRatings: courseFeedbacks.length }).catch(() => {});
  },

  deleteFeedback: (feedbackId) => {
    const { feedbacks, courses } = get();
    const targetFeedback = feedbacks.find((f) => f.id === feedbackId);
    const updatedFeedbacks = feedbacks.filter((f) => f.id !== feedbackId);
    dbService.remove("feedbacks", feedbackId).catch(() => {});

    if (targetFeedback) {
      const remainingCourseFeedbacks = updatedFeedbacks.filter((f) => f.courseId === targetFeedback.courseId);
      const avgRating =
        remainingCourseFeedbacks.length > 0
          ? Number((remainingCourseFeedbacks.reduce((acc, f) => acc + f.rating, 0) / remainingCourseFeedbacks.length).toFixed(1))
          : 0;

      const updatedCourses = courses.map((c) => {
        if (c.id === targetFeedback.courseId) {
          return {
            ...c,
            rating: avgRating,
            totalRatings: remainingCourseFeedbacks.length
          };
        }
        return c;
      });
      set({ feedbacks: updatedFeedbacks, courses: updatedCourses });
      dbService.update("courses", targetFeedback.courseId, { rating: avgRating, totalRatings: remainingCourseFeedbacks.length }).catch(() => {});
    } else {
      set({ feedbacks: updatedFeedbacks });
    }
  },

  getCourseFeedbacks: (courseId) => {
    return get().feedbacks.filter((f) => f.courseId === courseId);
  },

  getTrainerFeedbacks: (trainerId) => {
    const { courses, feedbacks } = get();
    const trainerCourseIds = new Set(courses.filter((c) => c.trainerId === trainerId).map((c) => c.id));
    return feedbacks.filter((f) => f.trainerId === trainerId || trainerCourseIds.has(f.courseId));
  },

  isEnrolled: (traineeId, courseId) => {
    if (!traineeId || !courseId) return false;
    const fromEnrollments = get().enrollments.some(
      (e) => (e.traineeId === traineeId || (e as any).userId === traineeId) && e.courseId === courseId
    );
    if (fromEnrollments) return true;

    try {
      const authUser = useAuthStore.getState().currentUser;
      if (authUser && authUser.id === traineeId) {
        const list: string[] =
          (authUser.traineeProfile as any)?.enrolledCourses ||
          (authUser.traineeProfile as any)?.enrolled_courses ||
          [];
        if (list.includes(courseId)) return true;
      }

      const user = useUsersStore.getState().users.find((u) => u.id === traineeId);
      if (user) {
        const list: string[] =
          (user.traineeProfile as any)?.enrolledCourses ||
          (user.traineeProfile as any)?.enrolled_courses ||
          [];
        if (list.includes(courseId)) return true;
      }
    } catch {}

    return false;
  },

  getEnrollment: (traineeId, courseId) => {
    if (!traineeId || !courseId) return undefined;
    const found = get().enrollments.find(
      (e) => (e.traineeId === traineeId || (e as any).userId === traineeId) && e.courseId === courseId
    );
    if (found) return found;

    if (get().isEnrolled(traineeId, courseId)) {
      return {
        id: `enr-${traineeId}-${courseId}`,
        traineeId,
        courseId,
        enrolledAt: new Date().toISOString(),
        progress: 0
      };
    }

    return undefined;
  },

  getTraineeCertificates: (traineeId) => {
    return get().certificates.filter((c) => c.traineeId === traineeId || (c as any).userId === traineeId);
  },

  getTrainerCourses: (trainerId) => {
    return get().courses.filter((c) => c.trainerId === trainerId);
  }
}));
