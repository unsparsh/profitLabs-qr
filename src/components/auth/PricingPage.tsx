import React from 'react';

interface Plan {
  name: string;
  price: number;
  months: number;
  style: string;
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Basic',
    price: 29,
    months: 1,
    style: 'bg-white text-gray-800/80',
  },
  {
    name: 'Pro',
    price: 79,
    months: 3,
    style: 'bg-indigo-500 text-white relative',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    months: 6,
    style: 'bg-white text-gray-800/80',
  },
];

const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="flex flex-wrap items-center justify-center gap-6">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`w-72 border border-gray-500/30 p-6 ${
              plan.name === 'Basic' ? 'pb-16' : plan.name === 'Pro' ? 'pb-14' : ''
            } rounded-lg text-center ${plan.style} relative`}
          >
            {plan.highlight && (
              <p className="absolute px-3 text-sm -top-3.5 left-3.5 py-1 bg-[#8789FB] rounded-full">
                Most Popular
              </p>
            )}
            <p className="font-semibold pt-2">{plan.name}</p>
            <h1 className="text-3xl font-semibold">
              ₹{plan.price}
              <span
                className={`text-sm font-normal ml-1 ${
                  plan.highlight ? 'text-white/80' : 'text-gray-500'
                }`}
              >
                for {plan.months} {plan.months === 1 ? 'month' : 'months'}
              </span>
            </h1>

            <button
              type="button"
              className={`text-sm w-full py-2 rounded font-medium mt-7 transition-all ${
                plan.highlight
                  ? 'bg-white text-indigo-500 hover:bg-gray-200'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
