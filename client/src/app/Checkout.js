import React, { useEffect } from 'react';

function Checkout() {
  useEffect(() => {
    // Redirect to the new Stripe checkout page
    window.location.href = '/checkout.html';
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#6b7280'
    }}>
      <div>
        <div className="loading" style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #2F6DF6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>Redirecting to checkout...</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Checkout;
