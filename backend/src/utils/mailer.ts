import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[Mailer] SMTP not configured — skipping email to", options.to);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      ...options,
    });
    console.log("[Mailer] Email sent to", options.to);
    return true;
  } catch (err) {
    console.error("[Mailer] Failed to send email:", err);
    return false;
  }
};

export const buildShortlistEmail = (candidateName: string, jobTitle: string, companyName?: string) => ({
  subject: `🎉 You've been shortlisted for "${jobTitle}"!`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a2e; font-size: 24px;">Congratulations, ${candidateName}!</h1>
      <p style="color: #444; font-size: 16px; line-height: 1.6;">
        Great news — you've been <strong>shortlisted</strong> for the position of
        <strong>${jobTitle}</strong>${companyName ? ` at <strong>${companyName}</strong>` : ""}.
      </p>
      <p style="color: #444; font-size: 16px; line-height: 1.6;">
        The recruiter has reviewed your profile and selected you for the next stage. 
        Please log in to your dashboard for more details and next steps.
      </p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/candidate"
           style="background: #6d28d9; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          View Your Dashboard
        </a>
      </div>
      <p style="color: #888; font-size: 13px;">
        If you have any questions, feel free to reach out through the platform.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">AbelUp — Inclusive Employment Platform</p>
    </div>
  `,
});

export const buildVerificationEmail = (candidateName: string) => ({
  subject: `✅ Your Profile Has Been Verified!`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a2e; font-size: 24px;">Congratulations, ${candidateName}!</h1>
      <p style="color: #444; font-size: 16px; line-height: 1.6;">
        Great news — your profile has been <strong>verified</strong> by our admin team!
      </p>
      <p style="color: #444; font-size: 16px; line-height: 1.6;">
        You can now apply for jobs on the platform. Recruiters will see your verified status,
        which increases your chances of getting shortlisted.
      </p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/candidate/jobs"
           style="background: #6d28d9; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Browse Jobs
        </a>
      </div>
      <p style="color: #888; font-size: 13px;">
        Start applying and take the next step in your career journey!
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">AbelUp — Inclusive Employment Platform</p>
    </div>
  `,
});

export const buildInterviewScheduledEmail = (
  candidateName: string, jobTitle: string, scheduledAt: Date, duration: number, mode: string, location?: string
) => ({
  subject: `📅 Interview Scheduled for "${jobTitle}"`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a2e; font-size: 24px;">Interview Scheduled!</h1>
      <p style="color: #444; font-size: 16px; line-height: 1.6;">
        Hi <strong>${candidateName}</strong>, an interview has been scheduled for the position of
        <strong>${jobTitle}</strong>.
      </p>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="color: #333; margin: 4px 0;"><strong>📅 Date & Time:</strong> ${scheduledAt.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}</p>
        <p style="color: #333; margin: 4px 0;"><strong>⏱ Duration:</strong> ${duration} minutes</p>
        <p style="color: #333; margin: 4px 0;"><strong>📍 Mode:</strong> ${mode}${location ? ` — ${location}` : ""}</p>
      </div>
      <p style="color: #444; font-size: 16px; line-height: 1.6;">
        Please log in to your dashboard to <strong>accept</strong> the slot or <strong>request a reschedule</strong>.
      </p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/candidate"
           style="background: #6d28d9; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          View Interview Details
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">AbelUp — Inclusive Employment Platform</p>
    </div>
  `,
});

export const buildInterviewRescheduleRequestEmail = (
  recruiterName: string, candidateName: string, jobTitle: string, message: string
) => ({
  subject: `🔄 Reschedule Request from ${candidateName} for "${jobTitle}"`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a2e; font-size: 24px;">Reschedule Request</h1>
      <p style="color: #444; font-size: 16px; line-height: 1.6;">
        Hi <strong>${recruiterName}</strong>, the candidate <strong>${candidateName}</strong> has requested
        a reschedule for the interview for <strong>${jobTitle}</strong>.
      </p>
      <div style="background: #fff3cd; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="color: #856404; margin: 0;"><strong>Candidate's message:</strong></p>
        <p style="color: #856404; margin: 8px 0 0;">"${message}"</p>
      </div>
      <p style="color: #444; font-size: 16px; line-height: 1.6;">
        Please log in to your dashboard to reschedule the interview.
      </p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/recruiter"
           style="background: #6d28d9; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Manage Interviews
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">AbelUp — Inclusive Employment Platform</p>
    </div>
  `,
});

export const buildInterviewAcceptedEmail = (
  recruiterName: string, candidateName: string, jobTitle: string, scheduledAt: Date
) => ({
  subject: `✅ ${candidateName} accepted the interview for "${jobTitle}"`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a2e; font-size: 24px;">Interview Accepted!</h1>
      <p style="color: #444; font-size: 16px; line-height: 1.6;">
        Hi <strong>${recruiterName}</strong>, the candidate <strong>${candidateName}</strong> has
        <strong>accepted</strong> the interview for <strong>${jobTitle}</strong>.
      </p>
      <div style="background: #d4edda; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="color: #155724; margin: 0;"><strong>📅 Scheduled:</strong> ${scheduledAt.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}</p>
      </div>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/recruiter"
           style="background: #6d28d9; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          View Dashboard
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">AbelUp — Inclusive Employment Platform</p>
    </div>
  `,
});
