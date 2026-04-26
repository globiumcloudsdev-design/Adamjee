"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  FileText,
  Download,
} from "lucide-react";
import DashboardSkeleton from "@/components/teacher/DashboardSkeleton";

export default function TeacherResultsPage() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("all");

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockResults = {
        overview: {
          totalExams: 12,
          averageScore: 78,
          highestScore: 98,
          lowestScore: 42,
          passRate: 85,
        },
        classResults: [
          {
            _id: "1",
            className: "Mathematics 101",
            examTitle: "Mid-term Exam",
            date: new Date(Date.now() - 86400000 * 5).toISOString(),
            totalStudents: 30,
            appeared: 28,
            passed: 25,
            failed: 3,
            average: 82,
            highest: 98,
            lowest: 45,
            passRate: 89,
          },
          {
            _id: "2",
            className: "Physics 201",
            examTitle: "Final Exam",
            date: new Date(Date.now() - 86400000 * 10).toISOString(),
            totalStudents: 25,
            appeared: 25,
            passed: 20,
            failed: 5,
            average: 75,
            highest: 95,
            lowest: 38,
            passRate: 80,
          },
          {
            _id: "3",
            className: "Chemistry 301",
            examTitle: "Quiz 1",
            date: new Date(Date.now() - 86400000 * 3).toISOString(),
            totalStudents: 28,
            appeared: 27,
            passed: 24,
            failed: 3,
            average: 78,
            highest: 92,
            lowest: 42,
            passRate: 89,
          },
          {
            _id: "4",
            className: "Biology 401",
            examTitle: "Mid-term Exam",
            date: new Date(Date.now() - 86400000 * 7).toISOString(),
            totalStudents: 22,
            appeared: 22,
            passed: 19,
            failed: 3,
            average: 80,
            highest: 96,
            lowest: 48,
            passRate: 86,
          },
        ],
        topPerformers: [
          {
            name: "Ahmed Ali",
            class: "Mathematics 101",
            score: 98,
            percentage: 98,
          },
          {
            name: "Ayesha Malik",
            class: "Biology 401",
            score: 96,
            percentage: 96,
          },
          {
            name: "Sara Hussain",
            class: "Physics 201",
            score: 95,
            percentage: 95,
          },
        ],
      };

      setResults(mockResults);
    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const { overview, classResults, topPerformers } = results;

  const filteredResults =
    selectedClass === "all"
      ? classResults
      : classResults.filter((r) => r.className === selectedClass);

  const uniqueClasses = [...new Set(classResults.map((r) => r.className))];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Results & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            View and analyze exam results
          </p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-sm text-muted-foreground">Total Exams</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {overview.totalExams}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <span className="text-sm text-muted-foreground">Avg Score</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {overview.averageScore}%
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-sm text-muted-foreground">Highest</span>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {overview.highestScore}%
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-8 h-8 text-red-600" />
            <span className="text-sm text-muted-foreground">Lowest</span>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {overview.lowestScore}%
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-orange-600" />
            <span className="text-sm text-muted-foreground">Pass Rate</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {overview.passRate}%
          </p>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Top Performers</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {topPerformers.map((student, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold">{student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.class}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600">
                    {student.percentage}%
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Class Filter */}
      <div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Classes</option>
          {uniqueClasses.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
      </div>

      {/* Class Results */}
      <div className="space-y-4">
        {filteredResults.map((result, index) => (
          <motion.div
            key={result._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">{result.examTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    {result.className}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(result.date).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  className={
                    result.passRate >= 80
                      ? "bg-green-500"
                      : result.passRate >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }
                >
                  {result.passRate}% Pass Rate
                </Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Appeared</p>
                  <p className="text-xl font-bold">
                    {result.appeared}/{result.totalStudents}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Passed</p>
                  <p className="text-xl font-bold text-green-600">
                    {result.passed}
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Failed</p>
                  <p className="text-xl font-bold text-red-600">
                    {result.failed}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Average</p>
                  <p className="text-xl font-bold text-blue-600">
                    {result.average}%
                  </p>
                </div>
              </div>

              {/* Score Range */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-muted-foreground">Highest:</span>
                  <span className="font-bold text-green-600">
                    {result.highest}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-muted-foreground">Lowest:</span>
                  <span className="font-bold text-red-600">
                    {result.lowest}%
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
