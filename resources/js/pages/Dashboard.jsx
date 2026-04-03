import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
    getAdminDashboard,
    getCreatorDashboard,
    getCreatorEarnings,
    getCreatorMonetizationSummary,
} from "../services/dashboardService";
import {
    getNusaKoinTransactions,
    getSubscriptionPlans,
    getWalletSummary,
} from "../services/subscriptionService";

function StatCard({ label, value }) {
    return (
        <div
            className="rounded-3xl p-5 border"
            style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}
        >
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#8A7B5A" }}>
                {label}
            </p>
            <p className="text-3xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                {value}
            </p>
        </div>
    );
}

export default function Dashboard() {
    const { user, logout } = useAuth();
    const isAdmin = user.role === "admin";
    const isCreator = user.role === "kreator";
    const [dashboard, setDashboard] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [plans, setPlans] = useState([]);
    const [earnings, setEarnings] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let ignore = false;

        async function loadDashboard() {
            try {
                const walletSummary = await getWalletSummary();
                const availablePlans = await getSubscriptionPlans();
                const koinTransactions = await getNusaKoinTransactions({ per_page: 5 });

                if (!ignore) {
                    setWallet(walletSummary);
                    setPlans(availablePlans);
                    setTransactions(koinTransactions.data ?? []);
                }

                if (isAdmin) {
                    const adminDashboard = await getAdminDashboard();
                    if (!ignore) {
                        setDashboard(adminDashboard);
                    }
                    return;
                }

                if (!isCreator) {
                    if (!ignore) {
                        setDashboard({
                            available_plans: availablePlans.length,
                            recent_transactions: koinTransactions.data?.length ?? 0,
                        });
                    }
                    return;
                }

                const [creatorDashboard, monetizationSummary, earningsData] = await Promise.all([
                    getCreatorDashboard(),
                    getCreatorMonetizationSummary(),
                    getCreatorEarnings({ per_page: 5 }),
                ]);

                if (!ignore) {
                    setDashboard(creatorDashboard);
                    setEarnings(monetizationSummary);
                    setTransactions((earningsData.data ?? []).concat(koinTransactions.data ?? []).slice(0, 5));
                }
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(
                        error.response?.data?.message || "Failed to load dashboard data."
                    );
                }
            }
        }

        loadDashboard();

        return () => {
            ignore = true;
        };
    }, [isAdmin, isCreator]);

    return (
        <div className="min-h-screen px-6 py-6" style={{ backgroundColor: "#F5F0E0" }}>
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-sm mb-1" style={{ color: "#8A7B5A" }}>
                            Signed in as {user.name} ({user.role})
                        </p>
                        <h1
                            className="text-4xl font-bold"
                            style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}
                        >
                            NusaTales Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/account"
                            className="px-5 py-3 rounded-full text-sm font-semibold"
                            style={{ backgroundColor: "#E9D9AE", color: "#5C4B2D" }}
                        >
                            Account Hub
                        </Link>
                        {user.role === "admin" ? (
                            <Link
                                to="/admin/studio"
                                className="px-5 py-3 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: "#8DC63F", color: "#FFFFFF" }}
                            >
                                Admin Studio
                            </Link>
                        ) : user.role === "kreator" ? (
                            <Link
                                to="/creator/studio"
                                className="px-5 py-3 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: "#8DC63F", color: "#FFFFFF" }}
                            >
                                Creator Studio
                            </Link>
                        ) : null}
                        <Link
                            to="/"
                            className="px-5 py-3 rounded-full text-sm font-semibold"
                            style={{ backgroundColor: "#EDE2BF", color: "#5C4B2D" }}
                        >
                            Back to Home
                        </Link>
                        <button
                            onClick={logout}
                            className="px-5 py-3 rounded-full text-sm font-semibold text-white"
                            style={{ backgroundColor: "#3B2A0E" }}
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {errorMessage ? (
                    <div
                        className="rounded-3xl px-5 py-4 mb-6 text-sm"
                        style={{ backgroundColor: "#FFF1EB", color: "#A63B1F" }}
                    >
                        {errorMessage}
                    </div>
                ) : null}

                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="NusaKoin" value={wallet?.total_point ?? 0} />
                    <StatCard label="Unread Notifications" value={wallet?.unread_notifications ?? 0} />
                    <StatCard
                        label={isAdmin ? "Total Users" : isCreator ? "Total Videos" : "Subscriptions"}
                        value={
                            isAdmin
                                ? dashboard?.total_users ?? 0
                                : isCreator
                                    ? dashboard?.total_videos ?? 0
                                    : plans.length
                        }
                    />
                    <StatCard
                        label={isAdmin ? "Published Videos" : isCreator ? "Published" : "Transactions"}
                        value={isAdmin || isCreator ? dashboard?.published_videos ?? 0 : transactions.length}
                    />
                </div>

                {isAdmin ? (
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        <StatCard label="Ads" value={dashboard?.total_ads ?? 0} />
                        <StatCard label="Plans" value={dashboard?.total_subscription_plans ?? 0} />
                        <StatCard label="Daily Missions" value={dashboard?.total_daily_missions ?? 0} />
                    </div>
                ) : isCreator ? (
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        <StatCard label="Draft Videos" value={dashboard?.draft_videos ?? 0} />
                        <StatCard label="Rejected Videos" value={dashboard?.rejected_videos ?? 0} />
                        <StatCard label="Total Earnings" value={earnings?.total_earnings ?? 0} />
                    </div>
                ) : null}

                <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6">
                    <section
                        className="rounded-3xl p-6 border"
                        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}
                    >
                        <h2
                            className="text-2xl font-bold mb-4"
                            style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}
                        >
                            {isAdmin ? "Operations Snapshot" : isCreator ? "Creator Snapshot" : "Account Snapshot"}
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            {Object.entries(dashboard ?? {}).map(([key, value]) => (
                                <div key={key} className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#F8F2E4" }}>
                                    <p style={{ color: "#8A7B5A" }}>{key.replaceAll("_", " ")}</p>
                                    <p className="font-semibold mt-1" style={{ color: "#3B2A0E" }}>
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section
                        className="rounded-3xl p-6 border"
                        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}
                    >
                        <h2
                            className="text-2xl font-bold mb-4"
                            style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}
                        >
                            Available Plans
                        </h2>
                        <div className="space-y-3">
                            {plans.map((plan) => (
                                <div key={plan.id} className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#F8F2E4" }}>
                                    <p className="font-semibold" style={{ color: "#3B2A0E" }}>
                                        {plan.name}
                                    </p>
                                    <p className="text-sm" style={{ color: "#6B5A3E" }}>
                                        {plan.description || "Subscription access plan"}
                                    </p>
                                    <p className="text-sm mt-2" style={{ color: "#8A7B5A" }}>
                                        {plan.price} NusaKoin / {plan.duration_days} days
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <section
                    className="rounded-3xl p-6 border mt-6"
                    style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}
                >
                    <h2
                        className="text-2xl font-bold mb-4"
                        style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}
                    >
                        Recent Activity
                    </h2>
                    <div className="space-y-3">
                        {transactions.length === 0 ? (
                            <p className="text-sm" style={{ color: "#8A7B5A" }}>
                                No recent transactions yet.
                            </p>
                        ) : (
                            transactions.map((item, index) => (
                                <div
                                    key={`${item.id ?? item.source ?? "entry"}-${index}`}
                                    className="rounded-2xl px-4 py-3 flex items-center justify-between gap-4"
                                    style={{ backgroundColor: "#F8F2E4" }}
                                >
                                    <div>
                                        <p className="font-semibold" style={{ color: "#3B2A0E" }}>
                                            {item.source || item.video?.title || "Activity"}
                                        </p>
                                        <p className="text-sm" style={{ color: "#8A7B5A" }}>
                                            {item.notes || item.date || item.created_at || "Recorded activity"}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold" style={{ color: "#6B5A3E" }}>
                                        {item.amount ?? item.video?.title ?? "View"}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
