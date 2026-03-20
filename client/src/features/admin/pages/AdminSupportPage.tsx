import { useState } from 'react';
import { useAdminTickets, useUpdateTicketStatus } from '../api/adminApi';
import { 
  Ticket, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ChevronDown,
  MessageSquare,
  Loader2
} from 'lucide-react';

interface TicketUpdateModalProps {
  ticket: any;
  isOpen: boolean;
  onClose: () => void;
}

function TicketUpdateModal({ ticket, isOpen, onClose }: TicketUpdateModalProps) {
  const [newStatus, setNewStatus] = useState(ticket?.status || 'open');
  const updateMutation = useUpdateTicketStatus();

  if (!isOpen || !ticket) return null;

  const handleUpdate = async () => {
    await updateMutation.mutateAsync({ id: ticket._id, status: newStatus });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Ticket Details</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <AlertCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Subject</p>
            <p className="text-white font-bold">{ticket.subject}</p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Description</p>
            <div className="bg-gray-800 p-4 border border-gray-700 max-h-48 overflow-y-auto">
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tenant</p>
              <p className="text-white font-bold text-xs uppercase">{ticket.restaurantId.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Priority</p>
              <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter
                ${ticket.priority === 'critical' ? 'bg-red-600 text-white' :
                  ticket.priority === 'high' ? 'bg-amber-600 text-white' :
                  'bg-blue-600 text-white'}
              `}>
                {ticket.priority}
              </span>
            </div>
          </div>

          <div className="space-y-2">
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Set Status</p>
             <select 
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-white px-3 py-2 text-sm font-bold uppercase tracking-wider focus:border-blue-500 outline-none transition-colors"
             >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
             </select>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {updateMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminSupportPage() {
  const { data: response, isLoading } = useAdminTickets();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenUpdate = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 border border-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const tickets = response?.data || [];

  return (
    <div className="flex flex-col h-full bg-gray-950 p-6 space-y-6">
      <div className="bg-gray-900 border border-gray-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Support Tickets</h1>
          <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-wider">Manage incoming requests and issues</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
             <input 
              type="text" 
              placeholder="SEARCH TICKETS..."
              className="bg-gray-950 border border-gray-800 text-white pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-widest focus:border-blue-500 outline-none w-64"
             />
           </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-800/80 border-b border-gray-700 text-xs font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">ID / Date</th>
                <th className="px-6 py-4">Tenant</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tickets.length > 0 ? tickets.map((ticket: any) => (
                <tr key={ticket._id} className="hover:bg-gray-800 transition-colors group">
                  <td className="px-6 py-4">
                     <p className="text-[10px] font-mono text-gray-500 uppercase">#{ticket._id.slice(-6)}</p>
                     <p className="text-[10px] font-black text-white uppercase mt-0.5">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-800 border border-gray-700 flex items-center justify-center">
                        <Ticket className="w-3 h-3 text-blue-500" />
                      </div>
                      <span className="text-xs font-black text-white uppercase tracking-tighter">{ticket.restaurantId.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-bold truncate max-w-[200px]">{ticket.subject}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tight truncate max-w-[200px]">By: {ticket.reportedBy.firstName} {ticket.reportedBy.lastName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter
                      ${ticket.priority === 'critical' ? 'bg-red-600 text-white' :
                        ticket.priority === 'high' ? 'bg-amber-600 text-white' :
                        ticket.priority === 'medium' ? 'bg-blue-600 text-white' :
                        'bg-gray-600 text-white'}
                    `}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {ticket.status === 'resolved' || ticket.status === 'closed' ? (
                         <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                       ) : ticket.status === 'in_progress' ? (
                         <Clock className="w-3 h-3 text-amber-500" />
                       ) : (
                         <AlertCircle className="w-3 h-3 text-red-500" />
                       )}
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">{ticket.status.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button 
                      onClick={() => handleOpenUpdate(ticket)}
                      className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 hover:border-blue-500 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Update
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-black uppercase tracking-widest italic">
                    No tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TicketUpdateModal 
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default AdminSupportPage;
