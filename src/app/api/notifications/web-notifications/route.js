import { NextResponse } from 'next/server';

// MOCK implementation for Web Notifications
// NOTE: Auth check removed because this is a mock endpoint returning empty data.
// Re-add withAuth when real notification logic is implemented.
export async function GET(request) {
    try {
        // Return empty notifications list to satisfy the frontend
        return NextResponse.json({
            success: true,
            data: {
                notifications: [],
                unreadCount: 0
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch notifications' }, { status: 500 });
    }
}

/**
 * Web Notifications API
 * Returns notifications for a specific user
 */
// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const userId = searchParams.get('userId');

//     // Return empty list for now until model is implemented
//     return NextResponse.json({
//       success: true,
//       data: {
//         notifications: [],
//         unreadCount: 0
//       },
//       message: 'Notifications fetched successfully'
//     });
//   } catch (error) {
//     console.error('Web notifications fetch error:', error);
//     return NextResponse.json(
//       { success: false, message: 'Failed to fetch notifications' },
//       { status: 500 }
//     );
//   }
// }
