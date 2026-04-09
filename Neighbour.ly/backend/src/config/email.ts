import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendStatusUpdateEmail({
  to,
  reporterName,
  issueTitle,
  newStatus,
}: {
  to: string;
  reporterName: string;
  issueTitle: string;
  newStatus: string;
}) {
  // Skip if email is not configured
  if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASSWORD) {
    console.log("Email not configured — skipping notification");
    return;
  }

  const statusMessages: Record<string, { subject: string; body: string; color: string }> = {
    IN_PROGRESS: {
      subject: "Your issue is being worked on 🔧",
      body: "Great news! Authorities have picked up your report and are working on it.",
      color: "#f97316",
    },
    FIXED: {
      subject: "Your issue has been resolved ✅",
      body: "Your reported issue has been fixed! Thank you for helping improve the community. You've earned 10 bonus points.",
      color: "#22c55e",
    },
    REPORTED: {
      subject: "Issue status updated",
      body: "The status of your reported issue has been updated.",
      color: "#6366f1",
    },
  };

  const info = statusMessages[newStatus] ?? statusMessages["REPORTED"];

  await transporter.sendMail({
    from: `"Neighbour.ly" <${process.env.EMAIL_FROM}>`,
    to,
    subject: info.subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: ${info.color};">${info.subject}</h2>
        <p>Hi ${reporterName},</p>
        <p>${info.body}</p>
        <div style="background: #f9fafb; border-left: 4px solid ${info.color}; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <strong>Issue:</strong> ${issueTitle}
        </div>
        <p style="color: #6b7280; font-size: 13px;">— The Neighbour.ly Team</p>
      </div>
    `,
  });
}
