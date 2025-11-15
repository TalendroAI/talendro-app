import { useState } from 'react'

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement actual authentication
    // For now, redirect to dashboard
    window.location.href = '/app/dashboard'
  }

  return (
    <div className="container py-10">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <a href="/" className="text-talBlue hover:underline flex items-center gap-2">
            ← Back to Home
          </a>
        </div>
        
        <h1 className="h1">Sign in to your account</h1>
        <p className="tagline mt-2">Access your Talendro dashboard</p>
        
        <div className="card mt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block body mb-2">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full border rounded-xl h-11 px-3 focus:outline-none focus:ring-2 focus:ring-talAqua border-talGray"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block body mb-2">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full border rounded-xl h-11 px-3 focus:outline-none focus:ring-2 focus:ring-talAqua border-talGray"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a href="/forgot-password" className="text-talBlue hover:underline">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="btn btn-primary w-full"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
        
        <div className="text-center mt-6">
          <p className="body text-talGray">
            Don't have an account?{' '}
            <a href="/app/onboarding/welcome" className="text-talBlue hover:underline">
              Get started
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}