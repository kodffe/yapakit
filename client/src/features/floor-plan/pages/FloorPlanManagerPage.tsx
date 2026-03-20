import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  MapPin, Plus, Loader2, LayoutGrid, X,
  MoreVertical, Pencil, Trash2, Users, Power,
} from 'lucide-react';
import {
  useFloorPlan,
  useCreateZone, useUpdateZone, useDeleteZone,
  useCreateTable, useUpdateTable, useDeleteTable,
  FloorZone, FloorTable,
} from '../../pos/api/getFloorPlan';
import useHeaderStore from '../../../store/headerStore';

// ─── Context Menu Component ───

interface DropdownItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

function ContextMenu({ items, onClose }: { items: DropdownItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.onClick(); onClose(); }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
            item.danger
              ? 'text-red-600 hover:bg-red-50'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Constants ───

const TABLE_STATUSES = [
  { value: 'available', label: 'Available', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { value: 'occupied', label: 'Occupied', color: 'bg-red-50 border-red-200 text-red-700' },
  { value: 'reserved', label: 'Reserved', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { value: 'out_of_service', label: 'Out of Service', color: 'bg-gray-100 border-gray-200 text-gray-400' },
] as const;

const statusColorMap: Record<string, string> = {
  available: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  occupied: 'bg-red-50 border-red-200 text-red-700',
  reserved: 'bg-amber-50 border-amber-200 text-amber-700',
  out_of_service: 'bg-gray-100 border-gray-200 text-gray-400',
};

// ─── Main Page ───

function FloorPlanManagerPage() {
  const { data, isLoading } = useFloorPlan();
  const createZoneMut = useCreateZone();
  const updateZoneMut = useUpdateZone();
  const deleteZoneMut = useDeleteZone();
  const createTableMut = useCreateTable();
  const updateTableMut = useUpdateTable();
  const deleteTableMut = useDeleteTable();
  const setHeader = useHeaderStore((s) => s.setHeader);

  useEffect(() => {
    setHeader('Floor Plan', 'Manage your zones and tables.');
  }, [setHeader]);

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const zones = data?.zones ?? [];
  const tables = data?.tables ?? [];

  useEffect(() => {
    if (zones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(zones[0]._id);
    }
  }, [zones, selectedZoneId]);

  // Zone form state
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [editingZone, setEditingZone] = useState<FloorZone | null>(null);

  // Table form state
  const [showTableForm, setShowTableForm] = useState(false);
  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState(4);
  const [tableStatus, setTableStatus] = useState<string>('available');
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  // Context menu state
  const [openZoneMenu, setOpenZoneMenu] = useState<string | null>(null);
  const [openTableMenu, setOpenTableMenu] = useState<string | null>(null);

  const filteredTables = useMemo(
    () => (selectedZoneId ? tables.filter((t) => t.zoneId === selectedZoneId) : []),
    [tables, selectedZoneId]
  );

  const selectedZone = useMemo(
    () => zones.find((z) => z._id === selectedZoneId),
    [zones, selectedZoneId]
  );

  // ─── Zone Handlers ───

  const resetZoneForm = () => { setZoneName(''); setEditingZone(null); setShowZoneForm(false); };

  const handleSaveZone = useCallback(() => {
    const name = zoneName.trim();
    if (!name) return;

    if (editingZone) {
      updateZoneMut.mutate(
        { id: editingZone._id, name, isActive: editingZone.isActive },
        { onSuccess: resetZoneForm }
      );
    } else {
      createZoneMut.mutate(
        { name },
        { onSuccess: (zone: FloorZone) => { resetZoneForm(); setSelectedZoneId(zone._id); } }
      );
    }
  }, [zoneName, editingZone, createZoneMut, updateZoneMut]);

  const handleEditZone = useCallback((zone: FloorZone) => {
    setEditingZone(zone);
    setZoneName(zone.name);
    setShowZoneForm(true);
  }, []);

  const handleToggleZoneActive = useCallback((zone: FloorZone) => {
    updateZoneMut.mutate({ id: zone._id, name: zone.name, isActive: !zone.isActive });
  }, [updateZoneMut]);

  const handleDeleteZone = useCallback((id: string) => {
    if (!confirm('This will delete the zone and ALL its tables. Continue?')) return;
    deleteZoneMut.mutate(id, {
      onSuccess: () => { if (selectedZoneId === id) setSelectedZoneId(null); },
    });
  }, [deleteZoneMut, selectedZoneId]);

  // ─── Table Handlers ───

  const resetTableForm = () => { setTableName(''); setTableCapacity(4); setTableStatus('available'); setEditingTableId(null); setShowTableForm(false); };

  const handleSaveTable = useCallback(() => {
    const name = tableName.trim();
    if (!name) return;

    if (editingTableId) {
      updateTableMut.mutate(
        { id: editingTableId, name, capacity: tableCapacity, status: tableStatus },
        { onSuccess: resetTableForm }
      );
    } else {
      if (!selectedZoneId) return;
      createTableMut.mutate(
        { zoneId: selectedZoneId, name, capacity: tableCapacity },
        { onSuccess: resetTableForm }
      );
    }
  }, [tableName, tableCapacity, tableStatus, editingTableId, selectedZoneId, createTableMut, updateTableMut]);

  const handleEditTable = useCallback((table: FloorTable) => {
    setEditingTableId(table._id);
    setTableName(table.name);
    setTableCapacity(table.capacity);
    setTableStatus(table.status);
    setShowTableForm(true);
  }, []);

  const handleDeleteTable = useCallback((id: string) => {
    if (!confirm('Delete this table?')) return;
    deleteTableMut.mutate(id);
  }, [deleteTableMut]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ───── Left Column: Zones ───── */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Zones</h2>
            <button
              onClick={() => { setShowZoneForm(true); setEditingZone(null); setZoneName(''); }}
              className="flex items-center gap-1 text-xs font-bold text-brand-primary hover:brightness-90 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Zone
            </button>
          </div>

          {/* Zone Form (Create / Edit) */}
          {showZoneForm && (
            <div className="bg-white border border-brand-primary/20 rounded-xl p-4 space-y-3 shadow-sm">
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveZone()}
                placeholder="Zone name..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={resetZoneForm}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveZone}
                  disabled={createZoneMut.isPending || updateZoneMut.isPending}
                  className="flex-1 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:brightness-90 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {(createZoneMut.isPending || updateZoneMut.isPending) && <Loader2 className="w-3 h-3 animate-spin" />}
                  {editingZone ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {/* Zone List */}
          {zones.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">No zones yet.</p>
            </div>
          ) : (
            zones.map((zone) => {
              const isInactive = !zone.isActive;

              return (
                <div
                  key={zone._id}
                  onClick={() => setSelectedZoneId(zone._id)}
                  className={`relative w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    isInactive
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : selectedZoneId === zone._id
                        ? 'bg-brand-primary/10 border-brand-primary/30 shadow-sm'
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isInactive ? 'bg-gray-100 text-gray-400' :
                        selectedZoneId === zone._id ? 'bg-brand-primary/20 text-brand-primary' : 'bg-gray-50 text-gray-400'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm">{zone.name}</p>
                          {isInactive && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {tables.filter((t) => t.zoneId === zone._id).length} tables
                        </p>
                      </div>
                    </div>

                    {/* 3-dot menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenZoneMenu(openZoneMenu === zone._id ? null : zone._id); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openZoneMenu === zone._id && (
                        <ContextMenu
                          onClose={() => setOpenZoneMenu(null)}
                          items={[
                            { label: 'Edit', icon: <Pencil className="w-3.5 h-3.5" />, onClick: () => handleEditZone(zone) },
                            {
                              label: zone.isActive ? 'Deactivate' : 'Activate',
                              icon: <Power className="w-3.5 h-3.5" />,
                              onClick: () => handleToggleZoneActive(zone),
                            },
                            { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => handleDeleteZone(zone._id), danger: true },
                          ]}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ───── Right Column: Tables ───── */}
        <div className="lg:col-span-2">
          {!selectedZoneId ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-300">
              <LayoutGrid className="w-12 h-12 mb-3" />
              <p className="font-medium text-sm">Select a zone to view its tables</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedZone?.name}{' '}
                  <span className="text-sm font-normal text-gray-400">({filteredTables.length} tables)</span>
                </h2>
                <button
                  onClick={() => { setShowTableForm(true); setEditingTableId(null); setTableName(''); setTableCapacity(4); setTableStatus('available'); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold hover:brightness-90 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Table
                </button>
              </div>

              {/* Table Form (Create / Edit) */}
              {showTableForm && (
                <div className="bg-white border border-brand-primary/20 rounded-xl p-4 shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-700">
                      {editingTableId ? 'Edit Table' : 'New Table'}
                    </span>
                    <button onClick={resetTableForm} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTable()}
                      placeholder="Table name (e.g. A1)"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                      autoFocus
                    />
                    <input
                      type="number"
                      value={tableCapacity}
                      onChange={(e) => setTableCapacity(Number(e.target.value))}
                      placeholder="Capacity"
                      min={1}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                    />
                  </div>

                  {/* Status selector (only visible when editing) */}
                  {editingTableId && (
                    <div className="mt-3">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        {TABLE_STATUSES.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setTableStatus(s.value)}
                            className={`py-2 px-3 rounded-lg text-xs font-bold border-2 transition-all ${
                              tableStatus === s.value
                                ? `${s.color} ring-2 ring-offset-1 ring-current`
                                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSaveTable}
                    disabled={createTableMut.isPending || updateTableMut.isPending}
                    className="mt-3 w-full py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold hover:brightness-90 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {(createTableMut.isPending || updateTableMut.isPending) && <Loader2 className="w-3 h-3 animate-spin" />}
                    {editingTableId ? 'Update Table' : 'Create Table'}
                  </button>
                </div>
              )}

              {/* Tables Grid */}
              {filteredTables.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm font-medium">No tables in this zone yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredTables.map((table) => (
                    <div
                      key={table._id}
                      className={`relative rounded-2xl border-2 p-4 text-center transition-all group ${
                        statusColorMap[table.status] ?? statusColorMap.available
                      }`}
                    >
                      {/* 3-dot menu */}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => setOpenTableMenu(openTableMenu === table._id ? null : table._id)}
                          className="p-1 rounded-lg text-current opacity-40 hover:opacity-100 hover:bg-white/60 transition-all"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {openTableMenu === table._id && (
                          <ContextMenu
                            onClose={() => setOpenTableMenu(null)}
                            items={[
                              { label: 'Edit', icon: <Pencil className="w-3.5 h-3.5" />, onClick: () => handleEditTable(table) },
                              { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => handleDeleteTable(table._id), danger: true },
                            ]}
                          />
                        )}
                      </div>

                      <p className="text-xl font-black">{table.name}</p>
                      <p className="text-[10px] uppercase tracking-wider font-bold mt-1 opacity-70">
                        {table.capacity} seats
                      </p>
                      <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-md bg-white/60">
                        {table.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FloorPlanManagerPage;
