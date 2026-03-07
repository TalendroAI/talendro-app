export default function Page(){
  return (
    <section>
      <h1 className="h1">Success — You're All Set!</h1>
      <p className="body mt-2">Thank you for subscribing to Talendro™. Your ASAN is now active and will begin searching for jobs on your behalf.</p>
      <div className="mt-6 flex gap-3">
        <a href="/app/dashboard"><button className="btn btn-primary">Go to Dashboard</button></a>
        <a href="/app/agents"><button className="btn btn-secondary">Build a Search Agent</button></a>
      </div>
    </section>
  )
}
