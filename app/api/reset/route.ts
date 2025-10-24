import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Resetting news status...');
    
    // Update all news to queued status
    const { data, error } = await supabaseService
      .from('news')
      .update({ status: 'queued' })
      .neq('status', 'done')
      .select();
    
    if (error) throw error;
    
    console.log('Reset news items:', data?.length);
    
    // Delete all failed analyses
    const { error: delError } = await supabaseService
      .from('analyses')
      .delete()
      .eq('status', 'error');
    
    if (delError) console.error('Delete analyses error:', delError);
    
    // Delete all jobs
    const { error: jobError } = await supabaseService
      .from('jobs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (jobError) console.error('Delete jobs error:', jobError);
    
    // Create jobs for all news
    const { data: news } = await supabaseService
      .from('news')
      .select('id')
      .eq('status', 'queued');
    
    let created = 0;
    if (news) {
      for (const item of news) {
        const { error: jobErr } = await supabaseService
          .from('jobs')
          .insert({ 
            type: 'analyze_news', 
            payload: { news_id: item.id },
            status: 'queued'
          });
        
        if (!jobErr) created++;
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      resetNews: data?.length || 0,
      createdJobs: created
    });
    
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: 'Failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
