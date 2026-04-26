"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  Layers, 
  GraduationCap, 
  Layout, 
  BookOpen,
  LayoutDashboard
} from "lucide-react";
import { withAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import AcademicYearsContent from "@/components/academic/AcademicYearsContent";
import GroupsContent from "@/components/academic/GroupsContent";
import ClassesContent from "@/components/academic/ClassesContent";
import SectionsContent from "@/components/academic/SectionsContent";
import SubjectsContent from "@/components/academic/SubjectsContent";
import Tabs, { TabPanel } from "@/components/ui/tabs";

function AcademicUnifiedPage() {
  const [activeTab, setActiveTab] = useState("years");

  const tabs = [
    { id: "years", label: "Academic Years", icon: Calendar, component: AcademicYearsContent },
    { id: "groups", label: "Groups", icon: Layers, component: GroupsContent },
    { id: "classes", label: "Classes", icon: GraduationCap, component: ClassesContent },
    { id: "sections", label: "Sections", icon: Layout, component: SectionsContent },
    { id: "subjects", label: "Subjects", icon: BookOpen, component: SubjectsContent },
  ];

  const tabConfig = tabs.map(t => ({
    id: t.id,
    label: t.label,
    icon: <t.icon className={`w-5 h-5 ${activeTab === t.id ? 'animate-pulse' : ''}`} />
  }));

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-gray-50/30 dark:bg-transparent">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mt-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-600 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {tabs.find(t => t.id === activeTab)?.label.replace('Academic ', '')} Management
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base ml-11">
          {activeTab === 'years' ? "Configure and manage the global and branch-specific academic timelines." : 
           activeTab === 'groups' ? "Organize study groups and disciplinary categories for better management." :
           activeTab === 'classes' ? "Define class structures and grade levels for student enrollment." :
           activeTab === 'sections' ? "Manage class sections, capacity, and branch assignments." :
           "Configure subjects, courses, and educational content."}
        </p>
        </div>
      </div>

      <div className="w-full space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden px-2">
          <Tabs 
            tabs={tabConfig} 
            activeTab={activeTab} 
            onChange={setActiveTab} 
            className="border-none"
          />
        </div>

        {tabs.map((tab) => (
          <TabPanel 
            key={tab.id} 
            value={tab.id} 
            activeTab={activeTab}
          >
            <div className="bg-white dark:bg-gray-900/50 p-1 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <tab.component />
            </div>
          </TabPanel>
        ))}
      </div>
    </div>
  );
}

export default withAuth(AcademicUnifiedPage, {
  requiredRole: [ROLES.SUPER_ADMIN],
});
