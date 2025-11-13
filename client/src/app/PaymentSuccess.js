import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function handlePaymentSuccess() {
      try {
        // Simulate payment verification
        const response = await fetch('/api/checkout/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: 'mock_payment_intent_123',
            amount: 3900,
            currency: 'usd'
          })
        });

        if (!response.ok) {
          throw new Error('Payment verification failed');
        }

        const result = await response.json();
        
        if (result.success) {
          // Set user as subscribed
          sessionStorage.setItem('isSubscribed', 'true');
          sessionStorage.setItem('currentCid', 'demo-user-123');
          
          // Trigger initial job search
          await triggerInitialJobSearch();
          
          // Redirect to dashboard
          setTimeout(() => {
            navigate('/app/dashboard');
          }, 2000);
        } else {
          setError('Payment verification failed');
        }
      } catch (err) {
        console.error('Payment success handler error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function triggerInitialJobSearch() {
      try {
        const cid = sessionStorage.getItem('currentCid') || 'demo-user-123';
        
        // Generate Boolean search
        const booleanResponse = await fetch(`/api/dashboard/boolean-generator/${cid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skills: ["Python", "Java", "React", "Node.js", "AWS"],
            jobTitles: ["Software Engineer", "Developer", "Full Stack", "Backend"],
            locations: ["Remote", "Hybrid", "San Francisco", "New York"],
            industries: ["Technology", "Software", "Fintech", "Healthcare"]
          })
        });

        if (booleanResponse.ok) {
          const booleanResult = await booleanResponse.json();
          
          // Execute initial search
          const searchResponse = await fetch(`/api/dashboard/execute-search/${cid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              booleanString: booleanResult.booleanString
            })
          });

          if (searchResponse.ok) {
            const searchResult = await searchResponse.json();
            console.log('Initial job search completed:', searchResult);
          }
        }
      } catch (err) {
        console.error('Initial job search failed:', err);
        // Don't fail the payment success flow for search errors
      }
    }

    handlePaymentSuccess();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">Processing Payment...</h2>
          <p className="text-gray-600 mt-2">Setting up your account and running initial job search</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Payment Error</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={() => navigate('/app/checkout')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Payment Successful!</h2>
        <p className="text-gray-600 mt-2">Your account is being set up...</p>
        <p className="text-sm text-gray-500 mt-1">Redirecting to your dashboard</p>
      </div>
    </div>
  );
}





