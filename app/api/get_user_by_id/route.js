import { NextResponse } from 'next/server';
import { getUserById } from '@/app/lib/auth-actions';

export async function GET() {
  try {
    // Get current user's data
    const result = await getUserById();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in GET /api/get_user_by_id:', error);
  }
}