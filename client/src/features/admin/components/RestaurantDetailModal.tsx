import React from 'react';
import { X, Building2, Calendar, ShieldCheck } from 'lucide-react';
import { AdminRestaurant } from '../api/adminApi';

interface RestaurantDetailModalProps {
  restaurant: AdminRestaurant | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RestaurantDetailModal: React.FC<RestaurantDetailModalProps> = ({
  restaurant,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !restaurant) return null;

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
            <div className="p-3 bg-blue-600 text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">{restaurant.name}</h2>
              <p className="text-gray-400 text-xs font-mono font-bold tracking-tighter">ID: {restaurant._id}</p>
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
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Subscription Status</span>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider
                ${restaurant.subscription?.status === 'active' ? 'bg-green-600 text-white' :
                  restaurant.subscription?.status === 'trial' ? 'bg-amber-600 text-white' :
                  'bg-red-600 text-white'}
              `}>
                {restaurant.subscription?.status}
              </span>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Platform Joined</span>
              </div>
              <p className="text-lg font-black text-white">{new Date(restaurant.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Details Sections */}
          <div className="space-y-6">
            <section>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 border-l-2 border-blue-600 pl-3">Business Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Store Slug (URL)</p>
                  <p className="text-sm font-bold text-blue-400 font-mono">/p/{restaurant.slug}</p>
                </div>
                {/* Managers Section */}
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Primary Managers</p>
                  {restaurant.managers && restaurant.managers.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      {restaurant.managers.map((manager) => (
                        <div key={manager._id} className="flex items-center gap-2 text-white font-bold text-xs uppercase bg-gray-800 border border-gray-700 px-2 py-1">
                           <ShieldCheck className="w-3 h-3 text-emerald-500" />
                           {manager.firstName} {manager.lastName}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic font-bold">No managers assigned</p>
                  )}
                </div>
              </div>
            </section>
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
