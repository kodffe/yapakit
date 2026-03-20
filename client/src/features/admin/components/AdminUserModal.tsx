import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { AdminUser, useCreateAdminUser, useUpdateAdminUser } from '../api/adminUserApi';

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUser?: AdminUser | null;
}

function AdminUserModal({ isOpen, onClose, initialUser }: AdminUserModalProps) {
  const isEditing = !!initialUser;
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [systemRole, setSystemRole] = useState<'superadmin' | 'support' | 'sales'>('support');
  const [isActive, setIsActive] = useState(true);

  const { mutate: createUser, isPending: isCreating } = useCreateAdminUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateAdminUser();

  useEffect(() => {
    if (isOpen) {
      if (initialUser) {
        setFirstName(initialUser.firstName || '');
        setLastName(initialUser.lastName || '');
        setEmail(initialUser.email || '');
        setSystemRole(initialUser.systemRole === 'none' ? 'support' : initialUser.systemRole as any);
        setIsActive(initialUser.isActive);
        setPassword('');
      } else {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setSystemRole('support');
        setIsActive(true);
      }
    }
  }, [isOpen, initialUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || (!isEditing && !password)) return;

    if (isEditing && initialUser) {
      updateUser({
        id: initialUser._id,
        updates: { firstName, lastName, email, systemRole, isActive }
      }, {
        onSuccess: () => onClose()
      });
    } else {
      createUser({
        firstName,
        lastName,
        email,
        password,
        systemRole,
        isActive: true
      }, {
        onSuccess: () => onClose()
      });
    }
  };

  if (!isOpen) return null;

  const isPending = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-gray-800 w-full max-w-md border border-gray-700 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            {isEditing ? 'Edit System User' : 'New System User'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 px-4 py-2.5 text-white focus:border-blue-600 outline-none font-bold"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 px-4 py-2.5 text-white focus:border-blue-600 outline-none font-bold"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 px-4 py-2.5 text-white focus:border-blue-600 outline-none font-bold"
              placeholder="admin@yapakit.com"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 px-4 py-2.5 text-white focus:border-blue-600 outline-none font-bold"
                placeholder="••••••••"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">System Role</label>
            <select
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value as any)}
              className="w-full bg-gray-700 border border-gray-600 px-4 py-2.5 text-white focus:border-blue-600 outline-none font-bold appearance-none cursor-pointer"
            >
              <option value="superadmin">Super Admin</option>
              <option value="support">Support Agent</option>
              <option value="sales">Sales Representative</option>
            </select>
          </div>

          {isEditing && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded-none border-gray-600 bg-gray-700 text-blue-600 focus:ring-0"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-white uppercase cursor-pointer">
                Account Active
              </label>
            </div>
          )}

          <div className="pt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-black py-3 uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 uppercase tracking-wider transition-colors disabled:bg-gray-600 flex items-center justify-center"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isEditing ? 'Save Changes' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminUserModal;
