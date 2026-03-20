import { useState, useEffect } from 'react';
import { UserPlus, Users, X, Loader2 } from 'lucide-react';
import { useStaff, useAddStaff, AddStaffPayload } from '../api/staffApi';
import useHeaderStore from '../../../store/headerStore';

const ROLE_COLORS: Record<string, string> = {
  manager: 'bg-purple-100 text-purple-700',
  cashier: 'bg-emerald-100 text-emerald-700',
  waiter: 'bg-blue-100 text-blue-700',
  kitchen: 'bg-orange-100 text-orange-700',
};

function StaffManagementPage() {
  const { data: staff = [], isLoading, error } = useStaff();
  const addStaffMutation = useAddStaff();
  const [showModal, setShowModal] = useState(false);
  const setHeader = useHeaderStore((s) => s.setHeader);

  useEffect(() => {
    setHeader('Staff Management', 'Manage your restaurant team members and their roles');
  }, [setHeader]);

  const [form, setForm] = useState<AddStaffPayload>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    tenantRole: 'waiter',
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.email || !form.firstName || !form.lastName || !form.password) {
      setFormError('All fields are required');
      return;
    }

    addStaffMutation.mutate(form, {
      onSuccess: () => {
        setShowModal(false);
        setForm({ email: '', firstName: '', lastName: '', password: '', tenantRole: 'waiter' });
      },
      onError: (err: Error) => {
        setFormError(err.message || 'Failed to add staff member');
      },
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Actions */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:brightness-90 text-white rounded-xl font-medium shadow-sm transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Add Staff Member
        </button>
      </div>

      {/* Staff Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
        </div>
      ) : error ? (
        <div className="text-red-500 font-medium text-center py-12">Failed to load staff.</div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-500">No Staff Yet</h3>
          <p className="text-sm text-gray-400 mt-1">Add your first team member to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((member) => (
                <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {member.user.firstName} {member.user.lastName}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{member.user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${ROLE_COLORS[member.tenantRole] || 'bg-gray-100 text-gray-600'}`}>
                      {member.tenantRole}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${member.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add Staff Member</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg font-medium">{formError}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-sm transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-sm transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-sm transition-all"
                  placeholder="john@restaurant.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial PIN / Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="tenantRole"
                  value={form.tenantRole}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-sm bg-white transition-all cursor-pointer"
                >
                  <option value="waiter">Waiter</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addStaffMutation.isPending}
                  className="flex-1 py-2.5 px-4 bg-brand-primary hover:brightness-90 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addStaffMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffManagementPage;
