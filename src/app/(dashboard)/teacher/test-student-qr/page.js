"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, User } from "lucide-react";

// Sample students for testing (you can fetch from your data)
const sampleStudents = [
  { studentId: "S001", name: "Ahmed Ali", roll: "101", avatar: "AA" },
  { studentId: "S002", name: "Fatima Khan", roll: "102", avatar: "FK" },
  { studentId: "S003", name: "Hassan Raza", roll: "103", avatar: "HR" },
  { studentId: "S004", name: "Ayesha Malik", roll: "104", avatar: "AM" },
  { studentId: "S005", name: "Bilal Ahmed", roll: "105", avatar: "BA" },
  { studentId: "S006", name: "Zainab Tariq", roll: "106", avatar: "ZT" },
];

export default function StudentQRGenerator() {
  const [selectedStudent, setSelectedStudent] = useState(null);

  const downloadQR = (student) => {
    const svg = document.getElementById(`qr-${student.studentId}`);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `${student.name}-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student QR Code Generator</h1>
          <p className="text-muted-foreground mt-1">
            Generate QR codes for student attendance
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Test Page
        </Badge>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Sample Students</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sampleStudents.map((student) => (
            <Card
              key={student.studentId}
              className="p-6 border-2 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold">
                  {student.avatar}
                </div>
                <div>
                  <h3 className="font-semibold">{student.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Roll: {student.roll}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-lg border-2 border-primary/20">
                  <QRCodeSVG
                    id={`qr-${student.studentId}`}
                    value={JSON.stringify({
                      studentId: student.studentId,
                      name: student.name,
                      roll: student.roll,
                      avatar: student.avatar,
                    })}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="w-full space-y-2">
                  <Button
                    onClick={() => downloadQR(student)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR
                  </Button>

                  <div className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      ID: {student.studentId}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">How to Test:</h3>
        <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
          <li>Open this page on your computer</li>
          <li>Download or display any student QR code</li>
          <li>Go to Attendance page and select a class</li>
          <li>Click "Start QR Scanner"</li>
          <li>Point your camera at the QR code displayed here</li>
          <li>Student will be automatically marked present!</li>
        </ol>
      </Card>
    </div>
  );
}
