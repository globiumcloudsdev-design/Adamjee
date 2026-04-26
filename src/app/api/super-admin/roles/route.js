import { NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import Role from '@/backend/models/Role';
import { withAuth } from '@/backend/middleware/auth';

// GET - List all roles
async function getRoles(request, authenticatedUser) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }

    // Get total count
    const total = await Role.countDocuments(query);

    // Get roles with pagination
    const roles = await Role.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return NextResponse.json({
      success: true,
      data: roles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch roles', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new role
async function createRole(request, authenticatedUser, userDoc) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, displayName, description, permissions, status } = body;

    // Validation
    if (!name || !displayName) {
      return NextResponse.json(
        { success: false, message: 'Name and display name are required' },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.toLowerCase() });
    if (existingRole) {
      return NextResponse.json(
        { success: false, message: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // Create new role
    const role = await Role.create({
      name: name.toLowerCase(),
      displayName,
      description,
      permissions: permissions || {},
      status: status || 'active',
      createdBy: userDoc._id,
    });

    const populatedRole = await Role.findById(role._id)
      .populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Role created successfully',
      data: populatedRole,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create role', error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getRoles);
export const POST = withAuth(createRole);
