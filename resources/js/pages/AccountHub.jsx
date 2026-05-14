import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppNavbar from "../navbar/AppNavbar.jsx";
import { useAuth } from "../contexts/AuthContext";
import { getMissions, getNotifications, getWatchHistory, updateNotificationStatus } from "../services/communityService";
import { getNusaKoinTransactions, getSubscriptions, getWalletSummary, subscribe, getSubscriptionPlans } from "../services/subscriptionService";

export default function AccountHub() {
    const { user, updateProfile } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [missions, setMissions] = useState([]);
    const [history, setHistory] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [plans, setPlans] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        nama: user?.name ?? "",
        email: user?.email ?? "",
        current_password: "",
        password: "",
        password_confirmation: "",
        foto_profil: null,
    });

    useEffect(() => {
        setProfileForm((previous) => ({
            ...previous,
            nama: user?.name ?? "",
            email: user?.email ?? "",
        }));
    }, [user]);

    useEffect(() => {
        let ignore = false;

        async function loadAccountHub() {
            try {
                const [
                    notificationResponse,
                    missionResponse,
                    historyResponse,
                    walletSummary,
                    planList,
                    subscriptionResponse,
                    transactionResponse,
                ] = await Promise.all([
                    getNotifications({ per_page: 10 }),
                    getMissions({ per_page: 10 }),
                    getWatchHistory({ per_page: 10 }),
                    getWalletSummary(),
                    getSubscriptionPlans(),
                    getSubscriptions({ per_page: 10 }),
                    getNusaKoinTransactions({ per_page: 10 }),
                ]);

                if (!ignore) {
                    setNotifications(notificationResponse.data ?? []);
                    setMissions(missionResponse.data ?? []);
                    setHistory(historyResponse.items ?? []);
                    setWallet(walletSummary);
                    setPlans(planList);
                    setSubscriptions(subscriptionResponse.data ?? []);
                    setTransactions(transactionResponse.data ?? []);
                }
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(error.response?.data?.message || "Failed to load account hub.");
                }
            }
        }

        loadAccountHub();

        return () => {
            ignore = true;
        };
    }, []);

    function updateProfileField(key, value) {
        setProfileForm((previous) => ({
            ...previous,
            [key]: value,
        }));
    }

    async function handleProfileSubmit(event) {
        event.preventDefault();
        setMessage("");
        setErrorMessage("");
        setIsSavingProfile(true);

        try {
            await updateProfile(profileForm);
            setProfileForm((previous) => ({
                ...previous,
                current_password: "",
                password: "",
                password_confirmation: "",
                foto_profil: null,
            }));
            setMessage("Profile updated successfully.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to update profile.");
        } finally {
            setIsSavingProfile(false);
        }
    }

    async function markAsRead(id) {
        try {
            const updated = await updateNotificationStatus(id, "read");
            setNotifications((previous) => previous.map((item) => (item.id === id ? updated : item)));
            setMessage("Notification marked as read.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to update notification.");
        }
    }

    async function handleSubscribe(planId) {
        try {
            const created = await subscribe(planId);
            setSubscriptions((previous) => [created, ...previous]);
            setMessage("Subscription activated successfully.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to subscribe.");
        }
    }

    return (
        <div className="min-h-screen pb-6" style={{ backgroundColor: "#F5F0E0" }}>
            <AppNavbar current="account" />
            <div className="px-6 py-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-sm mb-1" style={{ color: "#8A7B5A" }}>Community and wallet</p>
                        <h1 className="text-4xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                            Account Hub
                        </h1>
                    </div>
                    <Link to="/dashboard" className="px-5 py-3 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: "#3B2A0E" }}>
                        Back to Dashboard
                    </Link>
                </div>

                {message ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EEF7E3", color: "#4B6E17" }}>{message}</div> : null}
                {errorMessage ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FFF1EB", color: "#A63B1F" }}>{errorMessage}</div> : null}

                <section className="rounded-3xl p-6 border mb-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                        <div>
                            <p className="text-sm mb-1" style={{ color: "#8A7B5A" }}>Profile pengguna</p>
                            <h2 className="text-2xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                                {user?.name ?? "NusaTales User"}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-full overflow-hidden border flex items-center justify-center" style={{ backgroundColor: "#F7F3EA", borderColor: "#E8DFC7" }}>
                                {user?.profile_photo ? (
                                    <img src={user.profile_photo} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold" style={{ color: "#8A7B5A" }}>{(user?.name ?? "N").slice(0, 1)}</span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: "#3B2A0E" }}>{user?.email}</p>
                                <p className="text-xs uppercase mt-1" style={{ color: "#8A7B5A" }}>{user?.role}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="grid lg:grid-cols-2 gap-4">
                        <input value={profileForm.nama} onChange={(event) => updateProfileField("nama", event.target.value)} placeholder="Nama pengguna" className="w-full px-5 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA", color: "#3B2A0E" }} required />
                        <input type="email" value={profileForm.email} onChange={(event) => updateProfileField("email", event.target.value)} placeholder="Email" autoComplete="email" className="w-full px-5 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA", color: "#3B2A0E" }} required />
                        <input type="password" value={profileForm.current_password} onChange={(event) => updateProfileField("current_password", event.target.value)} placeholder="Password saat ini" autoComplete="current-password" className="w-full px-5 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA", color: "#3B2A0E" }} />
                        <input type="password" value={profileForm.password} onChange={(event) => updateProfileField("password", event.target.value)} placeholder="Password baru" autoComplete="new-password" className="w-full px-5 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA", color: "#3B2A0E" }} />
                        <input type="password" value={profileForm.password_confirmation} onChange={(event) => updateProfileField("password_confirmation", event.target.value)} placeholder="Konfirmasi password baru" autoComplete="new-password" className="w-full px-5 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA", color: "#3B2A0E" }} />
                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => updateProfileField("foto_profil", event.target.files?.[0] ?? null)} className="w-full px-5 py-4 rounded-2xl outline-none text-sm" style={{ backgroundColor: "#F7F3EA", color: "#3B2A0E" }} />
                        <button type="submit" disabled={isSavingProfile} className="lg:col-span-2 py-4 rounded-2xl text-white font-semibold disabled:opacity-60" style={{ backgroundColor: "#8DC63F" }}>
                            {isSavingProfile ? "Menyimpan..." : "Simpan Profile"}
                        </button>
                    </form>
                </section>

                <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="rounded-3xl p-5 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#8A7B5A" }}>NusaKoin</p>
                        <p className="text-3xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>{wallet?.total_point ?? 0}</p>
                    </div>
                    <div className="rounded-3xl p-5 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#8A7B5A" }}>Unread</p>
                        <p className="text-3xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>{wallet?.unread_notifications ?? 0}</p>
                    </div>
                    <div className="rounded-3xl p-5 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#8A7B5A" }}>Missions</p>
                        <p className="text-3xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>{missions.length}</p>
                    </div>
                    <div className="rounded-3xl p-5 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#8A7B5A" }}>Subscriptions</p>
                        <p className="text-3xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>{subscriptions.length}</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Notifications</h2>
                        <div className="space-y-3">
                            {notifications.map((item) => (
                                <div key={item.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F8F2E4" }}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm" style={{ color: "#6B5A3E" }}>{item.content}</p>
                                            <p className="text-xs mt-2 uppercase" style={{ color: "#8A7B5A" }}>{item.status}</p>
                                        </div>
                                        {item.status !== "read" ? (
                                            <button onClick={() => markAsRead(item.id)} className="text-xs font-semibold" style={{ color: "#4B8F2A" }}>
                                                Mark read
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Subscription Plans</h2>
                        <div className="space-y-3">
                            {plans.map((plan) => (
                                <div key={plan.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F8F2E4" }}>
                                    <p className="font-semibold" style={{ color: "#3B2A0E" }}>{plan.name}</p>
                                    <p className="text-sm mt-1" style={{ color: "#6B5A3E" }}>{plan.description}</p>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-sm" style={{ color: "#8A7B5A" }}>{plan.price} NusaKoin</span>
                                        <button onClick={() => handleSubscribe(plan.id)} className="px-4 py-2 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#8DC63F" }}>
                                            Subscribe
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 mt-6">
                    <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Daily Missions</h2>
                        <div className="space-y-3">
                            {missions.map((item) => (
                                <div key={item.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F8F2E4" }}>
                                    <p className="font-semibold" style={{ color: "#3B2A0E" }}>{item.mission?.title}</p>
                                    <p className="text-sm mt-1" style={{ color: "#6B5A3E" }}>
                                        Progress {item.progress}/{item.mission?.target}
                                    </p>
                                    <p className="text-xs mt-2 uppercase" style={{ color: "#8A7B5A" }}>{item.status}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Watch History and Transactions</h2>
                        <div className="space-y-3">
                            {history.map((item) => (
                                <div key={`history-${item.id}`} className="rounded-2xl p-4" style={{ backgroundColor: "#F8F2E4" }}>
                                    <p className="font-semibold" style={{ color: "#3B2A0E" }}>{item.video?.title || "Watched animation"}</p>
                                    <p className="text-sm mt-1" style={{ color: "#6B5A3E" }}>
                                        Watched {item.watched_duration} seconds
                                    </p>
                                </div>
                            ))}
                            {transactions.map((item) => (
                                <div key={`transaction-${item.id}`} className="rounded-2xl p-4" style={{ backgroundColor: "#EFE5C9" }}>
                                    <p className="font-semibold" style={{ color: "#3B2A0E" }}>{item.source}</p>
                                    <p className="text-sm mt-1" style={{ color: "#6B5A3E" }}>
                                        {item.type} {item.amount} NusaKoin
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
            </div>
        </div>
    );
}
