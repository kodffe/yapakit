import { useState } from 'react';
import { useStaffReservations, useUpdateReservationStatus, Reservation } from '../api/reservationsApi';
import { useFloorPlan } from '../../pos/api/getFloorPlan';
import { CalendarDays, Clock, Users, MessageSquare, Check, X, Loader2 } from 'lucide-react';
import useAlertStore from '../../../store/alertStore';
import useHeaderStore from '../../../store/headerStore';
import { useEffect } from 'react';

export default function StaffReservationsPage() {
  const { data: reservations, isLoading } = useStaffReservations();
  const updateStatus = useUpdateReservationStatus();
  const { data: floorPlan } = useFloorPlan();
  const addAlert = useAlertStore((s) => s.addAlert);

  const [selectedResId, setSelectedResId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const setHeader = useHeaderStore((s) => s.setHeader);

  useEffect(() => {
    setHeader('Reservations', 'Manage incoming booking requests');
  }, [setHeader]);

  const handleApproveClick = (res: Reservation) => {
    setSelectedResId(res._id);
    setSelectedTableId(res.tableId?._id || '');
    setIsModalOpen(true);
  };

  const handleConfirmApprove = () => {
    if (!selectedResId) return;
    updateStatus.mutate(
      { id: selectedResId, status: 'approved', tableId: selectedTableId || undefined },
      {
        onSuccess: () => {
          addAlert({ title: 'Approved', message: 'Reservation approved!', type: 'success' });
          setIsModalOpen(false);
          setSelectedResId(null);
          setSelectedTableId('');
        },
        onError: () => addAlert({ title: 'Error', message: 'Failed to approve reservation.', type: 'error' }),
      }
    );
  };

  const handleReject = (id: string) => {
    if (confirm('Are you sure you want to decline this reservation? An email will be sent to the customer.')) {
      updateStatus.mutate(
        { id, status: 'rejected' },
        {
          onSuccess: () => addAlert({ title: 'Declined', message: 'Reservation declined.', type: 'info' }),
          onError: () => addAlert({ title: 'Error', message: 'Failed to decline reservation.', type: 'error' }),
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-bold uppercase tracking-wider rounded">Pending</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold uppercase tracking-wider rounded">Approved</span>;
      case 'rejected':
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded">{status}</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-gray-600 text-white text-xs font-bold uppercase tracking-wider rounded">Completed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="pb-16 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reservations?.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-gray-200 rounded-xl">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No Reservations</h3>
            <p className="text-gray-500 font-medium">There are no reservations to display.</p>
          </div>
        )}

        {reservations?.map((res) => (
          <div key={res._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-gray-50">
              <div>
                <h3 className="font-black text-lg text-gray-900 leading-tight">{res.customerId?.name || 'Guest'}</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">{res.customerId?.phone || 'No phone'}</p>
                <p className="text-sm font-medium text-gray-500">{res.customerId?.email || 'No email'}</p>
              </div>
              <div>{getStatusBadge(res.status)}</div>
            </div>

            <div className="p-5 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <CalendarDays className="w-4 h-4 text-brand-primary" />
                  <span className="font-bold text-sm">
                    {new Date(res.reservationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-brand-primary" />
                  <span className="font-bold text-sm">{res.reservationTime}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-4 h-4 text-brand-primary" />
                  <span className="font-bold text-sm">{res.partySize} Guests</span>
                </div>
              </div>

              {res.specialRequests && (
                <div className="bg-brand-primary/10 p-3 rounded-lg flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-brand-primary">{res.specialRequests}</p>
                </div>
              )}

              {res.tableId && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm font-bold text-green-800">Assigned Table: {res.tableId.name}</p>
                </div>
              )}
            </div>

            {res.status === 'pending' && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleReject(res._id)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Decline
                </button>
                <button
                  onClick={() => handleApproveClick(res)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Approve & Assign Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Approve Reservation</h3>
              <p className="text-sm text-gray-500 font-medium">Optionally assign a table before approving.</p>
            </div>
            
            <div className="p-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">Assign Table (Optional)</label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary block p-3 font-medium outline-none transition-all"
              >
                <option value="">No table assigned yet</option>
                {floorPlan?.zones.map((zone) => {
                  const tablesInZone = floorPlan?.tables.filter((t) => t.zoneId === zone._id) || [];
                  if (tablesInZone.length === 0) return null;
                  return (
                    <optgroup key={zone._id} label={zone.name}>
                      {tablesInZone.map((table) => (
                        <option key={table._id} value={table._id}>
                          {table.name} (Cap: {table.capacity})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={updateStatus.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:brightness-90 text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
