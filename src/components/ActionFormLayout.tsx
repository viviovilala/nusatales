import React from "react";
import type { ReactNode } from "react";
import AppNavbar from "./AppNavbar";
import Footer from "./Footer";

type Props = { embedded?: boolean; title: string; description?: string; children: ReactNode; wide?: boolean };
export default function ActionFormLayout({ embedded = false, title, description, children, wide }: Props) {
    const content = <section className={`action-form ${wide ? "action-form-wide" : ""}`}>
        {!embedded && <div className="action-form-heading"><span className="ui-eyebrow">NUSATALES</span><h1>{title}</h1></div>}
        {description && <p className="action-form-description">{description}</p>}
        {children}
    </section>;
    if (embedded) return content;
    return <div className="site-page form-page"><AppNavbar /><main className="form-page-main">{content}</main><Footer /></div>;
}
