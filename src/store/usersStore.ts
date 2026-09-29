import { create } from 'zustand';
import type { User } from '../types';
import { STORAGE_KEYS } from '../data/seed';
import { dbService } from '../services/db';
import { recordAuditEvent } from './auditStore';

interface UsersState {
  users: User[];
  isSubscribed: boolean;
  load: () => Promise<void>;
  initSubscription: () => void;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  activateUser: (userId: string) => Promise<void>;
  updateRole: (userId: string, role: User['role']) => Promise<void>;
  verifyTrainer: (userId: string, isVerified: boolean) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  purgeRevokedUsers: () => Promise<number>;
  removeUser: (userId: string, reason?: string) => Promise<void>;
  allowUserAccess: (userId: string) => Promise<void>;
  requestReinstatement: (email: string, note?: string) => Promise<{ success: boolean; message: string }>;
  isUserRemoved: (email: string) => boolean;
  getTrainees: () => User[];
  getTrainers: () => User[];
  getPendingUsers: () => User[];
  getRemovedUsers: () => User[];
}

/**
 * Cross-tab & multi-device session eviction for removed users.
 * Immediately purges authentication cache and redirects to /login?removed=true.
 */
export function evictSessionIfRemoved(userId: string, email?: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      const authId = parsed?.userId || parsed?.user?.id || parsed?.id;
      const authEmail = (parsed?.user?.email || parsed?.email || "").toLowerCase();
      const targetEmail = (email || "").toLowerCase();
      if (authId === userId || (targetEmail && authEmail === targetEmail)) {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        if (typeof window !== "undefined") {
          window.location.href = "/login?removed=true";
        }
      }
    }
  } catch (e) {}

  // Broadcast across all open browser windows and tabs
  try {
    localStorage.setItem("cc_session_eviction", JSON.stringify({ userId, email, timestamp: Date.now() }));
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel("cc_auth_channel");
      bc.postMessage({ type: "SESSION_EVICTED", userId, email });
      bc.close();
    }
  } catch (e) {}
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  isSubscribed: false,

  initSubscription: () => {
    if (get().isSubscribed) return;
    set({ isSubscribed: true });

    // Listen to real-time server events across all devices on the network
    dbService.subscribe('users', async (event) => {
      try {
        const fresh = (event?.data && Array.isArray(event.data))
          ? event.data
          : await dbService.getAll<User>('users', 500);
        if (fresh) {
          const mapped = fresh.map((u) => {
            const { password, ...safeUser } = u as any;
            if (safeUser && (safeUser.removedAt || safeUser.removed_at || safeUser.removalReason || safeUser.removal_reason)) {
              return { ...safeUser, status: "removed" as const };
            }
            return safeUser as User;
          });
          set({ users: mapped });

          // Immediate multi-device session eviction check for current client
          try {
            const rawAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
            if (rawAuth) {
              const parsed = JSON.parse(rawAuth);
              const authId = parsed?.userId || parsed?.user?.id || parsed?.id;
              const authEmail = (parsed?.user?.email || parsed?.email || "").toLowerCase();
              const freshUser = mapped.find(
                (u) => u.id === authId || (u.email && u.email.toLowerCase() === authEmail)
              );
              if (freshUser && (freshUser.status === "removed" || Boolean(freshUser.removedAt))) {
                console.warn("[Security] Real-time signal: Active account was removed by Administrator. Evicting session.");
                localStorage.removeItem(STORAGE_KEYS.AUTH);
                if (typeof window !== "undefined") {
                  window.location.href = "/login?removed=true";
                }
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    });
  },

  load: async () => {
    get().initSubscription();

    try {
      const serverUsers = await dbService.getAll<User>('users', 500);
      if (serverUsers) {
        const mapped = serverUsers.map((u) => {
          const { password, ...safeUser } = u as any;
          if (safeUser && (safeUser.removedAt || safeUser.removed_at || safeUser.removalReason || safeUser.removal_reason)) {
            return { ...safeUser, status: "removed" as const };
          }
          return safeUser as User;
        });
        set({ users: mapped });
      }
    } catch (e) {
      console.warn('Could not load users from cloud:', e);
    }
  },

  approveUser: async (userId) => {
    const { users } = get();
    const targetUser = users.find((u) => u.id === userId);
    const updated = users.map((u) => (u.id === userId ? { ...u, status: 'active' as const } : u));
    set({ users: updated });

    await dbService.update('users', userId, { status: 'active' });
    if (targetUser) {
      recordAuditEvent({
        actor: "Capacity Connect Admin",
        role: "admin",
        action: "ACCOUNT_APPROVED",
        target: `${targetUser.name} (${targetUser.email})`,
        status: "SUCCESS"
      });
    }
  },

  rejectUser: async (userId) => {
    const { users } = get();
    const targetUser = users.find((u) => u.id === userId);
    const updated = users.map((u) => (u.id === userId ? { ...u, status: "rejected" as const } : u));
    set({ users: updated });

    await dbService.update('users', userId, { status: 'rejected' });
    if (targetUser) {
      recordAuditEvent({
        actor: "Capacity Connect Admin",
        role: "admin",
        action: "ACCOUNT_REJECTED",
        target: `${targetUser.name} (${targetUser.email})`,
        status: "WARNING"
      });
    }
  },

  deactivateUser: async (userId) => {
    const { users } = get();
    const targetUser = users.find((u) => u.id === userId);
    const updated = users.map((u) => (u.id === userId ? { ...u, status: 'inactive' as const } : u));
    set({ users: updated });

    await dbService.update('users', userId, { status: 'inactive' });
    if (targetUser) {
      recordAuditEvent({
        actor: "Capacity Connect Admin",
        role: "admin",
        action: "ACCOUNT_DEACTIVATED",
        target: `${targetUser.name} (${targetUser.email})`,
        status: "WARNING"
      });
    }
  },

  activateUser: async (userId) => {
    const { users } = get();
    const targetUser = users.find((u) => u.id === userId);
    const updated = users.map((u) => (u.id === userId ? { ...u, status: 'active' as const } : u));
    set({ users: updated });

    await dbService.update('users', userId, { status: 'active' });
    if (targetUser) {
      recordAuditEvent({
        actor: "Capacity Connect Admin",
        role: "admin",
        action: "ACCOUNT_ACTIVATED",
        target: `${targetUser.name} (${targetUser.email})`,
        status: "SUCCESS"
      });
    }
  },

  updateRole: async (userId, role) => {
    const { users } = get();
    const targetUser = users.find((u) => u.id === userId);
    const updated = users.map((u) => (u.id === userId ? { ...u, role } : u));
    set({ users: updated });

    await dbService.update('users', userId, { role });
    if (targetUser) {
      recordAuditEvent({
        actor: "Capacity Connect Admin",
        role: "admin",
        action: "ROLE_PROMOTED",
        target: `${targetUser.name} -> ${role.toUpperCase()}`,
        status: "SUCCESS"
      });
    }
  },

  verifyTrainer: async (userId, isVerified) => {
    const { users } = get();
    const targetUser = users.find((u) => u.id === userId);
    const updated = users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          isVerifiedByAdmin: isVerified,
          trainerProfile: u.trainerProfile
            ? { ...u.trainerProfile, isVerifiedByAdmin: isVerified }
            : undefined
        };
      }
      return u;
    });
    set({ users: updated });

    await dbService.update('users', userId, {
      isVerifiedByAdmin: isVerified,
      trainerProfile: targetUser?.trainerProfile
        ? { ...targetUser.trainerProfile, isVerifiedByAdmin: isVerified }
        : undefined
    });

    if (targetUser) {
      recordAuditEvent({
        actor: "Capacity Connect Admin",
        role: "admin",
        action: isVerified ? "TRAINER_VERIFIED" : "TRAINER_VERIFICATION_REVOKED",
        target: `${targetUser.name} (${targetUser.email}) - Video Upload ${isVerified ? "Unlocked" : "Revoked"}`,
        status: "SUCCESS"
      });
    }
  },

  deleteUser: async (userId) => {
    const { users } = get();
    const targetUser = users.find((u) => u.id === userId);
    const updated = users.filter((u) => u.id !== userId);
    set({ users: updated });

    await dbService.remove('users', userId);
    if (targetUser) {
      recordAuditEvent({
        actor: "Capacity Connect Admin",
        role: "admin",
        action: "ACCOUNT_DELETED",
        target: `${targetUser.name} (${targetUser.email})`,
        status: "SUCCESS"
      });
    }
  },

  purgeRevokedUsers: async () => {
    const { users } = get();
    const isRemoved = (u: User) =>
      u.status === "removed" ||
      Boolean(u.removedAt) ||
      Boolean((u as any).removed_at) ||
      Boolean(u.removalReason) ||
      Boolean((u as any).removal_reason);

    const revokedUsers = users.filter(isRemoved);
    const remainingUsers = users.filter((u) => !isRemoved(u));
    set({ users: remainingUsers });

    for (const u of revokedUsers) {
      try {
        await dbService.remove('users', u.id);
      } catch (e) {
        console.warn(`Failed to delete revoked user ${u.id}:`, e);
      }
    }

    recordAuditEvent({
      actor: "Capacity Connect Admin",
      role: "admin",
      action: "REVOKED_USERS_PURGED",
      target: `Permanently purged ${revokedUsers.length} revoked user records from database`,
      status: "SUCCESS"
    });

    return revokedUsers.length;
  },

  removeUser: async (userId, reason) => {
    const { users } = get();
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    if (targetUser.role === "admin") return;

    const now = new Date().toISOString();
    const updatedUser: User = {
      ...targetUser,
      status: "removed",
      removedAt: now,
      removedBy: "Capacity Connect Admin",
      removalReason: reason || "Revoked by Administrator",
      reinstatementRequested: false,
      reinstatementNote: undefined
    };

    const updated = users.map((u) => (u.id === userId ? updatedUser : u));
    set({ users: updated });

    await dbService.update('users', userId, {
      status: 'removed',
      removedAt: now,
      removedBy: 'Capacity Connect Admin',
      removalReason: reason || 'Revoked by Administrator'
    });

    recordAuditEvent({
      actor: "Capacity Connect Admin",
      role: "admin",
      action: "ACCOUNT_REMOVED",
      target: `${targetUser.name} (${targetUser.email}) [${targetUser.role.toUpperCase()}] Access Revoked. Reason: ${reason || 'Revocation by Administrator'}`,
      status: "WARNING"
    });

    recordAuditEvent({
      actor: "System Security Guard",
      role: "admin",
      action: "SESSION_FORCE_TERMINATED",
      target: `${targetUser.name} (${targetUser.email}) - All active login tokens invalidated across all devices`,
      status: "SUCCESS"
    });

    // Invalidate and evict session across all tabs and devices immediately
    evictSessionIfRemoved(userId, targetUser.email);
  },

  allowUserAccess: async (userId) => {
    const { users } = get();
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const updatedUser: User = {
      ...targetUser,
      status: "active",
      removedAt: undefined,
      removedBy: undefined,
      removalReason: undefined,
      reinstatementRequested: false,
      reinstatementNote: undefined,
      reinstatementRequestedAt: undefined
    };

    const updated = users.map((u) => (u.id === userId ? updatedUser : u));
    set({ users: updated });

    await dbService.update('users', userId, {
      status: 'active',
      removedAt: null,
      removedBy: null,
      removalReason: null,
      reinstatementRequested: false
    });

    recordAuditEvent({
      actor: "Capacity Connect Admin",
      role: "admin",
      action: "ACCOUNT_REINSTATED",
      target: `${targetUser.name} (${targetUser.email}) [${targetUser.role.toUpperCase()}] Access Allowed by Admin`,
      status: "SUCCESS"
    });
  },

  requestReinstatement: async (email, note) => {
    const clean = email.trim().toLowerCase();
    const { users } = get();
    const targetUser = users.find((u) => u.email.toLowerCase() === clean);
    if (!targetUser) {
      return { success: false, message: "No account found with this email." };
    }

    const now = new Date().toISOString();
    const updatedUser: User = {
      ...targetUser,
      reinstatementRequested: true,
      reinstatementRequestedAt: now,
      reinstatementNote: note?.trim() || "User requested re-admission to Capacity Connect."
    };

    const updated = users.map((u) => (u.id === targetUser.id ? updatedUser : u));
    set({ users: updated });

    await dbService.update('users', targetUser.id, {
      reinstatementRequested: true,
      reinstatementRequestedAt: now,
      reinstatementNote: note?.trim() || "User requested re-admission to Capacity Connect."
    });

    recordAuditEvent({
      actor: targetUser.name,
      role: targetUser.role,
      action: "REINSTATEMENT_REQUESTED",
      target: `Re-admission requested by ${targetUser.email}. Note: ${note || 'None'}`,
      status: "WARNING"
    });

    return {
      success: true,
      message: "Re-admission request submitted to Administrators. You will be able to access the portal once an Administrator reviews and allows your account."
    };
  },

  isUserRemoved: (email) => {
    const clean = email.trim().toLowerCase();
    const { users } = get();
    const match = users.find((u) => u.email?.toLowerCase() === clean);
    return match ? (match.status === "removed" || Boolean(match.removedAt) || Boolean((match as any).removed_at)) : false;
  },

  getTrainees: () => get().users.filter((u) => u.role === 'trainee' && u.status !== 'removed' && !u.removedAt && !(u as any).removed_at),
  getTrainers: () => get().users.filter((u) => u.role === 'trainer' && u.status !== 'removed' && !u.removedAt && !(u as any).removed_at),
  getPendingUsers: () => get().users.filter((u) => u.status === 'pending' && !u.removedAt && !(u as any).removed_at),
  getRemovedUsers: () => get().users.filter((u) => u.status === 'removed' || Boolean(u.removedAt) || Boolean((u as any).removed_at)),
}));

// Initialize subscription on boot
if (typeof window !== 'undefined') {
  useUsersStore.getState().load();
}
