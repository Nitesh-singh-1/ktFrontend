"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");

    if (!loggedIn) {
      router.push("/login");
    } else {
      setIsAuth(true);
    }
  }, [router]);

  if (isAuth === null) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div
        className={`flex-1 flex flex-col min-h-screen bg-slate-50 transition-all duration-300 ease-in-out
        ${isOpen ? "ml-64" : "ml-20"}`}
      >
        <Navbar />

        <main className="flex-1 p-6 lg:p-8 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}