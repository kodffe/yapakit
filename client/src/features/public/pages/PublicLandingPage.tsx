import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UtensilsCrossed, BookOpen, CalendarDays, MapPin, Phone } from 'lucide-react';
import { usePublicRestaurant } from '../api/publicApi';
import ReservationWizard from '../components/ReservationWizard';
import ThemeProvider from '../../../components/layout/ThemeProvider';

/**
 * Public Landing Page for a restaurant.
 * Accessible at /p/:slug — no auth required.
 * Flat solid colors only.
 */
function PublicLandingPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: restaurant, isLoading, isError } = usePublicRestaurant(slug);
  const [showWizard, setShowWizard] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <UtensilsCrossed className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Not Found</h1>
        <p className="text-gray-500">The restaurant you're looking for doesn't exist or is currently unavailable.</p>
      </div>
    );
  }

  return (
    <ThemeProvider branding={restaurant.branding}>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative">
          {restaurant.heroImageUrl ? (
            <div className="h-64 sm:h-80 w-full overflow-hidden">
              <img
                src={restaurant.heroImageUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-64 sm:h-80 w-full bg-gray-900 flex items-center justify-center">
              <UtensilsCrossed className="w-20 h-20 text-gray-700" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-6 -mt-12 relative z-10">
          {/* Logo + Name Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-200">
            {restaurant.logoUrl ? (
              <img
                src={restaurant.logoUrl}
                alt={`${restaurant.name} logo`}
                className="w-20 h-20 rounded-xl object-cover mx-auto mb-4 border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-brand-primary flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-10 h-10 text-white" />
              </div>
            )}

            <h1 className="text-2xl font-black text-gray-900">{restaurant.name}</h1>

            {restaurant.address && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 mt-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{restaurant.address}</span>
              </div>
            )}

            {restaurant.phone && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 mt-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{restaurant.phone}</span>
              </div>
            )}
          </div>

          {/* Action Buttons OR Wizard */}
          {showWizard ? (
            <div className="mt-8">
              <ReservationWizard restaurant={restaurant} onClose={() => setShowWizard(false)} />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <Link
                to={`/p/${slug}/menu`}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-brand-primary text-brand-primary font-bold py-5 rounded-2xl text-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <BookOpen className="w-6 h-6" />
                View Menu
              </Link>

              <button
                onClick={() => setShowWizard(true)}
                className="w-full flex items-center justify-center gap-3 bg-brand-primary text-white font-bold py-5 rounded-2xl text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
              >
                <CalendarDays className="w-6 h-6" />
                Book a Table
              </button>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8 pb-8">
            Powered by <span className="font-bold text-gray-500">Yapakit</span>
          </p>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default PublicLandingPage;
