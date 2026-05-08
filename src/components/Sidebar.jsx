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
  Wallet,
  BarChart3,
  Building2,
  UserCheck,
  UserCog,
  GraduationCap,
  QrCode,
  ChevronRight,
  Library,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Receipt,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";

/* ===================== MENU CONFIG ===================== */

const ROLE_MENUS = {
  super_admin: [
    {
      category: "Management",
      items: [
        { name: "Dashboard", path: "/super-admin", icon: LayoutDashboard },
        { name: "Branches", path: "/super-admin/branch-management/branches", icon: Building2 },
      ],
    },
    {
      category: "Personnel",
      items: [
        { name: "Admins", path: "/super-admin/user-management/administrators", icon: ShieldCheck },
        { name: "Staff", path: "/super-admin/staff", icon: UserCog },
        { name: "Teachers", path: "/super-admin/teacher-management/teachers", icon: Users },
      ],
    },
    {
      category: "Academic",
      items: [
        { name: "Academics", path: "/super-admin/academic", icon: GraduationCap },
        { name: "Timetable", path: "/super-admin/timetable", icon: Clock },
        { name: "Exams", path: "/super-admin/exams", icon: FileText },
      ],
    },
    {
      category: "Students",
      items: [
        { name: "Student List", path: "/super-admin/student-management/students", icon: Users },
      ],
    },
    {
      category: "Finance",
      isCollapsible: true,
      items: [
        { name: "Fee Vouchers", path: "/super-admin/fee-vouchers", icon: Receipt },
        { name: "Expenses", path: "/super-admin/expenses", icon: Wallet },
        { name: "Finance Reports", path: "/super-admin/reports", icon: BarChart3 },
      ],
    },
    {
      category: "Attendance",
      isCollapsible: true,
      items: [
        { name: "Student Attendance", path: "/super-admin/attendance", icon: QrCode },
        { name: "Staff Attendance", path: "/super-admin/staff-attendance", icon: UserCheck },
        { name: "Leaves", path: "/super-admin/leaves", icon: Calendar },
      ],
    },
    {
      category: "System",
      items: [
        { name: "Notifications", path: "/super-admin/notifications", icon: Sparkles },
      ],
    },
  ],

  branch_admin: [
    {
      category: "Overview",
      items: [
        { name: "Dashboard", path: "/branch-admin", icon: LayoutDashboard },
      ],
    },
    {
      category: "Academic",
      isCollapsible: true,
      items: [
        { name: "Academics", path: "/branch-admin/academic", icon: GraduationCap },
        { name: "Timetable", path: "/branch-admin/timetable", icon: Clock },
        { name: "Exams", path: "/branch-admin/exams", icon: FileText },
        { name: "Assignments", path: "/branch-admin/assignments", icon: FolderOpen },
      ],
    },
    {
      category: "Staff & Students",
      isCollapsible: true,
      items: [
        { name: "Staff", path: "/branch-admin/staff", icon: Users },
        { name: "Students", path: "/branch-admin/students", icon: Users },
        { name: "Teachers", path: "/branch-admin/teachers", icon: Users },
      ],
    },
    {
      category: "Attendance",
      isCollapsible: true,
      items: [
        { name: "Student Attendance", path: "/branch-admin/attendance", icon: QrCode },
        { name: "Staff Attendance", path: "/branch-admin/staff-attendance", icon: UserCheck },
        { name: "Leaves", path: "/branch-admin/leaves", icon: Calendar },
      ],
    },
    {
      category: "Finance",
      isCollapsible: true,
      items: [
        { name: "Fee Vouchers", path: "/branch-admin/fee-vouchers", icon: Receipt },
        { name: "Expenses", path: "/branch-admin/expenses", icon: Wallet },
        { name: "Finance Reports", path: "/branch-admin/reports", icon: BarChart3 },
      ],
    },
    {
      category: "System",
      items: [
        { name: "Notifications", path: "/branch-admin/notifications", icon: Sparkles },
      ],
    },
  ],

  teacher: [
    {
      category: "Overview",
      items: [{ name: "Dashboard", path: "/teacher", icon: LayoutDashboard }],
    },
    {
      category: "Academic",
      isCollapsible: true,
      items: [
        { name: "My Classes", path: "/teacher/classes", icon: School },
        { name: "Exams", path: "/teacher/exams", icon: Calendar },
        { name: "Self Attendance", path: "/teacher/self-attendance", icon: UserCheck },
      ],
    },
    // {
    //   category: "Communication",
    //   items: [
    //     { name: "Parent Contact", path: "/teacher/parent-contact", icon: Users },
    //   ],
    // },
    {
      category: "Account",
      items: [
        { name: "Profile", path: "/teacher/profile", icon: UserCog },
      ],
    },
  ],

  parent: [
    {
      category: "Overview",
      items: [{ name: "Dashboard", path: "/parent", icon: LayoutDashboard }],
    },
    {
      category: "Children info",
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
      category: "Overview",
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
  const menus = useMemo(() => ROLE_MENUS[role] || ROLE_MENUS.student, [role]);

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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky left-0 z-50 flex flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)",
          "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50",
          "top-0 h-[100dvh] md:top-0 md:h-screen shadow-2xl shadow-indigo-500/5",
          isOpen ? "w-64" : "w-[80px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-100/50 dark:border-slate-800/50">
          {isOpen ? (
            <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-4 duration-500 min-w-0">
              <div className="relative group flex-shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-10 h-10 rounded-xl bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center shadow-xl shadow-indigo-500/20">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="font-bold text-[15px] tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                  Adamjee <span className="text-indigo-600">Coaching</span>
                </h2>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">Management System</span>
              </div>
            </div>
          ) : (
            <div className="relative group mx-auto animate-in zoom-in duration-300">
               <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
               <div className="relative w-12 h-12 rounded-xl bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center shadow-xl">
                  <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
               </div>
            </div>
          )}
          
          {isOpen && (
            <Button
              size="icon"
              variant="ghost"
              className="hidden md:flex h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
              onClick={() => setIsOpen(false)}
            >
              <Menu size={18} />
            </Button>
          )}
        </div>

        {/* User Card */}
        {isOpen && (
          <div className="px-4 py-4">
            <div className="relative group p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-900/30 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-lg shadow-indigo-500/20 ring-2 ring-white dark:ring-slate-950">
                    {user.fullName?.[0]}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 ring-2 ring-emerald-500/20 animate-pulse"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate tracking-tight mb-0.5">{user.fullName}</p>
                  <div className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50">
                    <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider truncate">{role.replace("_", " ")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-6 custom-scrollbar scroll-smooth">
          {menus.map((group) => {
            const open = expanded[group.category];
            const hasActive = group.items.some((i) => pathname === i.path || (i.name !== 'Dashboard' && pathname.startsWith(i.path + "/")));

            return (
              <div key={group.category} className="space-y-1">
                {isOpen && (
                  <button
                    onClick={() => group.isCollapsible && toggleSection(group.category)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
                      group.isCollapsible ? "cursor-pointer hover:text-indigo-600" : "cursor-default",
                      hasActive ? "text-indigo-600" : "text-slate-400 dark:text-slate-500"
                    )}
                  >
                    <span>{group.category}</span>
                    {group.isCollapsible && (
                      <ChevronRight
                        size={12}
                        className={cn("transition-transform duration-300", open && "rotate-90")}
                      />
                    )}
                  </button>
                )}

                {(!group.isCollapsible || open || !isOpen) && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-300">
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
                            "group relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                            isActive
                              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/25 ring-1 ring-white/10"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-white",
                            !isOpen && "justify-center px-0 h-12 w-12 mx-auto"
                          )}
                        >
                          <Icon size={isActive ? 20 : 19} className={cn("transition-all duration-300", !isActive && "group-hover:scale-110 group-hover:text-indigo-600")} />
                          {isOpen && <span className="truncate tracking-tight">{item.name}</span>}
                          
                          {isActive && isOpen && (
                             <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                          )}

                          {/* Tooltip for collapsed state */}
                          {!isOpen && (
                            <div className="fixed left-[100px] px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap z-[9999] shadow-2xl pointer-events-none tracking-wide ring-1 ring-slate-200/20">
                              {item.name}
                              <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-900 dark:border-r-white"></div>
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

        {/* Footer Toggle (Desktop Collapsed) */}
        {!isOpen && (
           <div className="px-4 py-4 flex justify-center border-t border-slate-100 dark:border-slate-800/50">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                onClick={() => setIsOpen(true)}
              >
                <ArrowRight size={20} />
              </Button>
           </div>
        )}

        {/* Mobile Toggle & Logout */}
        <div className="mt-auto border-t border-slate-100/50 dark:border-slate-800/50 p-4 space-y-2">
          {mobileOpen && (
             <Button
                variant="ghost"
                onClick={() => setMobileOpen(false)}
                 className="w-full flex md:hidden items-center justify-start gap-3 px-4 h-12 text-slate-500 hover:text-slate-900 font-semibold rounded-xl"
             >
                <X size={20} />
                <span>Close Sidebar</span>
             </Button>
          )}

          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
               "group w-full h-12 rounded-xl text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 font-semibold transition-all duration-300",
              isOpen ? "justify-start px-4" : "justify-center px-0"
            )}
            title={!isOpen ? "Logout" : undefined}
          >
            <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
            {isOpen && <span className="ml-3 tracking-tight">Sign Out</span>}
          </Button>
        </div>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.2);
            border-radius: 20px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(99, 102, 241, 0.4);
          }
        `}</style>
      </aside>
    </>
  );
}