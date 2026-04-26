'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Lock, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!loginValue || !password) {
        setError('Login ID and password are required');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const result = await login(loginValue, password);

      if (!result.success) {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testAccounts = [
    { login: 'admin@coaching.com', password: 'Admin@123', role: 'Super Admin' },
    { login: 'sajoodali486@gmail.com', password: '111111', role: 'Branch Admin' },
    { login: 'sajoodali@gmail.com', password: '111111', role: 'Teacher' },
    { login: 'ali@111gmail.com', password: '24568655342', role: 'Student' },
  ];

  const fillTestCredentials = (testLogin, testPassword) => {
    setLoginValue(testLogin);
    setPassword(testPassword);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
            <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white">🎓</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Adamjee Coaching</h1>
          <p className="text-gray-600 mt-2">Coaching Management System</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="login" className="text-sm font-medium text-gray-700">
                  Login ID (Email or Reg No)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="login"
                    type="text"
                    placeholder="Enter email or registration number"
                    value={loginValue}
                    onChange={(e) => setLoginValue(e.target.value)}
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-sm text-gray-500 bg-gray-50 px-3">
                  Test Accounts
                </span>
                <div className="h-px bg-gray-200 mt-3" />
              </div>

            <div className="space-y-2">
              {testAccounts.map((account, index) => (
                <Button
                  key={index}
                  type="button"
                  onClick={() => fillTestCredentials(account.login, account.password)}
                  disabled={loading}
                  className="w-full justify-start space-y-0.5"
                >
                  <div>
                    {account.role}
                  </div>
                  <div className="text-xs opacity-70">
                    {account.login}
                  </div>
                </Button>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                Demo application • Use test accounts above
              </p>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-gray-700 text-lg mb-1">👥</div>
            <p className="text-xs text-gray-500">Multi-Role</p>
          </div>
          <div className="text-center">
            <div className="text-gray-700 text-lg mb-1">🔒</div>
            <p className="text-xs text-gray-500">Secure</p>
          </div>
          <div className="text-center">
            <div className="text-gray-700 text-lg mb-1">⚡</div>
            <p className="text-xs text-gray-500">Fast</p>
          </div>
        </div>
      </div>
    </div>
  );
}