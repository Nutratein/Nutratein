import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const resend = new Resend(process.env.RESEND_API_KEY);
const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 45;

export async function POST(request) {
  try {
    const { email, purpose = 'signup' } = await request.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Cooldown: block rapid repeated OTP requests for the same email/purpose
    const { data: recent } = await supabaseAdmin
      .from('otp_codes')
      .select('created_at')
      .eq('email', normalizedEmail)
      .eq('purpose', purpose)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const secondsSince = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
      if (secondsSince < RESEND_COOLDOWN_SECONDS) {
        return NextResponse.json(
          { error: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSince)}s before requesting another code.` },
          { status: 429 }
        );
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin.from('otp_codes').insert({
      email: normalizedEmail,
      code,
      purpose,
      expires_at: expiresAt,
    });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to generate verification code.' }, { status: 500 });
    }

    const fromName = process.env.RESEND_FROM_NAME || 'The Pep Shop';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const { error: sendError } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: normalizedEmail,
      subject: `${code} is your verification code`,
      html: `
        <div style="font-family: sans-serif; background:#0a0c10; padding: 24px 16px; color:#f1f5f9; box-sizing:border-box;">
          <div style="max-width: 440px; width:100%; margin: 0 auto; background:#12151b; border:1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 28px 20px; text-align:center; box-sizing:border-box;">
            <h2 style="margin: 0 0 8px; font-size: 20px; color:#f1f5f9;">Verify your email</h2>
            <p style="margin: 0 0 22px; font-size: 14px; color:#a8adb4;">
              Use the code below to finish creating your Pep Shop account. This code expires in ${OTP_TTL_MINUTES} minutes.
            </p>
            <div style="display:block; width:100%; max-width: 200px; margin: 0 auto; box-sizing:border-box; padding: 14px 8px; background:#171b23; border:1px solid rgba(0,102,255,0.35); border-radius: 10px; font-size: 28px; font-weight: 800; letter-spacing: 6px; color:#0066ff; text-align:center; white-space:nowrap;">
              ${code}
            </div>
            <p style="margin: 22px 0 0; font-size: 12.5px; color:#7d838d;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    if (sendError) {
      return NextResponse.json({ error: sendError.message || 'Failed to send verification email.' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
