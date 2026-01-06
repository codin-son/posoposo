import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 flex items-center justify-center p-4 md:p-8">
      <div className="card w-full max-w-lg bg-base-100 shadow-2xl">
        <div className="card-body p-8 md:p-10">
          {/* Logo and branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-primary rounded-2xl p-5 mb-5 shadow-lg">
              <UtensilsCrossed className="w-14 h-14 md:w-16 md:h-16 text-primary-content" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-center">Western Restaurant</h1>
            <p className="text-lg text-base-content/60 mt-2">Point of Sale System</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="alert alert-error py-4">
                <span className="text-lg">{error}</span>
              </div>
            )}
            
            <div className="form-control">
              <label className="label pb-2">
                <span className="label-text text-lg font-medium">Username</span>
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                className="input input-bordered input-lg text-lg h-14 md:h-16"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </div>
            
            <div className="form-control">
              <label className="label pb-2">
                <span className="label-text text-lg font-medium">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="input input-bordered input-lg w-full pr-14 text-lg h-14 md:h-16"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-circle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full h-14 md:h-16 text-lg mt-6"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-md"></span>
              ) : (
                <>
                  <LogIn size={24} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
