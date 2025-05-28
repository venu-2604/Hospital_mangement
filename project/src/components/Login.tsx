import React, { useState, useEffect } from 'react';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { loginDoctor, checkLoggedInStatus, updateDoctorStatus } from '../services/api';

interface LoginProps {
  onLogin: (doctorInfo?: any) => void;
}

// Create a simple MedicalCross component since it doesn't exist in lucide-react
const MedicalCross = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M8 4h8v4h4v8h-4v4H8v-4H4V8h4V4z" />
  </svg>
);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [userType, setUserType] = useState<'doctor' | 'admin'>('doctor');
  const [doctorId, setDoctorId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | React.ReactNode | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const doctorInfo = checkLoggedInStatus();
      if (doctorInfo?.authenticated) {
        onLogin(doctorInfo);
      }
    };
    
    checkAuth();
  }, [onLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // For now, we only support doctor login
      if (userType === 'doctor') {
        const response = await loginDoctor(doctorId, password);
        
        if (response.authenticated) {
          await updateDoctorStatus(doctorId, 'Active');
          onLogin(response);
        } else {
          // Display the specific error message from the backend
          setErrorMessage(response.message || 'Authentication failed');
        }
      } else {
        // Admin login not implemented yet
        setErrorMessage('Admin login is not implemented yet');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Failed to connect to the server. Please check your network connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl overflow-hidden flex">
        {/* Left Section - Blue Background */}
        <div className="bg-blue-600 w-2/5 text-white p-8 flex flex-col items-center justify-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto">
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                <path d="M15 2a5 5 0 015 5v0a9.74 9.74 0 01-3 7h0a9.74 9.74 0 01-7 3v0a5 5 0 01-5-5v0" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-center">Arogith Hospital</h1>
          <div className="w-16 h-1 bg-white mb-6 rounded"></div>
          <p className="text-center text-white/80 mb-8">Advanced Healthcare Management System</p>
          <p className="text-center text-sm text-white/70">
            Delivering exceptional healthcare with compassion and cutting-edge technology.
          </p>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-3/5 p-8">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-8">Please sign in to access your portal</p>
            
            {/* Login Type Tabs */}
            <div className="flex mb-8 border-b">
              <button 
                className={`pb-2 px-4 ${userType === 'doctor' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
                onClick={() => setUserType('doctor')}
              >
                <span className="flex items-center">
                  <div className="flex items-center mr-2">
                    <MedicalCross size={20} />
                  </div>
                  Doctor Login
                </span>
              </button>
              <button 
                className={`pb-2 px-4 ${userType === 'admin' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
                onClick={() => setUserType('admin')}
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                  </svg>
                  Admin Login
                </span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label htmlFor="userid" className="block text-gray-700 text-sm font-medium mb-2">
                  {userType === 'doctor' ? 'Doctor ID' : 'Admin ID'}
                </label>
                <input
                  type="text"
                  id="userid"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter your ${userType === 'doctor' ? 'Doctor' : 'Admin'} ID`}
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    {userType === 'doctor' ? 'Doctor Login' : 'Admin Login'}
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Having trouble logging in? <a href="#" className="text-blue-600">Contact support</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 