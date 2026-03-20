import { X } from 'lucide-react';
import { PublicMenuItem } from '../api/publicApi';

interface MenuItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PublicMenuItem | null;
  formatPrice: (amount: number) => string;
}

/**
 * Flat-color modal for showing item details.
 * Bottom-sheet style on mobile, centered on desktop.
 * NO gradients, NO shadows, NO opacities.
 */
export default function MenuItemDetailModal({ isOpen, onClose, item, formatPrice }: MenuItemDetailModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Item Image */}
        {item.imageUrl && (
          <div className="w-full h-56 sm:h-64 bg-gray-100 relative">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover sm:rounded-t-2xl"
            />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {/* Close button when no image */}
          {!item.imageUrl && (
            <div className="flex justify-end mb-2">
              <button
                onClick={onClose}
                className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}

          <h2 className="text-xl font-black text-gray-900 mb-2">{item.name}</h2>

          <p className="text-lg font-black text-brand-primary mb-4">
            {formatPrice(item.price)}
          </p>

          {item.description && (
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              {item.description}
            </p>
          )}

          {item.region && (
            <p className="text-xs text-gray-400 mt-3 font-medium">
              Region: {item.region}
            </p>
          )}
        </div>

        {/* Close Action */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 text-gray-900 font-bold rounded-xl text-center hover:bg-gray-300 active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
