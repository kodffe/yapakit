import { useState } from 'react';
import { useAvailability, useCreatePublicReservation, PublicRestaurant } from '../api/publicApi';
import { CalendarDays, Clock, Users, ArrowRight, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react';

interface ReservationWizardProps {
  restaurant: PublicRestaurant;
  onClose: () => void;
}

export default function ReservationWizard({ restaurant, onClose }: ReservationWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    partySize: 2,
    date: new Date().toISOString().split('T')[0],
    time: '',
    name: '',
    phone: '',
    specialRequests: '',
  });

  const { data: availableTimes, isLoading: isLoadingTimes, isError: isTimesError } = useAvailability(restaurant.slug, formData.date);
  const createReservation = useCreatePublicReservation(restaurant.slug);

  const [emailError, setEmailError] = useState('');

  const handleNextStep1 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({ ...prev, time }));
    setStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReservation.mutate(formData, {
      onSuccess: () => {
        setStep(4); // Success step
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {step > 1 && step < 4 && (
            <button onClick={() => setStep(step - 1)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h3 className="font-bold text-gray-900">
            Book a Table {step < 4 ? <span className="text-gray-400 font-medium ml-2">Step {step} of 3</span> : ''}
          </h3>
        </div>
        <button onClick={onClose} className="text-sm font-bold text-gray-400 hover:text-gray-600 px-2 py-1">
          Close
        </button>
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">What's your email?</label>
              <input
                type="email"
                placeholder="hello@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleNextStep1()}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                autoFocus
              />
              {emailError && <p className="text-red-600 text-xs font-bold mt-2">{emailError}</p>}
            </div>
            <button
              onClick={handleNextStep1}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" /> Party Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.partySize}
                  onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) || 1 })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-gray-400" /> Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" /> Available Times
              </label>

              {isLoadingTimes ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                </div>
              ) : isTimesError ? (
                <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm font-medium border border-red-100">
                  Failed to load availability. Please try again.
                </div>
              ) : !availableTimes || availableTimes.length === 0 ? (
                <div className="bg-gray-50 text-gray-600 p-6 text-center rounded-xl border border-gray-200">
                  <p className="font-bold text-gray-900 mb-1">No times available</p>
                  <p className="text-sm">We're fully booked or closed on this date. Please try another day.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 select-none">
                  {availableTimes.map((t) => (
                    <button
                      key={t}
                      onClick={() => handleTimeSelect(t)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-2.5 rounded-lg text-sm transition-colors border border-gray-200 hover:border-gray-300 active:bg-gray-300"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-blue-50 text-blue-900 p-4 rounded-xl text-sm font-medium flex justify-between items-center shadow-sm">
              <div>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">Reservation Details</p>
                <p className="font-black text-lg mt-0.5">{new Date(formData.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {formData.time}</p>
                <p>{formData.partySize} Guests</p>
              </div>
              <button type="button" onClick={() => setStep(2)} className="text-blue-600 underline font-bold text-xs">Edit</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Special Requests (Optional)</label>
              <textarea
                rows={2}
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Allergies, high chair needed..."
              />
            </div>

            <button
              type="submit"
              disabled={createReservation.isPending || !formData.name || !formData.phone}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createReservation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Booking'}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center py-6 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-black text-2xl text-gray-900 mb-2">Request Sent!</h3>
            <p className="text-gray-500 font-medium mb-6">
              Your reservation request is currently pending. The restaurant will review it and you will receive a confirmation email shortly.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
