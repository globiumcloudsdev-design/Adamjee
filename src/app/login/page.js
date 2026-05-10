"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Mail, Lock, AlertCircle, Loader, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!loginValue || !password) {
        setError("Login ID and password are required");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      const result = await login(loginValue, password);

      if (!result.success) {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const testAccounts = [
    { login: "admin@coaching.com", password: "Admin@123", role: "Super Admin" },
    {
      login: "adamjeec12@gmail.com",
      password: "admin@c12",
      role: "Branch Admin",
    },
    { login: "sajoodali@gmail.com", password: "111111", role: "Teacher" },
    // { login: 'ali@111gmail.com', password: '24568655342', role: 'Student' },
  ];

  const fillTestCredentials = (testLogin, testPassword) => {
    setLoginValue(testLogin);
    setPassword(testPassword);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 overflow-hidden">
              <img
                src="/logo.png"
                alt="Adamjee Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Adamjee Coaching</h1>
          <p className="text-gray-600 mt-2">Coaching Management System</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Welcome Back
            </CardTitle>
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
                <label
                  htmlFor="login"
                  className="text-sm font-medium text-gray-700"
                >
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
                <div className="flex justify-between items-center px-0.5">
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-blue-600 hover:text-blue-800 ml-auto mb-1"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  label="Password"
                />
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
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Demo Accounts */}
            {process.env.NODE_ENV === 'development' && (
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
                      onClick={() =>
                        fillTestCredentials(account.login, account.password)
                      }
                      disabled={loading}
                      className="w-full justify-start space-y-0.5"
                    >
                      <div>{account.role}</div>
                      <div className="text-xs opacity-70">{account.login}</div>
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
            )}
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
