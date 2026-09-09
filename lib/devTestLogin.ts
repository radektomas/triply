import "server-only";

// Preview/local-only tester account for the onboarding wizard.
//
// Vercel preview deployments and local dev share the production Supabase
// project, so testing /onboarding used to mean signing up with a real email
// every time. Instead, on NON-production environments the wizard signs the
// visitor in as one fixed tester account (created on first use, no password,
// no email ever sent). /api/dev/test-login does the sign-in; /onboarding
// redirects there when nobody is signed in.
//
// The guard below is the whole safety story: on flytriply.eu VERCEL_ENV is
// "production" and every one of these paths 404s.

export const TEST_USER_EMAIL = "onboarding-tester@flytriply.eu";
export const TEST_USER_NAME = "Onboarding Tester";

export function isTestLoginAllowed(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "production") return false;
  return (
    vercelEnv === "preview" ||
    vercelEnv === "development" ||
    process.env.NODE_ENV === "development"
  );
}
