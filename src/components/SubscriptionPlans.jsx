import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { PageScrollLock } from "../lib/pageScrollLock";

// Display copy/prices follow the supplied Figma. Billing is not enabled.
const plans = [
    { name: "Supporter", price: "15.000", subtitle: "Akses Fitur Dasar", features: [
        ["Bebas iklan", true], ["Akses lebih cepat", true], ["Dukung kreator lokal", true],
        ["Video behind the scenes", false], ["Proses storyboard", false], ["Sneak peek episode sebelum rilis", false],
    ] },
    { name: "Explorer", price: "35.000", subtitle: "Akses Konten Eksklusif", highlighted: true, features: [
        ["Bebas iklan", true], ["Akses lebih cepat", true], ["Dukung kreator lokal", true],
        ["Video behind the scenes", true], ["Proses storyboard", true], ["Sneak peek episode sebelum rilis", true],
    ] },
    { name: "VIP/Creator Pack", price: "75.000", subtitle: "Akses Penuh & Unduh", features: [
        ["Seluruh benefit paket Explorer", true], ["Unduh file PSD karakter", true], ["Desain vektor karakter", true],
        ["Unduh background art", true], ["Unduh aset animasi", true], ["Unduh storyboard", true],
    ] },
];

function PlanDetails({ plan }) {
    return <Dialog.Root>
        <Dialog.Trigger asChild><button className={`nusa-button ${plan.highlighted ? "" : "nusa-button-brown"}`} aria-label={`Lihat paket ${plan.name}`}>Beli Paket</button></Dialog.Trigger>
        <Dialog.Portal>
            <Dialog.Overlay className="nusa-sheet-overlay" />
            <Dialog.Content className="nusa-plan-dialog">
                <PageScrollLock />
                <span className="home-eyebrow">NUSAADHI · SEGERA HADIR</span>
                <Dialog.Title>Paket {plan.name}</Dialog.Title>
                <div className="home-plan-price">Rp{plan.price}<span>/bulan</span></div>
                <Dialog.Description>Langganan NusaAdhi belum tersedia untuk pembelian. Sambil menunggu, kamu tetap bisa menikmati cerita dan membagikan karyamu di NusaTales.</Dialog.Description>
                <Dialog.Close asChild><Link to="/animations" className="nusa-button">Jelajahi cerita dahulu<ArrowRight size={16} /></Link></Dialog.Close>
                <Dialog.Close className="nusa-icon-button nusa-sheet-close" aria-label="Tutup detail paket"><X size={20} /></Dialog.Close>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>;
}

export default function SubscriptionPlans() {
    return <Reveal as="section" id="langganan" className="home-section home-subscription-section" aria-labelledby="subscription-heading">
        <div className="home-centered-heading">
            <span className="home-eyebrow">DUKUNG CERITA, RAWAT WARISAN KITA</span>
            <h2 id="subscription-heading">Pilihan Paket NusaAdhi</h2>
            <p>Pilih paket yang paling pas untuk petualangan<br className="hidden sm:block" /> menelusuri kisah Nusantara-mu.</p>
        </div>
        <div className="home-subscriptions">
            <div className="home-subscription-mascot"><img src="/poto/nunjuk.webp" alt="Maskot NusaTales memperkenalkan paket NusaAdhi" loading="lazy" width="210" height="380" /></div>
            <div className="home-plan-grid">{plans.map((plan, index) => <Reveal as="article" delay={index * 0.08} key={plan.name} className={`home-plan ${plan.highlighted ? "home-plan-highlighted" : ""}`}>
                <h3>{plan.name}</h3>
                <div className="home-plan-price">Rp{plan.price}<span>/bulan</span></div>
                <h4>{plan.subtitle}</h4>
                <ul>{plan.features.map(([label, included]) => <li key={label} className={included ? "" : "is-excluded"}>
                    {included ? <Check size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
                    <span>{!included && <span className="sr-only">Tidak termasuk: </span>}{label}</span>
                </li>)}</ul>
                <PlanDetails plan={plan} />
            </Reveal>)}</div>
        </div>
    </Reveal>;
}
