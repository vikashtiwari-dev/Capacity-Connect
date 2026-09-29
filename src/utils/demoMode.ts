import type { User, Course } from "../types";

/**
 * Demo accounts have been permanently purged from the platform.
 * This helper returns false across all contexts.
 */
export function isDemoAccount(_user?: User | null | { email?: string; id?: string }): boolean {
  return false;
}

/**
 * Known core production course identifiers that are strictly protected from deletion/tampering
 */
export const CORE_PRODUCTION_COURSE_IDS = [
  "c-dsa",
  "c-sql",
  "c-web-dev",
  "c-python",
  "c-cplusplus",
  "c6",
  "c7",
  "c8",
  "c-dsa-advanced",
  "c-react-native",
  "c-ai-ml"
];

/**
 * Determines if a course is a core production course protected from accidental deletion
 */
export function isProtectedProductionCourse(course?: Course | { id: string; trainerId?: string } | null): boolean {
  if (!course) return false;
  return CORE_PRODUCTION_COURSE_IDS.includes(course.id);
}

/**
 * Primary platform administrator email
 */
export const PRIMARY_ADMIN_EMAIL = "vkt052005@gmail.com";

/**
 * Checks if a user is an authentic Platform Administrator
 */
export function isRealAdmin(user?: User | null | { email?: string; role?: string; id?: string }): boolean {
  if (!user) return false;
  const email = (user.email || "").toLowerCase().trim();
  const id = (user.id || "").toLowerCase().trim();
  if (email === PRIMARY_ADMIN_EMAIL || id === "u-admin-official") return true;
  return user.role === "admin";
}
