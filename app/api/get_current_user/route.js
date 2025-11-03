import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth-actions';

export async function GET() {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Return user data (you can customize what data to return)
    const userData = {
      id: user.id,
      email: user.email,
      // Add other user fields you want to expose
      metadata: user.user_metadata || {},
      // Add any other user data you want to include
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
