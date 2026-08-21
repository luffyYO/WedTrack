/**
 * Canonical plan identifiers across WedTrack.
 *
 * 'pro' is the current active tier name.
 * 'premium' and '349' are legacy identifiers that may exist in older records.
 */
export const PREMIUM_PLANS = ['pro', 'premium', '349'] as const;
export type PlanId = 'basic' | 'pro';

/**
 * Returns true if the plan grants premium features (push notifications,
 * WhatsApp messaging, phone number entry).
 */
export const isPremiumPlan = (plan: string | null | undefined): boolean => {
    if (!plan) return false;
    return PREMIUM_PLANS.includes(plan as typeof PREMIUM_PLANS[number]);
};
