export default function Page() {
  return (
    <section>
      <h1 className="text-4xl font-bold text-slate-800">You Made the Right Choice.</h1>
      <p className=\'text-lg text-slate-600 mt-2\'>Welcome to your new reality — a job search that runs itself.</p>
      
      <div className="mt-8 space-y-6">
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">What Happens Now?</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center font-bold text-sm rounded-full flex-shrink-0">1</div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">You Build Your Profile (10 minutes)</h4>
                <p className="text-slate-600 text-sm">We will guide you through a comprehensive but quick profile setup. This is the one and only time you will ever have to provide this information. This data is the fuel for your autonomous job search engine.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center font-bold text-sm rounded-full flex-shrink-0">2</div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">ASAN Takes Over</h4>
                <p className="text-slate-600 text-sm">Your Autonomous Search and Apply Navigator (ASAN) activates. It begins scanning 175,000+ employer sites 24/7, scoring every job against your profile, and identifying every role that exceeds a 75% match.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center font-bold text-sm rounded-full flex-shrink-0">3</div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">You Wake Up to Applications Already Submitted</h4>
                <p className="text-slate-600 text-sm">ASAN automatically applies to every matched role on your behalf. You will receive email notifications and can view a full audit trail in your dashboard. Your only job is to prepare for the interviews.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
          <h3 className="text-2xl font-bold text-blue-800 mb-2">This is Unlike Anything You Have Ever Seen.</h3>
          <p className="text-blue-700">This is not a job board. It is not a tool. It is a service that works for you while you live your life. Let us get your profile built so we can begin.</p>
        </div>
      </div>
      
      <div className=\'mt-8 flex justify-center\'>
        <a href=\'/app/onboarding/step-1\'>
          <button className=\'bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-lg text-lg transition-transform transform hover:scale-105\'>
            Let\'s Build My Profile
          </button>
        </a>
      </div>
    </section>
  )
}
