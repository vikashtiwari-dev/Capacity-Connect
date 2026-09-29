/**
 * Purges legacy and local device cache data to ensure the platform operates
 * purely against the Supabase Cloud backend without stale local storage.
 */
export function purgeLocalDeviceData(): void {
  if (typeof window === "undefined" || !window.localStorage) return;

  const keysToPurge = [
    "cc_competencies",
    "cc_discussions",
    "cc_leaderboard",
    "cc_badges",
    "cc_deleted_courses",
    "cc_removed_users",
    "cc_temp_cache",
    "cc_assessments"
  ];

  for (const key of keysToPurge) {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors
    }
  }

  try {
    const raw = window.localStorage.getItem("cc_enrollments");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((e: any) => e && e.courseId !== "c-raj-tiwari-dsa");
        window.localStorage.setItem("cc_enrollments", JSON.stringify(filtered));
      }
    }
  } catch (e) {}

  // Purge any stored demo sessions
  try {
    const rawAuth = window.localStorage.getItem("cc_auth");
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      const email = (parsed?.user?.email || parsed?.email || "").toLowerCase();
      const id = (parsed?.user?.id || parsed?.id || "").toLowerCase();
      if (
        email.endsWith("@capacityconnect.org") ||
        email.includes("demo") ||
        id.includes("demo") ||
        id === "u-admin-demo" ||
        id === "u-trainer-demo" ||
        id === "u-trainee-demo"
      ) {
        window.localStorage.removeItem("cc_auth");
      }
    }
  } catch (e) {}

  // Asynchronously purge trial / demo accounts from Supabase cloud database
  try {
    import("../services/supabase").then(({ supabase, isSupabaseConfigured }) => {
      if (isSupabaseConfigured) {
        supabase.delete("users", "email", "admin@capacityconnect.org").catch(() => {});
        supabase.delete("users", "email", "trainer@capacityconnect.org").catch(() => {});
        supabase.delete("users", "email", "trainee@capacityconnect.org").catch(() => {});
        supabase.delete("users", "id", "u-admin-demo").catch(() => {});
        supabase.delete("users", "id", "u-trainer-demo").catch(() => {});
        supabase.delete("users", "id", "u-trainee-demo").catch(() => {});
      }
    }).catch(() => {});
  } catch (e) {}
}
