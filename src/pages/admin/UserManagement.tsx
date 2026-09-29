import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users, CheckCircle2, XCircle, ShieldCheck, Search, Trash2,
  UserPlus, ShieldAlert, AlertTriangle, Filter, MoreVertical,
  X, UserX, UserCheck, Shield, GraduationCap, Briefcase,
  Phone, Mail, Lock, Eye, EyeOff, Sparkles, KeyRound, Building2,
  Award, Send, BookOpen
} from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useUsersStore } from "../../store/usersStore";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";
import { isSupabaseConfigured } from "../../services/supabase";
import { sendApprovalEmail } from "../../services/emailService";
import { PasswordStrengthMeter, checkPasswordStrength } from "../../components/auth/PasswordStrengthMeter";
import bcrypt from "bcryptjs";
import { dbService } from "../../services/db";
import type { User } from "../../types";

const TRAINER_DEPARTMENT_OPTIONS = [
  "Computer Science & Engineering",
  "Information Technology & Cloud Systems",
  "Artificial Intelligence & Machine Learning",
  "Data Science & Big Data Analytics",
  "Cybersecurity, Network & Systems Defense",
  "Electrical & Electronics Engineering",
  "Mechanical, Automation & Robotics",
  "Business Administration & Corporate Strategy",
  "Human Resources & Talent Development",
  "Finance, FinTech & Risk Management",
  "Healthcare, Biotechnology & Life Sciences",
  "Executive Governance & Policy Compliance",
  "Other"
];

const TRAINER_DESIGNATION_OPTIONS = [
  "Senior Faculty Trainer",
  "Principal Technical Instructor",
  "Lead Corporate Trainer",
  "Professor / Associate Professor",
  "Assistant Professor / Lecturer",
  "Adjunct Faculty / Guest Lecturer",
  "Curriculum Development Specialist",
  "Domain Subject Matter Expert (SME)",
  "Staff Solutions Architect & Mentor",
  "Department Head (HOD) / Dean",
  "Executive Director of Training",
  "Other"
];

const TRAINER_SPECIALIZATION_OPTIONS = [
  "Cloud Architecture, Kubernetes & Microservices (AWS/GCP/Azure)",
  "Generative AI, Large Language Models & Vector Databases (RAG)",
  "Cybersecurity, Zero-Trust, Ethical Hacking & ISO 27001",
  "Data Engineering, Apache Spark & Modern Data Warehousing",
  "Full-Stack Modern Web Engineering (React, Node.js, TypeScript)",
  "Enterprise DevOps, CI/CD Pipelines & Site Reliability (SRE)",
  "Agile Project Leadership, Scrum & PMP Methodologies",
  "Corporate Leadership, Executive Coaching & Change Management",
  "Healthcare Informatics, Clinical Data & Regulatory Compliance",
  "Ph.D. / Master's Academic Research & Pedagogy",
  "Other"
];

const TRAINEE_DEPARTMENT_OPTIONS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Data Science & Artificial Intelligence",
  "Cybersecurity & Digital Forensics",
  "Electronics & Communication Engineering",
  "Mechanical & Automation Engineering",
  "Electrical & Power Engineering",
  "Civil & Infrastructure Engineering",
  "Business Administration & Management (BBA/MBA)",
  "Commerce, Accounting & Finance",
  "Applied Sciences & Mathematics",
  "Humanities, Design & Media",
  "Other"
];

const TRAINEE_DESIGNATION_OPTIONS = [
  "Undergraduate Student (B.Tech / B.Sc / B.Com / BCA)",
  "Postgraduate / Master's Student (M.Tech / M.Sc / MCA / MBA)",
  "Graduate Engineer Trainee (GET)",
  "Associate Software Trainee",
  "Research Scholar / Project Intern",
  "Management Trainee",
  "Apprentice / Diploma Trainee",
  "Corporate Upskilling Candidate",
  "Other"
];

const TRAINEE_SKILLS_OPTIONS = [
  "Full-Stack Web Development (React, Node.js, JavaScript)",
  "Cloud Computing & DevOps (Docker, Kubernetes, AWS, GCP)",
  "Data Science, Machine Learning & Python",
  "Cybersecurity, Network Defense & Ethical Hacking",
  "Artificial Intelligence, Generative AI & Prompt Engineering",
  "Mobile App Development (Flutter, React Native, Android)",
  "Data Analytics, SQL, Power BI & Tableau",
  "Software Testing, Automation & QA Engineering",
  "Core Programming & Data Structures (Java, C++, Python)",
  "Embedded Systems, IoT & Robotics",
  "Other"
];

const ADMIN_DEPARTMENT_OPTIONS = [
  "Executive Governance & Strategy",
  "Academic Affairs & Accreditation",
  "Human Resources & Talent Management",
  "IT Infrastructure & Information Security",
  "Financial Operations & Audit",
  "Quality Assurance & Institutional Research",
  "Other"
];

const ADMIN_DESIGNATION_OPTIONS = [
  "Executive Administrator",
  "System Operations Director",
  "Academic Dean / Director",
  "Chief Compliance Officer",
  "Department Registrar",
  "Other"
];

const ADMIN_SPECIALIZATION_OPTIONS = [
  "Institutional Policy & Compliance",
  "Enterprise IAM & Zero-Trust Security",
  "Academic Curriculum Accreditation",
  "Budgeting, Grants & Resource Allocation",
  "System Administration & Security",
  "Other"
];

const EXPERIENCE_OPTIONS = [
  "Less than 1 year",
  "1 - 3 years",
  "3 - 5 years",
  "5 - 8 years",
  "8 - 12 years",
  "12+ years",
  "Other"
];

const generateStrongPasswordString = () => {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowers = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const specials = "!@#$%^&*";
  
  let pwd = "";
  pwd += uppers[Math.floor(Math.random() * uppers.length)];
  pwd += lowers[Math.floor(Math.random() * lowers.length)];
  pwd += numbers[Math.floor(Math.random() * numbers.length)];
  pwd += specials[Math.floor(Math.random() * specials.length)];
  
  const allChars = uppers + lowers + numbers + specials;
  for (let i = 0; i < 8; i++) {
    pwd += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return pwd.split("").sort(() => 0.5 - Math.random()).join("");
};

export const UserManagement: React.FC = () => {
  const { users, load, approveUser, rejectUser, deleteUser, purgeRevokedUsers, deactivateUser, activateUser, updateRole, verifyTrainer, removeUser, allowUserAccess } = useUsersStore();
  const { currentUser } = useAuthStore();
  const { addToast } = useAppStore();

  React.useEffect(() => {
    load();
  }, []);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToPermanentDelete, setUserToPermanentDelete] = useState<User | null>(null);
  const [purgeAllModalOpen, setPurgeAllModalOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [removalReason, setRemovalReason] = useState("");

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Full-Fledged New User Provisioning Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<"trainee" | "trainer" | "admin">("trainee");
  
  // Dynamic fields with "Other" fallback
  const [newUserDept, setNewUserDept] = useState("Computer Science & Engineering");
  const [customDept, setCustomDept] = useState("");
  
  const [newUserDesignation, setNewUserDesignation] = useState("Undergraduate Student (B.Tech / B.Sc / B.Com / BCA)");
  const [customDesignation, setCustomDesignation] = useState("");
  
  const [newUserSkills, setNewUserSkills] = useState("Full-Stack Web Development (React, Node.js, JavaScript)");
  const [customSkills, setCustomSkills] = useState("");
  
  // Trainer specific
  const [newUserExperience, setNewUserExperience] = useState("3 - 5 years");
  const [customExperience, setCustomExperience] = useState("");
  const [newUserCredentials, setNewUserCredentials] = useState("");
  const [newUserBio, setNewUserBio] = useState("");
  
  // Password & Security
  const [newUserPassword, setNewUserPassword] = useState(() => generateStrongPasswordString());
  const [showPassword, setShowPassword] = useState(false);
  const [newUserVerifiedForVideo, setNewUserVerifiedForVideo] = useState(true);

  // Prevent background page from scrolling or walking over when modal is open
  useEffect(() => {
    if (createModalOpen || userToDelete) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [createModalOpen, userToDelete]);

  const handleRoleChange = (newRole: "trainee" | "trainer" | "admin") => {
    setNewUserRole(newRole);
    if (newRole === "trainee") {
      setNewUserDept("Computer Science & Engineering");
      setNewUserDesignation("Undergraduate Student (B.Tech / B.Sc / B.Com / BCA)");
      setNewUserSkills("Full-Stack Web Development (React, Node.js, JavaScript)");
    } else if (newRole === "trainer") {
      setNewUserDept("Computer Science & Engineering");
      setNewUserDesignation("Senior Faculty Trainer");
      setNewUserSkills("Full-Stack Modern Web Engineering (React, Node.js, TypeScript)");
      setNewUserExperience("3 - 5 years");
    } else {
      setNewUserDept("Executive Governance & Strategy");
      setNewUserDesignation("Executive Administrator");
      setNewUserSkills("Enterprise IAM & Zero-Trust Security");
    }
    setCustomDept("");
    setCustomDesignation("");
    setCustomSkills("");
    setCustomExperience("");
  };

  const filtered = users.filter((u) => {
    const isRemoved = u.status === "removed" || Boolean(u.removedAt) || Boolean((u as any).removed_at) || Boolean(u.removalReason) || Boolean((u as any).removal_reason);
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    // By default ("all"), strictly exclude removed users so the active directory only shows legitimate members.
    // Removed users only show when explicitly viewing "removed" or "all_including_removed".
    const matchesStatus =
      statusFilter === "all"
        ? !isRemoved
        : statusFilter === "all_including_removed"
        ? true
        : statusFilter === "removed"
        ? isRemoved
        : u.status === statusFilter && !isRemoved;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (userToDelete.id === "u-admin-official" || userToDelete.email?.toLowerCase() === "vkt052005@gmail.com") {
      addToast({
        title: "Action Restricted",
        message: "Primary Platform Owner account cannot be removed.",
        type: "error"
      });
      setUserToDelete(null);
      return;
    }
    const name = userToDelete.name;
    const email = userToDelete.email;
    const id = userToDelete.id;
    await removeUser(id, removalReason.trim() || "Revoked by Administrator");
    setUserToDelete(null);
    setRemovalReason("");

    addToast({
      title: "User Removed & Access Revoked",
      message: `${name} (${email}) has been removed. They cannot access the platform until an Admin allows access.`,
      type: "warning"
    });
  };

  const handleAllowAccess = async (targetUser: User) => {
    await allowUserAccess(targetUser.id);
    addToast({
      title: "User Access Allowed & Restored",
      message: `${targetUser.name} (${targetUser.email}) has been re-admitted and can now log in to Capacity Connect.`,
      type: "success"
    });
  };

  const handleConfirmPermanentDelete = async () => {
    if (!userToPermanentDelete) return;
    if (userToPermanentDelete.id === "u-admin-official" || userToPermanentDelete.email?.toLowerCase() === "vkt052005@gmail.com") {
      addToast({
        title: "Action Restricted",
        message: "Primary Platform Owner account cannot be erased.",
        type: "error"
      });
      setUserToPermanentDelete(null);
      return;
    }
    const name = userToPermanentDelete.name;
    const email = userToPermanentDelete.email;
    const id = userToPermanentDelete.id;

    await deleteUser(id);
    setUserToPermanentDelete(null);

    addToast({
      title: "User Data Permanently Erased",
      message: `The account and all associated records for ${name} (${email}) have been permanently deleted from the database.`,
      type: "success"
    });
  };

  const handleConfirmPurgeAll = async () => {
    setIsPurging(true);
    try {
      const count = await purgeRevokedUsers();
      setPurgeAllModalOpen(false);
      addToast({
        title: "Revoked Records Purged",
        message: `Successfully deleted ${count} revoked user record(s) permanently from the database.`,
        type: "success"
      });
    } catch (e) {
      addToast({
        title: "Purge Failed",
        message: "Failed to purge some records. Please try again.",
        type: "error"
      });
    } finally {
      setIsPurging(false);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      addToast({
        title: "Missing Information",
        message: "Please specify user's full name and official email.",
        type: "error"
      });
      return;
    }

    // Strict Password Policy Enforcement: No password below Strong level accepted
    const strength = checkPasswordStrength(newUserPassword);
    if (!strength.isStrong) {
      addToast({
        title: "Insecure Password",
        message: "Security policy requires a Strong or Very Strong password (minimum 8 characters with uppercase, lowercase, numbers, and symbols).",
        type: "error"
      });
      return;
    }

    const existing = users.find((u) => u.email.toLowerCase() === newUserEmail.trim().toLowerCase());
    if (existing) {
      addToast({
        title: "Account Exists",
        message: "A user with this email address is already registered.",
        type: "error"
      });
      return;
    }

    const resolvedDept = newUserDept === "Other" ? (customDept.trim() || "General Department") : newUserDept;
    const resolvedDesignation = newUserDesignation === "Other" ? (customDesignation.trim() || (newUserRole === "trainee" ? "Trainee" : "Member")) : newUserDesignation;
    const resolvedSkills = newUserSkills === "Other" ? (customSkills.trim() || "General") : newUserSkills;
    const resolvedExp = newUserExperience === "Other" ? (customExperience.trim() || "1+ years") : newUserExperience;

    const hashedPassword = bcrypt.hashSync(newUserPassword, 10);

    const newUser: User = {
      id: "u-" + Math.random().toString(36).substring(2, 9),
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      password: hashedPassword,
      role: newUserRole,
      status: "active",
      createdAt: new Date().toISOString(),
      ...(newUserRole === "trainee"
        ? {
            traineeProfile: {
              bio: newUserBio.trim() || "Student trainee provisioned by Administrator.",
              phone: newUserPhone.trim(),
              department: resolvedDept,
              designation: resolvedDesignation,
              qualifications: [],
              experience: [],
              skills: [resolvedSkills],
              interests: [],
              certificates: [],
              xpPoints: 0,
              streakDays: 0,
              completedCoursesCount: 0,
              badges: []
            }
          }
        : newUserRole === "trainer"
        ? {
            isVerifiedByAdmin: newUserVerifiedForVideo,
            trainerProfile: {
              bio: newUserBio.trim() || "Faculty member provisioned by Administrator.",
              phone: newUserPhone.trim(),
              department: resolvedDept,
              designation: resolvedDesignation,
              experience: resolvedExp,
              expertise: [resolvedSkills],
              competencies: [resolvedSkills],
              rating: 5.0,
              totalStudentsTaught: 0,
              verifiedCredentials: newUserCredentials.trim()
                ? newUserCredentials.split(",").map((s) => s.trim()).filter(Boolean)
                : ["Verified Instructor"],
              isVerifiedByAdmin: newUserVerifiedForVideo
            }
          }
        : {})
    };

    // 1. Save user to Zustand state
    const { users: currentList } = useUsersStore.getState();
    const updated = [newUser, ...currentList];
    useUsersStore.setState({ users: updated });

    // 2. Persist to server backend database (db.json) & trigger live sync
    dbService.create('users', newUser).catch((err) => console.warn("dbService sync:", err));

    setCreateModalOpen(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPhone("");
    setNewUserBio("");
    setNewUserCredentials("");
    setNewUserPassword(generateStrongPasswordString());

    addToast({
      title: "User Account Provisioned",
      message: `${newUser.name} (${newUser.email}) activated as ${newUser.role.toUpperCase()}.`,
      type: "success"
    });
  };

  const isUserRemoved = (u: User) =>
    u.status === "removed" || Boolean(u.removedAt) || Boolean((u as any).removed_at) || Boolean(u.removalReason) || Boolean((u as any).removal_reason);

  const traineeCount = users.filter((u) => u.role === "trainee" && !isUserRemoved(u)).length;
  const trainerCount = users.filter((u) => u.role === "trainer" && !isUserRemoved(u)).length;
  const pendingCount = users.filter((u) => u.status === "pending" && !isUserRemoved(u)).length;
  const removedCount = users.filter((u) => isUserRemoved(u)).length;
  const reinstatementRequests = users.filter((u) => isUserRemoved(u) && u.reinstatementRequested);

  return (
    <DashboardLayout
      pageTitle="User Governance & Access Control"
      breadcrumbs={[
        { label: "Admin Dashboard", to: "/admin/dashboard" },
        { label: "User Governance" }
      ]}
    >
      <div className="space-y-6">
        {/* Metric Cards (Clickable Quick Filters) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => { setStatusFilter("all"); setRoleFilter("all"); }}
            className={`p-3.5 rounded-xl text-left transition cursor-pointer border ${statusFilter === "all" && roleFilter === "all" ? "bg-white/10 border-white/30 shadow-md ring-1 ring-white/20" : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"}`}
            title="Click to view all active directory members"
          >
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Active Directory</span>
            <span className="text-xl font-extrabold text-white tracking-tight">{users.filter((u) => !isUserRemoved(u)).length}</span>
          </button>
          <button
            type="button"
            onClick={() => { setRoleFilter(roleFilter === "trainee" ? "all" : "trainee"); if (statusFilter === "removed") setStatusFilter("all"); }}
            className={`p-3.5 rounded-xl text-left transition cursor-pointer border ${roleFilter === "trainee" ? "bg-emerald-500/15 border-emerald-500/40 shadow-md ring-1 ring-emerald-500/30" : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"}`}
            title="Click to filter by Trainees"
          >
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Trainees</span>
            <span className="text-xl font-extrabold text-emerald-400 tracking-tight">{traineeCount}</span>
          </button>
          <button
            type="button"
            onClick={() => { setRoleFilter(roleFilter === "trainer" ? "all" : "trainer"); if (statusFilter === "removed") setStatusFilter("all"); }}
            className={`p-3.5 rounded-xl text-left transition cursor-pointer border ${roleFilter === "trainer" ? "bg-[#0071e3]/20 border-[#2997ff]/40 shadow-md ring-1 ring-[#2997ff]/30" : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"}`}
            title="Click to filter by Faculty / Trainers"
          >
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Trainers / Faculty</span>
            <span className="text-xl font-extrabold text-[#2997ff] tracking-tight">{trainerCount}</span>
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter(statusFilter === "pending" ? "all" : "pending"); setRoleFilter("all"); }}
            className={`p-3.5 rounded-xl text-left transition cursor-pointer border ${statusFilter === "pending" ? "bg-amber-500/20 border-amber-500/40 shadow-md ring-1 ring-amber-500/30" : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"}`}
            title="Click to view pending approval requests"
          >
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Pending Approvals</span>
            <span className="text-xl font-extrabold text-amber-400 tracking-tight">{pendingCount}</span>
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter(statusFilter === "removed" ? "all" : "removed"); setRoleFilter("all"); }}
            className={`p-3.5 rounded-xl text-left transition cursor-pointer border ${statusFilter === "removed" ? "bg-rose-500/25 border-rose-500/60 shadow-lg ring-2 ring-rose-500/50" : "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15"}`}
            title="Click to inspect removed users and allow access"
          >
            <span className="text-[10px] text-rose-300/80 font-semibold uppercase block flex items-center justify-between">
              <span>Removed by Admin</span>
              {statusFilter === "removed" && <span className="text-[8px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold">ACTIVE VIEW</span>}
            </span>
            <span className="text-xl font-extrabold text-rose-400 tracking-tight">{removedCount}</span>
          </button>
        </div>

        {/* Re-Admission Requests Pending Admin Permission */}
        {reinstatementRequests.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{reinstatementRequests.length} Removed User(s) Awaiting Admin Permission for Re-admission</span>
              </div>
            </div>
            <p className="text-[11.5px] text-slate-300 leading-relaxed">
              These users were previously removed by an administrator. They cannot access Capacity Connect until an Administrator explicitly allows their access.
            </p>
            <div className="grid gap-2 pt-1">
              {reinstatementRequests.map((reqUser) => (
                <div key={reqUser.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/40 p-3 rounded-xl border border-white/10 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white flex items-center gap-2">
                      <span>{reqUser.name}</span>
                      <span className="text-slate-400 font-normal">({reqUser.email})</span>
                      <span className="badge text-[9px] badge-blue uppercase">{reqUser.role}</span>
                    </p>
                    {reqUser.reinstatementNote && (
                      <p className="text-[11px] text-amber-200/90 italic">
                        Note: &ldquo;{reqUser.reinstatementNote}&rdquo;
                      </p>
                    )}
                    {reqUser.removalReason && (
                      <p className="text-[10px] text-slate-400">
                        Originally removed for: {reqUser.removalReason}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAllowAccess(reqUser)}
                    className="apple-btn-success text-xs px-3.5 py-1.5 font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Allow Access</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time Multi-Device Sync Indicator */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-emerald-200">
              {isSupabaseConfigured ? "Supabase Cloud Database Connected" : "Real-Time Central Database Active"}
            </span>
          </div>
        </div>

        {/* Controls & Search Bar */}
        <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-3 border border-white/15">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search user name, email, or role..."
                className="apple-input text-xs !pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="apple-input text-xs py-1.5 px-2 bg-[#12141a] text-slate-200 border border-white/10 rounded-lg cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="trainee">Trainees</option>
              <option value="trainer">Trainers</option>
              <option value="admin">Administrators</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="apple-input text-xs py-1.5 px-2 bg-[#12141a] text-slate-200 border border-white/10 rounded-lg cursor-pointer"
            >
              <option value="all">Active Directory (Excludes Removed)</option>
              <option value="active">Active Only ({users.filter((u) => u.status === "active").length})</option>
              <option value="pending">Pending Approval ({pendingCount})</option>
              <option value="inactive">Inactive / Suspended ({users.filter((u) => u.status === "inactive").length})</option>
              <option value="removed">⛔ Removed / Access Revoked ({removedCount})</option>
              <option value="all_including_removed">All Records (Including Removed) ({users.length})</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="apple-btn-primary text-xs px-3.5 py-1.5 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add New User</span>
            </button>
          </div>
        </div>

        {/* Quarantine Banner When Viewing Removed Users */}
        {statusFilter === "removed" && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-200 animate-fadeIn">
            <div className="flex items-start sm:items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold text-white block">Quarantine & Revocation Directory</span>
                <span className="text-[11px] text-rose-200/90 leading-relaxed block">
                  Showing {filtered.length} account(s) whose platform access was revoked by an Administrator. Click <strong>Allow Access</strong> to restore, or <strong>Delete Data</strong> to permanently erase their data from the system.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {filtered.length > 0 && (
                <button
                  onClick={() => setPurgeAllModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  title="Permanently delete all revoked users and their data from the database"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge All Revoked Data ({filtered.length})</span>
                </button>
              )}
              <button
                onClick={() => setStatusFilter("all")}
                className="apple-btn-secondary text-[11px] py-1 px-3 whitespace-nowrap cursor-pointer"
              >
                Back to Active Directory →
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="card p-3 sm:p-5 space-y-4">
          <div className="overflow-x-auto touch-scroll -mx-3 sm:mx-0 px-3 sm:px-0">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="table-header border-b border-white/10 text-[10px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">User & Profile</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Account Status</th>
                  <th className="py-2.5 px-3">Registered Date</th>
                  <th className="py-2.5 px-3 text-right">Admin Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((u) => {
                  const isCurrentAdmin = currentUser?.id === u.id;
                  const isPrimaryOwner = u.id === "u-admin-official" || u.email?.toLowerCase() === "vkt052005@gmail.com";
                  const isProtectedAdmin = isCurrentAdmin || isPrimaryOwner;
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition">
                      {/* Name & Email */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={"w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs " + (u.role === "admin" ? "bg-purple-500/20 text-purple-400" : u.role === "trainer" ? "bg-[#0071e3]/20 text-[#2997ff]" : "bg-emerald-500/20 text-emerald-400")}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrentAdmin && (
                                <span className="badge-blue text-[8px] py-0">You (Current Admin)</span>
                              )}
                              {isPrimaryOwner && !isCurrentAdmin && (
                                <span className="badge-purple text-[8px] py-0">Primary Platform Owner</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Dropdown */}
                      <td className="py-3 px-3">
                        {isProtectedAdmin ? (
                          <span className="badge-purple text-[9px] uppercase font-bold">Admin</span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => {
                              const newRole = e.target.value as User["role"];
                              updateRole(u.id, newRole);
                              addToast({
                                title: "User Role Updated",
                                message: `${u.name} role changed to ${newRole.toUpperCase()}.`,
                                type: "info"
                              });
                            }}
                            className="text-[10.5px] font-semibold bg-black/40 border border-white/10 rounded-lg px-2 py-0.5 text-white cursor-pointer hover:border-[#2997ff]/40"
                          >
                            <option value="trainee">Trainee</option>
                            <option value="trainer">Trainer</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                        {u.role === "trainer" && (
                          <div className="mt-1">
                            {u.isVerifiedByAdmin || u.trainerProfile?.isVerifiedByAdmin ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Instructor
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                <ShieldAlert className="w-3 h-3 text-amber-400" /> Unverified (No Video Upload)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={
                              "badge text-[9px] font-bold " +
                              (isUserRemoved(u)
                                ? "bg-rose-950/80 text-rose-300 border-rose-800/60 font-mono"
                                : u.status === "active"
                                ? "badge-green"
                                : u.status === "pending"
                                ? "badge-yellow"
                                : "badge-red")
                            }
                          >
                            {isUserRemoved(u) ? "⛔ ACCESS REVOKED" : u.status.toUpperCase()}
                          </span>
                          {isUserRemoved(u) && (
                            <span className="text-[9px] text-slate-400">
                              Requires Admin Approval
                            </span>
                          )}
                          {u.reinstatementRequested && (
                            <span className="badge text-[8.5px] font-bold bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse flex items-center gap-1">
                              <span>⚠️ Re-admission Requested</span>
                            </span>
                          )}
                          {u.removalReason && (
                            <span className="text-[9.5px] text-slate-400 truncate max-w-[150px]" title={u.removalReason}>
                              {u.removalReason}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="py-3 px-3 text-slate-300 font-medium text-[11px]">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If user is removed by admin, show Allow Access and Delete Permanently buttons */}
                          {isUserRemoved(u) ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleAllowAccess(u)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:scale-[1.02]"
                                title="Allow access and reinstate user account"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Allow Access</span>
                              </button>
                              <button
                                onClick={() => setUserToPermanentDelete(u)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:scale-[1.02]"
                                title="Permanently delete user record and data from database"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>Delete Data</span>
                              </button>
                            </div>
                          ) : u.status === "pending" ? (
                            <>
                              <button
                                onClick={() => {
                                  approveUser(u.id);
                                  sendApprovalEmail({ email: u.email, name: u.name, role: u.role }).catch(() => {});
                                  addToast({
                                    title: "Account Approved",
                                    message: `${u.name} account is now active and notification was dispatched.`,
                                    type: "success"
                                  });
                                }}
                                className="apple-btn-success text-[10px] px-2.5 py-1 font-semibold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  rejectUser(u.id);
                                  addToast({
                                    title: "Application Rejected",
                                    message: `${u.name} application was rejected and removed.`,
                                    type: "error"
                                  });
                                }}
                                className="apple-btn-danger text-[10px] px-2.5 py-1 font-semibold"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Teacher Video Upload Verification Toggle */}
                              {u.role === "trainer" && u.status === "active" && (
                                u.isVerifiedByAdmin || u.trainerProfile?.isVerifiedByAdmin ? (
                                  <button
                                    onClick={() => {
                                      verifyTrainer(u.id, false);
                                      addToast({
                                        title: "Video Upload Access Revoked",
                                        message: `${u.name} can no longer upload video lessons until re-verified.`,
                                        type: "warning"
                                      });
                                    }}
                                    className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
                                    title="Revoke video upload privileges"
                                  >
                                    <XCircle className="w-3 h-3 text-rose-400" />
                                    <span>Revoke Video</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      verifyTrainer(u.id, true);
                                      addToast({
                                        title: "Instructor Verified for Videos",
                                        message: `${u.name} is now verified and can publish video lessons.`,
                                        type: "success"
                                      });
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                                    title="Verify teacher to unlock video uploading"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Verify Teacher</span>
                                  </button>
                                )
                              )}

                              {/* Suspend / Activate toggle */}
                              {!isProtectedAdmin && (
                                <>
                                  {u.status === "active" ? (
                                    <button
                                      onClick={() => {
                                        deactivateUser(u.id);
                                        addToast({
                                          title: "User Suspended",
                                          message: `${u.name}'s access has been temporarily revoked.`,
                                          type: "warning"
                                        });
                                      }}
                                      className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-medium transition cursor-pointer"
                                      title="Suspend Account Access"
                                    >
                                      Suspend
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        activateUser(u.id);
                                        addToast({
                                          title: "User Re-Activated",
                                          message: `${u.name}'s account has been restored.`,
                                          type: "success"
                                        });
                                      }}
                                      className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium transition cursor-pointer"
                                      title="Restore Active Access"
                                    >
                                      Activate
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Remove / Delete User Button */}
                              {isProtectedAdmin ? (
                                <span className="text-[9.5px] text-slate-500 font-mono italic px-2">
                                  Protected
                                </span>
                              ) : (
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/30 text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                                  title="Permanently Remove User"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <Users className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-white text-xs">No users matching search criteria</p>
                      <p className="text-[10px] text-slate-500">Try clearing filters or changing search keywords.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Permanently Remove User */}
      {userToDelete && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
          <div className="relative max-w-md w-full bg-[#0c1017] p-6 border border-rose-500/40 rounded-2xl shadow-2xl space-y-4 my-auto">
            <div className="flex items-center gap-3 text-rose-400 border-b border-white/10 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Revoke Access & Remove User</h3>
                <p className="text-[10.5px] text-rose-300 font-mono">Platform Access Blocked Until Allowed by Admin</p>
              </div>
              <button
                onClick={() => {
                  setUserToDelete(null);
                  setRemovalReason("");
                }}
                className="ml-auto text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/5">
              <p>
                Are you sure you want to remove <strong className="text-white font-bold">{userToDelete.name}</strong>?
              </p>
              <div className="space-y-1 text-[11px] text-slate-400">
                <p>• Email: <span className="text-slate-200">{userToDelete.email}</span></p>
                <p>• Role: <span className="uppercase text-[#2997ff] font-semibold">{userToDelete.role}</span></p>
                <p>• Registered: <span className="text-slate-200">{formatDate(userToDelete.createdAt)}</span></p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Removal Reason / Administrative Note <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Completed training cycle / Policy infraction / Administrative hold"
                  className="apple-input text-xs w-full"
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                />
              </div>

              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-200 text-[10.5px] space-y-1">
                <p className="font-bold flex items-center gap-1 text-rose-300">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Strict Re-admission Rule Enforced:</span>
                </p>
                <p className="text-rose-200/90 leading-relaxed">
                  This user will be immediately blocked from logging in or registering with this email. For him/her to access the website again, he/she must be explicitly allowed by an Administrator.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setUserToDelete(null);
                  setRemovalReason("");
                }}
                className="apple-btn-secondary text-xs px-4 py-2 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="apple-btn-danger text-xs px-4 py-2 font-bold flex items-center gap-1.5 shadow-lg shadow-rose-900/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Revoke Access</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal to Permanently Delete a Single Revoked User */}
      {userToPermanentDelete && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
          <div className="relative max-w-md w-full bg-[#0c1017] p-6 border border-rose-500/50 rounded-2xl shadow-2xl space-y-4 my-auto">
            <div className="flex items-center gap-3 text-rose-400 border-b border-white/10 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Permanently Delete User Data</h3>
                <p className="text-[10.5px] text-rose-300 font-mono">Irreversible Database Deletion</p>
              </div>
              <button
                onClick={() => setUserToPermanentDelete(null)}
                className="ml-auto text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/5">
              <p>
                Are you sure you want to permanently delete <strong className="text-white font-bold">{userToPermanentDelete.name}</strong>?
              </p>
              <div className="space-y-1 text-[11px] text-slate-400">
                <p>• Email: <span className="text-slate-200 font-mono">{userToPermanentDelete.email}</span></p>
                <p>• Role: <span className="uppercase text-[#2997ff] font-semibold">{userToPermanentDelete.role}</span></p>
                <p>• Status: <span className="text-rose-400 font-bold uppercase">Access Revoked</span></p>
              </div>

              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1 text-rose-300">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Warning: Permanent Data Erasure</span>
                </p>
                <p className="text-rose-200/90 leading-relaxed">
                  This user&apos;s account and all associated profile records will be permanently erased from the database. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUserToPermanentDelete(null)}
                className="apple-btn-secondary text-xs px-4 py-2 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPermanentDelete}
                className="apple-btn-danger text-xs px-4 py-2 font-bold flex items-center gap-1.5 shadow-lg shadow-rose-900/40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal to Purge ALL Revoked Users */}
      {purgeAllModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
          <div className="relative max-w-md w-full bg-[#0c1017] p-6 border border-rose-600/60 rounded-2xl shadow-2xl space-y-4 my-auto">
            <div className="flex items-center gap-3 text-rose-400 border-b border-white/10 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/25 flex items-center justify-center border border-rose-500/40">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Purge All Revoked User Data</h3>
                <p className="text-[10.5px] text-rose-300 font-mono">Bulk Permanent Erasure</p>
              </div>
              <button
                onClick={() => setPurgeAllModalOpen(false)}
                disabled={isPurging}
                className="ml-auto text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/5">
              <p>
                Are you sure you want to permanently delete the data of <strong>all revoked users</strong> ({users.filter(isUserRemoved).length} accounts)?
              </p>

              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/35 text-rose-200 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1 text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Irreversible Database Action:</span>
                </p>
                <p className="text-rose-200/90 leading-relaxed">
                  All {users.filter(isUserRemoved).length} quarantined accounts will be permanently removed from the database and will no longer appear anywhere in the portal.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPurgeAllModalOpen(false)}
                disabled={isPurging}
                className="apple-btn-secondary text-xs px-4 py-2 font-medium cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurgeAll}
                disabled={isPurging}
                className="apple-btn-danger text-xs px-4 py-2 font-bold flex items-center gap-1.5 shadow-lg shadow-rose-900/50 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPurging ? "Purging Records..." : `Confirm Purge (${users.filter(isUserRemoved).length} Users)`}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Direct User Provisioning Modal - Full-Fledged Suite */}
      {createModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
          <div 
            className="relative max-w-2xl w-full bg-[#0d111a] border border-white/20 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[88vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Provision New User Account</h3>
                  <p className="text-[11px] text-slate-400">Comprehensive role configuration, academic/department placement & security credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar flex-1 min-h-0">
                {/* 1. Target Account Role Selection */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Target Account Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRoleChange("trainee")}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        newUserRole === "trainee"
                          ? "bg-blue-600/15 border-blue-500/60 shadow-lg shadow-blue-500/10 text-white"
                          : "bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        newUserRole === "trainee" ? "bg-blue-500 text-white" : "bg-white/5 text-slate-400"
                      }`}>
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-white truncate">Student Trainee</div>
                        <div className="text-[10px] text-slate-400 truncate">Learner & Upskilling</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleChange("trainer")}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        newUserRole === "trainer"
                          ? "bg-purple-600/15 border-purple-500/60 shadow-lg shadow-purple-500/10 text-white"
                          : "bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        newUserRole === "trainer" ? "bg-purple-500 text-white" : "bg-white/5 text-slate-400"
                      }`}>
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-white truncate">Faculty Trainer</div>
                        <div className="text-[10px] text-slate-400 truncate">Instructor & SME</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleChange("admin")}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        newUserRole === "admin"
                          ? "bg-emerald-600/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10 text-white"
                          : "bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        newUserRole === "admin" ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-400"
                      }`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-white truncate">Administrator</div>
                        <div className="text-[10px] text-slate-400 truncate">Governance & Ops</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Personal & Contact Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                    <Users className="w-3.5 h-3.5 text-[#2997ff]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Personal & Contact Information</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Full Legal Name <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Patel"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className="apple-input text-xs w-full pl-8"
                        />
                        <Users className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Official Email <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="e.g. user@organization.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="apple-input text-xs w-full pl-8"
                        />
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* Phone is only for admin (matching register list where student/faculty don't have phone) */}
                  {newUserRole === "admin" && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Contact / Mobile Phone Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={newUserPhone}
                          onChange={(e) => setNewUserPhone(e.target.value)}
                          className="apple-input text-xs w-full pl-8"
                        />
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Academic & Departmental Placement (Exactly matching Register List) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      {newUserRole === "trainer"
                        ? "Faculty Academic & Department Placement"
                        : newUserRole === "trainee"
                        ? "Student Academic & Department Placement"
                        : "Institutional Governance & Placement"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Department Dropdown */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Department <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={newUserDept}
                        onChange={(e) => setNewUserDept(e.target.value)}
                        className="apple-input text-xs w-full bg-[#12141a] cursor-pointer"
                      >
                        {(newUserRole === "trainee"
                          ? TRAINEE_DEPARTMENT_OPTIONS
                          : newUserRole === "trainer"
                          ? TRAINER_DEPARTMENT_OPTIONS
                          : ADMIN_DEPARTMENT_OPTIONS
                        ).map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      {newUserDept === "Other" && (
                        <div className="mt-2 animate-in fade-in duration-150">
                          <input
                            type="text"
                            placeholder="Type custom department name..."
                            value={customDept}
                            onChange={(e) => setCustomDept(e.target.value)}
                            className="apple-input text-xs w-full border-indigo-500/40"
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* Designation Dropdown */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        {newUserRole === "trainee"
                          ? "Designation"
                          : newUserRole === "trainer"
                          ? "Designation"
                          : "Official Designation"} <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={newUserDesignation}
                        onChange={(e) => setNewUserDesignation(e.target.value)}
                        className="apple-input text-xs w-full bg-[#12141a] cursor-pointer"
                      >
                        {(newUserRole === "trainee"
                          ? TRAINEE_DESIGNATION_OPTIONS
                          : newUserRole === "trainer"
                          ? TRAINER_DESIGNATION_OPTIONS
                          : ADMIN_DESIGNATION_OPTIONS
                        ).map((desig) => (
                          <option key={desig} value={desig}>
                            {desig}
                          </option>
                        ))}
                      </select>
                      {newUserDesignation === "Other" && (
                        <div className="mt-2 animate-in fade-in duration-150">
                          <input
                            type="text"
                            placeholder="Type custom designation / title..."
                            value={customDesignation}
                            onChange={(e) => setCustomDesignation(e.target.value)}
                            className="apple-input text-xs w-full border-indigo-500/40"
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skill / Focus Area Dropdown (Exactly matching Register List) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      {newUserRole === "trainee"
                        ? "Primary Learning Track / Key Skill"
                        : newUserRole === "trainer"
                        ? "Domain Specialization & Credentials"
                        : "Administrative Focus / Specialization"} <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={newUserSkills}
                      onChange={(e) => setNewUserSkills(e.target.value)}
                      className="apple-input text-xs w-full bg-[#12141a] cursor-pointer"
                    >
                      {(newUserRole === "trainee"
                        ? TRAINEE_SKILLS_OPTIONS
                        : newUserRole === "trainer"
                        ? TRAINER_SPECIALIZATION_OPTIONS
                        : ADMIN_SPECIALIZATION_OPTIONS
                      ).map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </select>
                    {newUserSkills === "Other" && (
                      <div className="mt-2 animate-in fade-in duration-150">
                        <input
                          type="text"
                          placeholder={
                            newUserRole === "trainer"
                              ? "Type custom domain specialization & credentials..."
                              : newUserRole === "trainee"
                              ? "Type custom skills & learning goals..."
                              : "Type custom administrative specialization..."
                          }
                          value={customSkills}
                          onChange={(e) => setCustomSkills(e.target.value)}
                          className="apple-input text-xs w-full border-indigo-500/40"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Administrative Bio & Notes is only for Admin role */}
                  {newUserRole === "admin" && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Administrative Notes & Profile Bio
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Administrative notes or governance summary for this account..."
                        value={newUserBio}
                        onChange={(e) => setNewUserBio(e.target.value)}
                        className="apple-input text-xs w-full py-2 resize-none"
                      />
                    </div>
                  )}

                  {/* Teacher Video Upload Permission Toggle */}
                  {newUserRole === "trainer" && (
                    <div className="p-3 rounded-xl bg-[#0071e3]/10 border border-[#2997ff]/30 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#2997ff] shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Verify Instructor for Video Uploads</p>
                          <p className="text-[10.5px] text-slate-300">Grant immediate authority to upload video lectures, playlists, and curriculum materials</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={newUserVerifiedForVideo}
                        onChange={(e) => setNewUserVerifiedForVideo(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#2997ff] cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Password & Security Credentials */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-white/10">
                  <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Security Credentials & Policy Enforcement
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Account Initial Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="apple-input text-xs w-full pl-8 pr-10 font-mono"
                        placeholder="Enter password..."
                      />
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Real-time Password Strength Meter */}
                  <PasswordStrengthMeter password={newUserPassword} showRequirements={true} />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="p-4 border-t border-white/10 bg-[#090d15] flex items-center justify-between shrink-0">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Password must meet <strong>Strong</strong> policy to provision account.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="apple-btn-secondary text-xs px-4 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newUserName || !newUserEmail || !checkPasswordStrength(newUserPassword).isStrong}
                    className={`apple-btn-primary text-xs px-5 py-2 font-semibold flex items-center gap-1.5 ${
                      !newUserName || !newUserEmail || !checkPasswordStrength(newUserPassword).isStrong
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create & Activate User</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
};
export default UserManagement;
