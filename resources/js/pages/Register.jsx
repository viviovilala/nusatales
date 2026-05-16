import { useState, useTransition } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppNavbar from "../navbar/AppNavbar.jsx";
import { register } from "../services/authService";
import { getApiErrorMessage, getApiValidationErrors } from "../utils/errorMessage";

export default function Register() {
    const navigate = useNavigate();
    const { setUser, refreshUser } = useAuth();

    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

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

        setFieldErrors((previous) => ({
            ...previous,
            [key]: undefined,
        }));

        if (errorMessage) {
            setErrorMessage("");
        }
    }

    function getFirstError(key) {
        const error = fieldErrors?.[key];

        if (Array.isArray(error)) {
            return error[0];
        }

        return error || "";
    }

    function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage("");
        setFieldErrors({});

        startTransition(async () => {
            try {
                const payload = {
                    name: form.name.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    password_confirmation: form.password_confirmation,
                };

                const { user } = await register(payload);

                setUser(user);

                if (typeof refreshUser === "function") {
                    await refreshUser();
                }

                navigate("/", { replace: true });
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.error(
                        "Register API error:",
                        error?.response?.status,
                        error?.response?.data || error,
                    );
                }

                const errors = getApiValidationErrors(error);

                const passwordError = Array.isArray(errors.password)
                    ? errors.password[0]
                    : errors.password;

                const shouldMoveConfirmationError =
                    passwordError &&
                    /confirmation|konfirmasi|match/i.test(passwordError) &&
                    !errors.password_confirmation;

                setFieldErrors(
                    shouldMoveConfirmationError
                        ? {
                              ...errors,
                              password: undefined,
                              password_confirmation: [passwordError],
                          }
                        : errors,
                );

                setErrorMessage(
                    getApiErrorMessage(
                        error,
                        "Pendaftaran gagal. Periksa kembali data yang kamu masukkan.",
                    ),
                );
            }
        });
    }

    const nameError = getFirstError("name");
    const emailError = getFirstError("email");
    const passwordError = getFirstError("password");
    const passwordConfirmationError = getFirstError("password_confirmation");

    return (
        <div className="min-h-screen pb-10" style={{ backgroundColor: "#F5F0E0" }}>
            <AppNavbar current="register" />

            <main className="px-6 py-10">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-center">
                    <section
                        className="rounded-[32px] p-8 text-white shadow-sm"
                        style={{
                            background:
                                "linear-gradient(135deg, #5C3A1E 0%, #A56E28 100%)",
                        }}
                    >
                        <p className="text-sm uppercase tracking-[0.3em] text-amber-100 mb-3">
                            NusaTales
                        </p>

                        <h1
                            className="text-5xl font-bold leading-tight mb-4"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            Mulai Petualangan Cerita Nusantara
                        </h1>

                        <p className="text-sm leading-7 text-amber-50/90">
                            Daftar sebagai Petualang Nusa untuk menonton animasi,
                            menyimpan kisah favorit, berdiskusi di NusaRembug, dan
                            mengaktifkan Studio NusaKarya saat siap menjadi kreator.
                        </p>

                        <div
                            className="mt-8 rounded-3xl p-5 border"
                            style={{
                                borderColor: "rgba(255,255,255,0.22)",
                                backgroundColor: "rgba(255,255,255,0.08)",
                            }}
                        >
                            <p className="text-sm font-semibold text-amber-50 mb-2">
                                Yang bisa kamu lakukan setelah daftar:
                            </p>
                            <ul className="space-y-2 text-sm text-amber-50/90">
                                <li>• Menonton Lakon dan NusaSaga.</li>
                                <li>• Menyimpan kisah favorit.</li>
                                <li>• Berkomentar di NusaRembug.</li>
                                <li>• Mengaktifkan Studio NusaKarya kapan saja.</li>
                            </ul>
                        </div>
                    </section>

                    <form
                        onSubmit={handleSubmit}
                        className="rounded-[32px] p-8 border shadow-sm"
                        style={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E8DFC7",
                        }}
                    >
                        <div className="flex items-center justify-between gap-4 mb-8">
                            <div>
                                <p className="text-sm" style={{ color: "#8A7B5A" }}>
                                    Buat Akun
                                </p>
                                <h2
                                    className="text-4xl font-bold"
                                    style={{
                                        color: "#3B2A0E",
                                        fontFamily: "Georgia, serif",
                                    }}
                                >
                                    Bergabung dengan NusaTales
                                </h2>
                            </div>

                            <Link
                                to="/login"
                                className="text-sm font-semibold text-right"
                                style={{ color: "#A56E28" }}
                            >
                                Sudah punya akun? Masuk
                            </Link>
                        </div>

                        {errorMessage ? (
                            <div
                                className="mb-5 rounded-2xl px-4 py-3 text-sm"
                                style={{
                                    backgroundColor: "#FFF1EB",
                                    color: "#A63B1F",
                                }}
                            >
                                {errorMessage}
                            </div>
                        ) : null}

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(event) =>
                                        updateField("name", event.target.value)
                                    }
                                    placeholder="Nama lengkap"
                                    autoComplete="name"
                                    className="w-full px-5 py-4 rounded-2xl outline-none"
                                    style={{
                                        backgroundColor: "#F7F3EA",
                                        color: "#3B2A0E",
                                    }}
                                />
                                {nameError ? (
                                    <p
                                        className="mt-2 text-xs"
                                        style={{ color: "#A63B1F" }}
                                    >
                                        {nameError}
                                    </p>
                                ) : null}
                            </div>

                            <div>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(event) =>
                                        updateField("email", event.target.value)
                                    }
                                    placeholder="Email"
                                    autoComplete="email"
                                    className="w-full px-5 py-4 rounded-2xl outline-none"
                                    style={{
                                        backgroundColor: "#F7F3EA",
                                        color: "#3B2A0E",
                                    }}
                                />
                                {emailError ? (
                                    <p
                                        className="mt-2 text-xs"
                                        style={{ color: "#A63B1F" }}
                                    >
                                        {emailError}
                                    </p>
                                ) : null}
                            </div>

                            <div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={(event) =>
                                            updateField("password", event.target.value)
                                        }
                                        placeholder="Password"
                                        autoComplete="new-password"
                                        className="w-full px-5 py-4 pr-28 rounded-2xl outline-none"
                                        style={{
                                            backgroundColor: "#F7F3EA",
                                            color: "#3B2A0E",
                                        }}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((value) => !value)
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Sembunyikan password"
                                                : "Tampilkan password"
                                        }
                                        aria-pressed={showPassword}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold"
                                        style={{ color: "#A56E28" }}
                                    >
                                        {showPassword ? "Sembunyikan" : "Tampilkan"}
                                    </button>
                                </div>

                                {passwordError ? (
                                    <p
                                        className="mt-2 text-xs"
                                        style={{ color: "#A63B1F" }}
                                    >
                                        {passwordError}
                                    </p>
                                ) : null}
                            </div>

                            <div>
                                <div className="relative">
                                    <input
                                        type={
                                            showPasswordConfirmation
                                                ? "text"
                                                : "password"
                                        }
                                        value={form.password_confirmation}
                                        onChange={(event) =>
                                            updateField(
                                                "password_confirmation",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Konfirmasi password"
                                        autoComplete="new-password"
                                        className="w-full px-5 py-4 pr-28 rounded-2xl outline-none"
                                        style={{
                                            backgroundColor: "#F7F3EA",
                                            color: "#3B2A0E",
                                        }}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPasswordConfirmation(
                                                (value) => !value,
                                            )
                                        }
                                        aria-label={
                                            showPasswordConfirmation
                                                ? "Sembunyikan konfirmasi password"
                                                : "Tampilkan konfirmasi password"
                                        }
                                        aria-pressed={showPasswordConfirmation}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold"
                                        style={{ color: "#A56E28" }}
                                    >
                                        {showPasswordConfirmation
                                            ? "Sembunyikan"
                                            : "Tampilkan"}
                                    </button>
                                </div>

                                {passwordConfirmationError ? (
                                    <p
                                        className="mt-2 text-xs"
                                        style={{ color: "#A63B1F" }}
                                    >
                                        {passwordConfirmationError}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full mt-6 py-4 rounded-2xl text-white font-semibold disabled:opacity-60"
                            style={{ backgroundColor: "#8DC63F" }}
                        >
                            {isPending ? "Mendaftarkan..." : "Daftar"}
                        </button>

                        <p
                            className="text-center text-xs mt-5 leading-6"
                            style={{ color: "#8A7B5A" }}
                        >
                            Dengan mendaftar, kamu setuju untuk menjadi bagian dari
                            ekosistem cerita Nusantara di NusaTales.
                        </p>
                    </form>
                </div>
            </main>
        </div>
    );
}