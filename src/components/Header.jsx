//src/components/Header.jsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  ChevronDown, 
  Menu as MenuIcon, 
  X, 
  Settings, 
  LogOut, 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header({ mobileOpen, setMobileOpen }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    const userRole = user?.role?.toUpperCase();
    const rolePath = userRole?.toLowerCase().replace("_", "-");
    router.push(`/${rolePath}/profile`);
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Get page title based on pathname
  const getPageTitle = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 1) return "Dashboard Overview";
    
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ');
  }, [pathname]);

  const getBreadcrumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '));
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getUserInitials = () => {
    const name = user?.fullName || user?.name || "User";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
      <div className="flex h-20 items-center justify-between px-6 lg:px-8">
        
        {/* Left Section: Title & Breadcrumbs */}
        <div className="flex flex-col animate-in fade-in slide-in-from-top-2 duration-500">
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
              <Link href="/" className="hover:text-indigo-600 transition-colors">Adamjee</Link>
              <ChevronDown className="w-2.5 h-2.5 -rotate-90" />
              <span className="text-slate-600 dark:text-slate-400">{getBreadcrumbs[0]}</span>
           </div>
           <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {getPageTitle}
           </h1>
        </div>

        {/* Center Section: Spacer */}
        <div className="flex-1" />

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5 text-slate-600" /> : <MenuIcon className="w-5 h-5 text-slate-600" />}
          </Button>

          {/* Quick Actions (Desktop) */}
          <div className="hidden sm:flex items-center gap-1">
             {/* <ThemeToggle /> */}
             <NotificationBell />
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-300 ring-1 ring-transparent hover:ring-slate-200/50 dark:hover:ring-slate-800 group"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                  {getUserInitials()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 shadow-sm" />
              </div>

              <div className="hidden md:flex flex-col text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                  {user?.fullName || "User Account"}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">
                      {user?.role?.replace("_", " ")}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "w-3 h-3 text-slate-400 transition-transform duration-300",
                    isDropdownOpen && "rotate-180"
                  )} />
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                   <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Signed in as</p>
                   <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.email}</p>
                </div>

                <div className="p-2 space-y-1">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span>My Profile</span>
                  </button>

                  <button
                    className="flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span>Account Settings</span>
                  </button>
                </div>

                <div className="px-2 pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center w-full gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
