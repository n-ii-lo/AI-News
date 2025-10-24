import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Checking jobs table...');
    
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Jobs query error:', error);
      return NextResponse.json({ 
        error: 'Jobs query error', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      jobs: jobs || [],
      count: jobs?.length || 0
    });
    
  } catch (error) {
    console.error('Check jobs error:', error);
    return NextResponse.json(
      { error: 'Check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
