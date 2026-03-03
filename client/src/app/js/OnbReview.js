export default function OnbReview() {
  const handleComplete = () => {
    sessionStorage.setItem('onboardingComplete', 'true')
    window.location.href = '/app/dashboard'
  }

  return (
    <section>
      <h1 className="h1">Profile Complete</h1>
      <p className="body mt-2">Review your profile before Talendro™ goes to work.</p>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card"><p className="text-talGray">Summary: Personal</p></div>
        <div className="card"><p className="text-talGray">Summary: Employment</p></div>
        <div className="card"><p className="text-talGray">Summary: Education</p></div>
        <div className="card"><p className="text-talGray">Summary: Preferences</p></div>
      </div>
      <div className="mt-6 flex gap-3">
        <button className="btn btn-primary" onClick={handleComplete}>
          Launch My Dashboard →
        </button>
        <a href="/app/onboarding/step-5">
          <button className="btn btn-tertiary">← Go Back</button>
        </a>
      </div>
    </section>
  )
}
