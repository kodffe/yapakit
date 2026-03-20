import React, { useState } from 'react';
import { useSupportApi } from '../api/supportApi';
import { 
  Ticket as TicketIcon, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X 
} from 'lucide-react';
import useHeaderStore from '../../../store/headerStore';

function CreateTicketModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { useCreateTicket } = useSupportApi();
  const createMutation = useCreateTicket();
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    await createMutation.mutateAsync({ subject, description, priority });
    onClose();
    setSubject('');
    setDescription('');
    setPriority('medium');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">New Support Request</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Subject</label>
            <input 
              required
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information to help us solve the issue..."
              rows={4}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Priority</label>
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm"
            >
              <option value="low">Low - General inquiry</option>
              <option value="medium">Medium - Important but not urgent</option>
              <option value="high">High - System degraded</option>
              <option value="critical">Critical - System down</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
             <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
             >
               Cancel
             </button>
             <button 
              type="submit"
              disabled={createMutation.isPending || !subject.trim() || !description.trim()}
              className="flex items-center gap-2 bg-brand-primary hover:brightness-90 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50"
             >
               {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
               Submit Ticket
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManagerSupportPage() {
  const { useTenantTickets } = useSupportApi();
  const { data: response, isLoading } = useTenantTickets();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const setHeader = useHeaderStore((s) => s.setHeader);

  React.useEffect(() => {
    setHeader('Support Center', 'Manage your support requests and track their resolution progress');
  }, [setHeader]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  const tickets = response?.data || [];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-90 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-gray-600">Ticket ID</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Subject</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Date Opened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.length > 0 ? tickets.map((ticket: any) => (
                <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <TicketIcon className="w-4 h-4 text-gray-400" />
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md uppercase">
                        #{ticket._id.slice(-6)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 group-hover:text-brand-primary transition-colors cursor-pointer">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-sm">
                      {ticket.description}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5">
                       {ticket.status === 'resolved' || ticket.status === 'closed' ? (
                         <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                       ) : ticket.status === 'in_progress' ? (
                         <Clock className="w-4 h-4 text-amber-500" />
                       ) : (
                         <AlertCircle className="w-4 h-4 text-brand-primary" />
                       )}
                       <span className="text-xs font-semibold capitalize tracking-wide text-gray-700">
                         {ticket.status.replace('_', ' ')}
                       </span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-gray-500 bg-gray-50/50">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <TicketIcon className="w-8 h-8 text-gray-300" />
                      <p className="font-medium">No support tickets found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateTicketModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default ManagerSupportPage;
