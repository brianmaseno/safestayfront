import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, getAvailableApartments } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Move these components outside to prevent recreation on every render
const InputField = ({ icon, type, name, placeholder, required, value, autoComplete, onChange }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <span className="text-gray-400 text-lg">{icon}</span>
    </div>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      autoComplete={autoComplete}
      onChange={onChange}
      required={required}
      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
    />
  </div>
);

const PasswordField = ({ name, placeholder, required, value, autoComplete, onChange, showPassword, onTogglePassword }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <span className="text-gray-400 text-lg">🔒</span>
    </div>
    <input
      type={showPassword ? 'text' : 'password'}
      name={name}
      placeholder={placeholder}
      value={value}
      autoComplete={autoComplete}
      onChange={onChange}
      required={required}
      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
    />
    <button
      type="button"
      onClick={onTogglePassword}
      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
    >
      {showPassword ? '👁️' : '🙈'}
    </button>
  </div>
);

export default function Login() {
  console.log('🔍 Login component rendering...');
  
  const [isLogin, setIsLogin] = useState(true);
  const [availableApartments, setAvailableApartments] = useState([]);
  const [apartmentsLoading, setApartmentsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Tenant',
    nationalID: '',
    primaryPhoneNumber: '',
    secondaryPhoneNumber: '',
    buildingName: '',
    dateMovedIn: '',
    apartmentName: '',
    apartmentId: '',
    rentAmount: ''
  });

  // Fetch available apartments when component mounts or switches to register mode
  useEffect(() => {
    const fetchApartments = async () => {
      if (!isLogin) {
        console.log('🏠 Fetching available apartments...');
        setApartmentsLoading(true);
        try {
          const response = await getAvailableApartments();
          console.log('✅ API Response:', response);
          console.log('✅ Available apartments:', response.data);
          const apartments = response.data.data || response.data || [];
          console.log('📊 Processed apartments:', apartments);
          setAvailableApartments(apartments);
        } catch (error) {
          console.error('❌ Error fetching apartments:', error);
          console.error('❌ Error details:', error.response?.data);
          setAvailableApartments([]);
        } finally {
          setApartmentsLoading(false);
        }
      }
    };

    fetchApartments();
  }, [isLogin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('📝 Form field changed:', name, '=', value);
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      
      // If tenant selects an apartment, update apartmentName
      if (name === 'apartmentId' && value) {
        const selectedApartment = availableApartments.find(apt => apt._id === value);
        console.log('🏠 Selected apartment:', selectedApartment);
        if (selectedApartment) {
          newData.apartmentName = selectedApartment.name;
          console.log('📝 Updated apartmentName to:', selectedApartment.name);
        }
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async () => {
    console.log('🚀 Form submission started, isLogin:', isLogin);
    console.log('📝 Form data:', formData);
    
    setIsLoading(true);
    setError('');
    
    // Basic validation
    if (!formData.email || !formData.password) {
      console.log('❌ Basic validation failed - missing email or password');
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (!isLogin) {
      if (!formData.name || !formData.nationalID || !formData.primaryPhoneNumber) {
        console.log('❌ Registration validation failed - missing required fields');
        setError('Please fill in all required fields');
        setIsLoading(false);
        return;
      }
      
      if (formData.role === 'Landlord') {
        if (!formData.apartmentName || !formData.rentAmount) {
          console.log('❌ Landlord validation failed - missing apartment name or rent amount');
          setError('Apartment name and rent amount are required for landlords');
          setIsLoading(false);
          return;
        }
      } else {
        // Tenant validation
        if (!formData.apartmentId) {
          console.log('❌ Tenant validation failed - no apartment selected');
          setError('Please select an apartment');
          setIsLoading(false);
          return;
        }
      }
    }
    
    try {
      const payload = { ...formData };
      console.log('📤 Sending payload:', payload);

      // Remove fields not needed during login
      if (isLogin) {
        console.log('🔐 Processing login request');
        delete payload.name;
        delete payload.role;
        delete payload.nationalID;
        delete payload.primaryPhoneNumber;
        delete payload.secondaryPhoneNumber;
        delete payload.buildingName;
        delete payload.dateMovedIn;
        delete payload.apartmentName;
        delete payload.apartmentId;
        delete payload.rentAmount;
      } else {
        console.log('📝 Processing registration request');
      }

      console.log('🌐 Making API call...');
      const res = isLogin ? await loginUser(payload) : await registerUser(payload);
      console.log('✅ API call successful:', res.data);

      const { user, token } = res.data;
      
      // Use the auth context to login
      console.log('🔑 Logging in user with token...');
      login(user, token);
      
      // Navigate to dashboard
      console.log('🚀 Navigating to dashboard...');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('❌ Auth failed:', error);
      console.error('❌ Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Authentication failed';
      setError(errorMessage);
    } finally {
      console.log('⏰ Setting loading to false');
      setIsLoading(false);
    }
  }

  const toggleMode = () => {
    console.log('🔄 Toggling mode from', isLogin ? 'login' : 'register', 'to', isLogin ? 'register' : 'login');
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Tenant',
      nationalID: '',
      primaryPhoneNumber: '',
      secondaryPhoneNumber: '',
      buildingName: '',
      dateMovedIn: '',
      apartmentName: '',
      apartmentId: '',
      rentAmount: ''
    });
    // Clear apartments when toggling modes
    setAvailableApartments([]);
  };

  const getRoleColor = (role) => {
    return role === 'Tenant' ? 'from-blue-600 to-purple-600' : 'from-green-600 to-teal-600';
  };

  const getRoleIcon = (role) => {
    return role === 'Tenant' ? '👤' : '🏢';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {console.log('🎨 Rendering login page, isLogin:', isLogin, 'isLoading:', isLoading)}
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${getRoleColor(formData.role)} mb-4`}>
            <span className="text-white text-2xl">{getRoleIcon(formData.role)}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Join our property management platform'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-500 text-lg mr-2">❌</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Role Selection (Registration only) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {['Tenant', 'Landlord'].map((role) => {
                  const icon = getRoleIcon(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role }))}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.role === role
                          ? `border-${role === 'Tenant' ? 'blue' : 'green'}-500 bg-${role === 'Tenant' ? 'blue' : 'green'}-50`
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className={`text-xl mr-2 ${formData.role === role ? (role === 'Tenant' ? 'text-blue-600' : 'text-green-600') : 'text-gray-600'}`}>
                        {icon}
                      </span>
                      <span className={`font-medium ${formData.role === role ? (role === 'Tenant' ? 'text-blue-600' : 'text-green-600') : 'text-gray-600'}`}>
                        {role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Registration Fields */}
          {!isLogin && (
            <div className="space-y-4 ">
              <InputField
                icon="👤"
                type="text"
                name="name"
                placeholder="Full Name"
                required
                value={formData.name}
                onChange={handleChange}
              />
              
              <InputField
                icon="🆔"
                type="text"
                name="nationalID"
                placeholder="National ID"
                required
                value={formData.nationalID}
                onChange={handleChange}
              />
              
              <InputField
                icon="📱"
                type="tel"
                name="primaryPhoneNumber"
                placeholder="Primary Phone Number"
                required
                value={formData.primaryPhoneNumber}
                onChange={handleChange}
              />
              
              <InputField
                icon="📞"
                type="tel"
                name="secondaryPhoneNumber"
                placeholder="Secondary Phone Number (optional)"
                value={formData.secondaryPhoneNumber}
                onChange={handleChange}
              />

              {/* Apartment Selection */}
              {formData.role === 'Landlord' ? (
                <InputField
                  icon="🏠"
                  type="text"
                  name="apartmentName"
                  placeholder="Apartment Name"
                  required
                  value={formData.apartmentName}
                  onChange={handleChange}
                />
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Select Apartment</label>
                  {console.log('🏠 Rendering apartment dropdown. Available apartments:', availableApartments.length, 'Loading:', apartmentsLoading)}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-lg">🏠</span>
                    </div>
                    <select
                      name="apartmentId"
                      value={formData.apartmentId}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">Select an apartment...</option>
                      {apartmentsLoading ? (
                        <option disabled>Loading apartments...</option>
                      ) : availableApartments.length === 0 ? (
                        <option disabled>No apartments available</option>
                      ) : (
                        availableApartments.map((apartment) => {
                          console.log('🏠 Rendering apartment option:', apartment);
                          return (
                            <option key={apartment._id} value={apartment._id}>
                              {apartment.name} - ${apartment.rentAmount}/month (by {apartment.landlordName})
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* Role-specific fields */}
              {formData.role === 'Tenant' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Date Moved In</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-lg">📅</span>
                    </div>
                    <input
                      type="date"
                      name="dateMovedIn"
                      value={formData.dateMovedIn}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    />
                  </div>
                </div>
              )}

              {formData.role === 'Landlord' && (
                <div className="space-y-4">
                  <InputField
                    icon="🏢"
                    type="text"
                    name="buildingName"
                    placeholder="Building Name"
                    value={formData.buildingName}
                    onChange={handleChange}
                  />
                  
                  <InputField
                    icon="💰"
                    type="number"
                    name="rentAmount"
                    placeholder="Monthly Rent Amount (KES)"
                    value={formData.rentAmount}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* Email and Password */}
          <div className="space-y-4">
            <InputField
              icon="📧"
              type="email"
              name="email"
              placeholder="Email Address"
              required
              value={formData.email}
              autoComplete={isLogin ? 'username' : 'email'}
              onChange={handleChange}
            />
            
            <PasswordField
              name="password"
              placeholder="Password"
              required
              value={formData.password}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              onChange={handleChange}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gradient-to-r ${getRoleColor(formData.role)} ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="text-lg mr-2">✓</span>
                {isLogin ? 'Sign In' : 'Create Account'}
              </div>
            )}
          </button>

          {/* Toggle Mode */}
          <div className="text-center pt-4">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                {isLogin ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Secure property management platform</p>
        </div>
      </div>
    </div>
  );
}