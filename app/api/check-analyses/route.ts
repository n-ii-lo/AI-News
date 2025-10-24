import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Checking analyses table...');
    
    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Analyses query error:', error);
      return NextResponse.json({ 
        error: 'Analyses query error', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      analyses: analyses || [],
      count: analyses?.length || 0
    });
    
  } catch (error) {
    console.error('Check analyses error:', error);
    return NextResponse.json(
      { error: 'Check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
