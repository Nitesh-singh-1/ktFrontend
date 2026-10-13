"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Database, EyeOff, FileCheck, CheckCircle2 } from "lucide-react";
import BrandLogo from "@/app/components/ui/BrandLogo";

export default function PrivacyPolicyPage() {
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
              href="/terms"
              className="text-xs font-semibold text-[#64748B] hover:text-[#2F8E86] dark:text-slate-400 transition"
            >
              Terms of Service
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-3 border border-emerald-200 dark:border-emerald-800">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#111827] dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-2">
            Last Updated: October 2026 • Safeguarding Commercial Logistics & Fleet Intelligence Data
          </p>
        </div>

        {/* Security Overview Callout */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-slate-800 shadow-xs mb-8 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
            <p className="font-semibold text-[#111827] dark:text-white mb-1">
              Your Data Stays Strictly Yours
            </p>
            FleetPulse is engineered with multi-tenant database isolation and 256-Bit SSL/TLS in-transit encryption. We never sell, monetize, or share your proprietary consignment rates, bilty registers, customer lists, or financial data with third-party marketers or competitors.
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6 sm:space-y-8 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-10 border border-[#E2E8F0] dark:border-slate-800 shadow-xs text-xs sm:text-sm leading-relaxed text-[#334155] dark:text-slate-300">
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">1</span>
              Information We Collect
            </h2>
            <p>
              When your organization utilizes FleetPulse, we collect operational data necessary to perform logistics and transport billing tasks, including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#475569] dark:text-slate-400">
              <li><strong>User & Account Data:</strong> Usernames, employee contact emails, phone numbers, branch affiliations, and system role permissions.</li>
              <li><strong>Consignment & Bilty Information:</strong> Consignor and consignee names, addresses, GSTIN numbers, cargo commodity descriptions, packages, weights, and freight charge breakups.</li>
              <li><strong>Fleet & Trip Telemetry:</strong> Vehicle registration numbers, driver contact numbers, driver license references, trip route origin/destinations, and vehicle hire contracts.</li>
              <li><strong>Financial & Settlement Data:</strong> Money receipts, payment settlement modes (Cash, Cheque, UPI, Bank Transfer), transaction reference numbers, and GST tax invoice details.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">2</span>
              How Your Information Is Used
            </h2>
            <p>
              We process operational data exclusively for platform execution:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#475569] dark:text-slate-400">
              <li>Issuing and printing standardized Bilty / GR copies, loading challans, and delivery memos.</li>
              <li>Generating GST-compliant freight bills, automated tax reports, and party outstanding ledgers.</li>
              <li>Tracking live dispatches, delivery milestones, and proof of delivery (POD) acknowledgments.</li>
              <li>Authenticating user sessions and providing role-based security across multiple branch locations.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">3</span>
              Multi-Tenant Architecture & Data Isolation
            </h2>
            <p>
              FleetPulse operates on a multi-tenant architecture where entity records implement tenant-scoped filters. Each tenant&apos;s data is compartmentalized in the database:
            </p>
            <p>
              Users belonging to Transporter A have zero visibility or programmatic access to shipments, rates, customers, or bills generated by Transporter B.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">4</span>
              256-Bit SSL/TLS Encryption & Data Security
            </h2>
            <p>
              All communication between your client devices (smartphones, office desktops, thermal printers) and FleetPulse servers is encrypted using industry-standard 256-Bit SSL/TLS (Transport Layer Security).
            </p>
            <p>
              Authentication tokens and passwords are cryptographically hashed, and database backups are encrypted at rest to safeguard against unauthorized access or data exfiltration.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">5</span>
              Third-Party Integrations
            </h2>
            <p>
              When enabled by your workspace administrator, data may be transmitted to authorized third-party service providers solely to perform requested actions:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#475569] dark:text-slate-400">
              <li>Transactional SMS / WhatsApp service providers for consignment tracking alerts.</li>
              <li>Statutory government E-Way Bill / e-Invoice authentication APIs.</li>
              <li>Secure cloud storage infrastructure for archiving scanned POD delivery receipts.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#2F8E86] text-xs font-bold flex items-center justify-center dark:bg-slate-800">6</span>
              Data Retention, Export & Ownership
            </h2>
            <p>
              Your organization retains full legal ownership of your business data. Authorized administrators may export consignment ledgers, bilty registers, and financial statements in Excel / CSV / PDF formats at any time. Upon formal workspace termination, data is archived or purged in accordance with statutory accounting retention requirements.
            </p>
          </section>
        </div>

        {/* Contact Strip */}
        <div className="mt-8 text-center text-xs text-[#64748B] dark:text-slate-400">
          Have privacy questions or need data assistance? Reach out to our Data Protection Officer at{" "}
          <a href="mailto:privacy@fleetpulse.io" className="text-[#2F8E86] font-semibold hover:underline">
            privacy@fleetpulse.io
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-[#64748B] dark:text-slate-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} FleetPulse TMS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-[#111827] dark:hover:text-white font-medium">Terms of Service</Link>
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
