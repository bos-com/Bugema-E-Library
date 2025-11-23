import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Shield, ShieldOff, Trash2 } from 'lucide-react';
import { getUsers, updateUserRole, deleteUser } from '../../../lib/api/admin';
import { AdminUser } from '../../../lib/types';
import { useAuthStore } from '../../../lib/store/auth';
import LoadingOverlay from '../../../components/feedback/LoadingOverlay';

const AdminUsersPage = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user: currentUser } = useAuthStore();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePromoteUser = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        try {
            await updateUserRole(userId, newRole);
            toast.success(`User ${newRole === 'ADMIN' ? 'promoted' : 'demoted'} successfully`);
            loadUsers();
        } catch (error) {
            toast.error('Failed to update user role');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await deleteUser(userId);
            toast.success('User deleted successfully');
            loadUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    if (isLoading) {
        return <LoadingOverlay label="Loading users" />;
    }

    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs uppercase tracking-[0.4em] text-brand-200">Admin</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">User Management</h1>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900/50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Joined</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-medium text-white">{user.name}</div>
                                                <div className="text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${user.role === 'ADMIN'
                                                ? 'bg-purple-500/20 text-purple-300'
                                                : 'bg-green-500/20 text-green-300'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.is_online
                                                ? 'bg-green-500/20 text-green-300'
                                                : 'bg-slate-500/20 text-slate-400'
                                            }`}>
                                            <span className={`mr-1.5 h-2 w-2 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                                            {user.is_online ? 'Online' : 'Offline'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => handlePromoteUser(user.id, user.role)}
                                                className="p-2 text-slate-400 hover:text-brand-400 transition-colors"
                                                title={user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                                            >
                                                {user.role === 'ADMIN' ? <ShieldOff className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                                title="Delete User"
                                                disabled={user.id === currentUser?.id}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsersPage;
