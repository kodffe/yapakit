import { Navigate } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import useAuthStore from '../store/authStore';
import LoginForm from '../features/auth/components/LoginForm';

/**
 * Full-screen login page with solid dark background and centered white card.
 * No gradients, no glassmorphism — flat colors only.
 */
function LoginPage() {
  const { token, user } = useAuthStore();

  if (token && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Content */}
      <div className="max-w-xl w-full bg-white p-8 border border-gray-200 shadow-sm rounded-none">

        {/* Brand Identity */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-5">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase">
            Yapakit
          </h2>
        </div>

        {/* Login Area */}
        <div className="mb-6 text-center">
          <p className="text-sm font-bold text-gray-500">Sign in to your workspace.</p>
        </div>

        <LoginForm />

        {/* Footer */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Kodffe. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
