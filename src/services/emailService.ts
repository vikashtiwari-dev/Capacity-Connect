import bcrypt from 'bcryptjs';

const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://osahxrfvcuxymkktrbwl.supabase.co').replace(/\/$/, '');
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_AxPR4q9YGfHf-tywUOMuHw_3vaG15rV';

export interface SendOtpParams {
  email: string;
  name: string;
  otp: string;
  purpose?: 'register' | 'login' | 'reset_password' | 'recover_id';
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  provider?: string;
}

// In-memory secured session store for dispatched OTP hashes (10-minute validity)
interface OtpSession {
  hash: string;
  expiresAt: number;
  attempts: number;
}
const localOtpSessions: Record<string, OtpSession> = {};

/**
 * Sends a real 6-digit verification code to the recipient's email inbox.
 */
export async function sendOtpEmail({ email, name, otp, purpose = 'register' }: SendOtpParams): Promise<SendOtpResponse> {
  const normEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  // Store cryptographic hash of the generated OTP for rigorous verification
  if (normEmail && cleanOtp) {
    try {
      const hash = bcrypt.hashSync(cleanOtp, 8);
      localOtpSessions[normEmail] = {
        hash,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        attempts: 0
      };
    } catch (e) {
      console.error('Failed to create OTP session hash:', e);
    }
  }

  // Dispatch Real Official OTP via backend server (capacityconnect.org@gmail.com)
  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normEmail, name, otp: cleanOtp, purpose })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: data.message || `Verification code sent to ${email} from ${data.sender || 'capacityconnect.org@gmail.com'}.`,
          provider: 'capacity-connect-smtp'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to dispatch verification email from official server.'
        };
      }
    }
    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      message: errData.message || 'Official email service unavailable. Please try again in a few moments.'
    };
  } catch (err: any) {
    console.error('Backend custom mailer route error:', err);
    return {
      success: false,
      message: 'Failed to connect to official email dispatch server.'
    };
  }
}

/**
 * Validates the entered 6-digit OTP code against authoritative server and session cryptographic hash.
 * STRICT: Arbitrary or incorrect codes are ALWAYS rejected.
 */
export async function verifyOtpCode(
  email: string,
  enteredToken: string
): Promise<{ valid: boolean; error?: string }> {
  const normEmail = (email || '').trim().toLowerCase();
  const token = (enteredToken || '').trim();

  if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
    return {
      valid: false,
      error: 'Please enter a valid 6-digit verification code.'
    };
  }

  // 1. Primary: Verify against active cryptographic session hash in memory
  const session = localOtpSessions[normEmail];
  if (session) {
    if (Date.now() > session.expiresAt) {
      delete localOtpSessions[normEmail];
      return {
        valid: false,
        error: 'Verification code has expired. Please request a new code.'
      };
    }

    if (session.attempts >= 5) {
      delete localOtpSessions[normEmail];
      return {
        valid: false,
        error: 'Too many incorrect attempts. This verification code has been invalidated for security. Please request a new one.'
      };
    }

    // Verify candidate token against secure session bcrypt hash
    try {
      const isMatch = bcrypt.compareSync(token, session.hash);
      if (isMatch) {
        delete localOtpSessions[normEmail];
        // Clean up server record asynchronously
        fetch('/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normEmail, otp: token })
        }).catch(() => {});

        return { valid: true };
      }
    } catch (e) {
      console.warn('Session hash verification error:', e);
    }

    session.attempts += 1;
    return {
      valid: false,
      error: 'Incorrect verification code. Please check your email inbox and enter the exact 6-digit code.'
    };
  }

  // 2. Secondary: Fallback to server verification (for cross-device / multi-tab logins)
  try {
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normEmail, otp: token })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.valid === true) {
        delete localOtpSessions[normEmail];
        return { valid: true };
      }
      return {
        valid: false,
        error: data.error || 'Incorrect verification code. Please check your email inbox and enter the exact 6-digit code.'
      };
    }
  } catch (err) {
    console.warn('Backend OTP verification error:', err);
  }

  return {
    valid: false,
    error: 'No active verification session found. Please request a new verification code.'
  };
}

/**
 * Dispatches an official login security alert email when a user logs in.
 */
export async function sendLoginAlertEmail({
  email,
  name,
  role,
  loginTime = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
  deviceInfo = navigator.userAgent
}: {
  email: string;
  name: string;
  role: string;
  loginTime?: string;
  deviceInfo?: string;
}): Promise<boolean> {
  if (email.endsWith("@example.com")) {
    return true;
  }

  const isMobile = /iPhone|iPad|Android|Mobile/i.test(deviceInfo);
  const deviceType = isMobile ? "Mobile Device (iOS / Android)" : "Desktop / Laptop Workstation";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0b0f19; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">CAPACITY CONNECT</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Official Identity & Security Alert</p>
      </div>

      <div style="background: rgba(0, 113, 227, 0.08); border: 1px solid rgba(41, 151, 255, 0.25); border-radius: 16px; padding: 22px; margin-bottom: 24px;">
        <div style="margin-bottom: 12px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; margin-right: 6px;"></span>
          <strong style="color: #38bdf8; font-size: 14px;">Successful Account Sign-In Detected</strong>
        </div>
        <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; color: #e2e8f0;">
          Hello <strong>${name}</strong>,<br/>
          An authenticated login was just recorded for your Capacity Connect account.
        </p>
        <div style="background: rgba(0,0,0,0.3); border-radius: 10px; padding: 12px; font-size: 12px; color: #cbd5e1;">
          <div style="margin-bottom: 6px;"><strong>Role:</strong> <span style="color: #38bdf8; text-transform: uppercase;">${role}</span></div>
          <div style="margin-bottom: 6px;"><strong>Time:</strong> <span style="color: #ffffff;">${loginTime}</span></div>
          <div><strong>Device:</strong> <span style="color: #a5b4fc;">${deviceType}</span></div>
        </div>
      </div>

      <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; padding: 14px; font-size: 12px; line-height: 1.5; color: #fde68a; margin-bottom: 22px;">
        <strong>Notice:</strong> If this was you, no action is needed. If you did not log in, please reset your password immediately or contact your administrator.
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; text-align: center; font-size: 11px; color: #64748b;">
        Automated official dispatch sent to <strong>${email}</strong> &bull; Capacity Connect Portal
      </div>
    </div>
  `;

  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: `Security Alert: New Sign-In to Your Capacity Connect Account`,
        html,
        type: "login_alert"
      })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Dispatches an official account approval notification when an administrator approves a user.
 */
export async function sendApprovalEmail({
  email,
  name,
  role
}: {
  email: string;
  name: string;
  role: string;
}): Promise<boolean> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0b0f19; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">CAPACITY CONNECT</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Official Membership & Approval Notice</p>
      </div>

      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 32px; margin-bottom: 8px;">🎉</div>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #34d399;">Application Approved!</h3>
        <p style="margin: 0; font-size: 13px; color: #e2e8f0;">
          Your registration as a <strong>${role.toUpperCase()}</strong> has been reviewed and approved by the portal administrator.
        </p>
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0 0 20px 0;">
        Hello <strong>${name}</strong>,<br/>
        Your account is now fully active. You can sign in using your registered credentials to access your courses, certificates, assessments, and learning resources.
      </p>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/login" style="display: inline-block; background: #0071e3; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 600; font-size: 13px;">
          Sign In to Portal
        </a>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; text-align: center; font-size: 11px; color: #64748b;">
        Official membership communication dispatched to <strong>${email}</strong> &bull; Capacity Connect
      </div>
    </div>
  `;

  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: `Account Approved: Welcome to Capacity Connect`,
        html,
        type: "approval_notice"
      })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

