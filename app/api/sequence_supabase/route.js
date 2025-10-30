import { NextResponse } from 'next/server';
import { sequence_supabase } from '../../campaigns/get_sequence.js';

export async function GET() {

    const result = await sequence_supabase();
    return NextResponse.json(result);
    
    
}