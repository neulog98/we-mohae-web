import type { CoupleMode, UserProfile } from "@/types/domain";

export function hasCompletedOnboarding(profile: UserProfile | null) {
  return Boolean(profile?.mode && profile?.coupleId);
}

export function canUseBudget(mode: CoupleMode | null | undefined) {
  return mode === "wedding";
}
