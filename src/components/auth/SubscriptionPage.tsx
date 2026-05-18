import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Shield, Star, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  highlight: boolean;
  badge?: string;
  features: string[];
  prices: { [days: number]: number }; // in paise
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    icon: <Zap className="w-6 h-6" />,
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-600/5',
    highlight: false,
    features: [
      'Up to 30 rooms',
      'QR Code Generation',
      'Guest Request Management',
      'Food & Room Service Menu',
      'Real-time Notifications',
      'Email Support',
    ],
    prices: { 30: 29900, 90: 79900, 180: 149900 },
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: <Star className="w-6 h-6" />,
    color: 'text-purple-400',
    gradient: 'from-purple-500/30 to-indigo-600/10',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Up to 100 rooms',
      'Everything in Basic',
      'Google Reviews Integration',
      'AI-Powered Reply Generation',
      'Complaint Management',
      'Priority Support',
      'Analytics Dashboard',
    ],
    prices: { 30: 49900, 90: 129900, 180: 239900 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: <Shield className="w-6 h-6" />,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-teal-600/5',
    highlight: false,
    features: [
      'Unlimited rooms',
      'Everything in Pro',
      'Custom Branding',
      'Dedicated Account Manager',
      'SLA Guarantee',
      '24/7 Phone Support',
      'Custom Integrations',
      'White-label Option',
    ],
    prices: { 30: 99900, 90: 249900, 180: 449900 },
  },
];

const DURATIONS = [
  { days: 30, label: '1 Month', discount: null },
  { days: 90, label: '3 Months', discount: '10% off' },
  { days: 180, label: '6 Months', discount: '20% off' },
];

const formatAmount = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const SubscriptionPage: React.FC = () => {
  const { user, hotel, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    setLoadingPlan(plan.id);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please check your connection.');
        return;
      }

      const amount = plan.prices[selectedDuration];
      const { order, key } = await apiClient.createPaymentOrder(plan.id, selectedDuration);

      const options = {
        key,
        amount: order.amount,
        currency: 'INR',
        name: 'ProfitLabs',
        description: `${plan.name} Plan — ${DURATIONS.find(d => d.days === selectedDuration)?.label}`,
        image: '/logo.png',
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await apiClient.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan.id,
              duration: selectedDuration,
              amount,
            });

            // Sync localStorage so AuthContext re-hydrates with Active subscription
            const stored = localStorage.getItem('userData');
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.subscriptionActive = 'Active';
              localStorage.setItem('userData', JSON.stringify(parsed));
            }

            toast.success('🎉 Subscription activated! Redirecting to dashboard...');

            // Hard redirect — forces AuthContext to re-read localStorage
            // This avoids the React state timing race where SubscribedRoute
            // still sees 'Inactive' before context re-renders
            setTimeout(() => {
              window.location.href = '/admin';
            }, 1200);
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed.');
            setLoadingPlan(null);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        notes: {
          plan: plan.id,
          duration: String(selectedDuration),
          userId: user?._id || '',
        },
        theme: { color: '#7c3aed' },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setLoadingPlan(null);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate payment.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-950 to-gray-950 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="ProfitLabs" className="h-9 w-auto" />
          <span className="text-lg font-bold text-white">ProfitLabs</span>
        </div>
        <div className="flex items-center gap-4">
          {hotel && (
            <span className="text-sm text-gray-400">
              Signed in as <span className="text-white font-medium">{user?.name}</span> · {hotel.name}
            </span>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Hero text */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-4 h-4" />
            Choose your plan to unlock ProfitLabs
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Simple, transparent{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              pricing
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Activate your subscription to access the full dashboard and start managing your hotel smarter.
          </p>
        </div>

        {/* Duration toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            {DURATIONS.map((d) => (
              <button
                key={d.days}
                onClick={() => setSelectedDuration(d.days)}
                className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedDuration === d.days
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {d.label}
                {d.discount && (
                  <span className="ml-2 text-xs text-emerald-400 font-semibold">{d.discount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const amount = plan.prices[selectedDuration];
            const isLoading = loadingPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-7 flex flex-col transition-all duration-300 ${
                  plan.highlight
                    ? 'border-purple-500/60 bg-gradient-to-b from-purple-900/30 to-gray-900 shadow-xl shadow-purple-900/20 scale-[1.02]'
                    : 'border-white/10 bg-gray-900/60 hover:border-white/20'
                }`}
              >
                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    {plan.badge}
                  </div>
                )}

                {/* Plan header */}
                <div className={`inline-flex items-center gap-2.5 mb-5 ${plan.color}`}>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${plan.gradient}`}>
                    {plan.icon}
                  </div>
                  <span className="text-lg font-bold text-white">{plan.name}</span>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">{formatAmount(amount)}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    for {DURATIONS.find((d) => d.days === selectedDuration)?.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    ≈ {formatAmount(Math.round(amount / (selectedDuration / 30)))} / month
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.color}`} />
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isLoading || !!loadingPlan}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Get ${plan.name}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-600 text-sm mt-10">
          Payments secured by Razorpay · All prices are inclusive of GST · Cancel anytime
        </p>
      </main>
    </div>
  );
};

export default SubscriptionPage;
