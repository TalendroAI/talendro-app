import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // TODO: Replace with actual auth context
  // For now, determine if user is authenticated based on route
  // Exclude onboarding pages from showing profile button
  const isOnboardingRoute = location.pathname.startsWith('/app/onboarding/');
  const isAuthenticatedRoute = location.pathname.startsWith('/app/') && !isOnboardingRoute;
  
  // Mock user data - replace with actual user from context/state
  const user = isAuthenticatedRoute ? {
    firstName: 'Grace',
    lastName: 'Nguyen',
    email: 'grace@nguyen.com',
    plan: 'Pro'
  } : null;
  
  const isActive = (path) => location.pathname === path;
  
  const handleLogout = () => {
    // TODO: Implement actual logout logic
    console.log('Logout clicked');
    navigate('/');
  };
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-talBlue hover:text-blue-700 transition">
            Talendro™
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {user ? (
              // Authenticated Navigation
              <>
                <Link 
                  to="/app/dashboard" 
                  className={`text-sm font-medium transition ${
                    isActive('/app/dashboard') 
                      ? 'text-talBlue border-b-2 border-talBlue pb-1' 
                      : 'text-gray-700 hover:text-talBlue'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/app/applications" 
                  className={`text-sm font-medium transition ${
                    isActive('/app/applications') 
                      ? 'text-talBlue border-b-2 border-talBlue pb-1' 
                      : 'text-gray-700 hover:text-talBlue'
                  }`}
                >
                  Applications
                </Link>
                <Link 
                  to="/app/agents" 
                  className={`text-sm font-medium transition ${
                    isActive('/app/agents') 
                      ? 'text-talBlue border-b-2 border-talBlue pb-1' 
                      : 'text-gray-700 hover:text-talBlue'
                  }`}
                >
                  Search Agents
                </Link>
                <Link 
                  to="/app/analytics" 
                  className={`text-sm font-medium transition ${
                    isActive('/app/analytics') 
                      ? 'text-talBlue border-b-2 border-talBlue pb-1' 
                      : 'text-gray-700 hover:text-talBlue'
                  }`}
                >
                  Analytics
                </Link>
              </>
            ) : (
              // Public Navigation
              <>
                <Link to="/how-it-works" className="text-sm font-medium text-gray-700 hover:text-talBlue transition">
                  How It Works
                </Link>
                <Link to="/services" className="text-sm font-medium text-gray-700 hover:text-talBlue transition">
                  Services
                </Link>
                <Link to="/pricing" className="text-sm font-medium text-gray-700 hover:text-talBlue transition">
                  Pricing
                </Link>
                <Link to="/about" className="text-sm font-medium text-gray-700 hover:text-talBlue transition">
                  About
                </Link>
                <Link to="/contact" className="text-sm font-medium text-gray-700 hover:text-talBlue transition">
                  Contact
                </Link>
              </>
            )}
          </nav>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              // User Menu (Authenticated)
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 bg-talBlue rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user.firstName}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserMenuOpen(false)}
                    ></div>
                    
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-600 mt-1">{user.email}</p>
                        <p className="text-xs text-talBlue font-semibold mt-2 bg-blue-50 px-2 py-1 rounded inline-block">
                          {user.plan} Plan
                        </p>
                      </div>
                      
                      <Link 
                        to="/app/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        👤 My Profile
                      </Link>
                      <Link 
                        to="/app/settings" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        ⚙️ Settings
                      </Link>
                      <Link 
                        to="/app/billing" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        💳 Billing
                      </Link>
                      
                      <div className="border-t border-gray-200 my-2"></div>
                      
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Public Actions (Not Authenticated)
              <>
                <Link 
                  to="/signin" 
                  className="text-sm font-medium text-gray-700 hover:text-talBlue transition"
                >
                  Sign In
                </Link>
                <Link to="/pricing">
                  <button className="px-6 py-2 bg-talBlue text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md" style={{ border: 'none' }}>
                    Get Started
                  </button>
                </Link>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {user ? (
              // Authenticated Mobile Menu
              <>
                <Link 
                  to="/app/dashboard" 
                  className="block py-2 text-sm font-medium text-gray-700 hover:text-talBlue transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/app/applications" 
                  className="block py-2 text-sm font-medium text-gray-700 hover:text-talBlue transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Applications
                </Link>
                <Link 
                  to="/app/agents" 
                  className="block py-2 text-sm font-medium text-gray-700 hover:text-talBlue transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Search Agents
                </Link>
                <Link 
                  to="/app/analytics" 
                  className="block py-2 text-sm font-medium text-gray-700 hover:text-talBlue transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Analytics
                </Link>
              </>
            ) : (
              // Public Mobile Menu
              <>
                <Link 
                  to="/how-it-works" 
                  className="block py-2 text-sm font-medium text-gray-700 hover:text-talBlue transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link 
                  to="/services" 
                  className="block py-2 text-sm font-medium text-gray-700 hover:text-talBlue transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Services
                </Link>
                <Link 
                  to="/pricing" 
                  className="block py-2 text-sm font-medium text-gray-700 hover:text-talBlue transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  to="/about" 
                  className="block py-2 text-sm font-medium text-gray-700 hover:text-talBlue transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  to="/contact" 
                  className="block py-2 text-sm font-medium text-gray-700 hover:text-talBlue transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
