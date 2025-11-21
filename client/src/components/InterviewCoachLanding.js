import React from 'react';

const InterviewCoachLanding = () => {
  const handleStarterCheckout = () => {
    window.location.href = 'https://buy.stripe.com/6oUcN4avtes2bdvfb9cV201';
  };

  const handleFullMockCheckout = () => {
    window.location.href = 'https://buy.stripe.com/5kQaEW1YX0Bc1CV0gfcV200';
  };

  const handlePremiumCheckout = () => {
    window.location.href = 'https://buy.stripe.com/28E3cu1YX97I4P7bYXcV202';
  };

  const scrollToPricing = (e) => {
    e.preventDefault();
    document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ 
      position: 'relative',
      top: 0,
      left: 0,
      minHeight: '100vh', 
      backgroundColor: '#ffffff', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      margin: 0,
      padding: 0,
      width: '100%',
      boxSizing: 'border-box',
      display: 'block'
    }}>
      
      {/* Hero Section */}
      <section style={{ backgroundColor: '#f9fafb', padding: '120px 20px 60px 20px', margin: 0, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            color: '#2F6DF6', 
            marginBottom: '20px',
            lineHeight: '1.2'
          }}>
            Talendro™ Interview Coach
          </h1>
          <p style={{ 
            fontSize: '1.5rem', 
            color: '#00C4CC', 
            fontStyle: 'italic',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            Personalized, professional-grade interview preparation using your résumé, job description, and target company.
          </p>
          <p style={{ fontSize: '1.125rem', color: '#374151', marginBottom: '15px', lineHeight: '1.6' }}>
            Choose the level of prep you need, pay securely, and start practicing in minutes.
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '30px' }}>
            Built on Talendro's autonomous job search & apply engine • Optimized for mid-career & senior roles
          </p>
          <button 
            onClick={scrollToPricing}
            style={{
              backgroundColor: '#2F6DF6',
              color: 'white',
              padding: '14px 32px',
              fontSize: '1rem',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1e40af'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2F6DF6'}
          >
            View Plans & Pricing
          </button>
        </div>
      </section>

      {/* Info Banner */}
      <section style={{ backgroundColor: '#2F6DF6', padding: '20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ color: 'white', fontSize: '0.875rem', lineHeight: '1.6' }}>
            <strong>When you purchase, you'll receive an email</strong> with your Interview Coach link and simple instructions: 
            <strong> upload résumé + job description + company URL</strong>, then select your plan.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '60px 20px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', marginBottom: '15px', textAlign: 'center' }}>
            Choose your prep level
          </h2>
          <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '50px', textAlign: 'center', maxWidth: '800px', margin: '0 auto 50px auto' }}>
            All options use your résumé, JD, and company website for tailored questions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '40px' }}>
            
            {/* Starter Plan */}
            <div style={{ 
              backgroundColor: 'white', 
              border: '2px solid #e5e7eb', 
              borderRadius: '12px', 
              padding: '30px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Starter</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '15px' }}>Quick Prep Interview</p>
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: '700', color: '#2F6DF6' }}>$12</span>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '20px', lineHeight: '1.6' }}>
                A focused question set with model answers and feedback to sharpen your responses fast.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '25px' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ color: '#00C4CC', marginRight: '10px', fontSize: '1.2rem' }}>●</span>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>Targeted questions based on your résumé & JD</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ color: '#00C4CC', marginRight: '10px', fontSize: '1.2rem' }}>●</span>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>Suggested talking points and improvement tips</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ color: '#00C4CC', marginRight: '10px', fontSize: '1.2rem' }}>●</span>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>Perfect for "I've got an interview tomorrow" panic</span>
                </li>
              </ul>
              <button 
                onClick={handleStarterCheckout}
                style={{
                  width: '100%',
                  backgroundColor: '#2F6DF6',
                  color: 'white',
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Start Quick Prep – $12
              </button>
            </div>

            {/* Full Mock Plan - Most Popular */}
            <div style={{ 
              backgroundColor: 'white', 
              border: '3px solid #2F6DF6', 
              borderRadius: '12px', 
              padding: '30px',
              position: 'relative',
              boxShadow: '0 6px 12px rgba(47,109,246,0.2)',
              transform: 'scale(1.03)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#2F6DF6',
                color: 'white',
                padding: '6px 20px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                Most Popular
              </div>
              <div style={{ textAlign: 'center', marginBottom: '25px', marginTop: '10px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Full Mock Interview (Text)</h3>
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: '700', color: '#2F6DF6' }}>$29</span>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '20px', lineHeight: '1.6' }}>
                A realistic, text-based mock interview with pacing, coaching, and a full improvement report.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '25px' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ color: '#00C4CC', marginRight: '10px', fontSize: '1.2rem' }}>●</span>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>Simulated live interview in chat</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ color: '#00C4CC', marginRight: '10px', fontSize: '1.2rem' }}>●</span>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>Follow-up questions, probes, and clarifiers</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ color: '#00C4CC', marginRight: '10px', fontSize: '1.2rem' }}>●</span>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>Post-interview summary with strengths & gaps</span>
                </li>
              </ul>
              <button 
                onClick={handleFullMockCheckout}
                style={{
                  width: '100%',
                  backgroundColor: '#2F6DF6',
                  color: 'white',
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Book Full Mock – $29
              </button>
            </div>

            {/* Premium Plan */}
            <div style={{ 
              backgroundColor: 'white', 
              border: '2px solid #e5e7eb', 
              borderRadius: '12px', 
              padding: '30px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Premium</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '15px' }}>Premium Audio Mock Interview</p>
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: '700', color: '#2F6DF6' }}>$49</span>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '20px', lineHeight: '1.6' }}>
                A live, audio-mode mock interview with verbal questions, real-time coaching, and a comprehensive report.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '25px' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ color: '#00C4CC', marginRight: '10px', fontSize: '1.2rem' }}>●</span>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>Practice answering out loud under pressure</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ color: '#00C4CC', marginRight: '10px', fontSize: '1.2rem' }}>●</span>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>Coaching on tone, pace, and clarity</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ color: '#00C4CC', marginRight: '10px', fontSize: '1.2rem' }}>●</span>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>Final written recap you can reuse for future prep</span>
                </li>
              </ul>
              <button 
                onClick={handlePremiumCheckout}
                style={{
                  width: '100%',
                  backgroundColor: '#2F6DF6',
                  color: 'white',
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Upgrade to Premium Audio – $49
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              <strong>24-Hour Upgrade Credit:</strong> If you purchase Quick Prep or Full Mock and upgrade within 24 hours, 
              Talendro credits your original purchase toward the higher-level plan.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '60px 20px', background: 'linear-gradient(to bottom, #f9fafb, white)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', marginBottom: '15px', textAlign: 'center' }}>
            How Talendro™ Interview Coach works
          </h2>
          <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '50px', textAlign: 'center', maxWidth: '800px', margin: '0 auto 50px auto' }}>
            We keep it simple: pay securely, receive your access email, and start practicing with a coach that already understands your background and target role.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#2F6DF6',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '0 auto 20px auto'
              }}>1</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                Pick your prep level & pay via Stripe
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                Use the buttons above to choose Quick Prep, Full Mock, or Premium Audio. Payments are processed securely through Stripe. 
                You'll receive a confirmation email within minutes.
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#2F6DF6',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '0 auto 20px auto'
              }}>2</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                Upload résumé, JD, and company URL
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                Your confirmation email includes a link to Talendro™ Interview Coach and clear instructions. Upload your résumé, 
                paste the job description, and provide the company website so the coach can tailor everything to your exact opportunity.
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#2F6DF6',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '0 auto 20px auto'
              }}>3</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                Run your session and review the report
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                Complete your Quick Prep or Mock Interview session, then review your feedback, suggested talking points, and improvement areas. 
                Use the insights to walk into your interview clear, confident, and prepared.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section style={{ padding: '60px 20px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', marginBottom: '40px', textAlign: 'center' }}>
            FAQs & quick notes
          </h2>
          <div style={{ display: 'grid', gap: '25px' }}>
            <div style={{ backgroundColor: '#f9fafb', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '10px' }}>
                How do I access the actual Interview Coach?
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                After payment, Stripe notifies our system and Talendro sends you an email with your unique Interview Coach link 
                and simple "how to start" steps.
              </p>
            </div>
            <div style={{ backgroundColor: '#f9fafb', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '10px' }}>
                Can I upgrade after I purchase?
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                Yes. If you upgrade within 24 hours of your original purchase, Talendro credits what you already paid 
                toward the higher-level plan.
              </p>
            </div>
            <div style={{ backgroundColor: '#f9fafb', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '10px' }}>
                What do I need ready before I start?
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                Have your latest résumé, the full job description, and the target company's website URL. 
                That's all the coach needs to personalize your prep.
              </p>
            </div>
            <div style={{ backgroundColor: '#f9fafb', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '10px' }}>
                Is this part of the full Talendro™ platform?
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                Yes. Talendro™ Interview Coach is one product in the broader Talendro autonomous job search & apply suite, 
                built to help serious job seekers move faster with more confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '60px 20px', backgroundColor: 'white', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', marginBottom: '15px' }}>
            Ready to ace your next interview?
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '30px' }}>
            Get personalized interview prep tailored to your background and target role.
          </p>
          <button 
            onClick={scrollToPricing}
            style={{
              backgroundColor: '#2F6DF6',
              color: 'white',
              padding: '14px 32px',
              fontSize: '1rem',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Choose Your Plan
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#111827', color: 'white', padding: '30px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '8px' }}>
          © {new Date().getFullYear()} Talendro™. All rights reserved.
        </p>
        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          Secure payments processed by Stripe
        </p>
      </footer>
    </div>
  );
};

export default InterviewCoachLanding;
