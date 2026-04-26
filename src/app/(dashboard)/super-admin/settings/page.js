"use client";

import { withAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import PolicySettingsPanel from "@/components/settings/PolicySettingsPanel";

function SuperAdminSettingsPage() {
  return <PolicySettingsPanel role="SUPER_ADMIN" />;
}

export default withAuth(SuperAdminSettingsPage, {
  requiredRole: [ROLES.SUPER_ADMIN],
});
