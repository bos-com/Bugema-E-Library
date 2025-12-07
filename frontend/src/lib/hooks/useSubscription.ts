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

    // Determine if user is a visitor (doesn't have registration_number or staff_id)
    // Backend determines this by checking if user has registration_number or staff_id
    // Users with these IDs get free access, visitors need subscriptions
    // LOCATION: Backend checks User.has_free_access property in backend/accounts/models.py
    const isVisitor = user !== null && !user.registration_number && !user.staff_id;

    const { data: subscription, isLoading } = useQuery({
        queryKey: ['my-subscription'],
        queryFn: getMySubscription,
        enabled: !!user, // Fetch for all users (backend handles free access)
        staleTime: 60 * 1000, // 1 minute
        retry: false, // Don't retry if no subscription
    });

    // Backend returns is_valid: true for users with registration_number or staff_id (free access)
    // LOCATION: Backend logic in backend/subscriptions/views.py - MySubscriptionView.retrieve
    const hasActiveSubscription = subscription?.is_valid === true;
    // Only visitors (no registration_number or staff_id) need subscription if they don't have one
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
