"use client";

import { withAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import PolicySettingsPanel from "@/components/settings/PolicySettingsPanel";

function BranchAdminSettingsPage() {
  return <PolicySettingsPanel role="BRANCH_ADMIN" />;
}

export default withAuth(BranchAdminSettingsPage, {
  requiredRole: [ROLES.BRANCH_ADMIN],
});
