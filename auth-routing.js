const authenticationPages = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

// Only application-relative destinations are accepted, so a sign-in cannot
// become an open redirect and authentication pages cannot redirect to themselves.
export function resolveReturnPath(from, fallback = "/dashboard") {
  if (
    typeof from !== "string" ||
    !from.startsWith("/") ||
    from.startsWith("//") ||
    from.includes("\\") ||
    /[\u0000-\u0020]/.test(from)
  )
    return fallback;
  try {
    const destination = new URL(from, "https://app.local");
    if (
      destination.origin !== "https://app.local" ||
      authenticationPages.has(
        destination.pathname.replace(/\/$/, "").toLowerCase(),
      )
    )
      return fallback;
    return destination.pathname + destination.search + destination.hash;
  } catch {
    return fallback;
  }
}
