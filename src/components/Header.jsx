"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Search, User, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";

export default function Header({ mobileOpen, setMobileOpen }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    // Directly use the correct path based on role
    const userRole = user?.role?.toUpperCase();
    if (userRole === "SUPER_ADMIN") {
      router.push("/super-admin/profile");
    } else if (userRole === "BRANCH_ADMIN") {
      router.push("/branch-admin/profile");
    } else if (userRole === "TEACHER") {
      router.push("/teacher/profile");
    } else if (userRole === "PARENT") {
      router.push("/parent/profile");
    } else if (userRole === "STUDENT") {
      router.push("/student/profile");
    } else {
      router.push("/profile");
    }
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
  const getPageTitle = () => {
    if (pathname.includes("/super-admin")) {
      return pathname.includes("/profile")
        ? "My Profile"
        : "Super Admin Dashboard";
    }
    if (pathname.includes("/branch-admin")) {
      return pathname.includes("/profile") ? "My Profile" : "Branch Dashboard";
    }
    if (pathname.includes("/teacher")) {
      return pathname.includes("/profile") ? "My Profile" : "Teacher Dashboard";
    }
    if (pathname.includes("/parent")) {
      return pathname.includes("/profile") ? "My Profile" : "Parent Dashboard";
    }
    if (pathname.includes("/student")) {
      return pathname.includes("/profile") ? "My Profile" : "Student Dashboard";
    }

    const role = user?.role || "";
    return `${role.charAt(0).toUpperCase() + role.slice(1).replace("_", " ")} Dashboard`;
  };

  // Get welcome message
  const getWelcomeMessage = () => {
    const firstName =
      user?.fullName?.split(" ")[0] || user?.name?.split(" ")[0] || "User";
    return `Welcome back, ${firstName}`;
  };

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

  // Get user initials
  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName.charAt(0).toUpperCase();
    }
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <header
      className={cn(
        "bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm",
        mobileOpen && "md:block hidden",
      )}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Page Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            {getPageTitle()}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">
            {getWelcomeMessage()}
          </p>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          {/* Mobile Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-gray-100 h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            ) : (
              <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            )}
          </Button>

          {/* Search */}
          <div className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-48 lg:w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-gray-100 h-8 w-8 sm:h-9 sm:w-9"
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 rounded-lg px-2 sm:px-3 py-2 transition-colors min-w-0"
            >
              {/* User Avatar */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                {getUserInitials()}
              </div>

              {/* User Info - Hidden on mobile */}
              <div className="hidden md:block text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[100px] lg:max-w-[120px]">
                  {user?.fullName || user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role?.replace("_", " ") || "Role"}
                </p>
              </div>

              <ChevronDown
                className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                {/* Profile Option - Hidden for teachers */}
                {user?.role?.toUpperCase() !== "TEACHER" && (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-5 h-5 mr-3 text-gray-500">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-medium">Profile</span>
                    </Link>

                    {/* Divider */}
                    <div className="border-t border-gray-100 mx-3 my-1"></div>
                  </>
                )}

                <button
                  onClick={handleLogoutClick}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <div className="w-5 h-5 mr-3">
                    <svg
                      className="h-4 w-4 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
