import { NextResponse } from 'next/server';
import { getUserAll } from '@/app/lib/auth-actions';

export async function GET() {
  try {
    // Get current user's data
    const result = await getUserAll();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in GET /api/get_user_all:', error);
  }
}