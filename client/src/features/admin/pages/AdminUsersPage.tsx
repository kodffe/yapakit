import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, UserCog, Loader2, ShieldCheck, Headphones, PieChart, Info } from 'lucide-react';
import { useAdminUsers, useRemoveAdminUser, AdminUser, AdminUsersParams } from '../api/adminUserApi';
import AdminUserModal from '../components/AdminUserModal';
import { UserDetailModal } from '../components/UserDetailModal';
import { AdminTableFilters } from '../components/AdminTableFilters';
import { AdminTablePagination } from '../components/AdminTablePagination';
import useAuthStore from '../../../store/authStore';

function AdminUsersPage() {
  const [params, setParams] = useState<AdminUsersParams>({
    page: 1,
    limit: 10,
    search: '',
    role: '',
  });

  const { data: response, isLoading, isError } = useAdminUsers(params);
  const { mutate: removeUser } = useRemoveAdminUser();
  const currentUser = useAuthStore((state) => state.user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleViewDetail = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  const handleRemove = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove global system access for ${name}?`)) {
      removeUser(id);
    }
  };

  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, page: 1 }));
  };

  const handleRoleFilter = (role: string) => {
    setParams(prev => ({ ...prev, role, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setParams(prev => ({ ...prev, page }));
  };

  const filters = useMemo(() => [
    {
      label: 'Role',
      key: 'role',
      value: params.role || '',
      options: [
        { label: 'Super Admin', value: 'superadmin' },
        { label: 'Support', value: 'support' },
        { label: 'Sales', value: 'sales' },
      ],
      onChange: handleRoleFilter,
    }
  ], [params.role]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="flex items-center gap-1 bg-yellow-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-tighter">
            <ShieldCheck className="w-3 h-3" />
            Super Admin
          </span>
        );
      case 'support':
        return (
          <span className="flex items-center gap-1 bg-green-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-tighter">
            <Headphones className="w-3 h-3" />
            Support
          </span>
        );
      case 'sales':
        return (
          <span className="flex items-center gap-1 bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-tighter">
            <PieChart className="w-3 h-3" />
            Sales
          </span>
        );
      default:
        return (
          <span className="bg-gray-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-tighter">
            None
          </span>
        );
    }
  };

  if (isLoading && !response) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 border border-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const users = response?.data || [];

  return (
    <div className="flex flex-col h-full bg-gray-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900 border border-gray-800 p-6">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <UserCog className="w-8 h-8 text-blue-500" />
            User Management
          </h1>
          <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-wider">
            Manage global administrative accounts and system permissions.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-2xl"
        >
          <Plus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      {/* Filters */}
      <AdminTableFilters
        searchPlaceholder="Filter by name or email..."
        searchValue={params.search || ''}
        onSearchChange={handleSearch}
        filters={filters}
      />

      {/* Main Table */}
      <div className="bg-gray-900 border border-gray-800 overflow-hidden flex-1 overflow-y-auto">
        <div className="overflow-x-auto min-h-full">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-800 border-b border-gray-700 text-xs font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">System User</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Global Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isError || (!isLoading && users.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-gray-500 font-bold uppercase italic tracking-widest">No administrative users found.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleViewDetail(user)}
                        className="font-black text-white hover:text-blue-400 transition-colors uppercase tracking-tight text-left flex items-center gap-2"
                      >
                         {user.firstName} {user.lastName}
                         <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-400 text-xs whitespace-nowrap uppercase tracking-tighter">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.systemRole)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isActive ? (
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest border border-green-500/20 px-2 py-0.5 bg-green-500/5">Active</span>
                      ) : (
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest border border-red-500/20 px-2 py-0.5 bg-red-500/5">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 border border-gray-700 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemove(user._id, `${user.firstName} ${user.lastName}`)}
                          disabled={currentUser?._id === user._id}
                          className={`p-2 border transition-colors ${
                            currentUser?._id === user._id
                              ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed opacity-50'
                              : 'bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white border-red-900/30'
                          }`}
                          title={currentUser?._id === user._id ? "Cannot remove yourself" : "Remove Access"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {response && (
        <AdminTablePagination
          currentPage={response.page}
          totalPages={response.pages}
          totalResults={response.total}
          resultsPerPage={params.limit || 10}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modals */}
      <AdminUserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialUser={selectedUser}
      />

      <UserDetailModal
        user={selectedUser}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}

export default AdminUsersPage;
