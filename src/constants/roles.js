// User Roles
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BRANCH_ADMIN: 'BRANCH_ADMIN',
  TEACHER: 'TEACHER',
  // PARENT: 'PARENT',
  STUDENT: 'STUDENT',
  STAFF: 'STAFF',
};

// Role Permissions
export const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    'manage_all',
    'create_branch',
    'manage_branch_admin',
    'view_all_branches',
    'manage_settings',
  ],
  [ROLES.BRANCH_ADMIN]: [
    'manage_branch',
    'manage_teachers',
    'manage_students',
    'manage_classes',
    'view_reports',
  ],
  [ROLES.TEACHER]: [
    'view_students',
    'mark_attendance',
    'create_assignments',
    'grade_exams',
    'view_class',
  ],
  // [ROLES.PARENT]: [
  //   'view_child',
  //   'view_attendance',
  //   'view_grades',
  //   'communicate_teacher',
  // ],
  [ROLES.STUDENT]: [
    'view_profile',
    'view_attendance',
    'view_grades',
    'view_assignments',
  ],
};

export const getRolePermissions = (role) => PERMISSIONS[role] || [];

export const hasPermission = (userRole, permission) => {
  const permissions = getRolePermissions(userRole);
  return permissions.includes('manage_all') || permissions.includes(permission);
};
