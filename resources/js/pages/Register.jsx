import { useState, useTransition } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppNavbar from "../navbar/AppNavbar.jsx";
import { register } from "../services/authService";
import { getApiErrorMessage, getApiValidationErrors } from "../utils/errorMessage";

export default function Register() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    function updateField(key, value) {
        setForm((previous) => ({
            ...previous,
            [key]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage("");
        setFieldErrors({});

        startTransition(async () => {
            try {
                const { user } = await register(form);
                setUser(user);
                navigate("/dashboard");
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.error("API error:", error?.response?.status, error?.response?.data || error);
                }

                const errors = getApiValidationErrors(error);
                const passwordError = Array.isArray(errors.password) ? errors.password[0] : errors.password;
                const shouldMoveConfirmationError = passwordError
                    && /confirmation|konfirmasi|match/i.test(passwordError)
                    && !errors.password_confirmation;

                setFieldErrors(shouldMoveConfirmationError
                    ? { ...errors, password_confirmation: [passwordError] }
                    : errors);
                setErrorMessage(getApiErrorMessage(error, "Registration failed. Please review your input."));
            }
        });
    }

    const passwordFieldError = Array.isArray(fieldErrors.password) ? fieldErrors.password[0] : fieldErrors.password;
    const confirmationFieldError = Array.isArray(fieldErrors.password_confirmation) ? fieldErrors.password_confirmation[0] : fieldErrors.password_confirmation;
    const passwordConfirmationError = confirmationFieldError
        || (passwordFieldError && /confirmation|konfirmasi|match/i.test(passwordFieldError) ? passwordFieldError : "");
    const visiblePasswordError = passwordConfirmationError === passwordFieldError ? "" : passwordFieldError;

    return (
        <div className="min-h-screen pb-10" style={{ backgroundColor: "#F5F0E0" }}>
            <AppNavbar current="register" />
            <div className="px-6 py-10">
            <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-center">
                <section className="rounded-[32px] p-8 text-white" style={{ background: "linear-gradient(135deg, #5C3A1E 0%, #A56E28 100%)" }}>
                    <p className="text-sm uppercase tracking-[0.3em] text-amber-100 mb-3">NusaKarya</p>
                    <h1 className="text-5xl font-bold leading-tight mb-4" style={{ fontFamily: "Georgia, serif" }}>
                        Start building your cultural animation studio.
                    </h1>
                    <p className="text-sm leading-7 text-amber-50/90">
                        Register as a NusaTales creator to upload animation, manage moderation status,
                        track community signals, and prepare monetization through NusaKoin and subscriptions.
                    </p>
                </section>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-[32px] p-8 border shadow-sm"
                    style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}
                >
                    <div className="flex items-center justify-between gap-4 mb-8">
                        <div>
                            <p className="text-sm" style={{ color: "#8A7B5A" }}>Create account</p>
                            <h2 className="text-4xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                                Join NusaTales
                            </h2>
                        </div>
                        <Link to="/login" className="text-sm font-semibold" style={{ color: "#A56E28" }}>
                            Sign in
                        </Link>
                    </div>

                    {errorMessage ? (
                        <div className="mb-5 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FFF1EB", color: "#A63B1F" }}>
                            {errorMessage}
                        </div>
                    ) : null}

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Full name" className="w-full px-5 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA", color: "#3B2A0E" }} />
                            {fieldErrors.name ? <p className="mt-2 text-xs" style={{ color: "#A63B1F" }}>{fieldErrors.name[0]}</p> : null}
                        </div>
                        <div>
                            <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email" className="w-full px-5 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA", color: "#3B2A0E" }} />
                            {fieldErrors.email ? <p className="mt-2 text-xs" style={{ color: "#A63B1F" }}>{fieldErrors.email[0]}</p> : null}
                        </div>
                        <div>
                            <input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Password" className="w-full px-5 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA", color: "#3B2A0E" }} />
                            {visiblePasswordError ? <p className="mt-2 text-xs" style={{ color: "#A63B1F" }}>{visiblePasswordError}</p> : null}
                        </div>
                        <div>
                            <input type="password" value={form.password_confirmation} onChange={(event) => updateField("password_confirmation", event.target.value)} placeholder="Confirm password" className="w-full px-5 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA", color: "#3B2A0E" }} />
                            {passwordConfirmationError ? <p className="mt-2 text-xs" style={{ color: "#A63B1F" }}>{passwordConfirmationError}</p> : null}
                        </div>
                    </div>

                    <button type="submit" disabled={isPending} className="w-full mt-6 py-4 rounded-2xl text-white font-semibold disabled:opacity-60" style={{ backgroundColor: "#8DC63F" }}>
                        {isPending ? "Creating account..." : "Create account"}
                    </button>
                </form>
            </div>
            </div>
        </div>
    );
}
