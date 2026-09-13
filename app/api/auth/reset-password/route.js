import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return match;
    if (data.users.length < 1000) break;
  }
  return null;
}

export async function POST(request) {
  try {
    const { email, token, newPassword } = await request.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json({ error: 'Email, token, and new password are required.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: record, error: fetchError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('purpose', 'password_reset')
      .eq('code', token)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !record) {
      return NextResponse.json({ error: 'This reset link is invalid or has already been used.' }, { status: 400 });
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json({ error: 'No account found for this email.' }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Failed to reset password.' }, { status: 500 });
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
