import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
  const [billing, setBilling] = useState("monthly");
  const navigate = useNavigate();

  const plans = {
    concierge: {
      name: "ASAN Concierge",
      price: { monthly: 99, annual: 990 },
      description: "The complete white-glove, fully autonomous job search experience.",
      features: [
        "Autonomous job search & application submission",
        "AI-powered resume optimization & tailoring",
        "175,000+ employer career sites searched 24/7",
        "75%+ match threshold enforcement",
        "Real-time application tracking dashboard",
        "Dedicated email & chat support",
      ],
      popular: true,
    },
  };

  const getPrice = (planKey) => {
    return billing === "monthly" ? plans[planKey].price.monthly : Math.round(plans[planKey].price.annual / 12);
  };

  const calculateSavings = (planKey) => {
    return plans[planKey].price.monthly * 12 - plans[planKey].price.annual;
  };

  const handleSelectPlan = (planKey) => {
    const selection = { ...plans[planKey], billing, price: getPrice(planKey) };
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
            “While you were living your life, we were building your career.”
          </h2>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Simple, All-Inclusive Pricing</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              One plan. Every feature. Your entire job search, fully automated.
            </p>
          </div>
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-8 border-2 border-blue-600">
            <h3 className="text-3xl font-bold text-blue-600 mb-2">ASAN Concierge</h3>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-slate-900">$99</span>
              <span className="text-xl text-slate-500 ml-2">/month</span>
            </div>
            <p className="text-slate-600 mb-8">The complete white-glove, fully autonomous job search experience. Everything you need to land your next role, without the manual work.</p>
            <ul className="list-none p-0 m-0 mb-10 space-y-4">
              {plans.concierge.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectPlan("concierge")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">
              Get Started Now
            </button>
          </div>
          <div className="text-center mt-12">
            <h3 className="text-xl font-semibold text-slate-700 mb-4">All Plans Include Our Ironclad Guarantee</h3>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-slate-600">
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
