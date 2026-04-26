import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { User, Branch } from '@/backend/models/postgres';
import { uploadProfilePhoto, deleteFromCloudinary } from '@/backend/utils/cloudinary';

/**
 * GET /api/users/profile
 * Get current user's full profile
 */
async function getProfile(req) {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      include: [{ model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] }]
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
async function updateProfile(req) {
  try {
    const userId = req.user.id;
    const body = await req.json();
    const { first_name, last_name, email, phone, avatar, details } = body;

    const user = await User.findByPk(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    
    // Merge details with address and other fields
    const currentDetails = user.details || {};
    const newDetails = { ...currentDetails };
    if (body.address) newDetails.address = body.address;
    if (details) Object.assign(newDetails, details);
    
    updateData.details = newDetails;

    // Handle avatar upload
    if (avatar && avatar.startsWith('data:image')) {
      // Delete old avatar if exists
      if (user.avatar_public_id) {
        await deleteFromCloudinary(user.avatar_public_id).catch(console.error);
      }
      
      const uploadResult = await uploadProfilePhoto(avatar, userId);
      updateData.avatar_url = uploadResult.url;
      updateData.avatar_public_id = uploadResult.publicId;
    }

    await user.update(updateData);

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle uniqueness constraints
    if (error.name === 'SequelizeUniqueConstraintError') {
      return NextResponse.json({ error: 'Email or phone already in use' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export const GET = withAuth(getProfile);
export const PUT = withAuth(updateProfile);
