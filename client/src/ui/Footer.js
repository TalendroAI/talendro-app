import { Link } from 'react-router-dom'
import TrustBadge from './TrustBadge'

export default function Footer(){
  return (
    <footer className="mt-16 bg-gray-900">
      <div className="container py-10 text-center">
        <div className="mb-6">
          <p className="font-mont font-bold text-xl text-talBlue mb-2">Talendro™</p>
          <p className="text-white font-medium">Precision Matches. Faster Results.</p>
        </div>
        <div className="flex justify-center gap-6 flex-wrap font-medium">
          <Link to="/how-it-works" className="text-white hover:text-talAqua transition">How It Works</Link>
          <Link to="/services" className="text-white hover:text-talAqua transition">Services</Link>
          <Link to="/pricing" className="text-white hover:text-talAqua transition">Pricing</Link>
          <Link to="/about" className="text-white hover:text-talAqua transition">About</Link>
          <Link to="/resources/faq" className="text-white hover:text-talAqua transition">FAQ</Link>
          <Link to="/contact" className="text-white hover:text-talAqua transition">Contact</Link>
          <Link to="/veterans" className="text-white hover:text-talAqua transition">Veterans Program</Link>
          <Link to="/security" className="text-white hover:text-talAqua transition">Security</Link>
          <Link to="/privacy" className="text-white hover:text-talAqua transition">Privacy</Link>
          <Link to="/terms" className="text-white hover:text-talAqua transition">Terms</Link>
        </div>
      </div>
      <TrustBadge />
      <div className="pb-8" />
    </footer>
  )
}
