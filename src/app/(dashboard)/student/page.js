"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  ArrowRight,
  FolderOpen,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    submitted: 0,
    overdue: 0,
    upcoming: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get("/api/student/assignments");
        if (response.success) {
          const assignments = response.data.assignments;
          const pending = assignments.filter(a => a.submission_status === "pending").length;
          const submitted = assignments.filter(a => a.submission_status === "submitted").length;
          const overdue = assignments.filter(a => a.submission_status === "overdue").length;
          
          // Get next 3 upcoming pending assignments
          const upcoming = assignments
            .filter(a => a.submission_status === "pending")
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .slice(0, 3);

          setStats({ pending, submitted, overdue, upcoming });
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { 
      title: "Pending", 
      value: stats.pending, 
      icon: Clock, 
      color: "text-blue-600", 
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-100 dark:border-blue-800"
    },
    { 
      title: "Submitted", 
      value: stats.submitted, 
      icon: CheckCircle2, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-100 dark:border-emerald-800"
    },
    { 
      title: "Overdue", 
      value: stats.overdue, 
      icon: AlertCircle, 
      color: "text-red-600", 
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-100 dark:border-red-800"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
         <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Welcome back, {user?.first_name || "Student"}! 👋
            </h1>
            <p className="text-slate-400 max-w-md">
              You have {stats.pending} pending assignments to complete. Keep up the good work!
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
               <Button 
                 onClick={() => router.push("/student/assignments")}
                 className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-6 shadow-lg shadow-indigo-500/20 border-0"
               >
                 View Assignments
                 <ArrowRight className="ml-2 h-5 w-5" />
               </Button>
            </div>
         </div>
         {/* Abstract background shapes */}
         <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
         <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
        ) : (
          statCards.map((stat, i) => (
            <Card key={i} className={cn("border shadow-sm overflow-hidden rounded-2xl", stat.border)}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                  <p className={cn("text-4xl font-black", stat.color)}>{stat.value}</p>
                </div>
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner", stat.bg)}>
                  <stat.icon className={cn("h-8 w-8", stat.color)} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Assignments */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Clock className="h-6 w-6 text-indigo-600" />
                Upcoming Deadlines
              </h2>
              <Button variant="link" onClick={() => router.push("/student/assignments")} className="text-indigo-600 font-bold p-0">
                View All
              </Button>
           </div>

           {loading ? (
             <div className="space-y-4">
               {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />) }
             </div>
           ) : stats.upcoming.length === 0 ? (
             <Card className="border-dashed py-8">
               <CardContent className="flex flex-col items-center justify-center text-center space-y-2">
                 <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                 <p className="font-semibold">All caught up!</p>
                 <p className="text-sm text-slate-500">No pending assignments with upcoming deadlines.</p>
               </CardContent>
             </Card>
           ) : (
             <div className="space-y-4">
               {stats.upcoming.map((assignment) => (
                 <Card 
                   key={assignment.id} 
                   className="group hover:shadow-md transition-all border-slate-200/60 dark:border-slate-800/60 overflow-hidden cursor-pointer rounded-2xl"
                   onClick={() => router.push(`/student/assignments/${assignment.id}`)}
                 >
                    <CardContent className="p-5 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                             <BookOpen className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          </div>
                          <div className="space-y-0.5">
                             <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{assignment.title}</h4>
                             <p className="text-xs text-slate-500 flex items-center gap-1.5">
                               <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{assignment.subject?.name}</Badge>
                               <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                             </p>
                          </div>
                       </div>
                       <Button size="sm" variant="ghost" className="rounded-full h-8 w-8 p-0">
                          <ChevronRight className="h-5 w-5" />
                       </Button>
                    </CardContent>
                 </Card>
               ))}
             </div>
           )}
        </div>

        {/* Quick Links / Quick Info */}
        <div className="space-y-6">
           <h2 className="text-2xl font-bold tracking-tight">Quick Access</h2>
           <div className="grid grid-cols-1 gap-4">
              <Button 
                variant="outline" 
                className="h-20 justify-start px-6 rounded-2xl border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/30 group transition-all"
                onClick={() => router.push("/student/submissions")}
              >
                 <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                   <FolderOpen className="h-5 w-5 text-indigo-600" />
                 </div>
                 <div className="text-left">
                   <p className="font-bold">My Submissions</p>
                   <p className="text-xs text-slate-500">Check your grades</p>
                 </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-20 justify-start px-6 rounded-2xl border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/30 group transition-all"
                onClick={() => router.push("/profile")}
              >
                 <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                   <TrendingUp className="h-5 w-5 text-purple-600" />
                 </div>
                 <div className="text-left">
                   <p className="font-bold">My Performance</p>
                   <p className="text-xs text-slate-500">View analytics</p>
                 </div>
              </Button>
           </div>

           <Card className="bg-slate-50 dark:bg-slate-900/50 border-0 rounded-3xl overflow-hidden mt-6">
              <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                 <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                   Contact the academic coordinator if you have issues with your assignments.
                 </p>
                 <Button variant="link" className="p-0 h-auto text-indigo-600 font-bold flex items-center gap-2">
                    Academic Policy
                    <ExternalLink className="h-3 w-3" />
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
