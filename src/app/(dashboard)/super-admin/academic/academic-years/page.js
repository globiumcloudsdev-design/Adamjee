"use client";

import { withAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import AcademicYearsContent from "@/components/academic/AcademicYearsContent";

function AcademicYearsPage() {
  return <AcademicYearsContent />;
}

export default withAuth(AcademicYearsPage, {
  requiredRole: [ROLES.SUPER_ADMIN],
});
