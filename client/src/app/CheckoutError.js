export default function Page(){
  return (
    <section>
      <h1 className="h1">Payment Issue — Let’s Try Again</h1>
      <p className="body mt-2">We couldn’t complete your purchase. Check card details or try another method.</p>
      <div className="mt-6 flex gap-3">
        <a href="/app/checkout"><button className="btn btn-primary">Retry Payment</button></a>
        <a href="/contact"><button className="btn btn-secondary">Contact Support</button></a>
      </div>
    </section>
  )
}
