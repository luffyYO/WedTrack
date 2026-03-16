import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPaymentVerifiedEmail = async (guestEmail, guestName, amount, weddingName) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Skipping email notification.');
    return { success: false, error: 'API key not configured' };
  }

  if (!guestEmail) {
    console.warn(`No email provided for guest ${guestName}. Skipping email notification.`);
    return { success: false, error: 'No guest email provided' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'WedTrack <no-reply@wedtrack.com>', // Replace with your verified Resend domain if available, or a generic one if testing
      to: [guestEmail],
      subject: 'Payment Verified – WedTrack',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Payment Verified</h2>
          <p>Hello <strong>${guestName}</strong>,</p>
          <p>Your contribution for the wedding has been successfully verified by the host.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Event:</strong> ${weddingName}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${amount}</p>
          </div>
          
          <p>Thank you for your contribution and for attending the wedding.</p>
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">&mdash; The WedTrack Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, error: error.message };
    }

    console.log(`Payment verification email sent to ${guestEmail} (ID: ${data.id})`);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send payment verification email:', error);
    return { success: false, error: error.message };
  }
};
