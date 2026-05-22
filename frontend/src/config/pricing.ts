// Centralized pricing configuration
// Use this to toggle pricing for live testing.
// DO NOT delete original values, just comment them out if needed.

export const PLAN_PRICING = {
    basic: {
        originalPrice: 499,
        // finalPrice: 99, // Original production price
        finalPrice: 1,     // Temporary testing price
        discountBadge: '99% OFF'
    },
    pro: {
        originalPrice: 699,
        // finalPrice: 349, // Original production price
        finalPrice: 349,     
        discountBadge: '50% OFF'
    }
};
