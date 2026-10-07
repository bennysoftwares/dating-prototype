import { ACCOUNT_ROUTES, ONBOARDING_ROUTES, ROUTES } from '../app/navigation';
import type { User } from '../domain/types';
import type { AuthState } from '../repositories/types';

/**
 * Where someone belongs right now. Every gate uses this, so the getting-started order
 * (account → verify email → profile → app) is defined once.
 */
export function homeFor(user: User, auth: AuthState): string {
  if (!auth.signedIn) return ONBOARDING_ROUTES.welcome;
  if (auth.account?.method === 'email' && !auth.account.emailVerified) return ACCOUNT_ROUTES.verify;
  if (!user.onboardingComplete) return ONBOARDING_ROUTES.intro;
  return ROUTES.explore;
}

export type GateStage = 'signed-out' | 'verify' | 'onboarding' | 'member';

/** Which stage `homeFor` corresponds to. */
export function stageOf(user: User, auth: AuthState): GateStage {
  const home = homeFor(user, auth);
  if (home === ONBOARDING_ROUTES.welcome) return 'signed-out';
  if (home === ACCOUNT_ROUTES.verify) return 'verify';
  if (home === ONBOARDING_ROUTES.intro) return 'onboarding';
  return 'member';
}
