import nodemailer, { Transporter } from 'nodemailer';

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: Number(process.env.BREVO_SMTP_PORT) || 587,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_API_KEY,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Sends a reservation status update email to the customer.
   * @param toEmail The customer's email address
   * @param customerName The customer's name
   * @param restaurantName The restaurant's name
   * @param status 'approved' or 'rejected'
   * @param date The date of the reservation
   * @param time The time of the reservation
   */
  public async sendReservationStatusEmail(
    toEmail: string,
    customerName: string,
    restaurantName: string,
    status: 'approved' | 'rejected',
    date: Date | string,
    time: string
  ): Promise<void> {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const isApproved = status === 'approved';
    const statusColor = isApproved ? '#16a34a' : '#dc2626'; // flat green or red
    const statusText = isApproved ? 'Approved' : 'Declined';
    const message = isApproved
      ? `We are pleased to confirm your reservation at ${restaurantName} on ${formattedDate} at ${time}. We look forward to serving you!`
      : `Unfortunately, we are unable to accommodate your reservation request at ${restaurantName} on ${formattedDate} at ${time}. We apologize for the inconvenience.`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: ${statusColor}; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Reservation ${statusText}</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p style="font-size: 16px; color: #374151; margin-top: 0;">Hi ${customerName},</p>
          <p style="font-size: 16px; color: #374151; line-height: 1.5;">${message}</p>
          
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin-top: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;"><strong>Restaurant:</strong> ${restaurantName}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 0 0 0 0; font-size: 14px; color: #6b7280;"><strong>Time:</strong> ${time}</p>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">Thank you for using Yapakit.</p>
        </div>
      </div>
    `;

    const subject = `Your reservation at ${restaurantName} is ${statusText}`;

    const fromName = process.env.BREVO_FROM_NAME || 'Yapakit';
    const fromEmail = process.env.BREVO_FROM_EMAIL || 'al.exito.aja@gmail.com';

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`, // This should match a verified sender in Brevo
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[EmailService] Reservation ${status} email sent to ${toEmail}`);
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      // We log but don't necessarily throw to prevent crashing the API request just because email failed
    }
  }

  /**
   * Sends a 6-digit OTP for password recovery.
   * @param toEmail The user's email address
   * @param otp The 6-digit one-time password
   */
  public async sendPasswordResetOtp(toEmail: string, otp: string): Promise<void> {
    const fromName = process.env.BREVO_FROM_NAME || 'Yapakit';
    const fromEmail = process.env.BREVO_FROM_EMAIL || 'al.exito.aja@gmail.com';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #2563eb; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Password Reset Code</h1>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <p style="font-size: 16px; color: #374151; margin-top: 0;">You requested a password reset for your Yapakit account.</p>
          <p style="font-size: 16px; color: #374151; line-height: 1.5;">Please use the following 6-digit code to reset your password. This code will expire in 15 minutes.</p>
          
          <div style="background-color: #f3f4f6; padding: 24px; border-radius: 6px; margin-top: 24px; display: inline-block;">
            <p style="margin: 0; font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 4px; color: #111827;">${otp}</p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">If you did not request this code, please ignore this email.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">Thank you for using Yapakit.</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: toEmail,
        subject: 'Your Yapakit Password Reset Code',
        html: htmlContent,
      });
      console.log(`[EmailService] Password reset OTP sent to ${toEmail}`);
    } catch (error) {
      console.error('[EmailService] Failed to send password reset email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Sends a 6-digit OTP for B2B Registration.
   * @param toEmail The user's email address
   * @param otp The 6-digit one-time password
   */
  public async sendRegistrationOtp(toEmail: string, otp: string): Promise<void> {
    const fromName = process.env.BREVO_FROM_NAME || 'Yapakit';
    const fromEmail = process.env.BREVO_FROM_EMAIL || 'al.exito.aja@gmail.com';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #2563eb; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Verify Your Email</h1>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <p style="font-size: 16px; color: #374151; margin-top: 0;">Welcome to Yapakit! You're almost there.</p>
          <p style="font-size: 16px; color: #374151; line-height: 1.5;">Please use the following 6-digit code to complete the verification step of your restaurant's registration. This code will expire in 15 minutes.</p>
          
          <div style="background-color: #f3f4f6; padding: 24px; border-radius: 6px; margin-top: 24px; display: inline-block;">
            <p style="margin: 0; font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 4px; color: #111827;">${otp}</p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">If you did not initiate a registration, please ignore this email.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">Thank you for choosing Yapakit.</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: toEmail,
        subject: 'Your Yapakit Registration Code',
        html: htmlContent,
      });
      console.log(`[EmailService] Registration OTP sent to ${toEmail}`);
    } catch (error) {
      console.error('[EmailService] Failed to send registration email:', error);
      throw new Error('Failed to send registration verification email');
    }
  }
}

export const emailService = new EmailService();
