import client from './client';

export interface SubscriptionPlan {
    id: number;
    name: string;
    duration: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    price: string;
    description: string;
    features: string[];
}

export interface UserSubscription {
    id: number;
    plan_name: string;
    start_date: string;
    end_date: string;
    status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
    is_valid: boolean;
}

export const getPlans = async () => {
    const response = await client.get<SubscriptionPlan[]>('/subscriptions/plans/');
    return response.data;
};

export const createSubscription = async (data: { plan_id: number; payment_method: string }) => {
    const response = await client.post<UserSubscription>('/subscriptions/subscribe/', data);
    return response.data;
};

export const getMySubscription = async () => {
    const response = await client.get<UserSubscription>('/subscriptions/me/');
    return response.data;
};
