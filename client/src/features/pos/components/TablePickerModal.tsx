import { useMemo } from 'react';
import { MapPin, X, Users } from 'lucide-react';
import { useFloorPlan, FloorZone } from '../api/getFloorPlan';
import useCartStore from '../../../store/cartStore';

interface TablePickerModalProps {
  onClose: () => void;
}

/**
 * Compact modal to pick a table for dine-in orders.
 * Groups tables by zone, shows only active zones and available tables.
 */
function TablePickerModal({ onClose }: TablePickerModalProps) {
  const { data, isLoading } = useFloorPlan();
  const { selectedTableId, setTable } = useCartStore();

  const zones = data?.zones ?? [];
  const tables = data?.tables ?? [];

  // Only show active zones that have tables
  const activeZones = useMemo(
    () => zones.filter((z: FloorZone) => z.isActive),
    [zones]
  );

  const handleSelectTable = (tableId: string, tableName: string) => {
    setTable(tableId, tableName);
    onClose();
  };

  const handleClearTable = () => {
    setTable(null, null);
    onClose();
  };

  const statusColors: Record<string, { bg: string; selectable: boolean }> = {
    available: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:shadow-md', selectable: true },
    occupied: { bg: 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed', selectable: false },
    reserved: { bg: 'bg-amber-50 border-amber-200 text-amber-400 cursor-not-allowed', selectable: false },
    out_of_service: { bg: 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed', selectable: false },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[70vh] flex flex-col animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-900">Select Table</h3>
            <p className="text-xs text-gray-400 mt-0.5">Pick a table for this dine-in order.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          ) : activeZones.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">No zones available.</p>
            </div>
          ) : (
            activeZones.map((zone) => {
              const zoneTables = tables.filter((t) => t.zoneId === zone._id);
              if (zoneTables.length === 0) return null;

              return (
                <div key={zone._id}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{zone.name}</span>
                    <span className="text-[10px] text-gray-300">
                      ({zoneTables.filter((t) => t.status === 'available').length} free)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {zoneTables.map((table) => {
                      const style = statusColors[table.status] ?? statusColors.available;
                      const isSelected = selectedTableId === table._id;

                      return (
                        <button
                          key={table._id}
                          onClick={() => style.selectable && handleSelectTable(table._id, table.name)}
                          disabled={!style.selectable}
                          className={`rounded-xl border-2 p-3 text-center transition-all ${style.bg} ${
                            isSelected ? 'ring-2 ring-primary-500 ring-offset-1 border-primary-400 shadow-md' : ''
                          }`}
                        >
                          <p className="text-base font-black">{table.name}</p>
                          <p className="text-[9px] uppercase tracking-wider font-bold mt-0.5 opacity-60">
                            {table.capacity} seats
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {selectedTableId && (
          <div className="px-5 py-3 border-t border-gray-100">
            <button
              onClick={handleClearTable}
              className="w-full py-2 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              Clear table selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TablePickerModal;
