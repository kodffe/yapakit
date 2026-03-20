import { useState } from 'react';
import { useOpenShift } from '../api/shiftApi';
import { Loader2, DollarSign } from 'lucide-react';

export default function OpenShiftCard() {
  const [startingCash, setStartingCash] = useState<string>('');
  const openShiftMutation = useOpenShift();

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseFloat(startingCash);
    if (isNaN(cash) || cash < 0) return;

    openShiftMutation.mutate(cash);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-6rem)] bg-white p-4">
      <div className="rounded-2xl shadow-xl shadow-gray-200/50 p-8 max-w-md w-full border border-gray-100">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
          <DollarSign className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 text-center mb-2">
          Open Register
        </h2>
        <p className="text-gray-500 text-center text-sm mb-8 leading-relaxed">
          You don't have an active shift. Please open the register to start accepting payments.
        </p>

        <form onSubmit={handleOpenShift} className="space-y-6">
          <div>
            <label htmlFor="startingCash" className="block text-sm font-semibold text-gray-700 mb-2">
              Starting Cash (Float in Drawer)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">$</span>
              </div>
              <input
                id="startingCash"
                type="number"
                step="0.01"
                min="0"
                required
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all text-lg font-medium text-gray-900 placeholder:text-gray-400"
                placeholder="0.00"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={openShiftMutation.isPending || !startingCash}
            className="w-full bg-brand-primary text-white font-bold py-3.5 rounded-xl hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {openShiftMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Open Register'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
