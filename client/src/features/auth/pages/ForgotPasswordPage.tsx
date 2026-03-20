import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, KeyRound, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Email is required');
    
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccessMsg(res.data.message || 'OTP sent to your email');
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) return setError('OTP and new password are required');
    
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword });
      setSuccessMsg(res.data.message || 'Password reset successfully');
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP or failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 border border-gray-200 shadow-sm rounded-none">
        
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 uppercase">Recover Access</h2>
              <p className="mt-2 text-sm font-bold text-gray-500">Enter your email to receive a 6-digit reset code.</p>
            </div>
            
            <form onSubmit={handleRequestOtp} className="space-y-6">
              {error && <div className="p-4 bg-red-50 text-red-700 text-sm font-bold border border-red-200">{error}</div>}
              
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm font-bold"
                    placeholder="manager@restaurant.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black rounded-none text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 uppercase tracking-wider items-center transition-colors"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Recovery Code <ArrowRight className="ml-2 w-4 h-4" /></>}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 uppercase">Enter Code</h2>
              <p className="mt-2 text-sm font-bold text-gray-500">We sent a 6-digit code to <span className="text-gray-900">{email}</span></p>
            </div>
            
            <form onSubmit={handleResetPassword} className="space-y-6">
              {error && <div className="p-4 bg-red-50 text-red-700 text-sm font-bold border border-red-200">{error}</div>}
              {successMsg && <div className="p-4 bg-blue-50 text-blue-700 text-sm font-bold border border-blue-200 mb-4">{successMsg}</div>}
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">6-Digit Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Numeric only
                  className="block w-full px-3 py-3 border border-gray-300 text-gray-900 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="000000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">New Password / PIN</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm font-bold"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black rounded-none text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 uppercase tracking-wider items-center transition-colors"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm New Password'}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-900 uppercase">Password Reset</h2>
            <p className="mt-2 text-sm font-bold text-gray-500 mb-8">You can now login with your new password.</p>
            <button
               onClick={() => navigate('/login')}
               className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black rounded-none text-white bg-blue-600 hover:bg-blue-700 uppercase tracking-wider transition-colors"
            >
              Return to Login
            </button>
          </div>
        )}

        {step !== 3 && (
          <div className="mt-6 text-center border-t border-gray-100 pt-6">
            <Link to="/login" className="flex items-center justify-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
