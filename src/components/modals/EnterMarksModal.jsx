"use client";
import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Save, User } from "lucide-react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import FullPageLoader from "@/components/ui/full-page-loader";

export default function EnterMarksModal({ exam, onClose }) {
  const [students, setStudents] = useState([]);
  const [existingMarks, setExistingMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  // localMarks: { [String(subject_id)]: { [String(student_id)]: { marks_obtained, is_absent, remarks } } }
  const [localMarks, setLocalMarks] = useState({});

  useEffect(() => {
    if (exam) {
      fetchData();
      if (exam.subjects?.length > 0) {
        setSelectedSubjectId(String(exam.subjects[0].subject_id));
      }
    }
  }, [exam]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, marksRes] = await Promise.all([
        apiClient.get(`/api/exams/${exam.id}/students`),
        apiClient.get(`/api/exams/${exam.id}/marks`),
      ]);

      if (studentsRes.success) setStudents(studentsRes.data);

      if (marksRes.success) {
        setExistingMarks(marksRes.data);

        // Key everything as String to avoid type mismatch
        const initialMarks = {};
        marksRes.data.forEach((m) => {
          const subKey = String(m.subject_id);
          const stuKey = String(m.student_id);
          if (!initialMarks[subKey]) initialMarks[subKey] = {};
          initialMarks[subKey][stuKey] = {
            marks_obtained: m.is_absent ? "" : (m.marks_obtained ?? ""),
            is_absent: !!m.is_absent,
            remarks: m.remarks || "",
          };
        });
        setLocalMarks(initialMarks);
      }
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, field, value) => {
    const stuKey = String(studentId);
    const subKey = String(selectedSubjectId);

    // Get total marks for validation
    const currentSub = exam.subjects.find((s) => String(s.subject_id) === subKey);
    const totalMarks = Number(currentSub?.total_marks) || 0;

    setLocalMarks((prev) => {
      const prevSub = prev[subKey] || {};
      const prevStu = prevSub[stuKey] || {
        marks_obtained: "",
        is_absent: false,
        remarks: "",
      };

      let updated = { ...prevStu, [field]: value };

      // Jab absent check karo → marks clear karo
      if (field === "is_absent" && value === true) {
        updated.marks_obtained = "";
      }
      
      // Jab marks type karo → validate range
      if (field === "marks_obtained" && value !== "") {
        updated.is_absent = false;

        // Strip leading zeros unless it's just "0"
        let valStr = String(value).replace(/^0+(?=\d)/, '');
        
        const num = parseFloat(valStr);
        if (!isNaN(num)) {
          if (num < 0) {
            updated.marks_obtained = "0";
            setTimeout(() => toast.warning("Marks 0 se kam nahi ho sakti"), 0);
          } else if (totalMarks > 0 && num > totalMarks) {
            updated.marks_obtained = String(totalMarks);
            setTimeout(() => toast.warning(`Maximum marks ${totalMarks} ho saktay hain`), 0);
          } else {
            updated.marks_obtained = valStr;
          }
        } else {
           updated.marks_obtained = "";
        }
      }

      return {
        ...prev,
        [subKey]: { ...prevSub, [stuKey]: updated },
      };
    });
  };

  const handleSave = async () => {
    if (!selectedSubjectId) return;
    setSubmitting(true);
    try {
      const subKey = String(selectedSubjectId);
      const subjectMarks = localMarks[subKey] || {};

      const marksArray = Object.keys(subjectMarks).map((stuId) => {
        const d = subjectMarks[stuId];
        return {
          student_id: stuId,
          subject_id: selectedSubjectId,
          marks_obtained: d.is_absent ? 0 : parseFloat(d.marks_obtained) || 0,
          is_absent: !!d.is_absent,
          remarks: d.remarks || "",
        };
      });

      if (marksArray.length === 0) {
        toast.info("No marks entered to save");
        return;
      }

      const response = await apiClient.post(`/api/exams/${exam.id}/marks`, {
        marks: marksArray,
      });
      if (response.success) {
        toast.success("Marks saved successfully");
        // Refresh existing marks so isSaved badges update
        const marksRes = await apiClient.get(`/api/exams/${exam.id}/marks`);
        if (marksRes.success) setExistingMarks(marksRes.data);
      }
    } catch (error) {
      toast.error(error.message || "Failed to save marks");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <FullPageLoader message="Fetching students and marks..." />;

  const subKey = String(selectedSubjectId);
  const currentSubject = exam.subjects.find(
    (s) => String(s.subject_id) === subKey,
  );

  // Per-subject absent counter for tab badge
  const absentCountPerSubject = {};
  exam.subjects.forEach((s) => {
    const sk = String(s.subject_id);
    const subData = localMarks[sk] || {};
    absentCountPerSubject[sk] = Object.values(subData).filter(
      (d) => d.is_absent,
    ).length;
  });

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.registration_no || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // Type-safe enrolled_subjects check
    const enrolledRaw = s.enrolled_subjects || [];
    const enrolledStr = enrolledRaw.map(String);
    const isEnrolled = enrolledStr.length === 0 || enrolledStr.includes(subKey);

    return matchesSearch && isEnrolled;
  });

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Enter Marks — ${exam.title}`}
      size="xl"
      footer={null}
    >
      <div className="space-y-6">
        {/* ── Subject Tabs ── */}
        <div className="flex flex-wrap gap-2">
          {exam.subjects.map((s) => {
            const sk = String(s.subject_id);
            const absCnt = absentCountPerSubject[sk] || 0;
            const isActive = sk === subKey;
            return (
              <button
                key={sk}
                onClick={() => setSelectedSubjectId(sk)}
                className={[
                  "relative px-4 py-1.5 rounded-full text-sm font-semibold border transition-all",
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow"
                    : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:text-indigo-600",
                ].join(" ")}
              >
                {s.subject_name || "Subject"}
                {absCnt > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold">
                    {absCnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Subject Info Bar ── */}
        {currentSubject && (
          <Card className="bg-indigo-50 border-indigo-100">
            <CardContent className="p-4 flex flex-wrap justify-between items-center gap-4">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-indigo-600 font-bold uppercase">
                    Subject
                  </p>
                  <p className="text-base font-bold">
                    {currentSubject.subject_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-indigo-600 font-bold uppercase">
                    Total Marks
                  </p>
                  <p className="text-lg font-bold">
                    {currentSubject.total_marks}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-indigo-600 font-bold uppercase">
                    Passing Marks
                  </p>
                  <p className="text-lg font-bold">
                    {currentSubject.passing_marks}
                  </p>
                </div>
              </div>
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or reg no..."
                    className="pl-9 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Marks Table ── */}
        <div className="border rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead>Student Info</TableHead>
                <TableHead className="w-36">Marks Obtained</TableHead>
                <TableHead className="w-28 text-center">Absent</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="w-24 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-gray-500"
                  >
                    No students found for this subject/search
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  const stuKey = String(student.id || student._id);
                  const marksData = localMarks[subKey]?.[stuKey] || {
                    marks_obtained: "",
                    is_absent: false,
                    remarks: "",
                  };

                  // isSaved: check by String comparison
                  const isSaved = existingMarks.some(
                    (em) =>
                      String(em.student_id) === stuKey &&
                      String(em.subject_id) === subKey,
                  );

                  const marksVal = parseFloat(marksData.marks_obtained);
                  const isPassing =
                    !isNaN(marksVal) &&
                    marksData.marks_obtained !== "" &&
                    marksVal >= (Number(currentSubject?.passing_marks) || 0);

                  // Row color: absent = red tint, fail = amber tint
                  const rowBg = marksData.is_absent
                    ? "bg-red-50/60"
                    : marksData.marks_obtained !== "" && !isPassing
                      ? "bg-amber-50/60"
                      : "";

                  return (
                    <TableRow
                      key={stuKey}
                      className={`${rowBg} transition-colors`}
                    >
                      {/* Student Info */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={[
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              marksData.is_absent
                                ? "bg-red-100"
                                : "bg-gray-100",
                            ].join(" ")}
                          >
                            <User
                              className={`w-4 h-4 ${marksData.is_absent ? "text-red-500" : "text-gray-500"}`}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {student.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {student.registration_no}
                            </p>
                          </div>
                          {isSaved && (
                            <span className="ml-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                              SAVED
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Marks Input */}
                      <TableCell>
                        <input
                          type="number"
                          min={0}
                          max={currentSubject?.total_marks}
                          value={marksData.marks_obtained}
                          onChange={(e) =>
                            handleMarkChange(
                              student.id || student._id,
                              "marks_obtained",
                              e.target.value,
                            )
                          }
                          disabled={marksData.is_absent}
                          style={{
                            color: marksData.is_absent
                              ? "#94a3b8"
                              : !isPassing && marksData.marks_obtained !== ""
                                ? "#92400e"
                                : "#0f172a",
                          }}
                          className={[
                            "w-full h-10 px-3 text-base font-bold rounded-lg border-2 outline-none transition-all",
                            "focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1",
                            marksData.is_absent
                              ? "bg-slate-100 border-slate-200 cursor-not-allowed"
                              : !isPassing && marksData.marks_obtained !== ""
                                ? "bg-amber-50 border-amber-400"
                                : "bg-white border-slate-300 focus:border-indigo-500",
                          ].join(" ")}
                          placeholder={marksData.is_absent ? "Absent" : "0"}
                        />
                      </TableCell>

                      {/* Absent Checkbox */}
                      <TableCell className="text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={marksData.is_absent}
                            onChange={(e) =>
                              handleMarkChange(
                                student.id || student._id,
                                "is_absent",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 accent-red-500 cursor-pointer"
                          />
                          <span className="text-xs text-slate-500">Absent</span>
                        </label>
                      </TableCell>

                      {/* Remarks */}
                      <TableCell>
                        <input
                          type="text"
                          placeholder="Optional remarks"
                          value={marksData.remarks}
                          onChange={(e) =>
                            handleMarkChange(
                              student.id || student._id,
                              "remarks",
                              e.target.value,
                            )
                          }
                          className="w-full h-9 px-3 py-1 text-sm text-slate-800 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="text-right">
                        {marksData.is_absent ? (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-600 border-red-300 font-bold"
                          >
                            Absent
                          </Badge>
                        ) : marksData.marks_obtained !== "" ? (
                          isPassing ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-600 border-green-200"
                            >
                              Pass
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-300"
                            >
                              Fail
                            </Badge>
                          )
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-400 border-gray-200"
                          >
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-between items-center gap-3 pt-4 border-t">
          <p className="text-xs text-slate-500">
            Showing <strong>{filteredStudents.length}</strong> student(s) for{" "}
            <strong>{currentSubject?.subject_name || "this subject"}</strong>
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleSave}
              disabled={submitting || !selectedSubjectId}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? "Saving..." : "Save Marks"}
              <Save className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
