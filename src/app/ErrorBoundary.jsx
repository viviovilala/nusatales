import React from "react";

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[NusaTales ErrorBoundary]", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#FFFDF7] p-6 text-neutral-800">
                    <div className="max-w-md w-full bg-white border border-amber-200/80 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center text-amber-700">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900 mb-2">Terjadi Gangguan Tampilan</h2>
                        <p className="text-sm text-neutral-600 mb-6">
                            Aplikasi mengalami masalah saat memuat halaman ini.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-xl font-semibold shadow hover:opacity-95 transition cursor-pointer"
                            >
                                Muat Ulang Halaman
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
