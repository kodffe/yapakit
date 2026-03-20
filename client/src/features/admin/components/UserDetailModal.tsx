import React from 'react';
import { X, User, Mail, Shield, Calendar, Building2, CheckCircle, XCircle } from 'lucide-react';
import { AdminManager } from '../api/adminApi';
import { AdminUser } from '../api/adminUserApi';

type UserDetail = AdminUser | AdminManager;

interface UserDetailModalProps {
  user: UserDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !user) return null;

  // Type helper to check if it's a manager
  const isManager = 'restaurants' in user;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 border-2 border-gray-800 w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-800/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600 text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-400 text-xs font-mono font-bold tracking-tighter">ID: {user._id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Status & Role Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                {user.isActive ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Account Status</span>
              </div>
              <span className={`px-2 py-0.5 text-xs font-black uppercase tracking-widest
                ${user.isActive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
              `}>
                {user.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-purple-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">System Role</span>
              </div>
              <p className="text-lg font-black text-white uppercase tracking-tight">
                {isManager ? 'RESTAURANT MANAGER' : user.systemRole}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <section>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 border-l-2 border-purple-600 pl-3">Contact Information</h3>
            <div className="bg-gray-800 border border-gray-700 p-6 flex items-center gap-6">
              <div className="p-4 bg-gray-900">
                <Mail className="w-8 h-8 text-gray-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Email Address</p>
                <p className="text-lg font-bold text-white tracking-tight">{user.email}</p>
              </div>
            </div>
          </section>

          {/* Assigned Restaurants (Only for Managers) */}
          {isManager && (
            <section>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 border-l-2 border-amber-600 pl-3">Assigned Restaurants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {user.restaurants.length > 0 ? (
                  user.restaurants.map((res) => (
                    <div key={res._id} className="bg-gray-800 border border-gray-700 p-3 flex items-center gap-3">
                      <div className="p-2 bg-gray-900">
                        <Building2 className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight leading-none">{res.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">slug: {res.slug}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 font-bold italic col-span-2">No restaurants linked to this manager.</p>
                )}
              </div>
            </section>
          )}

          {/* Registration Info */}
          <div className="bg-gray-800/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Account Created</span>
            </div>
            {/* Note: AdminUser has it, AdminManager might not have it in the manual list yet, but we'll assume it's available or handle null */}
            <p className="text-sm font-bold text-gray-400">
               {/* @ts-ignore - showing createdAt if exists */}
               {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white text-xs font-black uppercase tracking-widest hover:bg-gray-700 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
