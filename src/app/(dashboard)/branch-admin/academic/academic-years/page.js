"use client";

import { withAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import AcademicYearsContent from "@/components/academic/AcademicYearsContent";

function BranchAcademicYearsPage() {
  return <AcademicYearsContent />;
}

export default withAuth(BranchAcademicYearsPage, {
  requiredRole: [ROLES.BRANCH_ADMIN],
});
