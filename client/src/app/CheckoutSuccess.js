import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CheckoutSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Mark subscription as active so ResumeGate shows the "Payment confirmed" badge
    sessionStorage.setItem('subscriptionStatus', 'active');
    // Redirect to the resume gate to begin onboarding
    navigate('/app/resume-gate', { replace: true });
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1f2e 0%, #2C2F38 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#fff',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <p style={{ fontSize: 18, color: '#9ca3af' }}>Payment confirmed — setting up your account...</p>
      </div>
    </div>
  );
}
