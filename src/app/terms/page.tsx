"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2, AlertCircle, Building2, Lock, Scale } from "lucide-react";
import BrandLogo from "@/app/components/ui/BrandLogo";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-[#111827] dark:text-slate-100 flex flex-col font-sans selection:bg-[#3a8890] selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 group">
            <BrandLogo size="sm" variant="auto" accent="teal" name="FleetPulse" tagline="Enterprise Cloud TMS" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="text-xs font-semibold text-[#64748B] hover:text-[#2F8E86] dark:text-slate-400 transition"
            >
              Privacy Policy
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-bold transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Title */}
        <div className="mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-[#2F8E86] text-xs font-bold mb-3 border border-[#D9E2E3] dark:border-slate-700">
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#111827] dark:text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-2">
            Last Updated: October 2026 • Effective for all FleetPulse Workspaces and Tenant Organizations
          </p>
        </div>

        {/* Highlight Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-slate-800 shadow-xs mb-8 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#E7F1F2] dark:bg-slate-800 text-[#2F8E86] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#2F8E86]" />
          </div>
          <div className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
            <p className="font-semibold text-[#111827] dark:text-white mb-1">
              Enterprise Logistics & Transport Platform Agreement
            </p>
            By accessing or using FleetPulse Cloud TMS (the &quot;Platform&quot;), including consignment booking, bilty generation, trip dispatch, lorry hire, money receipt issuance, and GST billing services, you agree to be bound by these Terms of Service.
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6 sm:space-y-8 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-10 border border-[#E2E8F0] dark:border-slate-800 shadow-xs text-xs sm:text-sm leading-relaxed text-[#334155] dark:text-slate-300">
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">1</span>
              Platform License & Multi-Tenant Workspaces
            </h2>
            <p>
              FleetPulse provides a multi-tenant cloud-based Transport Management System (TMS) designed for commercial logistics operators, fleet owners, and freight forwarding agencies. Subject to timely payment of applicable subscription or usage fees, FleetPulse grants your organization a non-exclusive, non-transferable, revocable license to access the Platform.
            </p>
            <p>
              Each organization operates within a cryptographically isolated tenant partition. You are responsible for ensuring that all authorized team members adhere to these Terms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">2</span>
              User Accounts & Security Credentials
            </h2>
            <p>
              Authorized personnel must maintain the strict confidentiality of their credentials. You must immediately notify FleetPulse of any unauthorized access or breach of credentials. All actions executed under your workspace credentials (including bilty issuance, invoice generation, or settlement markups) are deemed to be authorized by your organization.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">3</span>
              Bilty (GR), E-Way Bill & Statutory Tax Compliance
            </h2>
            <p>
              The Platform facilitates the generation of Goods Receipt (GR / Bilty), loading memos, truck challans, and GST tax invoices. Your organization remains solely responsible for the accuracy of:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#475569] dark:text-slate-400">
              <li>Consignor and consignee legal names, GSTIN registrations, and delivery destination addresses.</li>
              <li>Cargo weight, package count, article descriptions, and declared cargo value.</li>
              <li>GST tax treatments (Regular 5%/12%, Reverse Charge Mechanism / RCM, or Exempt consignments).</li>
              <li>E-Way Bill validity and transit compliance under Indian Goods and Services Tax Act.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">4</span>
              Payments, Money Receipts & Financial Settlements
            </h2>
            <p>
              Records created in the Money Receipt (MR), Delivery Settlement, and Freight Billing modules constitute administrative tracking records. FleetPulse does not act as an escrow agent or custodian of physical freight funds. Freight settlement disputes between transporters, consignors, consignees, or hire brokers remain the sole responsibility of the respective contracting parties.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">5</span>
              System Reliability & 256-Bit SSL Encryption
            </h2>
            <p>
              FleetPulse utilizes enterprise-grade 256-bit SSL/TLS cryptographic encryption for all web sessions, API exchanges, and mobile touchpoints. While we strive to maintain a 99.9% platform availability, scheduled maintenance or third-party infrastructure disruptions may occur. Automated database backups are routinely taken to ensure operational continuity.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">6</span>
              Limitation of Cargo & Commercial Liability
            </h2>
            <p>
              FleetPulse is a software technology provider and is NOT a common carrier, freight insurer, or cargo bailee. FleetPulse shall not be liable for any physical loss, damage, theft, pilferage, delay, transit demurrage, or loss of cargo value arising during road transit or warehouse handling. All goods carried remain subject to the Carriage by Road Act, 2007 and your organization&apos;s commercial consignment contracts.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">7</span>
              Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.
            </p>
          </section>
        </div>

        {/* Contact Strip */}
        <div className="mt-8 text-center text-xs text-[#64748B] dark:text-slate-400">
          Questions regarding our Terms? Contact our compliance desk at{" "}
          <a href="mailto:support@fleetpulse.io" className="text-[#2F8E86] font-semibold hover:underline">
            support@fleetpulse.io
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-[#64748B] dark:text-slate-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} FleetPulse TMS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-[#111827] dark:hover:text-white font-medium">Terms</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#111827] dark:hover:text-white font-medium">Privacy Policy</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-[#111827] dark:hover:text-white font-medium">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
