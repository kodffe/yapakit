import { Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowRight, ShieldCheck, Zap, LayoutDashboard } from 'lucide-react';
import useAuthStore from '../store/authStore';

/**
 * Public Landing Page for the root route (/).
 * Displays a professional hero section with a call to action.
 */
function LandingPage() {
  const { token } = useAuthStore();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation - STRICTLY SOLID WHITE, NO BACKDROP BLUR */}
      <nav className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 text-white">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tight uppercase">Yapakit</span>
          </div>
          <div className="flex items-center gap-4">
            {token ? (
              <Link
                to="/select-restaurant"
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 font-bold hover:bg-blue-700 transition-colors uppercase text-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-900 hover:text-blue-600 font-bold px-4 py-2 uppercase text-sm transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-6 py-2 uppercase text-sm transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - SOLID BACKGROUND */}
      <section className="pt-24 pb-24 bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-black mb-6 uppercase tracking-widest">
              Multi-Tenant SaaS POS & Restaurant OS
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 uppercase leading-none tracking-tight">
              Command Your Restaurant With Absolute <span className="text-blue-600">Precision</span>
            </h1>
            <p className="text-xl text-gray-700 mb-10 font-bold max-w-2xl mx-auto">
              Yapakit is a Mobile-First operating system built strictly for high-velocity B2B operations. 
              Flawless core synchronization from Waiter to Kitchen KDS to Cashier.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={token ? "/select-restaurant" : "/register"}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 font-black text-lg hover:bg-blue-700 transition-colors uppercase"
              >
                {token ? "Open Workspace" : "Start Free Trial"}
                <ArrowRight className="w-5 h-5" />
              </Link>
              {!token && (
                <Link
                  to="/login"
                  className="w-full sm:w-auto text-gray-900 bg-white border-2 border-gray-900 hover:bg-gray-900 hover:text-white font-black px-8 py-4 text-lg transition-colors uppercase text-center"
                >
                  Sign In to Workspace
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Core Focus Grid - FLAT COLORS, HIGH CONTRAST */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight">The B2B Core Focus</h2>
            <div className="w-24 h-2 bg-blue-600 mx-auto mt-6"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-100 p-10 border-t-8 border-blue-600">
              <div className="w-16 h-16 bg-blue-600 text-white flex items-center justify-center mb-6">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase">1. Waiter POS</h3>
              <p className="text-gray-700 font-medium">
                Mobile-first ordering interface. Rapid menu traversal, modifier selection, and dynamic table assignment built for high-speed table service.
              </p>
            </div>
            
            <div className="bg-gray-100 p-10 border-t-8 border-gray-900">
              <div className="w-16 h-16 bg-gray-900 text-white flex items-center justify-center mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-4 uppercase">2. Kitchen KDS</h1>
              <p className="text-gray-700 font-medium">
                Live websocket synchronization routing tickets instantly to the prep line. Clear, high-contrast layouts for brigade-style kitchen reading.
              </p>
            </div>
            
            <div className="bg-gray-100 p-10 border-t-8 border-blue-600">
              <div className="w-16 h-16 bg-blue-600 text-white flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase">3. Cashier Hub</h3>
              <p className="text-gray-700 font-medium">
                Consolidated ledger controls, advanced split-billing mechanics, and dynamic custom payment methods integrated into a single dense view.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - SOLID */}
      <footer className="py-12 bg-gray-900 text-center border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 text-white">
            <UtensilsCrossed className="w-6 h-6" />
            <span className="text-xl font-black tracking-tight uppercase">Yapakit</span>
          </div>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Kodffe. Enterprise grade efficiency.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
