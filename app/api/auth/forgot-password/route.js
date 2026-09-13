import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const resend = new Resend(process.env.RESEND_API_KEY);
const RESET_TTL_MINUTES = 30;

async function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return match;
    if (data.users.length < 1000) break; // last page
  }
  return null;
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const genericResponse = { success: true, message: 'If an account exists for that email, a reset link has been sent.' };

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      // Don't reveal whether the account exists — respond the same either way.
      return NextResponse.json(genericResponse);
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin.from('otp_codes').insert({
      email: normalizedEmail,
      code: token,
      purpose: 'password_reset',
      expires_at: expiresAt,
    });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to generate reset link.' }, { status: 500 });
    }

    const origin = request.nextUrl.origin;
    const resetLink = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    const fromName = process.env.RESEND_FROM_NAME || 'Drago Pharma';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: normalizedEmail,
      subject: 'Reset your Drago Pharma password',
      html: `
        <div style="font-family: sans-serif; background:#0a0c10; padding: 24px 16px; color:#f1f5f9; box-sizing:border-box;">
          <div style="max-width: 440px; width:100%; margin: 0 auto; background:#12151b; border:1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 28px 20px; text-align:center; box-sizing:border-box;">
            <h2 style="margin: 0 0 8px; font-size: 20px; color:#f1f5f9;">Reset your password</h2>
            <p style="margin: 0 0 24px; font-size: 14px; color:#a8adb4;">
              We received a request to reset your Drago Pharma account password. This link expires in ${RESET_TTL_MINUTES} minutes.
            </p>
            <a href="${resetLink}" style="display:inline-block; padding: 14px 32px; background:#e0173d; color:#ffffff; text-decoration:none; font-weight:700; font-size:15px; border-radius: 10px;">
              Reset Password
            </a>
            <p style="margin: 24px 0 0; font-size: 12px; color:#7d838d; word-break: break-all;">
              Or copy this link: ${resetLink}
            </p>
            <p style="margin: 18px 0 0; font-size: 12.5px; color:#7d838d;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json(genericResponse);
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
