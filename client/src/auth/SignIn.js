import { useState } from 'react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/stripe/lookup-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()

      if (data.hasActiveSubscription) {
        // Returning subscriber — go to dashboard
        sessionStorage.setItem('customerId', data.customerId)
        sessionStorage.setItem('subscriptionStatus', data.subscriptionStatus)
        sessionStorage.setItem('plan', data.plan)
        window.location.href = '/app/dashboard'
      } else if (data.customerExists) {
        // Has a Stripe account but no active subscription — send to pricing
        setError('Your subscription is not active. Please select a plan to continue.')
        setTimeout(() => { window.location.href = '/pricing' }, 2500)
      } else {
        // No account found — send to pricing to sign up
        setError('No account found with that email. Redirecting to get started...')
        setTimeout(() => { window.location.href = '/pricing' }, 2000)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? 'Checking...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="body text-talGray">
            Don't have an account?{' '}
            <a href="/pricing" className="text-talBlue hover:underline">
              Get started
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
