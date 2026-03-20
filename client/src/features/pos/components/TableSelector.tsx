import { useState, useMemo } from 'react';
import { Loader2, AlertCircle, Users } from 'lucide-react';
import { useFloorPlan, FloorTable } from '../api/getFloorPlan';

/**
 * Status-to-style mapping for table cards.
 */
const STATUS_STYLES: Record<FloorTable['status'], { bg: string; text: string; label: string }> = {
  available: { bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400', text: 'text-emerald-700', label: 'Available' },
  occupied: { bg: 'bg-red-50 border-red-200 hover:border-red-400', text: 'text-red-700', label: 'Occupied' },
  reserved: { bg: 'bg-amber-50 border-amber-200 hover:border-amber-400', text: 'text-amber-700', label: 'Reserved' },
  out_of_service: { bg: 'bg-gray-100 border-gray-300', text: 'text-gray-400', label: 'Out of Service' },
};

/**
 * Table Selector component.
 * Displays zones as tabs and tables as a responsive grid of status-colored cards.
 */
function TableSelector() {
  const { data, isLoading, isError, error } = useFloorPlan();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  // Auto-select the first zone once data loads
  const zones = data?.zones ?? [];
  const tables = data?.tables ?? [];

  const selectedZoneId = activeZoneId ?? zones[0]?._id ?? null;

  const filteredTables = useMemo(
    () => tables.filter((t) => t.zoneId === selectedZoneId),
    [tables, selectedZoneId]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <span className="ml-3 text-gray-500">Loading floor plan...</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 text-sm">
            {error instanceof Error ? error.message : 'Failed to load floor plan. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (zones.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg">No zones configured yet.</p>
        <p className="text-sm mt-1">Ask a manager to set up the floor plan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Zone Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {zones.map((zone) => (
          <button
            key={zone._id}
            onClick={() => setActiveZoneId(zone._id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedZoneId === zone._id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {zone.name}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredTables.map((table) => {
          const style = STATUS_STYLES[table.status];

          return (
            <button
              key={table._id}
              className={`relative border-2 rounded-xl p-4 text-center transition-all cursor-pointer ${style.bg}`}
            >
              {/* Table Name */}
              <h3 className={`text-2xl font-bold ${style.text}`}>
                {table.name}
              </h3>

              {/* Capacity */}
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                <span>{table.capacity}</span>
              </div>

              {/* Status Badge */}
              <span className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${style.text} bg-white/60`}>
                {style.label}
              </span>
            </button>
          );
        })}

        {filteredTables.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-8 text-sm">
            No tables in this zone.
          </p>
        )}
      </div>
    </div>
  );
}

export default TableSelector;
