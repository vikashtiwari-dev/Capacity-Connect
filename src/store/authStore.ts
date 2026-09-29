import { create } from "zustand";
import bcrypt from "bcryptjs";
import type { User, TrainerProfile } from "../types";
import { STORAGE_KEYS, generateId, initialUsers } from "../data/seed";
import { dbService } from "../services/db";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { recordAuditEvent } from "./auditStore";
import { useUsersStore } from "./usersStore";
import { useNotificationsStore } from "./notificationsStore";

const defaultRajTrainerProfile: TrainerProfile = {
  bio: "Senior Technical Educator & Mentor specializing in Computer Science, Full-Stack Architecture, and Systems Engineering.",
  expertise: ["Full-Stack Architecture", "Python", "JavaScript", "C Programming"],
  competencies: ["Hands-on Coding", "Curriculum Design", "Real-world Projects"],
  phone: "+91 98765 11111",
  department: "Computer Science & Engineering",
  designation: "Senior Technical Educator & Mentor",
  experience: "10+ Years Technical Education",
  rating: 4.99,
  totalStudentsTaught: 60000,
  verifiedCredentials: ["Senior Educator", "Verified LMS Faculty"],
  isVerifiedByAdmin: true
};

function sanitizeUserForSession(user: User): User {
  const { password, ...safeUser } = user as any;
  const target = safeUser as User;
  if (
    target.email?.toLowerCase() === "tiwariraj052005@gmail.com" ||
    (target.id === "u-trainer-official" && !target.email?.toLowerCase().includes("harry")) ||
    target.id === "trainer-mto8vdlt-rpmv8"
  ) {
    return {
      ...target,
      id: "u-trainer-official",
      name: "Raj Tiwari",
      email: "tiwariraj052005@gmail.com",
      trainerProfile: {
        ...defaultRajTrainerProfile,
        ...(target.trainerProfile || {}),
        bio: defaultRajTrainerProfile.bio,
        designation: defaultRajTrainerProfile.designation,
        verifiedCredentials: defaultRajTrainerProfile.verifiedCredentials,
        isVerifiedByAdmin: true
      }
    };
  } else if (target.email?.toLowerCase() === "codewithharry@gmail.com" || target.id === "u-trainer-codewithharry") {
    return {
      ...target,
      id: "u-trainer-codewithharry",
      name: "CodeWithHarry (Haris Khan)",
      email: "codewithharry@gmail.com"
    };
  }
  return target;
}

// ── Session duration: 8 hours ─────────────────────────────────
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** Hash a password using bcrypt */
async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, 10);
  } catch (e) {
    console.warn("bcrypt hash fallback:", e);
    return password;
  }
}

/** Securely compare password vs stored hash */
async function verifyPassword(password: string, hash: string): Promise<{ valid: boolean; isLegacy: boolean }> {
  if (!password || typeof password !== "string" || password.trim().length === 0) {
    return { valid: false, isLegacy: false };
  }
  if (!hash || typeof hash !== "string" || hash.trim().length === 0) {
    return { valid: false, isLegacy: false };
  }

  // If hash starts with $2 (bcrypt hash format: $2a$, $2b$, $2y$)
  if (hash.startsWith("$2")) {
    try {
      const match = await bcrypt.compare(password, hash);
      return { valid: match, isLegacy: false };
    } catch (e) {
      console.warn("bcrypt compare failed:", e);
      return { valid: false, isLegacy: false };
    }
  }

  // Legacy plaintext match (strict exact string equality)
  const valid = password === hash;
  return { valid, isLegacy: true };
}

function getInitialAuthUser(): User | null {
  try {
    const rawAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!rawAuth) return null;
    const parsed = JSON.parse(rawAuth);

    // ── Session expiry check (8 hours) ──────────────────────────
    if (parsed?.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      return null;
    }

    if (parsed?.user && parsed.user.name && parsed.user.role) {
      const email = (parsed.user.email || "").toLowerCase();
      const id = (parsed.user.id || "").toLowerCase();
      if (
        email.endsWith("@capacityconnect.org") ||
        email.includes("demo") ||
        id.includes("demo") ||
        id === "u-admin-demo" ||
        id === "u-trainer-demo" ||
        id === "u-trainee-demo"
      ) {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        return null;
      }
      if (parsed.user.status === "removed") {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        return null;
      }
      return sanitizeUserForSession(parsed.user);
    }
  } catch (e) {
    console.error("Failed to load initial auth user", e);
  }
  return null;
}

interface AuthState {
  currentUser: User | null;
  isInitialized: boolean;
  login: (email: string, password: string, requiredRole?: User["role"]) => Promise<{ success: boolean; message: string; user?: User; isRemoved?: boolean }>;
  validateCredentials: (email: string, password: string, requiredRole?: User["role"]) => { success: boolean; message: string; user?: User; isRemoved?: boolean };
  validateCredentialsAsync: (email: string, password: string, requiredRole?: User["role"]) => Promise<{ success: boolean; message: string; user?: User; isRemoved?: boolean }>;
  completeLogin: (user: User) => { success: boolean; message: string; user: User };
  logout: () => void;
  register: (data: Omit<User, "id" | "createdAt" | "status">) => Promise<{ success: boolean; message: string }>;
  updateProfile: (updates: Partial<User>) => void;
  loadFromStorage: () => void;
  verifyCurrentSession: () => Promise<void>;
  findUserForRecovery: (query: { name: string; department?: string; designation?: string; role?: User["role"] }) => {
    success: boolean;
    message: string;
    accounts: Array<{
      id: string;
      name: string;
      maskedEmail: string;
      rawEmail: string;
      role: User["role"];
      department: string;
      designation: string;
      status: User["status"];
    }>;
  };
  resetUserPassword: (email: string, newPassword: string, requiredRole?: User["role"]) => Promise<{
    success: boolean;
    message: string;
  }>;
  submitRecoveryTicket: (ticket: {
    name: string;
    contactInfo: string;
    role: User["role"];
    description: string;
  }) => {
    success: boolean;
    message: string;
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: getInitialAuthUser(),
  isInitialized: true,

  loadFromStorage: () => {
    const user = getInitialAuthUser();
    if (user) {
      set({ currentUser: user, isInitialized: true });
      get().verifyCurrentSession();
    } else {
      set({ currentUser: null, isInitialized: true });
    }
  },

  verifyCurrentSession: async () => {
    const user = get().currentUser;
    if (!user) return;

    try {
      // 1. Check in-memory usersStore
      const memoryUsers = useUsersStore.getState().users;
      let matched = memoryUsers.find(
        (u) => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())
      );

      // 2. Query direct from Supabase Cloud
      if (isSupabaseConfigured) {
        try {
          const cloudUsers = await supabase.select<User>("users", `id=eq.${encodeURIComponent(user.id)}&limit=1`);
          if (cloudUsers && cloudUsers.length > 0) {
            matched = cloudUsers[0];
          }
        } catch (e) {}
      }

      if (matched) {
        if (matched.status === "removed") {
          console.warn("[AuthSecurity] Account revoked by Administrator. Ejecting session immediately.");
          get().logout();
          if (typeof window !== "undefined") {
            window.location.href = "/login?removed=true";
          }
          return;
        }

        // If status or role changed, update local cache
        if (matched.status !== user.status || matched.role !== user.role) {
          const sanitized = sanitizeUserForSession(matched);
          set({ currentUser: sanitized });
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
            if (raw) {
              const parsed = JSON.parse(raw);
              parsed.user = sanitized;
              localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(parsed));
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("verifyCurrentSession check:", err);
    }
  },

  validateCredentialsAsync: async (email, password, requiredRole) => {
    if (!email || !password || email.trim().length === 0 || password.trim().length === 0) {
      return { success: false, message: "Email and password are required." };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Strict security check: reject trial/demo accounts immediately
    if (
      cleanEmail.endsWith("@capacityconnect.org") ||
      cleanEmail.includes("demo") ||
      cleanEmail === "admin@capacityconnect.org" ||
      cleanEmail === "trainer@capacityconnect.org" ||
      cleanEmail === "trainee@capacityconnect.org"
    ) {
      return {
        success: false,
        message: "Trial and demo accounts have been permanently purged. Please sign in with your official account or register."
      };
    }

    let user: User | null = null;

    // 1. Check direct from Supabase Cloud
    if (isSupabaseConfigured) {
      try {
        let cloudUsers = await supabase.select<User>("users", `email=eq.${encodeURIComponent(cleanEmail)}&limit=1`);
        if ((!cloudUsers || cloudUsers.length === 0) && !cleanEmail.includes("@")) {
          // If user entered username prefix without @ domain
          cloudUsers = await supabase.select<User>("users", `email=ilike.${encodeURIComponent(cleanEmail)}@%&limit=1`);
        }
        if (cloudUsers && cloudUsers.length > 0) {
          user = cloudUsers[0];
        }
      } catch (e) {
        console.warn("Supabase auth lookup warning:", e);
      }
    }

    // 2. Fallback to in-memory state if cloud lookup was empty
    if (!user) {
      const inMemory = useUsersStore.getState().users.find((u) => {
        const uEmail = u.email?.toLowerCase() || "";
        return uEmail === cleanEmail || (!cleanEmail.includes("@") && uEmail.startsWith(`${cleanEmail}@`));
      });
      if (inMemory) user = inMemory;
    }

    // 3. Fallback to initialUsers seed (e.g. demo accounts or offline resilience)
    if (!user || !user.password) {
      const seedUser = initialUsers.find((u) => {
        const uEmail = u.email?.toLowerCase() || "";
        return uEmail === cleanEmail || (!cleanEmail.includes("@") && uEmail.startsWith(`${cleanEmail}@`));
      });
      if (seedUser) user = seedUser;
    }

    // User not found
    if (!user) {
      recordAuditEvent({
        actor: email,
        role: requiredRole || "trainee",
        action: "FAILED_LOGIN_ATTEMPT",
        target: "Auth Service",
        status: "FAILED"
      });
      return { success: false, message: "Invalid official email or password." };
    }

    // Check removed status
    if (user.status === "removed") {
      recordAuditEvent({
        actor: user.name || cleanEmail,
        role: user.role || requiredRole || "trainee",
        action: "REMOVED_USER_LOGIN_BLOCKED",
        target: "Auth Service",
        status: "FAILED"
      });
      return {
        success: false,
        message: "Your account was removed by an Administrator. For you to again access the website, you must be allowed and reinstated by an Administrator.",
        isRemoved: true,
        user
      };
    }

    // Secure password verification (bcrypt or legacy plaintext match)
    const { valid, isLegacy } = await verifyPassword(password, user.password || "");
    if (!valid) {
      recordAuditEvent({
        actor: email,
        role: requiredRole || "trainee",
        action: "FAILED_LOGIN_ATTEMPT",
        target: "Auth Service",
        status: "FAILED"
      });
      return { success: false, message: "Invalid official email or password." };
    }

    // Auto-migrate legacy plaintext password to bcrypt hash on cloud
    if (isLegacy) {
      hashPassword(password).then(async (newHash) => {
        try {
          await dbService.update("users", user!.id, { password: newHash });
        } catch (e) {
          console.warn("Password re-hash update failed:", e);
        }
      });
    }

    // Check account lifecycle states
    if (user.status === "pending") {
      if (user.role === "trainee") {
        // Students auto-activate
        user.status = "active";
        dbService.update("users", user.id, { status: "active" }).catch(() => {});
      } else {
        recordAuditEvent({
          actor: user.name,
          role: user.role,
          action: "UNAPPROVED_LOGIN_ATTEMPT",
          target: "Auth Service",
          status: "WARNING"
        });
        return { success: false, message: "Your trainer account is awaiting admin approval before you can sign in." };
      }
    }

    if (user.status === "inactive" || user.status === "suspended") {
      recordAuditEvent({
        actor: user.name,
        role: user.role,
        action: "SUSPENDED_LOGIN_ATTEMPT",
        target: "Auth Service",
        status: "FAILED"
      });
      return { success: false, message: "Your account has been deactivated. Please contact an administrator." };
    }

    // Enforce role isolation
    if (requiredRole && user.role !== requiredRole) {
      recordAuditEvent({
        actor: user.name,
        role: user.role,
        action: "ROLE_MISMATCH_LOGIN_BLOCKED",
        target: `${requiredRole.toUpperCase()} Portal`,
        status: "WARNING"
      });
      return {
        success: false,
        message: `Access Denied: This account is registered as an ${user.role.toUpperCase()}. You cannot sign in through the ${requiredRole.toUpperCase()} portal. Please switch to the ${user.role.toUpperCase()} tab.`
      };
    }

    return { success: true, message: "Credentials validated.", user };
  },

  validateCredentials: (email, password, requiredRole) => {
    if (!email || !password || email.trim().length === 0 || password.trim().length === 0) {
      return { success: false, message: "Email and password are required." };
    }

    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanEmail.endsWith("@capacityconnect.org") ||
      cleanEmail.includes("demo") ||
      cleanEmail === "admin@capacityconnect.org" ||
      cleanEmail === "trainer@capacityconnect.org" ||
      cleanEmail === "trainee@capacityconnect.org"
    ) {
      return {
        success: false,
        message: "Trial and demo accounts have been permanently purged. Please sign in with your official account or register."
      };
    }

    const users = useUsersStore.getState().users;
    const user = users.find((u) => {
      const uEmail = u.email?.toLowerCase() || "";
      return uEmail === cleanEmail || (!cleanEmail.includes("@") && uEmail.startsWith(`${cleanEmail}@`));
    });

    if (!user) {
      return { success: false, message: "Invalid official email or password." };
    }

    let valid = false;
    if (!password || !user.password) {
      valid = false;
    } else if (user.password?.startsWith("$2")) {
      try {
        valid = bcrypt.compareSync(password, user.password);
      } catch {
        valid = false;
      }
    } else {
      valid = user.password === password;
    }

    if (!valid) {
      return { success: false, message: "Invalid official email or password." };
    }

    if (user.status === "removed") {
      return {
        success: false,
        message: "Your account was removed by an Administrator. For you to again access the website, you must be allowed and reinstated by an Administrator.",
        isRemoved: true,
        user
      };
    }

    if (user.status === "pending" && user.role !== "trainee") {
      return { success: false, message: "Your trainer account is awaiting admin approval before you can sign in." };
    }

    if (user.status === "inactive" || user.status === "suspended") {
      return { success: false, message: "Your account has been deactivated. Please contact an administrator." };
    }

    if (requiredRole && user.role !== requiredRole) {
      return {
        success: false,
        message: `Access Denied: This account is registered as an ${user.role.toUpperCase()}. You cannot sign in through the ${requiredRole.toUpperCase()} portal. Please switch to the ${user.role.toUpperCase()} tab.`
      };
    }

    return { success: true, message: "Credentials validated.", user };
  },

  completeLogin: (user) => {
    const sanitizedUser = sanitizeUserForSession(user);
    set({ currentUser: sanitizedUser, isInitialized: true });
    localStorage.setItem(
      STORAGE_KEYS.AUTH,
      JSON.stringify({
        userId: sanitizedUser.id,
        user: sanitizedUser,
        expiresAt: Date.now() + SESSION_TTL_MS // 8-hour session expiry
      })
    );
    recordAuditEvent({
      actor: sanitizedUser.name,
      role: sanitizedUser.role,
      action: "SESSION_AUTHENTICATED",
      target: `${sanitizedUser.role.toUpperCase()} Portal`,
      status: "SUCCESS"
    });
    return { success: true, message: "Login successful!", user: sanitizedUser };
  },

  login: async (email, password, requiredRole) => {
    const valid = await get().validateCredentialsAsync(email, password, requiredRole);
    if (!valid.success || !valid.user) {
      return valid;
    }
    return get().completeLogin(valid.user);
  },

  logout: () => {
    const user = get().currentUser;
    if (user) {
      recordAuditEvent({
        actor: user.name,
        role: user.role,
        action: "SESSION_TERMINATED",
        target: "Auth Service",
        status: "SUCCESS"
      });
    }
    set({ currentUser: null });
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  },

  register: async (data) => {
    const cleanEmail = data.email.trim().toLowerCase();

    // 1. Check Cloud Supabase for existing user
    let existingUser: User | null = null;
    if (isSupabaseConfigured) {
      try {
        const cloudUsers = await supabase.select<User>("users", `email=eq.${encodeURIComponent(cleanEmail)}&limit=1`);
        if (cloudUsers && cloudUsers.length > 0) {
          existingUser = cloudUsers[0];
        }
      } catch (e) {}
    }

    if (!existingUser) {
      const inMemory = useUsersStore.getState().users.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (inMemory) existingUser = inMemory;
    }

    if (existingUser?.status === "removed") {
      recordAuditEvent({
        actor: data.name || cleanEmail,
        role: data.role,
        action: "REMOVED_USER_REGISTRATION_BLOCKED",
        target: "Registration Gateway",
        status: "WARNING"
      });
      return {
        success: false,
        message: "Registration Blocked: This email was removed by an Administrator. Platform policy requires an Administrator to allow and reinstate your access before you can register or access the website."
      };
    }

    if (existingUser) {
      return { success: false, message: "An account with this email already exists." };
    }

    // 2. Hash password with bcrypt before saving to Cloud
    const hashedPassword = await hashPassword(data.password || "");

    const newUser: User = {
      ...data,
      password: hashedPassword,
      id: generateId(data.role),
      status: data.role === "trainee" ? "active" : "pending",
      createdAt: new Date().toISOString(),
      traineeProfile: data.role === "trainee" ? {
        bio: `Dedicated ${(data.traineeProfile?.department as any) || "Technical"} student actively acquiring advanced capabilities on Capacity Connect.`,
        qualifications: ["Bachelor of Technology / Higher Secondary / Equivalent"],
        experience: ["Student / Trainee Scholar"],
        skills: data.traineeProfile?.skills || ["Problem Solving", "Cloud Infrastructure"],
        interests: ["Capacity Building", "System Architecture", "Continuous Learning"],
        certificates: [],
        phone: "+91 98765 00000",
        department: (data.traineeProfile?.department as any) || "Computer Science & Engineering",
        designation: (data.traineeProfile?.designation as any) || "Undergraduate Student",
        xpPoints: 100,
        streakDays: 1,
        completedCoursesCount: 0,
        badges: []
      } : undefined,
      trainerProfile: data.role === "trainer" ? {
        bio: `Certified Instructor with deep domain expertise in ${(data.trainerProfile?.department as any) || "Engineering & Leadership"}.`,
        expertise: data.trainerProfile?.expertise || ["Curriculum Authoring", "Assessment Design"],
        competencies: ["Live Lecture Delivery", "Workforce Assessment"],
        phone: "+91 98765 11111",
        department: (data.trainerProfile?.department as any) || "Academic Faculty",
        designation: (data.trainerProfile?.designation as any) || "Senior Trainer",
        experience: data.trainerProfile?.experience || "8+ Years Industry & Academic Leadership",
        rating: 5.0,
        totalStudentsTaught: 0,
        verifiedCredentials: [(data.trainerProfile?.department as any) || "Institutional Faculty Accreditation"]
      } : undefined
    };

    // 3. Insert directly into Supabase Cloud
    await dbService.create("users", newUser);

    // 4. Update in-memory Zustand store
    useUsersStore.setState((state) => ({
      users: [newUser, ...state.users.filter((u) => u.id !== newUser.id)]
    }));

    recordAuditEvent({
      actor: newUser.name,
      role: newUser.role,
      action: "ACCOUNT_REGISTERED",
      target: "Cloud Users Registry",
      status: "SUCCESS"
    });

    return { success: true, message: "Registration successful!" };
  },

  updateProfile: (updates) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    set({ currentUser: updatedUser });
    localStorage.setItem(
      STORAGE_KEYS.AUTH,
      JSON.stringify({
        userId: updatedUser.id,
        user: updatedUser,
        expiresAt: Date.now() + SESSION_TTL_MS
      })
    );
    useUsersStore.setState((state) => ({
      users: state.users.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u))
    }));
    dbService.update("users", currentUser.id, updates);
  },

  findUserForRecovery: (query) => {
    const users = useUsersStore.getState().users;
    const searchName = (query.name || "").trim().toLowerCase();

    if (!searchName || searchName.length < 2) {
      return {
        success: false,
        message: "Please enter at least 2 characters of your registered name.",
        accounts: []
      };
    }

    const searchDept = (query.department || "").trim().toLowerCase();
    const searchDesig = (query.designation || "").trim().toLowerCase();

    const matches = users.filter((u) => {
      if (query.role && u.role !== query.role) {
        return false;
      }

      const nameMatch = u.name?.toLowerCase().includes(searchName);
      if (!nameMatch) return false;

      const uDept = (u.department || u.traineeProfile?.department || u.trainerProfile?.department || "").toLowerCase();
      if (searchDept && searchDept !== "all" && !uDept.includes(searchDept)) {
        return false;
      }

      const uDesig = (u.designation || u.traineeProfile?.designation || u.trainerProfile?.designation || "").toLowerCase();
      if (searchDesig && searchDesig !== "all" && !uDesig.includes(searchDesig)) {
        return false;
      }

      return true;
    });

    if (matches.length === 0) {
      return {
        success: false,
        message: "No registered account matched the provided name and department. Please verify spelling or contact support.",
        accounts: []
      };
    }

    const accounts = matches.map((u) => {
      const parts = u.email.split("@");
      let maskedEmail = u.email;
      if (parts.length === 2) {
        const [n, d] = parts;
        const prefix = n.length > 3 ? n.slice(0, 3) : n.slice(0, 1);
        const suffix = n.length > 3 ? n.slice(-2) : "";
        maskedEmail = `${prefix}*****${suffix}@${d}`;
      }

      return {
        id: u.id,
        name: u.name,
        maskedEmail,
        rawEmail: u.email,
        role: u.role,
        department: u.department || u.traineeProfile?.department || u.trainerProfile?.department || "Computer Science & Engineering",
        designation: u.designation || u.traineeProfile?.designation || u.trainerProfile?.designation || (u.role === "trainee" ? "Undergraduate Student" : "Faculty Trainer"),
        status: u.status
      };
    });

    return {
      success: true,
      message: `Found ${accounts.length} verified account(s) matching "${query.name}".`,
      accounts
    };
  },

  resetUserPassword: async (email, newPassword, requiredRole) => {
    const cleanEmail = email.trim().toLowerCase();
    let user: User | null = null;

    if (isSupabaseConfigured) {
      try {
        const cloudUsers = await supabase.select<User>("users", `email=eq.${encodeURIComponent(cleanEmail)}&limit=1`);
        if (cloudUsers && cloudUsers.length > 0) {
          user = cloudUsers[0];
        }
      } catch (e) {}
    }

    if (!user) {
      user = useUsersStore.getState().users.find((u) => u.email?.toLowerCase() === cleanEmail) || null;
    }

    if (!user) {
      return { success: false, message: "Account not found with this official email address." };
    }

    if (user.role === "admin") {
      return {
        success: false,
        message: "Administrative accounts cannot be reset via self-service recovery. Please contact a Super Administrator."
      };
    }

    if (requiredRole && user.role !== requiredRole) {
      return {
        success: false,
        message: `Account role mismatch: This email is registered as an ${user.role.toUpperCase()}.`
      };
    }

    if (user.status === "suspended" || user.status === "inactive") {
      return { success: false, message: "This account is inactive or suspended. Please contact an administrator." };
    }

    const hashedPassword = await hashPassword(newPassword);

    await dbService.update("users", user.id, { password: hashedPassword });

    useUsersStore.setState((state) => ({
      users: state.users.map((u) => (u.id === user!.id ? { ...u, password: hashedPassword } : u))
    }));

    recordAuditEvent({
      actor: user.name,
      role: user.role,
      action: "PASSWORD_RESET_SUCCESS",
      target: "Auth Credentials Service",
      status: "SUCCESS"
    });

    const current = get().currentUser;
    if (current && current.id === user.id) {
      set({ currentUser: { ...user, password: hashedPassword } });
    }

    return {
      success: true,
      message: "Password updated successfully. You can now sign in with your new credentials."
    };
  },

  submitRecoveryTicket: (ticket) => {
    const newNotif = {
      id: generateId("notif-recovery"),
      type: "alert" as const,
      title: `Credential Assistance Request: ${ticket.name} (${ticket.role.toUpperCase()})`,
      content: `User reported inaccessible credentials. Contact: ${ticket.contactInfo}. Details: ${ticket.description}`,
      createdAt: new Date().toISOString(),
      pinned: true,
      author: "Security & Recovery Sentinel"
    };

    useNotificationsStore.getState().addNotification(newNotif);

    recordAuditEvent({
      actor: ticket.name,
      role: ticket.role,
      action: "ACCOUNT_RECOVERY_TICKET_FILED",
      target: "Admin Governance Ledger",
      status: "WARNING"
    });

    return {
      success: true,
      message: "Your recovery ticket has been submitted to the platform administrator for manual verification."
    };
  }
}));
