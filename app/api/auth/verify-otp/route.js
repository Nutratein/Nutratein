import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const MAX_ATTEMPTS = 5;

export async function POST(request) {
  try {
    const { email, code, purpose = 'signup' } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: record, error: fetchError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('purpose', purpose)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !record) {
      return NextResponse.json({ error: 'No active verification code found. Please request a new one.' }, { status: 400 });
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This code has expired. Please request a new one.' }, { status: 400 });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new code.' }, { status: 429 });
    }

    if (record.code !== String(code).trim()) {
      await supabaseAdmin
        .from('otp_codes')
        .update({ attempts: record.attempts + 1 })
        .eq('id', record.id);
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
    }

    await supabaseAdmin
      .from('otp_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', record.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
