import { NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import Role from '@/backend/models/Role';
import { withAuth } from '@/backend/middleware/auth';

// GET - Get single role
async function getRole(request) {
  try {
    await dbConnect();

    // Extract ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const role = await Role.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch role', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update role
async function updateRole(request, authenticatedUser, userDoc) {
  try {
    await dbConnect();

    // Extract ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const body = await request.json();
    const { displayName, description, permissions, status } = body;

    // Find role
    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if system role
    if (role.isSystem) {
      return NextResponse.json(
        { success: false, message: 'System roles cannot be modified' },
        { status: 403 }
      );
    }

    // Update role
    const updateData = {
      updatedBy: userDoc._id,
    };

    if (displayName) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (permissions) updateData.permissions = permissions;
    if (status) updateData.status = status;

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      data: updatedRole,
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update role', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete role
async function deleteRole(request) {
  try {
    await dbConnect();

    // Extract ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if system role
    if (role.isSystem) {
      return NextResponse.json(
        { success: false, message: 'System roles cannot be deleted' },
        { status: 403 }
      );
    }

    await Role.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete role', error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getRole);
export const PUT = withAuth(updateRole);
export const DELETE = withAuth(deleteRole);
