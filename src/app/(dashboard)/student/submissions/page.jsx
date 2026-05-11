"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Search, 
  Trophy, 
  Calendar, 
  Clock, 
  ChevronRight,
  ExternalLink,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function StudentSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/student/submissions");
      if (response.success) {
        setSubmissions(response.submissions);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const filteredSubmissions = submissions.filter(s => 
    s.assignment?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.assignment?.subject?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            My Submissions
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            History of your submitted work and grades
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by assignment or subject..."
              className="pl-9 bg-white dark:bg-slate-950"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submission List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="border-dashed border-2 py-12">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold">No submissions found</h3>
            <p className="text-slate-500 max-w-xs">
              You haven't submitted any assignments yet. 
              Start by checking your active assignments!
            </p>
            <Button 
              className="bg-indigo-600" 
              onClick={() => router.push("/student/assignments")}
            >
              Go to Assignments
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => (
            <Card 
              key={submission.id} 
              className="group hover:shadow-md transition-all duration-300 border-slate-200/60 dark:border-slate-800/60 overflow-hidden cursor-pointer"
              onClick={() => router.push(`/student/assignments/${submission.assignment_id}`)}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-stretch">
                   {/* Left status bar */}
                   <div className={cn(
                     "w-full md:w-2 min-h-[4px] md:min-h-0",
                     submission.status === "graded" ? "bg-emerald-500" : "bg-blue-500"
                   )} />

                   <div className="flex-1 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                             {submission.assignment?.subject?.name}
                           </Badge>
                           {submission.is_late && (
                             <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-100 text-[10px]">LATE</Badge>
                           )}
                        </div>
                        <h3 className="text-lg font-bold group-hover:text-indigo-600 transition-colors">
                          {submission.assignment?.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                           <span className="flex items-center gap-1">
                             <Calendar className="h-3.5 w-3.5" />
                             Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                           </span>
                           <span className="flex items-center gap-1">
                             <Clock className="h-3.5 w-3.5" />
                             {new Date(submission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto gap-4 md:gap-1">
                         {submission.status === "graded" ? (
                           <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Grade</p>
                              <p className="text-2xl font-black text-emerald-600">
                                {submission.obtained_marks}
                                <span className="text-sm text-slate-400 font-normal"> / {submission.assignment?.total_marks}</span>
                              </p>
                           </div>
                         ) : (
                           <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100">
                             Pending Review
                           </Badge>
                         )}
                         
                         <Button variant="ghost" size="sm" className="text-slate-400 group-hover:text-indigo-600 rounded-full h-8 w-8 p-0">
                           <ChevronRight className="h-5 w-5" />
                         </Button>
                      </div>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
