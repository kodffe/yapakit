import { useGlobalStats } from '../api/adminApi';
import { Building2, Activity, CreditCard, AlertTriangle, CalendarDays, Loader2, TicketCheck, Clock, CheckCircle2, Ticket } from 'lucide-react';
import useAuthStore from '../../../store/authStore';

function GlobalDashboardPage() {
  const { data: response, isLoading } = useGlobalStats();
  const { user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 border border-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!response) return null;

  const { stats, recentRestaurants, expiringSoonRestaurants, recentTickets } = response;
  const isSuperAdmin = user?.systemRole === 'superadmin';
  const isSales = user?.systemRole === 'sales';
  const isSupport = user?.systemRole === 'support';

  // Sales and SuperAdmin see growth metrics
  const showGrowthMetrics = isSuperAdmin || isSales;

  // Metrics based on role
  const cards = showGrowthMetrics 
    ? [
        {
          label: 'Total Tenants',
          value: stats.totalRestaurants,
          icon: <Building2 className="w-6 h-6 text-gray-400" />,
          change: 'Platform-wide',
        },
        {
          label: 'Active Subscriptions',
          value: stats.activeSubscriptions,
          icon: <Activity className="w-6 h-6 text-emerald-500" />,
          change: 'Healthy',
        },
        {
          label: 'Trial Accounts',
          value: stats.trialSubscriptions,
          icon: <CreditCard className="w-6 h-6 text-amber-500" />,
          change: 'Conversion target',
        },
        {
          label: 'Past Due',
          value: stats.pastDueSubscriptions,
          icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
          change: 'Action required',
        },
      ]
    : [
        {
          label: 'Total Tenants',
          value: stats.totalRestaurants,
          icon: <Building2 className="w-6 h-6 text-gray-400" />,
          change: 'Total Base',
        },
        {
          label: 'Open Tickets',
          value: stats.openTickets,
          icon: <TicketCheck className="w-6 h-6 text-red-500" />,
          color: 'border-red-500/50',
          change: 'Awaiting Action',
        },
        {
          label: 'In Progress',
          value: stats.inProgressTickets,
          icon: <Clock className="w-6 h-6 text-amber-500" />,
          color: 'border-amber-500/50',
          change: 'Active Support',
        },
        {
          label: 'Resolved Today',
          value: stats.resolvedTickets,
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
          color: 'border-emerald-500/50',
          change: 'Successfully Closed',
        },
      ];

  const dashboardTitle = isSuperAdmin 
    ? 'Global Dashboard' 
    : isSales 
      ? 'Sales & Growth Dashboard' 
      : 'Technical Support Oversight';

  const dashboardSubtitle = isSuperAdmin 
    ? 'SaaS Platform Metrics & Growth' 
    : isSales 
      ? 'Sales Performance & Subscription Tracking'
      : 'Technical Support Oversight';

  return (
    <div className="flex flex-col h-full bg-gray-950 p-6 space-y-6">
      <div className="bg-gray-900 border border-gray-800 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">{dashboardTitle}</h1>
          <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-wider">
            {dashboardSubtitle}
          </p>
        </div>
        <div className="px-3 py-1 bg-gray-800 border border-gray-700">
           <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{user?.systemRole} VIEW</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className={`bg-gray-900 border border-gray-800 p-6 overflow-hidden ${card.color || ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">{card.label}</p>
                <h3 className="text-3xl font-black text-white font-mono">{card.value}</h3>
                <p className="text-[10px] text-gray-600 font-bold uppercase mt-2 tracking-tighter">{card.change}</p>
              </div>
              <div className="p-3 bg-gray-800 border border-gray-700">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recently Registered Tenants (Superadmin & Sales) */}
        {showGrowthMetrics && (
          <div className="bg-gray-900 border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50 flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-tight">Recently Registered</h2>
              <CalendarDays className="w-4 h-4 text-gray-600" />
            </div>
            
            {recentRestaurants && recentRestaurants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-800/80 border-b border-gray-700 font-black text-gray-500 uppercase tracking-widest">
                      <th className="px-5 py-3">Tenant</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 font-bold">
                    {recentRestaurants.map((tenant) => (
                      <tr key={tenant._id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-5 py-3">
                          <div className="text-white uppercase truncate max-w-[120px]">{tenant.name}</div>
                          <div className="text-[10px] text-blue-400 font-mono tracking-tighter">/p/{tenant.slug}</div>
                        </td>
                        <td className="px-5 py-3 text-amber-500">{tenant.subscription?.status}</td>
                        <td className="px-5 py-3 text-gray-400">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500 font-black uppercase tracking-widest italic">No registration data.</div>
            )}
          </div>
        )}

        {/* Memberships Expiring Soon (Superadmin & Sales) */}
        {showGrowthMetrics && (
          <div className="bg-gray-900 border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50 flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-tight">Expiring Soon</h2>
              <Clock className="w-4 h-4 text-gray-600" />
            </div>
            
            {expiringSoonRestaurants && expiringSoonRestaurants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-800/80 border-b border-gray-700 font-black text-gray-500 uppercase tracking-widest">
                      <th className="px-5 py-3">Tenant</th>
                      <th className="px-5 py-3">Plan</th>
                      <th className="px-5 py-3">Expires At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 font-bold">
                    {expiringSoonRestaurants.map((tenant) => (
                      <tr key={tenant._id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-5 py-3 text-white uppercase truncate max-w-[120px]">{tenant.name}</td>
                        <td className="px-5 py-3 text-gray-200">
                          <span className="bg-gray-800 px-1.5 py-0.5 rounded text-[10px] uppercase font-black">{tenant.subscription?.plan}</span>
                        </td>
                        <td className="px-5 py-3 text-red-400 font-black">
                          {tenant.subscription?.expiresAt ? new Date(tenant.subscription.expiresAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 font-black uppercase tracking-widest italic">No memberships expiring soon.</div>
            )}
          </div>
        )}

        {/* Recent Tickets (Support & Superadmin - Support also sees only this) */}
        {(isSuperAdmin || isSupport) && (
          <div className={`bg-gray-900 border border-gray-800 overflow-hidden ${isSuperAdmin ? 'xl:col-span-2' : 'xl:col-span-2'}`}>
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50 flex items-center justify-between">
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                Recent Support Tickets
              </h2>
              <Ticket className="w-4 h-4 text-gray-600" />
            </div>
            
            {recentTickets && recentTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-800/80 border-b border-gray-700 text-xs font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Tenant</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {recentTickets.map((ticket) => (
                      <tr key={ticket._id} className="hover:bg-gray-800 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-black text-white uppercase tracking-tighter">{ticket.restaurantId.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 font-bold truncate max-w-[200px] block">{ticket.subject}</span>
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
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{ticket.status.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 flex items-center gap-2">
                           <span className="font-bold text-[10px] uppercase">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500 font-black uppercase tracking-widest italic">No recent tickets.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalDashboardPage;
