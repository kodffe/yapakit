import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, Lock } from 'lucide-react';
import { loginApi } from '../api/login';
import useAuthStore from '../../../store/authStore';

/**
 * Styled login form with flat solid colors — no gradients or opacities.
 */
function LoginForm() {
  const navigate = useNavigate();
  const { setAuth, setRestaurantContext } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      const { token, user, memberships } = data;
      setAuth(token, user, memberships);

      if (user.systemRole && ['superadmin', 'support', 'sales'].includes(user.systemRole)) {
        navigate('/admin', { replace: true });
        return;
      }

      if (memberships && memberships.length === 1) {
        setRestaurantContext(memberships[0].restaurantId._id);
        navigate(`/${memberships[0].restaurantId.slug || 'tenant'}`, { replace: true });
        return;
      }

      navigate('/select-restaurant', { replace: true });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    loginMutation.mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {loginMutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {loginMutation.error instanceof Error
            ? 'Invalid email or password. Please try again.'
            : 'An unexpected error occurred.'}
        </div>
      )}

      <div>
        <label htmlFor="login-email" className="block text-xs font-bold text-gray-700 uppercase mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="manager@restaurant.com"
            required
            autoComplete="email"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm font-bold rounded-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="login-password" className="block text-xs font-bold text-gray-700 uppercase mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm font-bold rounded-none"
          />
        </div>
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
          >
            Forgot Password?
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-none text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 uppercase tracking-wider items-center transition-colors mt-6 shadow-md"
      >
        {loginMutation.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}

export default LoginForm;
