import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
  const [billing, setBilling] = useState("monthly");
  const navigate = useNavigate();

  const plans = {
    starter: {
      name: "Starter",
      price: { monthly: 39, annual: 31 },
      description: "For anyone ready to put their job search on autopilot.",
      features: [
        "AI searches for matching jobs every 4 hours",
        "Up to 50 AI-submitted applications/month",
        "AI resume build, update, or optimize → ATS plain text output",
        "AI Quick Prep report — questions, talking points & company brief",
        "75%+ match threshold — only quality-matched jobs",
        "Applications audit trail dashboard",
        "Email notifications on every submission",
      ],
      popular: false,
    },
    pro: {
      name: "Pro",
      price: { monthly: 99, annual: 79 },
      description: "For serious job seekers who want maximum reach and speed.",
      features: [
        "Everything in Starter, plus:",
        "AI searches for matching jobs every 60 minutes",
        "Up to 200 AI-submitted applications/month",
        "AI resume build, update, or optimize → plain text + HTML formatted resume",
        "AI-conducted Full Mock Interview — real-time chat coaching & scoring",
        "AI-conducted Full Mock salary negotiation role-play",
        "Priority application submission queue",
      ],
      popular: true,
    },
    concierge: {
      name: "Concierge",
      price: { monthly: 249, annual: 199 },
      description: "Full-service autonomous career advancement.",
      features: [
        "Everything in Pro, plus:",
        "AI searches for matching jobs every 30 minutes",
        "Unlimited AI-submitted applications",
        "AI resume build, update, or optimize → plain text + HTML resume + LinkedIn profile update",
        "AI-conducted live voice Mock Interview — real-time spoken coaching & debrief",
        "AI-conducted live voice Mock salary negotiation role-play",
        "Weekly AI career strategy session",
      ],
      popular: false,
    },
  };

  const getPrice = (planKey) => {
    return billing === "monthly" ? plans[planKey].price.monthly : plans[planKey].price.annual;
  };

  const calculateSavings = (planKey) => {
    return (plans[planKey].price.monthly - plans[planKey].price.annual) * 12;
  };

  const handleSelectPlan = (planKey) => {
    const selection = { plan: planKey, billing, price: getPrice(planKey) };
    localStorage.setItem("selectedPlan", JSON.stringify(selection));
    navigate(`/app/checkout?plan=${planKey}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white pt-20 pb-32">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight">
            Your Job Search, Automated.
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
            While you live your life, our AI searches every employer, scores every job, and applies to every qualifying role on your behalf — automatically, around the clock.
          </p>
          <div className="flex gap-4 justify-center mt-10">
            <a href="#pricing">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-lg text-lg transition-transform transform hover:scale-105">
                Start My Autonomous Search
              </button>
            </a>
          </div>
          <p className="text-sm text-slate-400 mt-6">
            7-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">The Job Search is Broken.</h2>
          <p className="text-lg text-slate-600">
            The average job seeker spends 11 hours a week applying for jobs. Most of that time is wasted on roles that are not a real fit, using a resume that will be filtered out by software before a human ever sees it. It is a demoralizing, inefficient, full-time job in itself.
          </p>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Talendro is Not Another Job Board.</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              It is a service that works for you. We built the system we wished we had — your own Autonomous Search and Apply Navigator (ASAN) that handles the entire top of the funnel so you can focus on what matters: interviewing.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl mb-6">🧠</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">1. We Learn Who You Are</h3>
              <p className="text-slate-600">
                You complete a 10-minute profile, upload your resume, and tell us your exact criteria — target titles, locations, salary, skills, and more. We do the rest.
              </p>
            </div>
            <div>
              <div className="text-5xl mb-6">🎯</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">2. We Search Everywhere</h3>
              <p className="text-slate-600">
                ASAN monitors 175,000+ employer career sites and all major job aggregators 24/7, finding new roles within minutes of being posted.
              </p>
            </div>
            <div>
              <div className="text-5xl mb-6">🚀</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">3. We Apply For You</h3>
              <p className="text-slate-600">
                When a job scores a 75%+ match, ASAN automatically tailors your resume and submits the application on your behalf. You wake up to a dashboard of jobs already applied for.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Quote Section */}
      <section className="py-24 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            "While you are living your life, we are building your career."
          </h2>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Choose Your Plan</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Every plan includes 24/7 job search, AI resume tailoring, and autonomous application submission. Choose the level of reach and support that fits your search.
            </p>
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className={billing === "monthly" ? "text-blue-600 font-semibold" : "text-slate-500"}>Monthly</span>
              <button
                onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
                className={`w-14 h-8 rounded-full border-none cursor-pointer relative transition-colors outline-none ${billing === "annual" ? "bg-blue-600" : "bg-slate-300"}`}
                aria-label="Toggle billing period"
              >
                <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${billing === "monthly" ? "left-1" : "left-7"}`} />
              </button>
              <span className={billing === "annual" ? "text-blue-600 font-semibold" : "text-slate-500"}>Annual</span>
              {billing === "annual" && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold ml-2">Save up to ${calculateSavings("concierge")}/year</span>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {Object.entries(plans).map(([key, plan]) => {
              const price = getPrice(key);
              const savings = calculateSavings(key);
              const isPopular = plan.popular;
              return (
                <div
                  key={key}
                  className={`bg-white rounded-2xl p-8 flex flex-col relative ${
                    isPopular
                      ? "border-2 border-blue-600 shadow-2xl scale-105"
                      : "border border-slate-200 shadow-md"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                      Most Popular
                    </div>
                  )}
                  <h3 className={`text-2xl font-bold mb-2 ${isPopular ? "text-blue-600" : "text-slate-800"}`}>
                    {plan.name}
                  </h3>
                  <div className="mb-2">
                    <span className={`text-4xl font-extrabold ${isPopular ? "text-blue-600" : "text-slate-900"}`}>${price}</span>
                    <span className="text-slate-500 ml-1">/month</span>
                    {billing === "annual" && <span className="text-slate-400 text-sm block">billed annually</span>}
                  </div>
                  {billing === "annual" && savings > 0 && (
                    <p className="text-green-600 text-sm font-semibold mb-3">Save ${savings}/year</p>
                  )}
                  <p className="text-slate-600 text-sm mb-6">{plan.description}</p>
                  <ul className="list-none p-0 m-0 mb-8 flex-1 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <span className="text-sm text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSelectPlan(key)}
                    className={`w-full font-bold py-3 px-6 rounded-lg text-base transition-transform transform hover:scale-105 ${
                      isPopular
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              );
            })}
          </div>

          {/* Trust Signals */}
          <div className="text-center mt-16">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-slate-500 text-sm">
              <span>✓ 7-day money-back guarantee</span>
              <span>✓ Cancel anytime</span>
              <span>✓ No hidden fees or contracts</span>
              <span>✓ Secure payments via Stripe</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
