import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createAnimation, deleteAnimation, getCreatorAnimations, updateAnimation } from "../services/animationService";
import { getCreatorDashboard, getCreatorMonetizationSummary } from "../services/dashboardService";
import { getCategories, getStories } from "../services/referenceService";
import AppNavbar from "../navbar/AppNavbar.jsx";

const defaultForm = {
    judul: "",
    deskripsi: "",
    durasi: "",
    kategori_id: "",
    cerita_id: "",
    status: "draft",
    video_file: null,
    thumbnail_file: null,
};

export default function CreatorStudio() {
    const [animations, setAnimations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stories, setStories] = useState([]);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [form, setForm] = useState(defaultForm);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dashboard, setDashboard] = useState(null);
    const [monetization, setMonetization] = useState(null);

    useEffect(() => {
        let ignore = false;

        async function loadStudio() {
            try {
                const [
                    animationResponse,
                    categoryResponse,
                    storyResponse,
                    dashboardResponse,
                    monetizationResponse,
                ] = await Promise.all([
                    getCreatorAnimations({ per_page: 20 }),
                    getCategories(),
                    getStories(),
                    getCreatorDashboard(),
                    getCreatorMonetizationSummary(),
                ]);

                if (!ignore) {
                    setAnimations(animationResponse.data ?? []);
                    setCategories(categoryResponse);
                    setStories(storyResponse);
                    setDashboard(dashboardResponse);
                    setMonetization(monetizationResponse);
                }
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(error.response?.data?.message || "Failed to load creator studio.");
                }
            }
        }

        loadStudio();

        return () => {
            ignore = true;
        };
    }, []);

    function updateField(key, value) {
        setForm((previous) => ({ ...previous, [key]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            const saved = editingId
                ? await updateAnimation(editingId, form)
                : await createAnimation(form);

            setAnimations((previous) => editingId
                ? previous.map((item) => (item.id === editingId ? saved : item))
                : [saved, ...previous]
            );
            setForm(defaultForm);
            setEditingId(null);
            setMessage(editingId ? "Animation updated successfully." : "Animation uploaded successfully.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to save animation.");
        } finally {
            setIsSubmitting(false);
        }
    }

    function startEdit(item) {
        setEditingId(item.id);
        setForm({
            judul: item.title ?? "",
            deskripsi: item.description ?? "",
            durasi: item.duration ?? "",
            kategori_id: item.category?.id ?? "",
            cerita_id: item.story?.id ?? "",
            status: item.status === "rejected" ? "draft" : item.status ?? "draft",
            video_file: null,
            thumbnail_file: null,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function handleDelete(id) {
        setMessage("");
        setErrorMessage("");

        try {
            await deleteAnimation(id);
            setAnimations((previous) => previous.filter((item) => item.id !== id));
            setMessage("Animation deleted successfully.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to delete animation.");
        }
    }

    return (
        <div className="min-h-screen pb-6" style={{ backgroundColor: "#F5F0E0" }}>
            <AppNavbar current="creator" />
            <div className="px-6 py-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-sm mb-1" style={{ color: "#8A7B5A" }}>Creator workflow</p>
                        <h1 className="text-4xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                            NusaKarya Studio
                        </h1>
                    </div>
                    <Link to="/dashboard" className="px-5 py-3 rounded-full text-sm font-semibold" style={{ backgroundColor: "#3B2A0E", color: "#FFFFFF" }}>
                        Back to Dashboard
                    </Link>
                </div>

                {message ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EEF7E3", color: "#4B6E17" }}>{message}</div> : null}
                {errorMessage ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FFF1EB", color: "#A63B1F" }}>{errorMessage}</div> : null}

                <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="rounded-3xl p-5 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#8A7B5A" }}>Total Videos</p>
                        <p className="text-3xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>{dashboard?.total_videos ?? animations.length}</p>
                    </div>
                    <div className="rounded-3xl p-5 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#8A7B5A" }}>Published</p>
                        <p className="text-3xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>{dashboard?.published_videos ?? 0}</p>
                    </div>
                    <div className="rounded-3xl p-5 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#8A7B5A" }}>Views</p>
                        <p className="text-3xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>{dashboard?.total_views ?? 0}</p>
                    </div>
                    <div className="rounded-3xl p-5 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#8A7B5A" }}>Earnings</p>
                        <p className="text-3xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>{monetization?.total_earnings ?? 0}</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
                    <form onSubmit={handleSubmit} className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <h2 className="text-2xl font-bold mb-5" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Upload Animation</h2>
                        <div className="space-y-4">
                            <input value={form.judul} onChange={(event) => updateField("judul", event.target.value)} placeholder="Animation title" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} required />
                            <textarea value={form.deskripsi} onChange={(event) => updateField("deskripsi", event.target.value)} placeholder="Description" rows={4} className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                            <input type="number" min="1" value={form.durasi} onChange={(event) => updateField("durasi", event.target.value)} placeholder="Duration in seconds" className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} required />
                            <div className="grid md:grid-cols-2 gap-4">
                                <select value={form.kategori_id} onChange={(event) => updateField("kategori_id", event.target.value)} className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }}>
                                    <option value="">Select category</option>
                                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                </select>
                                <select value={form.cerita_id} onChange={(event) => updateField("cerita_id", event.target.value)} className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }}>
                                    <option value="">Select story</option>
                                    {stories.map((story) => <option key={story.id} value={story.id}>{story.title}</option>)}
                                </select>
                            </div>
                            <select value={form.status} onChange={(event) => updateField("status", event.target.value)} className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }}>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                            <label className="block rounded-2xl px-4 py-4" style={{ backgroundColor: "#F7F3EA" }}>
                                <span className="block text-sm mb-2" style={{ color: "#6B5A3E" }}>Video file</span>
                                <input type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/webm" required={!editingId} onChange={(event) => updateField("video_file", event.target.files?.[0] ?? null)} />
                            </label>
                            <label className="block rounded-2xl px-4 py-4" style={{ backgroundColor: "#F7F3EA" }}>
                                <span className="block text-sm mb-2" style={{ color: "#6B5A3E" }}>Thumbnail</span>
                                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => updateField("thumbnail_file", event.target.files?.[0] ?? null)} />
                            </label>
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-2xl text-white font-semibold disabled:opacity-60" style={{ backgroundColor: "#8DC63F" }}>
                                {isSubmitting ? "Saving..." : editingId ? "Update Animation" : "Upload Animation"}
                            </button>
                            {editingId ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setForm(defaultForm);
                                    }}
                                    className="w-full py-3 rounded-2xl font-semibold"
                                    style={{ backgroundColor: "#EBDCB7", color: "#5C4B2D" }}
                                >
                                    Cancel Edit
                                </button>
                            ) : null}
                        </div>
                    </form>

                    <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                        <h2 className="text-2xl font-bold mb-5" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>My Animation Queue</h2>
                        <div className="space-y-4">
                            {animations.length === 0 ? (
                                <p className="text-sm" style={{ color: "#8A7B5A" }}>No animations uploaded yet.</p>
                            ) : animations.map((item) => (
                                <div key={item.id} className="rounded-2xl p-4" style={{ backgroundColor: "#F8F2E4" }}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-semibold" style={{ color: "#3B2A0E" }}>{item.title}</p>
                                            <p className="text-sm mt-1" style={{ color: "#6B5A3E" }}>{item.description || "No description"}</p>
                                            <p className="text-xs mt-2 uppercase tracking-wide" style={{ color: "#8A7B5A" }}>Status: {item.status}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => startEdit(item)} className="px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: "#EBDCB7", color: "#5C4B2D" }}>
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: "#E7D2C8", color: "#8A3B28" }}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
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
