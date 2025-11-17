export default function Page(){
  return (
    <section>
      <h1 className="h1">Final Review</h1>
      <p className="body mt-2">Review your profile before Talendro™ goes to work.</p>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card"><p className="text-talGray">Summary: Personal</p></div>
        <div className="card"><p className="text-talGray">Summary: Employment</p></div>
        <div className="card"><p className="text-talGray">Summary: Education</p></div>
        <div className="card"><p className="text-talGray">Summary: Preferences</p></div>
      </div>
      <div className="mt-6 flex gap-3">
        <a href="/app/checkout"><button className="btn btn-primary">Approve &amp; Continue to Payment</button></a>
        <button className="btn btn-tertiary">Save &amp; Return Later</button>
      </div>
    </section>
  )
}
