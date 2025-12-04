import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../lib/store/auth';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';
import api from '../../lib/api/client';

interface ProfileData {
    name: string;
    email: string;
    profile_picture?: File | null;
}

const ProfilePage = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<ProfileData>({ name: '', email: '', profile_picture: null });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const queryClient = useQueryClient();

    // Initialize form data when user is available
    useState(() => {
        if (user) {
            setFormData({ name: user.name, email: user.email, profile_picture: null });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: ProfileData) => {
            const formDataToSend = new FormData();
            formDataToSend.append('name', data.name);
            formDataToSend.append('email', data.email);
            if (data.profile_picture) {
                formDataToSend.append('profile_picture', data.profile_picture);
            }

            const { data: responseData } = await api.patch('/auth/profile/', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return responseData;
        },
        onSuccess: (data) => {
            setUser(data);
            queryClient.invalidateQueries({ queryKey: ['user'] });
            setIsEditing(false);
            setPreviewUrl(null);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    const handleCancel = () => {
        if (user) {
            setFormData({ name: user.name, email: user.email, profile_picture: null });
        }
        setIsEditing(false);
        setPreviewUrl(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, profile_picture: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!user) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <p className="text-slate-600 dark:text-slate-400">Please log in to view your profile.</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            <div>
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">My Profile</h1>
                <p className="text-slate-600 dark:text-slate-400">Manage your account information</p>
            </div>

            <div className="card p-6">
                <div className="mb-6 flex items-center gap-4">
                    {user.profile_picture ? (
                        <img
                            src={user.profile_picture}
                            alt={user.name}
                            className="h-20 w-20 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-3xl font-bold text-white">
                            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{user.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 capitalize">{user.role.toLowerCase()}</p>
                    </div>
                </div>

                {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Profile Picture</label>
                            <div className="mt-2 flex items-center gap-4">
                                {previewUrl || user.profile_picture ? (
                                    <img
                                        src={previewUrl || user.profile_picture || ''}
                                        alt="Preview"
                                        className="h-20 w-20 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-2xl font-bold text-white">
                                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-600 dark:text-slate-400"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
                            >
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                            >
                                Cancel
                            </button>
                        </div>
                        {updateMutation.isError && (
                            <p className="text-sm text-red-600 dark:text-red-400">Failed to update profile. Please try again.</p>
                        )}
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Name</label>
                            <p className="mt-1 text-slate-900 dark:text-white">{user.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Email</label>
                            <p className="mt-1 text-slate-900 dark:text-white">{user.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Role</label>
                            <p className="mt-1 text-slate-900 dark:text-white capitalize">{user.role.toLowerCase()}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Account Status</label>
                            <p className="mt-1 text-slate-900 dark:text-white">{user.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Member Since</label>
                            <p className="mt-1 text-slate-900 dark:text-white">
                                {new Date(user.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
                        >
                            Edit Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
