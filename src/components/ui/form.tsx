import React, { forwardRef, useState } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className = "", ...props }, ref) {
    return <input {...props} ref={ref} className={`ui-input ${className}`} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className = "", ...props }, ref) {
    return <textarea {...props} ref={ref} className={`ui-input ui-textarea ${className}`} />;
});
type FieldProps = { id: string; label: string; hint?: ReactNode; required?: boolean; children: ReactNode; trailing?: ReactNode };
export function Field({ id, label, hint, required, children, trailing }: FieldProps) {
    return <div className="ui-field">
        <div className="ui-label-row"><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>{trailing}</div>
        {children}
        {hint && <p id={`${id}-hint`} className="ui-hint">{hint}</p>}
    </div>;
}
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" | "danger"; busy?: boolean };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "primary", busy, disabled, className = "", children, type = "button", ...props }, ref) {
    return <button {...props} type={type} ref={ref} disabled={disabled || busy} aria-busy={busy || undefined} className={`ui-button ui-button-${variant} ${className}`}>
        {busy && <Loader2 size={16} className="ui-spinner" aria-hidden="true" />}{children}
    </button>;
});
export function Notice({ children, tone = "error" }: { children?: ReactNode; tone?: "error" | "success" | "info" }) {
    if (!children) return null;
    const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
    return <div role={tone === "error" ? "alert" : "status"} className={`ui-notice ui-notice-${tone}`}><Icon size={17} aria-hidden="true" /><div>{children}</div></div>;
}
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
    const [visible, setVisible] = useState(false);
    return <div className="ui-password"><Input {...props} type={visible ? "text" : "password"} />
        <button type="button" aria-label={visible ? "Sembunyikan password" : "Lihat password"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>
    </div>;
}
