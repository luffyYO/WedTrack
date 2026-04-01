// Feature: Dashboard
// Barrel exports — import from '@/features/dashboard' in consuming pages.

export { default as DashboardStats } from './components/DashboardStats';
export { default as GuestLinkBanner } from './components/GuestLinkBanner';
export { default as WeddingSelector } from './components/WeddingSelector';
export { default as GuestSummaryBar } from './components/GuestSummaryBar';

export { useRealtimeGuests } from './hooks/useRealtimeGuests';
export { useGuestFilters } from './hooks/useGuestFilters';
export { useGuestMutations } from './hooks/useGuestMutations';
