import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getUsers, updateUserRole, deleteUser } from '../../../lib/api/admin';
import { AdminUser } from '../../../lib/types';
import { useAuthStore } from '../../../lib/store/auth';
import LoadingOverlay from '../../../components/feedback/LoadingOverlay';
import ConfirmDialog from '../../../components/ConfirmDialog';

const AdminUsersPage = () => {
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; userId: string | null; userName: string }>({ isOpen: false, userId: null, userName: '' });
    const { user: currentUser } = useAuthStore();
    const queryClient = useQueryClient();

    // Use React Query with caching for better performance
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: getUsers,
        staleTime: 30 * 1000, // Cache for 30 seconds
        gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    });

    const roleMutation = useMutation({
        mutationFn: ({ userId, newRole }: { userId: string; newRole: 'ADMIN' | 'USER' }) =>
            updateUserRole(userId, newRole),
        onSuccess: (_, variables) => {
            toast.success(`User role updated to ${variables.newRole}`);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: () => {
            toast.error('Failed to update user role');
        },
    });

    const handleRoleChange = (userId: string, newRole: 'ADMIN' | 'USER') => {
        roleMutation.mutate({ userId, newRole });
    };

    const openDeleteDialog = (userId: string, userName: string) => {
        setDeleteDialog({ isOpen: true, userId, userName });
    };

    const closeDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, userId: null, userName: '' });
    };

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            toast.success('User deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            closeDeleteDialog();
        },
        onError: () => {
            toast.error('Failed to delete user');
        },
    });

    const confirmDelete = () => {
        if (!deleteDialog.userId) return;
        deleteMutation.mutate(deleteDialog.userId);
    };

    if (isLoading) {
        return <LoadingOverlay label="Loading users" />;
    }

    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs uppercase tracking-[0.4em] text-brand-500 dark:text-brand-300">Admin</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Joined</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                                                <div className="text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.is_online
                                            ? 'bg-green-500/20 text-green-300'
                                            : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            <span className={`mr-1.5 h-2 w-2 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                            {user.is_online ? 'Online' : 'Offline'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.user_type === 'Student'
                                                ? 'bg-blue-500/20 text-blue-300'
                                                : user.user_type === 'Staff'
                                                    ? 'bg-emerald-500/20 text-emerald-300'
                                                    : 'bg-amber-500/20 text-amber-300'
                                            }`}>
                                            {user.user_type || 'Visitor'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as 'ADMIN' | 'USER')}
                                            disabled={user.id === currentUser?.id}
                                            className={`rounded-full px-3 py-1 text-xs font-semibold leading-5 border-0 cursor-pointer ${user.role === 'ADMIN'
                                                ? 'bg-purple-500/20 text-purple-300'
                                                : 'bg-orange-500/20 text-orange-300'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <option value="ADMIN">ADMIN</option>
                                            <option value="USER">USER</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        }) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openDeleteDialog(user.id, user.name)}
                                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                            title="Delete User"
                                            disabled={user.id === currentUser?.id}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                title="Delete User"
                message={`Are you sure you want to delete ${deleteDialog.userName}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isDangerous={true}
            />
        </div>
    );
};

export default AdminUsersPage;
