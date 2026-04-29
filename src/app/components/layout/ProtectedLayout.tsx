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
  const [isOpen, setIsOpen] = useState(true); // 🔥 sidebar state

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");

    if (!loggedIn) {
      router.push("/login");
    } else {
      setIsAuth(true);
    }
  }, [router]);

  if (isAuth === null) return null; // prevent flicker

  return (
    <div className="flex">
  <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

  <main
    className={`flex-1 transition-all duration-300 p-6
    ${isOpen ? "ml-64" : "ml-16"}`}
  >
    {children}
  </main>
</div>
  );
}