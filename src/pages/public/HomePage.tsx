import { getCourseThumbnail } from "../../utils/courseThumbnail";
import { formatCourseDuration } from "../../utils/courseDuration";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, BookOpen, Award, Users, ChevronRight, ChevronDown,
  TrendingUp, Shield, Zap, ArrowRight, CheckCircle2,
  Video, Brain, ShieldCheck, Flame, Star, QrCode, Search,
  HelpCircle, Mail, Send, MapPin,
  Bell, AlertTriangle, FileText
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useCoursesStore } from "../../store/coursesStore";
import { useNotificationsStore } from "../../store/notificationsStore";
import { useAppStore } from "../../store/appStore";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { ToastContainer } from "../../components/common/ToastContainer";
import { initialCourses, initialNotifications } from "../../data/seed";

export const HomePage: React.FC = () => {
  const { courses, load } = useCoursesStore();
  const { notifications, load: loadNotifs } = useNotificationsStore();
  const { currentUser } = useAuthStore();
  const { addToast } = useAppStore();

  useEffect(() => {
    load();
    loadNotifs();
  }, [load, loadNotifs]);

  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [noticeFilter, setNoticeFilter] = useState<"all" | "announcement" | "new_content">("all");

  const featuredCourses = (courses && courses.length > 0 ? courses : initialCourses)
    .filter((c) => c.status !== "pending_approval")
    .slice(0, 4);
  const displayNotices = (notifications && notifications.length > 0 ? notifications : initialNotifications).filter(
    (n) =>
      n.type !== "achievement" &&
      !n.title.toLowerCase().includes("pending admin review") &&
      !n.title.toLowerCase().includes("pending approval")
  );
  const filteredNotices = displayNotices.filter((n) => {
    if (noticeFilter === "all") return true;
    return n.type === noticeFilter;
  });

  const handleRoleQuickStart = (role: "trainee" | "trainer" | "admin") => {
    navigate(`/login?role=${role}`);
  };

  const handleWatchCourse = (courseId: string) => {
    if (!currentUser) {
      addToast({
        title: "Login Required to Watch",
        message: "Please log in to watch this course and access video lectures.",
        type: "info"
      });
      navigate("/login", { state: { from: { pathname: `/trainee/course/${courseId}` } } });
    } else {
      navigate(`/trainee/course/${courseId}`);
    }
  };

  const faqs = [
    {
      q: "What is the CAPACITY CONNECT portal?",
      a: "CAPACITY CONNECT is a centralized, digital capacity building and learning management platform designed for the Ministry of Earth Sciences (MoES) and India Meteorological Department (IMD). It streamlines organizational upskilling, structured curricula, live interactive masterclasses, knowledge sharing, and competency tracking across departments."
    },
    {
      q: "Who can use the CAPACITY CONNECT portal and what roles are supported?",
      a: "The portal supports three distinct, role-governed user workspaces: \n• Trainees: Build professional profiles (qualifications, work experience, interests, skills), enroll in specialized courses, attend live Google Meet lectures, and take proctored MCQ assessments to earn certified credentials.\n• Trainers: Upload recorded lectures, presentations, and study materials to the Trainer Library, author questionnaires with submission deadlines, and monitor trainee participation.\n• Administrators: Manage user registrations and approvals, execute organizational competency mapping to bridge skill gaps, and broadcast official announcements."
    },
    {
      q: "How do trainees enroll in courses and access learning resources?",
      a: "Trainees can explore the Course Catalog, enroll in curriculum-backed programs with a single click, access lecture slides and downloadable PDFs from the Trainer Library, and join live interactive Google Meet sessions with automated attendance tracking."
    },
    {
      q: "How does the portal handle assessments, deadlines, and certifications?",
      a: "Trainers create subject-wise MCQ evaluations with strict submission deadlines and passing thresholds (e.g. 40%). Trainees complete these tests within an anti-cheat proctored environment. Achieving a passing score automatically issues an instant, cryptographically verifiable digital certificate complete with a QR code and ledger record."
    },
    {
      q: "How does Competency Mapping work on CAPACITY CONNECT?",
      a: "Competency Mapping is an intelligent executive tool that compares departmental operational demands against verified faculty skills and ratings. It highlights high-priority knowledge gaps and recommends the most qualified internal or visiting trainers for specialized training programs."
    },
    {
      q: "Is CAPACITY CONNECT accessible on mobile devices and low-bandwidth environments?",
      a: "Yes. CAPACITY CONNECT is fully responsive across smartphones, tablets, and desktop workstations. It features seamless QR-code instant mobile login, real-time multi-device cloud synchronization, and a built-in Data-Saver mode designed for field officers and low-bandwidth remote meteorological stations."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#000000] text-[#f5f5f7] relative selection:bg-[#0071e3] selection:text-white">
      {/* Ambient Glow Orbs */}
      <div className="glow-orb-primary" />
      <div className="glow-orb-secondary" />

      <Header />

      <main className="flex-1 space-y-10 pb-12 overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-4 sm:pt-10 pb-8 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 text-center space-y-5 sm:space-y-6 z-10">
          {/* Large Hero Brand Logo */}
          <div className="flex justify-center mb-1">
            <img
              src="/logo.png"
              alt="Capacity Connect Logo"
              className="w-20 h-20 sm:w-32 sm:h-32 object-contain drop-shadow-[0_0_35px_rgba(41,151,255,0.7)] hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-[#2997ff]/40 bg-[#0071e3]/10 text-[#2997ff] text-[11px] sm:text-[12.5px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]" />
            <span>Competency Development Portal</span>
          </div>

          <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto px-2">
            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-snug">
              Digital Capacity Building &
              <span className="block mt-1 sm:mt-2.5 pb-1 bg-gradient-to-r from-[#2997ff] via-[#64d2ff] to-[#a1e3ff] bg-clip-text text-transparent">
                Learning Management
              </span>
            </h1>
            <p className="text-xs sm:text-[15px] text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
              A centralized web platform supporting organizational training, competency development, and knowledge sharing through structured courses, MCQ assessments, and verified certifications.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2 w-full max-w-xs sm:max-w-none mx-auto">
            <Link
              to="/register"
              className="apple-btn-primary w-full sm:w-auto px-6 py-3 sm:py-2.5 text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 min-h-[44px]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="apple-btn-secondary w-full sm:w-auto px-6 py-3 sm:py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center min-h-[44px]"
            >
              Sign In to Portal
            </Link>
          </div>

          {/* Quick Role Entrance Cards */}
          <div className="pt-6 sm:pt-8 max-w-5xl mx-auto">
            <p className="text-[11px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3 sm:mb-4">
              Select User Role to Access Workspace
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Trainee */}
              <div
                onClick={() => handleRoleQuickStart("trainee")}
                className="glass-card p-4 sm:p-5 text-left space-y-1.5 sm:space-y-2 cursor-pointer group hover:border-[#2997ff]/60 transition"
              >
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#2997ff] transition flex items-center justify-between">
                    <span>Trainee</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2997ff] transition" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Professional profile, enrolled courses, MCQ tests & verified certificates.
                  </p>
                </div>
              </div>

              {/* Trainer */}
              <div
                onClick={() => handleRoleQuickStart("trainer")}
                className="glass-card p-4 sm:p-5 text-left space-y-1.5 sm:space-y-2 cursor-pointer group hover:border-[#2997ff]/60 transition"
              >
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#2997ff] transition flex items-center justify-between">
                    <span>Trainer</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2997ff] transition" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Schedule live lectures, author questionnaires, library & trainee gradebook.
                  </p>
                </div>
              </div>

              {/* Administrator */}
              <div
                onClick={() => handleRoleQuickStart("admin")}
                className="glass-card p-4 sm:p-5 text-left space-y-1.5 sm:space-y-2 cursor-pointer group hover:border-[#2997ff]/60 transition"
              >
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#2997ff] transition flex items-center justify-between">
                    <span>Administrator</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2997ff] transition" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    User approval, competency mapping, announcements & executive reports.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Official Notices & Announcements Section */}
        {filteredNotices.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0071e3]/15 border border-[#0071e3]/30 flex items-center justify-center text-[#2997ff]">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-wide">
                      Official Notice Board & Announcements
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Official circulars, academic notices, and course updates
                    </p>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { key: "all", label: "All Notices" },
                    { key: "announcement", label: "Official Circulars" },
                    { key: "new_content", label: "Course Updates" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setNoticeFilter(tab.key as any)}
                      className={`px-3 py-1 rounded-md text-[11px] font-medium transition whitespace-nowrap cursor-pointer ${
                        noticeFilter === tab.key
                          ? "bg-[#0071e3] text-white shadow-sm"
                          : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredNotices.map((n) => {
                  const isCourse = n.type === "new_content";
                  return (
                    <div
                      key={n.id}
                      className="rounded-xl p-4 border border-white/10 hover:border-[#0071e3]/40 bg-slate-900/60 transition space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isCourse
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-blue-500/10 text-[#2997ff] border-blue-500/20"
                          }`}>
                            {isCourse ? <BookOpen className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            <span>{isCourse ? "Course Update" : "Official Circular"}</span>
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-white leading-snug">
                          {n.title}
                        </h3>

                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                          {n.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-[10px] text-slate-400">
                        <span>{n.author}</span>
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Core Architectural Pillars */}
        <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Key Platform Features
            </h2>
            <p className="text-xs text-slate-400">
              A comprehensive system built for structured engineering curricula, live Google Meet teaching, proctored examinations, and verified credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Competency Mapping Engine",
                desc: "Matches organizational and student learning requirements with verified faculty competencies to pinpoint and bridge technical knowledge gaps."
              },
              {
                title: "Official Google Meet & Live Classes",
                desc: "Live classes conducted on official Google Meet with automatic course enrollment verification and live attendance tracking."
              },
              {
                title: "Full Video Curriculums & Video Studio",
                desc: "Verified educators publish comprehensive video playlists, syllabus modules, slide decks, and lecture materials for self-paced learning."
              },
              {
                title: "Proctored MCQ Assessment Engine",
                desc: "Timed subject-wise assessments with anti-cheat tab monitoring, proctoring security guard, and instant score evaluation."
              },
              {
                title: "Verifiable Digital Certificates",
                desc: "Official course completion certificates with unique verification hashes and QR codes for authentic credential verification."
              },
              {
                title: "Learner Progress & Recognition",
                desc: "Track completed courses, earn milestone badges, maintain daily learning streaks, and view departmental achievements."
              }
            ].map((f, i) => (
              <div key={i} className="card p-5 space-y-2 hover:border-white/20 transition">
                <h3 className="text-xs font-bold text-white tracking-tight">{f.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Courses Spotlight */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Featured Courses
              </h2>
              <p className="text-xs text-slate-400">
                Curated capacity building programs from verified instructors
              </p>
            </div>
            <Link
              to="/courses"
              className="text-xs text-[#2997ff] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Browse Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {featuredCourses.length === 1 ? (
            <div className="max-w-3xl mx-auto">
              {featuredCourses.map((c) => (
                <div key={c.id} className="card overflow-hidden grid grid-cols-1 sm:grid-cols-12 group hover:border-[#2997ff]/50 transition shadow-2xl">
                  <div
                    onClick={() => handleWatchCourse(c.id)}
                    className="sm:col-span-5 relative min-h-[220px] overflow-hidden cursor-pointer"
                  >
                    <img
                      src={getCourseThumbnail(c)}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = getCourseThumbnail(c);
                        if (!target.src.endsWith(fallback)) {
                          target.src = fallback;
                        }
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="badge-blue text-[10px] font-bold">Featured Playlist</span>
                    </div>
                  </div>
                  <div className="sm:col-span-7 p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="badge-blue text-[9px]">{c.category}</span>
                        <span className="badge-green text-[9px]">{c.lessons?.length || (c.id === 'c-dsa' ? 315 : 139)} Lessons</span>
                        {c.rating && c.totalRatings && c.totalRatings > 0 ? (
                          <span className="badge-blue text-[9px] font-mono">⭐ {c.rating.toFixed(1)}</span>
                        ) : (
                          <span className="badge-gray text-[9px]">Unrated</span>
                        )}
                      </div>
                      <h3
                        onClick={() => handleWatchCourse(c.id)}
                        className="text-base sm:text-lg font-bold text-white group-hover:text-[#2997ff] transition cursor-pointer"
                      >
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Instructor: <strong className="text-white">{c.trainerName}</strong>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">⏱ {formatCourseDuration(c)}</span>
                      {currentUser ? (
                        <Link
                          to={`/trainee/course/${c.id}`}
                          className="apple-btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5"
                        >
                          <span>Start Learning</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleWatchCourse(c.id)}
                          className="apple-btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Start Learning</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredCourses.map((c) => (
                <div key={c.id} className="card overflow-hidden flex flex-col justify-between group hover:border-[#2997ff]/50 transition">
                  <div>
                    <div
                      onClick={() => handleWatchCourse(c.id)}
                      className="relative h-32 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={getCourseThumbnail(c)}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = getCourseThumbnail(c);
                          if (!target.src.endsWith(fallback)) {
                            target.src = fallback;
                          }
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <span className="badge-blue text-[8px]">{c.category}</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-1.5">
                      <h3
                        onClick={() => handleWatchCourse(c.id)}
                        className="text-xs font-bold text-white line-clamp-2 cursor-pointer group-hover:text-[#2997ff] transition"
                      >
                        {c.title}
                      </h3>
                      <p className="text-[10px] text-slate-400">Instructor: {c.trainerName}</p>
                    </div>
                  </div>
                  <div className="p-4 pt-0 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">{formatCourseDuration(c)}</span>
                    {currentUser ? (
                      <Link
                        to={`/trainee/course/${c.id}`}
                        className="text-xs text-[#2997ff] font-semibold hover:underline flex items-center gap-0.5"
                      >
                        <span>View Course</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleWatchCourse(c.id)}
                        className="text-xs text-[#2997ff] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>View Course</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Expected Outcomes & Operational Delivery */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="glass-panel p-6 sm:p-8 border border-white/15 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Projected Learning & Operational Impact
              </h2>
              <p className="text-[11px] text-slate-400">
                Estimated benchmarks and rough targets expected from active student batches and curricula
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              {[
                {
                  range: "~70% – 85%",
                  title: "Target Concept Mastery",
                  note: "Roughly expected comprehension gain across structured playlists and syllabus modules"
                },
                {
                  range: "~60% – 75%",
                  title: "Batch Completion Target",
                  note: "Projected completion range when self-paced video learning is combined with live Meet check-ins"
                },
                {
                  range: "~40% – 50%",
                  title: "Knowledge Gap Reduction",
                  note: "Estimated reduction in technical skill gaps identified through periodic MCQ assessments"
                },
                {
                  range: "~25 – 40 Hours",
                  title: "Estimated Curriculum Depth",
                  note: "Rough average hours of lecture content, slide review, and evaluation per subject track"
                }
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 hover:border-white/20 transition">
                  <p className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">{item.range}</p>
                  <h3 className="text-xs font-bold text-slate-200">{item.title}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        

        {/* FAQ Accordion */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-[11.5px] text-slate-400">
              Everything you need to know about the CAPACITY CONNECT digital learning & capacity building portal.
            </p>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={"rounded-xl overflow-hidden border transition-all " + (isOpen ? "border-[#2997ff]/40 bg-[#0071e3]/[0.08]" : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]")}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-white">
                      {faq.q}
                    </span>
                    <ChevronDown className={"w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform " + (isOpen ? "rotate-180 text-[#2997ff]" : "")} />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3 pt-1 text-[11px] text-slate-300 leading-relaxed border-t border-white/5 animate-fadeIn whitespace-pre-line">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>



        {/* Monthly Capacity Bulletin Newsletter */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="card p-6 sm:p-8 border-[#2997ff]/30 bg-gradient-to-r from-blue-950/30 to-purple-950/20 text-center space-y-4">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Subscribe to Monthly Capacity Bulletins & Exam Schedules
              </h2>
              <p className="text-xs text-slate-300 max-w-lg mx-auto">
                Get official notifications regarding upcoming live masterclasses, certification deadlines, and skill mapping digests.
              </p>
            </div>

            {subscribed ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Subscribed successfully to monthly capacity briefings.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (subscribeEmail.trim()) setSubscribed(true);
                }}
                className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
              >
                <input
                  type="email"
                  required
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  placeholder="Enter your official email"
                  className="apple-input text-xs flex-1"
                />
                <button
                  type="submit"
                  className="apple-btn-primary px-5 py-2 text-xs font-semibold shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Subscribe
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Official Contact & Campus Helpdesk Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="glass-panel p-6 sm:p-8 border border-white/15 bg-gradient-to-b from-white/[0.04] to-black/60 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2997ff]/40 bg-[#0071e3]/10 text-[#2997ff] text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]" />
                  <span>Official Support & Campus Inquiries</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Have questions about courses, certifications, or faculty access?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Our coordinators are available to assist with onboarding, account approvals, and institutional collaborations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-[#0071e3]/20 text-[#2997ff] flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Official Email</span>
                    <a
                      href="mailto:capacityconnect.org@gmail.com"
                      className="text-xs font-semibold text-white hover:text-[#2997ff] transition break-all"
                    >
                      capacityconnect.org@gmail.com
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Campus Location</span>
                    <p className="text-xs font-semibold text-white leading-snug">
                      GGSIPU EDC BOYS HOSTEL
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Guru Gobind Singh Indraprastha University<br />East Delhi Campus, Surajmal Vihar, Delhi - 110092
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="glass-panel p-8 sm:p-12 text-center space-y-4 border border-[#2997ff]/40 bg-gradient-to-r from-[#0071e3]/10 via-[#0a0d16] to-purple-900/20 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Start Building Organizational Capacity Today
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Join trainees and trainers participating in structured technical, leadership, and compliance programs.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="apple-btn-primary px-6 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="apple-btn-secondary px-6 py-2.5 text-xs sm:text-sm font-medium">
                Sign In to Portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ToastContainer />
    </div>
  );
};
export default HomePage;
