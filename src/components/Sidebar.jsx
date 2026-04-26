//src/components/Sidebar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  School,
  Clock,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  FolderOpen,
  Calendar,
  CalendarDays,
  Wallet,
  BarChart3,
  Briefcase,
  Receipt,
  Building2,
  UserCheck,
  UserCog,
  GraduationCap,
  QrCode,
  ChevronRight,
  Library,
  Grid3X3,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

/* ===================== MENU CONFIG ===================== */

const ROLE_MENUS = {
  super_admin: [
    {
      category: "Overview",
      items: [
        { name: "Dashboard", path: "/super-admin", icon: LayoutDashboard },
      ],
    },
    {
      category: "Branch Management",
      items: [
        {
          name: "All Branches",
          path: "/super-admin/branch-management/branches",
          icon: FolderOpen,
        },
        // {
        //   name: "Library",
        //   path: "/super-admin/library",
        //   icon: Library,
        // }
      ],
    },
    {
      category: "User Management",
      items: [
        {
          name: "Administrators",
          path: "/super-admin/user-management/administrators",
          icon: UserCog,
        },
        // {
        //   name: "Parents",
        //   path: "/super-admin/user-management/parents",
        //   icon: UserCheck,
        // },
        {
          name: "Staff",
          path: "/super-admin/staff",
          icon: Users,
        },
      ],
    },
    {
      category: "Academic",
      items: [
        {
          name: "Academic Management",
          path: "/super-admin/academic",
          icon: GraduationCap,
        },
        { name: "Timetable", path: "/super-admin/timetable", icon: Clock },
        { name: "Exam Management", path: "/super-admin/exams", icon: FileText },
      ],
    },
    // {
    //   category: "Library Management",
    //   isCollapsible: true,
    //   items: [
    //     {
    //       name: "Library Books",
    //       path: "/super-admin/library",
    //       icon: BookOpen,
    //     },
    //   ],
    // },
    {
      category: "Student Management",
      isCollapsible: true,
      items: [
        {
          name: "All Students",
          path: "/super-admin/student-management/students",
          icon: Users,
        },
      ],
    },
    {
      category: "Teacher Management",
      isCollapsible: true,
      items: [
        {
          name: "All Teachers",
          path: "/super-admin/teacher-management/teachers",
          icon: Users,
        },
      ],
    },
    {
      category: "Fee Management",
      isCollapsible: true,
      items: [
        {
          name: "Fee Templates",
          path: "/super-admin/fee-management/templates",
          icon: Receipt,
        },
        {
          name: "Fee Voucher",
          path: "/super-admin/fee-vouchers",
          icon: Receipt,
        },
        { name: "Expenses", path: "/super-admin/expenses", icon: Wallet },

      ],
    },
    {
      category: "Attendance",
      isCollapsible: true,
      items: [
        {
          name: "Attendance QR Code",
          path: "/super-admin/attendance",
          icon: QrCode,
        },
        {
          name: "Staff Attendance",
          path: "/super-admin/staff-attendance",
          icon: UserCheck,
        },
      ],
    },
    {
      category: "Event Management",
      isCollapsible: true,
      items: [
        {
          name: "Calendar View",
          path: "/super-admin/event-management/calendar",
          icon: Calendar,
        },
        {
          name: "All Events",
          path: "/super-admin/event-management/events",
          icon: Calendar,
        },
      ],
    },
    {
      category: "Notifications",
      items: [
        {
          name: "Notifications",
          path: "/super-admin/notifications",
          icon: Calendar,
        },
      ],
    },
    {
      category: "System",
      items: [
        {
          name: "Settings",
          path: "/super-admin/settings",
          icon: Settings,
        },
      ],
    },
    {
      category: "Salary Management",
      isCollapsible: true,
      items: [
        {
          name: "Payroll",
          path: "/super-admin/salary-management/payroll",
          icon: Wallet,
        },
        {
          name: "Employee Attendance",
          path: "/super-admin/salary-management/employee-attendance",
          icon: UserCheck,
        },
      ],
    },
  ],

  branch_admin: [
    {
      category: "Dashboard",
      items: [
        { name: "Dashboard", path: "/branch-admin", icon: LayoutDashboard },
      ],
    },
    {
      category: "Academic",
      isCollapsible: true,
      items: [
        { name: "Academic Management", path: "/branch-admin/academic", icon: GraduationCap },
        { name: "Timetable", path: "/branch-admin/timetable", icon: Clock },
        { name: "Syllabus", path: "/branch-admin/syllabus", icon: FileText },
        { name: "Departments", path: "/branch-admin/departments", icon: Building2 },
        { name: "Academic Structure", path: "/branch-admin/academic-structure", icon: LayoutDashboard },
      ],
    },
    {
      category: "User Management",
      isCollapsible: true,
      items: [
        { name: "Staff", path: "/branch-admin/staff", icon: Users },
        // { name: "Parents", path: "/branch-admin/parents", icon: UserCheck },
      ],
    },
    {
      category: "Student Management",
      isCollapsible: true,
      items: [
        { name: "Students", path: "/branch-admin/students", icon: Users },
      ],
    },
    {
      category: "Teacher Management",
      isCollapsible: true,
      items: [
        { name: "Teachers", path: "/branch-admin/teachers", icon: Users },
      ],
    },
    // {
    //   category: "Library Management",
    //   isCollapsible: true,
    //   items: [
    //     { name: "Library Books", path: "/branch-admin/library", icon: BookOpen },
    //   ],
    // },
    {
      category: "Attendance",
      isCollapsible: true,
      items: [
        { name: "Student Attendance", path: "/branch-admin/attendance", icon: Clock },
        { name: "Staff Attendance", path: "/branch-admin/staff-attendance", icon: UserCheck },
      ],
    },
    {
      category: "Operations",
      isCollapsible: true,
      items: [
        { name: "Events", path: "/branch-admin/events", icon: Calendar },
        { name: "Exams", path: "/branch-admin/exams", icon: FileText },
      ],
    },
    {
      category: "Notifications",
      items: [
        { name: "Notifications", path: "/branch-admin/notifications", icon: Calendar },
      ],
    },
    {
      category: "System",
      items: [
        { name: "Settings", path: "/branch-admin/settings", icon: Settings },
      ],
    },
    {
      category: "Finance Management",
      isCollapsible: true,
      items: [
        { name: "Fee Voucher", path: "/branch-admin/fee-vouchers", icon: Receipt },
        { name: "Fee Templates", path: "/branch-admin/fee-templates", icon: Receipt },
        { name: "Expenses", path: "/branch-admin/expenses", icon: Wallet },
      ],
    },
    {
      category: "Salary Management",
      isCollapsible: true,
      items: [
        {
          name: "Payroll",
          path: "/branch-admin/salary-management/payroll",
          icon: Wallet,
        },
        {
          name: "Employee Attendance",
          path: "/branch-admin/salary-management/employee-attendance",
          icon: UserCheck,
        },
      ],
    },
  ],

  teacher: [
    {
      category: "Dashboard",
      items: [{ name: "Dashboard", path: "/teacher", icon: LayoutDashboard }],
    },
    {
      category: "Classes",
      isCollapsible: true,
      items: [
        { name: "My Classes", path: "/teacher/classes", icon: School },
        { name: "Assignments", path: "/teacher/assignments", icon: FileText },
        { name: "Attendance", path: "/teacher/attendance", icon: Clock },
        { name: "Self Attendance", path: "/teacher/self-attendance", icon: UserCheck },
        { name: "Exams", path: "/teacher/exams", icon: Calendar },
        { name: "Results", path: "/teacher/results", icon: BarChart3 },
      ],
    },
    {
      category: "Communication",
      isCollapsible: true,
      items: [
        {
          name: "Parent Contact",
          path: "/teacher/parent-contact",
          icon: Users,
        },
      ],
    },
    {
      category: "Account",
      isCollapsible: true,
      items: [
        { name: "Profile", path: "/teacher/profile", icon: UserCog },
        { name: "Settings", path: "/teacher/settings", icon: Settings },
      ],
    },
    {
      category: "Salary",
      isCollapsible: true,
      items: [
        { name: "Payroll", path: "/teacher/payroll", icon: Wallet, }
      ],
    },
  ],

  parent: [
    {
      category: "Dashboard",
      items: [{ name: "Dashboard", path: "/parent", icon: LayoutDashboard }],
    },
    {
      category: "Student Info",
      isCollapsible: true,
      items: [
        { name: "My Children", path: "/parent/children", icon: Users },
        { name: "Attendance", path: "/parent/attendance", icon: Clock },
        { name: "Results", path: "/parent/results", icon: BarChart3 },
        { name: "Fee Status", path: "/parent/fees", icon: DollarSign },
        { name: "Notifications", path: "/parent/notifications", icon: Calendar },
      ],
    },
  ],

  student: [
    {
      category: "Dashboard",
      items: [{ name: "Dashboard", path: "/student", icon: LayoutDashboard }],
    },
    {
      category: "Academics",
      isCollapsible: true,
      items: [
        { name: "My Classes", path: "/student/classes", icon: School },
        { name: "Attendance", path: "/student/attendance", icon: Clock },
        { name: "Exams", path: "/student/exams", icon: FileText },
        { name: "Results", path: "/student/results", icon: BarChart3 },
      ],
    },
    {
      category: "Account",
      isCollapsible: true,
      items: [
        { name: "Profile", path: "/student/profile", icon: Users },
        { name: "Messages", path: "/student/messages", icon: FileText },
        { name: "Settings", path: "/student/settings", icon: Settings },
      ],
    },
  ],
};

/* ===================== SIDEBAR ===================== */
export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  /* ---------- Persisted States ---------- */
  const [isOpen, setIsOpen] = useState(true);
  const [expanded, setExpanded] = useState({});

  /* ---------- Restore sidebar state ---------- */
  useEffect(() => {
    const savedOpen = localStorage.getItem("sidebar-open");
    const savedExpanded = localStorage.getItem("sidebar-expanded");

    if (savedOpen !== null) setIsOpen(savedOpen === "true");
    if (savedExpanded) setExpanded(JSON.parse(savedExpanded));
  }, []);

  /* ---------- Save sidebar state ---------- */
  useEffect(() => {
    localStorage.setItem("sidebar-open", isOpen);
    localStorage.setItem("sidebar-expanded", JSON.stringify(expanded));
  }, [isOpen, expanded]);

  const role = (user?.role || "student").toLowerCase();
  const menus = ROLE_MENUS[role] || ROLE_MENUS.student;

  /* ---------- Auto expand active section ---------- */
  useEffect(() => {
    menus.forEach((group) => {
      if (
        group.items.some(
          (item) =>
            pathname === item.path ||
            (item.name !== 'Dashboard' && pathname.startsWith(item.path + "/"))
        )
      ) {
        setExpanded((prev) => ({
          ...prev,
          [group.category]: true,
        }));
      }
    });
  }, [pathname, menus]);

  if (!user) return null;

  const toggleSection = (key) =>
    setExpanded((p) => ({ ...p, [key]: !p[key] }));

  /* ===================== UI ===================== */

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out",
          "bg-white border-r border-gray-200",
          "top-0 h-screen md:top-0 md:h-screen",
          "md:w-auto",
          isOpen ? "w-72" : "w-20",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo & Toggle */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200">
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-base text-gray-900">Adamjee Coaching</h2>
                <p className="text-xs text-gray-500">Coaching Management</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Mobile Close Button */}
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden h-9 w-9 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </Button>
            {/* Desktop Toggle Button */}
            <Button
              size="icon"
              variant="ghost"
              className="hidden md:flex h-9 w-9 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Menu size={20} />
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-base shadow-md">
                {user.fullName?.[0]}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-500 capitalize font-medium">{role.replace("_", " ")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {menus.map((group) => {
            const open = expanded[group.category];
            const hasActive = group.items.some((i) => pathname.startsWith(i.path));

            return (
              <div key={group.category} className="mb-3">
                {isOpen && (
                  <button
                    onClick={() => group.isCollapsible && toggleSection(group.category)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 mb-1 text-xs font-bold uppercase tracking-wide rounded-lg transition-colors",
                      group.isCollapsible ? "cursor-pointer" : "cursor-default",
                      hasActive ? "text-indigo-600" : "text-gray-400"
                    )}
                  >
                    <span>{group.category}</span>
                    {group.isCollapsible && (
                      <ChevronRight
                        size={14}
                        className={cn("transition-transform duration-200", open && "rotate-90")}
                      />
                    )}
                  </button>
                )}

                {(!group.isCollapsible || open || !isOpen) && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.path || (item.name !== 'Dashboard' && pathname.startsWith(item.path + "/"));

                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          scroll={false}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                              : "text-gray-700 hover:bg-gray-100",
                            !isOpen && "justify-center"
                          )}
                        >
                          <Icon size={19} className={cn("transition-transform", !isActive && "group-hover:scale-110")} />
                          {isOpen && <span className="truncate">{item.name}</span>}

                          {/* Tooltip for collapsed state */}
                          {!isOpen && (
                            <div className="fixed left-24 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[9999] shadow-2xl pointer-events-none">
                              {item.name}
                              <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-gray-900"></div>
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-200 px-3 py-3">
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "w-full rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors",
              isOpen ? "justify-start" : "justify-center"
            )}
            title={!isOpen ? "Logout" : undefined}
          >
            <LogOut size={19} />
            {isOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </>
  );
}