import { useQuery } from '@tanstack/react-query';
import { getMySubscription, UserSubscription } from '../api/subscriptions';
import { useAuthStore } from '../store/auth';

interface SubscriptionState {
    subscription: UserSubscription | null;
    isLoading: boolean;
    hasActiveSubscription: boolean;
    isVisitor: boolean;
    needsSubscription: boolean;
    timeRemaining: number | null; // in milliseconds
    percentElapsed: number;
    showRenewalWarning: boolean;
    expiryDate: Date | null;
}

export const useSubscription = (): SubscriptionState => {
    const user = useAuthStore((state) => state.user);

    // Determine if user is a visitor (non-staff/student)
    // Staff and students have role 'USER' but are identified differently
    // For now, we check if the user's email contains staff/student patterns
    // or check a specific field - adjust based on your User model
    const isStaffOrStudent = user?.email?.includes('@bugema.ac.ug') ||
        user?.email?.includes('staff') ||
        user?.role === 'ADMIN';

    const isVisitor = user !== null && !isStaffOrStudent;

    const { data: subscription, isLoading } = useQuery({
        queryKey: ['my-subscription'],
        queryFn: getMySubscription,
        enabled: !!user && isVisitor, // Only fetch for visitors
        staleTime: 60 * 1000, // 1 minute
        retry: false, // Don't retry if no subscription
    });

    const hasActiveSubscription = subscription?.is_valid === true;
    const needsSubscription = isVisitor && !hasActiveSubscription;

    // Calculate time remaining
    let timeRemaining: number | null = null;
    let percentElapsed = 0;
    let expiryDate: Date | null = null;

    if (subscription?.end_date && subscription?.start_date) {
        const endDate = new Date(subscription.end_date);
        const startDate = new Date(subscription.start_date);
        const now = new Date();

        expiryDate = endDate;
        timeRemaining = endDate.getTime() - now.getTime();

        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = now.getTime() - startDate.getTime();
        percentElapsed = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }

    // Show renewal warning at 80% elapsed
    const showRenewalWarning = hasActiveSubscription && percentElapsed >= 80;

    return {
        subscription: subscription || null,
        isLoading,
        hasActiveSubscription,
        isVisitor,
        needsSubscription,
        timeRemaining,
        percentElapsed,
        showRenewalWarning,
        expiryDate,
    };
};
