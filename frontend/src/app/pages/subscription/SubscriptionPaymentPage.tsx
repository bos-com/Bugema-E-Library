import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
	CreditCard,
	Smartphone,
	Wallet,
	ArrowRight,
	ArrowLeft,
	Shield,
} from "lucide-react";
import { getPlans } from "../../../lib/api/subscriptions";
import LoadingOverlay from "../../../components/feedback/LoadingOverlay";

const SubscriptionPaymentPage = () => {
	const { planId } = useParams();
	const navigate = useNavigate();

	// Fetch plan details to show amount
	const {
		data: plans,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["subscription-plans"],
		queryFn: getPlans,
	});

	// Ensure plans is always an array
	const plansArray = Array.isArray(plans) ? plans : [];
	const plan = plansArray.find((p) => p.id === Number(planId));

	const methods = [
		{
			id: "mobile-money",
			name: "Mobile Money",
			subtitle: "MTN MoMo or Airtel Money",
			icon: Smartphone,
			color: "text-yellow-600",
			bg: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-500/10 dark:to-orange-500/10",
			border: "border-yellow-200 dark:border-yellow-500/30",
			route: `/subscription/payment/${planId}/mobile-money`,
		},
		{
			id: "card",
			name: "Card Payment",
			subtitle: "Visa or MasterCard",
			icon: CreditCard,
			color: "text-blue-600",
			bg: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10",
			border: "border-blue-200 dark:border-blue-500/30",
			route: `/subscription/payment/${planId}/card`,
		},
		{
			id: "paypal",
			name: "PayPal",
			subtitle: "Pay with PayPal account",
			icon: Wallet,
			color: "text-sky-600",
			bg: "bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-500/10 dark:to-cyan-500/10",
			border: "border-sky-200 dark:border-sky-500/30",
			route: `/subscription/payment/${planId}/paypal`,
		},
	];

	if (isLoading) {
		return <LoadingOverlay label="Loading payment options" />;
	}

	if (isError || !plan) {
		return (
			<div className="mx-auto max-w-lg space-y-6 py-8 animate-in">
				<div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
					<div className="rounded-full bg-rose-100 p-6 dark:bg-rose-500/10">
						<Shield className="h-16 w-16 text-rose-600 dark:text-rose-400" />
					</div>
					<div>
						<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
							Plan Not Found
						</h2>
						<p className="mt-2 text-slate-600 dark:text-slate-400">
							{isError
								? "Failed to load subscription plans. Please try again."
								: "The selected plan could not be found."}
						</p>
					</div>
					<Link to="/subscription/plans" className="btn-primary">
						<ArrowLeft className="h-5 w-5" />
						Back to Plans
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-lg space-y-6 py-8 animate-in">
			{/* Back link */}
			<Link
				to="/subscription/plans"
				className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-400"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to plans
			</Link>

			{/* Header */}
			<div className="text-center">
				<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600">
					<Shield className="h-7 w-7 text-white" />
				</div>
				<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
					Secure Payment
				</h1>
				<p className="mt-2 text-slate-600 dark:text-slate-400">
					Choose your preferred payment method
				</p>
			</div>

			{/* Plan Summary */}
			<div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-800">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Selected Plan
						</p>
						<p className="font-semibold text-slate-900 dark:text-white">
							{plan?.name || "Subscription Plan"}
						</p>
					</div>
					<div className="text-right">
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Amount
						</p>
						<p className="text-lg font-bold text-brand-600 dark:text-brand-400">
							UGX{" "}
							{plan ? Number(plan.price).toLocaleString() : "---"}
						</p>
					</div>
				</div>
			</div>

			{/* Payment Methods */}
			<div className="space-y-3">
				<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
					Select Payment Method
				</p>
				{methods.map((method) => (
					<button
						key={method.id}
						onClick={() => navigate(method.route)}
						className={`flex w-full items-center gap-4 rounded-xl border ${method.border} ${method.bg} p-4 transition-all hover:scale-[1.01] hover:shadow-md`}
					>
						<div
							className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800 ${method.color}`}
						>
							<method.icon size={24} />
						</div>
						<div className="flex-1 text-left">
							<p className="font-semibold text-slate-900 dark:text-white">
								{method.name}
							</p>
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{method.subtitle}
							</p>
						</div>
						<ArrowRight className="h-5 w-5 text-slate-400" />
					</button>
				))}
			</div>

			{/* Security badges */}
			<div className="flex items-center justify-center gap-4 pt-4 text-xs text-slate-500 dark:text-slate-400">
				<span className="flex items-center gap-1">
					<Shield className="h-3 w-3" />
					Secure Payment
				</span>
				<span>•</span>
				<span>256-bit SSL</span>
				<span>•</span>
				<span>Instant Access</span>
			</div>
		</div>
	);
};

export default SubscriptionPaymentPage;
