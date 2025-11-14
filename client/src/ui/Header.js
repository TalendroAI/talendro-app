import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  // Check if user is authenticated from localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({
          firstName: userData.name?.split(' ')[0] || 'User',
          lastName: userData.name?.split(' ').slice(1).join(' ') || '',
          email: userData.email,
          plan: userData.plan || 'Pro'
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location]);
  
  // TODO: Replace with actual auth context
  // For now, determine if user is authenticated based on route
  // Exclude onboarding pages from showing profile button
  const isOnboardingRoute = location.pathname.startsWith('/app/onboarding/');
  const isDashboardRoute = location.pathname === '/dashboard' || location.pathname === '/app/dashboard';
  const isAuthenticatedRoute = (location.pathname.startsWith('/app/') && !isOnboardingRoute) || user !== null;
  const shouldShowProfileButton = isAuthenticatedRoute && !isDashboardRoute;
  
  const isActive = (path) => location.pathname === path;
  
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const handleSignOut = () => {
    // Clear any stored data
    localStorage.clear();
    // Redirect to home
    window.location.href = '/';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.nav-user-menu')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);
  
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
                <Link to="/about/our-story" className="text-sm font-medium text-gray-700 hover:text-talBlue transition">
                  Our Story
                </Link>
                <Link to="/contact" className="text-sm font-medium text-gray-700 hover:text-talBlue transition">
                  Contact
                </Link>
              </>
            )}
          </nav>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {isDashboardRoute && user ? (
              // User Menu - Only show on dashboard pages
              <div className="nav-right">
                {/* Notifications */}
                <button className="nav-notification">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                  </svg>
                  <span className="notification-badge">3</span>
                </button>

                {/* User Dropdown */}
                <div className="nav-user-menu">
                  <button 
                    className="user-menu-trigger"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div className="user-avatar">KJ</div>
                    <span className="user-name">Kenneth</span>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="user-dropdown">
                      <div className="dropdown-header">
                        <div className="dropdown-user-info">
                          <div className="dropdown-name">Kenneth Jackson</div>
                          <div className="dropdown-plan">Pro Plan • Trial</div>
                        </div>
                      </div>
                      
                      <div className="dropdown-divider"></div>
                      
                      <Link to="/app/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <span className="dropdown-icon">👤</span>
                        My Profile
                      </Link>
                      
                      <Link to="/app/billing" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <span className="dropdown-icon">💳</span>
                        Subscription & Billing
                      </Link>
                      
                      <Link to="/app/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <span className="dropdown-icon">⚙️</span>
                        Account Settings
                      </Link>
                      
                      <div className="dropdown-divider"></div>
                      
                      <Link to="/help" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <span className="dropdown-icon">❓</span>
                        Help & Support
                      </Link>
                      
                      <div className="dropdown-divider"></div>
                      
                      <button onClick={handleSignOut} className="dropdown-item">
                        <span className="dropdown-icon">🚪</span>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : user && shouldShowProfileButton ? (
              // User Menu (Authenticated) - but not on dashboard
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
                <Link to="/app/onboarding/step-1">
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
                  to="/about/our-story" 
                  className="block py-2 text-sm font-medium text-gray-700 hover:text-talBlue transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Our Story
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
