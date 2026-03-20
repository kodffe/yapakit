import { useState } from 'react';
import { useCloseShift } from '../api/shiftApi';
import { Loader2, AlertTriangle, X } from 'lucide-react';

interface CloseShiftModalProps {
  onClose: () => void;
}

export default function CloseShiftModal({ onClose }: CloseShiftModalProps) {
  const [actualCash, setActualCash] = useState<string>('');
  const closeShiftMutation = useCloseShift();

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseFloat(actualCash);
    if (isNaN(cash) || cash < 0) return;

    closeShiftMutation.mutate(cash, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Close Shift
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCloseShift} className="p-6">
          <p className="text-gray-600 text-sm mb-6 leading-relaxed bg-red-50 text-red-800 p-4 rounded-xl border border-red-100">
            Closing the shift will prevent you from taking further payments until a new shift is opened. Please count the drawer accurately.
          </p>

          <div className="mb-8">
            <label htmlFor="actualCash" className="block text-sm font-semibold text-gray-700 mb-2">
              Actual Cash in Drawer
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">$</span>
              </div>
              <input
                id="actualCash"
                type="number"
                step="0.01"
                min="0"
                required
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-lg font-medium text-gray-900 placeholder:text-gray-400"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={closeShiftMutation.isPending || !actualCash}
              className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
            >
              {closeShiftMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Confirm & Close'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
