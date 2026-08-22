"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../../../services/authService";

const LoginPage = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");


    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    try {
      setLoading(true);


      const res = await authService.login({ username, password });
      if (res.success) {

        localStorage.setItem("isLoggedIn", "true");


        router.push("/dashboard");
      } else {
        setError("Invalid credentials");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "Failed to connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col">


      <header className="w-full top-0 sticky bg-[#f7f9fb] z-50">
        <nav className="flex justify-between items-center px-8 py-4 w-full max-w-screen-2xl mx-auto">
          <div className="text-2xl font-bold tracking-tighter text-[#002e5d]">
            Kesari Transports
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-grow relative flex items-center justify-center overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover grayscale-[20%] contrast-[110%] brightness-[40%]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdiu8qB7jZYiXOVTdU7ymwrTW9PRu1_FafGK9qyq1JUE9B1xxBhd_0rNXqT-hCg3iY_VcWEqi_7RlW4tsB8yjLwEqXCrMhKrZz8kz3fF6JSZ1Gd--aUGRmq15vOexhtHBY2JGqGLFb_eJAfDhBMlG9p_B2ncYYm4O-tBe2DY_TZa07yeWHRaiabSEUGdctTJOf9D9316e2ulATyQk_05jiWjV02tuWYyGQywsdvVGFYDwQinpYJHBeLusPbpYBV2Rk54nCfWfb_R8"
            alt="truck"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl px-6 grid md:grid-cols-12 gap-0 items-stretch">

          {/* Left Side */}
          <div className="hidden md:flex md:col-span-7 flex-col justify-center pr-12 text-white">
            <h1 className="text-6xl lg:text-8xl font-extrabold tracking-tighter mb-6 leading-[0.9]">
              PRECISION <br />
              <span className="text-purple-300">IN MOTION.</span>
            </h1>
            <p className="text-lg opacity-80 max-w-md font-medium tracking-wide">
              Access your logistics dashboard to manage global fleet operations
              with precision.
            </p>
          </div>

          {/* Right Side (Form) */}
          <div className="md:col-span-5">
            <div className="bg-white/90 backdrop-blur-lg rounded-xl p-8 lg:p-12 shadow-2xl border border-white/50">

              <div className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  System Login
                </h2>
                <p className="text-gray-500 mt-2 text-sm">
                  Enter your credentials to access the secure network.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>

                {/* Username */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-indigo-700 ml-1">
                    Username or Email
                  </label>
                  <input
                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200"
                    placeholder="admin@kesari.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-indigo-700 ml-1">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {/* Remember */}
                <div className="flex items-center justify-between py-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-indigo-600" />
                    <span className="text-sm text-gray-600">
                      Remember Me
                    </span>
                  </label>

                  <a className="text-sm font-semibold text-indigo-600 hover:text-purple-600 transition-colors cursor-pointer">
                    Forgot Password?
                  </a>
                </div>

                {/* ❗ Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
                >
                  {loading ? "Logging in..." : "Login →"}
                </button>
              </form>

              <div className="mt-10 pt-8 border-t text-center">
                <p className="text-sm text-gray-500">
                  New to the fleet?{" "}
                  <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Contact Administrator
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-8">
          <span className="font-bold text-[#002e5d] text-sm">
            Kesari Transports
          </span>

          <div className="text-xs text-gray-500 mt-4 md:mt-0">
            © 2024 Kesari Transports
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;