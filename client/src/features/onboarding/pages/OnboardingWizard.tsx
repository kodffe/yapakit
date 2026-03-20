import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  UtensilsCrossed,
  Phone,
  MapPin,
  User
} from 'lucide-react';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import ImageUpload from '../../../components/ui/ImageUpload';

function OnboardingWizard() {
  const navigate = useNavigate();
  const { setAuth, setRestaurantContext } = useAuthStore();
  
  // Wizard State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  
  // Step 3: Owner Details
  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  
  // Step 4: Restaurant Details
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantType, setRestaurantType] = useState('Full Service');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');

  // ─── Step Handlers ───

  const handleInit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Email is required');
    
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/onboarding/init', { email });
      
      if (data.alreadyRegistered) {
        setError('Email already registered. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return setError('A valid 6-digit OTP is required');

    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/onboarding/verify', { email, otp });
      setRegistrationToken(data.registrationToken);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOwnerDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userPassword) return setError('Name and Password are required');
    if (userPassword.length < 6) return setError('Password must be at least 6 characters');
    
    setError('');
    setStep(4);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName) return setError('Restaurant Name is required');

    setError('');
    setIsLoading(true);
    try {
      const payload = {
        registrationToken,
        userPassword,
        userName,
        restaurantName,
        restaurantType,
        phone,
        address,
        logoUrl,
        heroImageUrl
      };

      const { data } = await api.post('/onboarding/complete', payload);
      
      // Auto-Login the user globally
      setAuth(data.token, data.user, data.memberships);
      
      // Since it's a new tenant, they only have 1 membership initially.
      if (data.memberships && data.memberships.length > 0) {
        setRestaurantContext(data.memberships[0].restaurantId._id);
        navigate(`/${data.slug}/dashboard`, { replace: true });
      } else {
        navigate('/select-restaurant', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete registration');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render Helpers ───

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8 space-x-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
          </div>
          {i < 4 && <div className={`w-8 h-1 mx-2 ${step > i ? 'bg-blue-600' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full bg-white p-8 border border-gray-200 shadow-sm rounded-none">
        
        {/* Header Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-5">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase">Create Workspace</h2>
        </div>

        <StepIndicator />

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-bold border border-red-200 flex flex-col items-center">
            {error}
            {error.includes('already registered') && (
              <Link to="/login" className="mt-2 text-blue-600 hover:text-blue-800 underline uppercase tracking-wider text-xs">
                Go to Login
              </Link>
            )}
          </div>
        )}

        {/* ─── STEP 1: INITIALIZE ─── */}
        {step === 1 && (
          <form onSubmit={handleInit} className="space-y-6">
            <div className="text-center">
              <p className="text-sm font-bold text-gray-500">Let's start with your email address.</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm font-bold"
                  placeholder="manager@restaurant.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black rounded-none text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 uppercase tracking-wider items-center transition-colors"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Verification Code <ArrowRight className="ml-2 w-4 h-4" /></>}
            </button>
          </form>
        )}

        {/* ─── STEP 2: VERIFY OTP ─── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center">
              <p className="text-sm font-bold text-gray-500">Enter the 6-digit code sent to <span className="text-gray-900">{email}</span></p>
            </div>
            
            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="block w-full px-3 py-4 border border-gray-300 text-gray-900 text-center text-3xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black rounded-none text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 uppercase tracking-wider items-center transition-colors"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
            </button>
          </form>
        )}

        {/* ─── STEP 3: OWNER DETAILS ─── */}
        {step === 3 && (
          <form onSubmit={handleOwnerDetails} className="space-y-6">
            <div className="text-center">
              <p className="text-sm font-bold text-gray-500">Create your admin account.</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm font-bold"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Secure Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black rounded-none text-white bg-blue-600 hover:bg-blue-700 uppercase tracking-wider items-center transition-colors"
            >
              Continue to Workspace Setup <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>
        )}

        {/* ─── STEP 4: RESTAURANT DETAILS ─── */}
        {step === 4 && (
          <form onSubmit={handleComplete} className="space-y-6">
            <div className="text-center">
              <p className="text-sm font-bold text-gray-500">Tell us about your restaurant. We'll pre-load your menu with standard data.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Restaurant Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm font-bold"
                    placeholder="The Grand Cafe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm font-bold"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Type</label>
                <select
                  value={restaurantType}
                  onChange={(e) => setRestaurantType(e.target.value)}
                  className="block w-full px-3 py-3 bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm font-bold"
                >
                  <option value="Full Service">Full Service / Dine-In</option>
                  <option value="Quick Service">Quick Service / Fast Food</option>
                  <option value="Cafe">Cafe / Bakery</option>
                  <option value="Food Truck">Food Truck</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm font-bold"
                    placeholder="123 Main St, City, ST 12345"
                  />
                </div>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Logo</label>
                <ImageUpload
                  value={logoUrl}
                  onChange={setLogoUrl}
                  token={registrationToken}
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Hero Image</label>
                <ImageUpload
                  value={heroImageUrl}
                  onChange={setHeroImageUrl}
                  token={registrationToken}
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-none text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 uppercase tracking-wider items-center transition-colors mt-6 shadow-md"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Launch Workspace'}
            </button>
          </form>
        )}

        {/* Global Footer Interactivity */}
        {step === 1 && (
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <Link to="/login" className="flex items-center justify-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingWizard;
