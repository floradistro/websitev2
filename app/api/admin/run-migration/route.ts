import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Add shipping_fulfillment to transaction_type constraint
    let dropError;
    try {
      const result = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_transaction_type_check;`
      });
      dropError = result.error;
    } catch (err) {
      // If RPC doesn't exist, skip constraint drop
      console.log('RPC not available, skipping constraint drop');
    }

    // Try using SQL directly
    const updateSql = `
      ALTER TABLE public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_transaction_type_check;
      ALTER TABLE public.pos_transactions ADD CONSTRAINT pos_transactions_transaction_type_check
        CHECK (transaction_type IN ('walk_in_sale', 'pickup_fulfillment', 'shipping_fulfillment', 'refund', 'void', 'no_sale'));
    `;

    // Execute using raw SQL
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({ query: updateSql }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: 'Unable to run migration through RPC. Please run SQL manually.',
        sql: updateSql,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Constraint updated successfully',
    });
  } catch (error: any) {
    // Return the SQL so it can be run manually
    const sql = `
ALTER TABLE public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_transaction_type_check;
ALTER TABLE public.pos_transactions ADD CONSTRAINT pos_transactions_transaction_type_check
  CHECK (transaction_type IN ('walk_in_sale', 'pickup_fulfillment', 'shipping_fulfillment', 'refund', 'void', 'no_sale'));
    `;

    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Please run this SQL manually in Supabase SQL Editor',
      sql,
    }, { status: 500 });
  }
}
