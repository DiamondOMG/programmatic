import { NextResponse } from 'next/server';
import { testSupabaseAPI } from '../../campaigns/get_sequence.js';

export async function GET() {
  try {
    const result = await testSupabaseAPI();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'API test successful', 
        data: result.data 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: result.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Route error: ${error.message}` 
    }, { status: 500 });
  }
}