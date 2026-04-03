import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    createAdminAd,
    createAdminMission,
    createAdminPlan,
    deleteAdminAd,
    deleteAdminMission,
    deleteAdminPlan,
    getAdminAds,
    getAdminAnimations,
    getAdminMissions,
    getAdminPlans,
    updateAdminAnimationStatus,
} from "../services/dashboardService";

export default function AdminStudio() {
    const [animations, setAnimations] = useState([]);
    const [plans, setPlans] = useState([]);
    const [missions, setMissions] = useState([]);
    const [ads, setAds] = useState([]);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [planForm, setPlanForm] = useState({ name: "", description: "", price: "", duration_days: 30, status: "active" });
    const [missionForm, setMissionForm] = useState({ judul: "", deskripsi: "", target: 1, tipe: "watch", reward_point: 10 });
    const [adForm, setAdForm] = useState({ nama_brand: "", jenis_iklan: "", durasi: "", video_id: "" });

    useEffect(() => {
        let ignore = false;

        async function loadAdminStudio() {
            try {
                const [animationResponse, planResponse, missionResponse, adResponse] = await Promise.all([
                    getAdminAnimations({ per_page: 20 }),
                    getAdminPlans({ per_page: 20 }),
                    getAdminMissions({ per_page: 20 }),
                    getAdminAds({ per_page: 20 }),
                ]);

                if (!ignore) {
                    setAnimations(animationResponse.data ?? []);
                    setPlans(planResponse.data ?? []);
                    setMissions(missionResponse.items ?? []);
                    setAds(adResponse.data ?? []);
                }
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(error.response?.data?.message || "Failed to load admin studio.");
                }
            }
        }

        loadAdminStudio();

        return () => {
            ignore = true;
        };
    }, []);

    async function moderate(videoId, status) {
        setMessage("");
        setErrorMessage("");

        try {
            const payload = status === "rejected"
                ? { status, rejection_reason: "Rejected from admin studio review." }
                : { status };

            const updated = await updateAdminAnimationStatus(videoId, payload);
            setAnimations((previous) => previous.map((item) => (item.id === videoId ? updated : item)));
            setMessage(`Animation status updated to ${status}.`);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to update moderation status.");
        }
    }

    async function removePlan(id) {
        setMessage("");
        setErrorMessage("");

        try {
            await deleteAdminPlan(id);
            setPlans((previous) => previous.filter((item) => item.id !== id));
            setMessage("Subscription plan deleted.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to delete plan.");
        }
    }

    async function removeMission(id) {
        setMessage("");
        setErrorMessage("");

        try {
            await deleteAdminMission(id);
            setMissions((previous) => previous.filter((item) => (item.mission_id ?? item.id) !== id));
            setMessage("Mission deleted.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to delete mission.");
        }
    }

    async function removeAd(id) {
        setMessage("");
        setErrorMessage("");

        try {
            await deleteAdminAd(id);
            setAds((previous) => previous.filter((item) => item.id !== id));
            setMessage("Ad deleted.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to delete ad.");
        }
    }

    async function submitPlan(event) {
        event.preventDefault();
        try {
            const created = await createAdminPlan(planForm);
            setPlans((previous) => [...previous, created]);
            setPlanForm({ name: "", description: "", price: "", duration_days: 30, status: "active" });
            setMessage("Subscription plan created.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to create plan.");
        }
    }

    async function submitMission(event) {
        event.preventDefault();
        try {
            const created = await createAdminMission(missionForm);
            setMissions((previous) => [...previous, created]);
            setMissionForm({ judul: "", deskripsi: "", target: 1, tipe: "watch", reward_point: 10 });
            setMessage("Mission created.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to create mission.");
        }
    }

    async function submitAd(event) {
        event.preventDefault();
        try {
            const created = await createAdminAd(adForm);
            setAds((previous) => [created, ...previous]);
            setAdForm({ nama_brand: "", jenis_iklan: "", durasi: "", video_id: "" });
            setMessage("Ad created.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to create ad.");
        }
    }

    return (
        <div className="min-h-screen px-6 py-6" style={{ backgroundColor: "#F5F0E0" }}>
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-sm mb-1" style={{ color: "#8A7B5A" }}>Admin operations</p>
                        <h1 className="text-4xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>NusaTales Admin Studio</h1>
                    </div>
                    <Link to="/dashboard" className="px-5 py-3 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: "#3B2A0E" }}>Back to Dashboard</Link>
                </div>

                {message ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EEF7E3", color: "#4B6E17" }}>{message}</div> : null}
                {errorMessage ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FFF1EB", color: "#A63B1F" }}>{errorMessage}</div> : null}

                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                    <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Moderation Queue</h2>
                        <div className="space-y-4">
                            {animations.map((item) => (
                                <div key={item.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F8F2E4" }}>
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <p className="font-semibold" style={{ color: "#3B2A0E" }}>{item.title}</p>
                                            <p className="text-sm mt-1" style={{ color: "#6B5A3E" }}>{item.creator?.name || "Unknown creator"}</p>
                                            <p className="text-xs mt-2 uppercase" style={{ color: "#8A7B5A" }}>{item.status}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => moderate(item.id, "published")} className="px-4 py-2 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#4B8F2A" }}>Publish</button>
                                            <button onClick={() => moderate(item.id, "rejected")} className="px-4 py-2 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#A63B1F" }}>Reject</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Create Subscription Plan</h2>
                        <form onSubmit={submitPlan} className="space-y-3">
                            <input value={planForm.name} onChange={(event) => setPlanForm((previous) => ({ ...previous, name: event.target.value }))} placeholder="Plan name" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                            <textarea value={planForm.description} onChange={(event) => setPlanForm((previous) => ({ ...previous, description: event.target.value }))} placeholder="Plan description" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" value={planForm.price} onChange={(event) => setPlanForm((previous) => ({ ...previous, price: event.target.value }))} placeholder="Price" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                                <input type="number" value={planForm.duration_days} onChange={(event) => setPlanForm((previous) => ({ ...previous, duration_days: event.target.value }))} placeholder="Duration days" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                            </div>
                            <button type="submit" className="w-full py-4 rounded-2xl text-white font-semibold" style={{ backgroundColor: "#8DC63F" }}>Create Plan</button>
                        </form>
                        <div className="mt-5 space-y-2">
                            {plans.map((plan) => (
                                <div key={plan.id} className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "#F8F2E4" }}>
                                    <div>
                                        <p className="font-semibold" style={{ color: "#3B2A0E" }}>{plan.name}</p>
                                        <p className="text-sm" style={{ color: "#8A7B5A" }}>{plan.price} NusaKoin</p>
                                    </div>
                                    <button onClick={() => removePlan(plan.id)} className="text-xs font-semibold" style={{ color: "#A63B1F" }}>Delete</button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Create Daily Mission</h2>
                        <form onSubmit={submitMission} className="space-y-3">
                            <input value={missionForm.judul} onChange={(event) => setMissionForm((previous) => ({ ...previous, judul: event.target.value }))} placeholder="Mission title" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                            <textarea value={missionForm.deskripsi} onChange={(event) => setMissionForm((previous) => ({ ...previous, deskripsi: event.target.value }))} placeholder="Mission description" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                            <div className="grid grid-cols-3 gap-3">
                                <input type="number" value={missionForm.target} onChange={(event) => setMissionForm((previous) => ({ ...previous, target: event.target.value }))} placeholder="Target" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                                <select value={missionForm.tipe} onChange={(event) => setMissionForm((previous) => ({ ...previous, tipe: event.target.value }))} className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }}>
                                    <option value="watch">Watch</option>
                                    <option value="like">Like</option>
                                    <option value="comment">Comment</option>
                                </select>
                                <input type="number" value={missionForm.reward_point} onChange={(event) => setMissionForm((previous) => ({ ...previous, reward_point: event.target.value }))} placeholder="Reward" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                            </div>
                            <button type="submit" className="w-full py-4 rounded-2xl text-white font-semibold" style={{ backgroundColor: "#8DC63F" }}>Create Mission</button>
                        </form>
                        <div className="mt-5 space-y-2">
                            {missions.map((mission) => (
                                <div key={mission.mission_id ?? mission.id} className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "#F8F2E4" }}>
                                    <div>
                                        <p className="font-semibold" style={{ color: "#3B2A0E" }}>{mission.judul ?? mission.title}</p>
                                        <p className="text-sm" style={{ color: "#8A7B5A" }}>{mission.tipe ?? mission.type} / reward {mission.reward_point}</p>
                                    </div>
                                    <button onClick={() => removeMission(mission.mission_id ?? mission.id)} className="text-xs font-semibold" style={{ color: "#A63B1F" }}>Delete</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Create Brand Ad</h2>
                        <form onSubmit={submitAd} className="space-y-3">
                            <input value={adForm.nama_brand} onChange={(event) => setAdForm((previous) => ({ ...previous, nama_brand: event.target.value }))} placeholder="Brand name" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                            <input value={adForm.jenis_iklan} onChange={(event) => setAdForm((previous) => ({ ...previous, jenis_iklan: event.target.value }))} placeholder="Ad type" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" value={adForm.durasi} onChange={(event) => setAdForm((previous) => ({ ...previous, durasi: event.target.value }))} placeholder="Duration" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                                <input value={adForm.video_id} onChange={(event) => setAdForm((previous) => ({ ...previous, video_id: event.target.value }))} placeholder="Optional video ID" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                            </div>
                            <button type="submit" className="w-full py-4 rounded-2xl text-white font-semibold" style={{ backgroundColor: "#8DC63F" }}>Create Ad</button>
                        </form>
                        <div className="mt-5 space-y-2">
                            {ads.map((ad) => (
                                <div key={ad.id} className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "#F8F2E4" }}>
                                    <div>
                                        <p className="font-semibold" style={{ color: "#3B2A0E" }}>{ad.brand_name}</p>
                                        <p className="text-sm" style={{ color: "#8A7B5A" }}>{ad.ad_type} / {ad.duration}s</p>
                                    </div>
                                    <button onClick={() => removeAd(ad.id)} className="text-xs font-semibold" style={{ color: "#A63B1F" }}>Delete</button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
