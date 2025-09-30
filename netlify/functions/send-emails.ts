import sgMail from '@sendgrid/mail';
import type { Match } from '../../src/types';

const getThemeColors = (theme: string) => {
    switch (theme) {
        case 'halloween': return { primary: '#f97316', secondary: '#1f2937' }; // Orange to Black
        case 'valentines': return { primary: '#dc2626', secondary: '#ec4899' }; // Red to Pink
        case 'christmas': return { primary: '#c62828', secondary: '#16a34a' }; // Red to Green
        case 'birthday': return { primary: '#0ea5e9', secondary: '#f59e0b' }; // Sky Blue to Amber
        case 'celebration': return { primary: '#4f46e5', secondary: '#d946ef' }; // Indigo to Fuchsia
        default: return { primary: '#c62828', secondary: '#16a34a' }; // Default to Christmas gradient
    }
};

// --- Email HTML Template ---
const createEmailHtml = (giverName: string, receiverName: string, receiverNotes: string, receiverBudget: string, eventDetails: string, theme: string): string => {
    const { primary, secondary } = getThemeColors(theme);
    const budgetHtml = receiverBudget 
        ? `<p style="font-size: 14px; margin-top: 5px;"><strong>Suggested Budget:</strong> ${receiverBudget.startsWith('$') ? receiverBudget : `$${receiverBudget}`}</p>`
        : '';
    const eventDetailsHtml = eventDetails
        ? `<div style="margin-top: 25px; padding: 15px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0;">
             <h3 style="margin: 0; font-size: 16px; color: #1e293b;">Event Details</h3>
             <p style="margin: 5px 0 0; font-size: 14px; color: #475569;">${eventDetails.replace(/\n/g, '<br>')}</p>
           </div>`
        : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');
          body { font-family: 'Montserrat', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(to right, ${primary}, ${secondary}); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">You're a Secret Santa!</h1>
          </div>
          <div class="content">
            <h2 style="font-size: 20px; color: #1e293b; margin-top: 0;">Hello, ${giverName}!</h2>
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">The results are in! You are the Secret Santa for...</p>
            <div style="font-size: 32px; font-weight: 700; color: #16a34a; text-align: center; margin: 20px 0; padding: 15px; background-color: #f0fdf4; border-radius: 8px;">
              ${receiverName}
            </div>
            <div style="margin-top: 20px;">
              <h3 style="font-size: 16px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Their Gift Ideas & Notes</h3>
              <p style="font-size: 14px; color: #475569; min-height: 20px;">${receiverNotes || '<em>No notes provided.</em>'}</p>
              ${budgetHtml}
            </div>
            ${eventDetailsHtml}
          </div>
          <div class="footer">
            <p>Sent via SecretSantaMatch.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
};

// --- Netlify Function Handler ---
export async function handler(event: any, context: any) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = process.env;

    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server configuration error: SendGrid API key or 'From' email is not set." })
        };
    }
    sgMail.setApiKey(SENDGRID_API_KEY);

    try {
        const { matches, eventDetails, theme = 'default' } = JSON.parse(event.body || '{}') as { matches: Match[], eventDetails: string, theme: string };

        if (!matches || !Array.isArray(matches) || matches.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'No match data provided.' }) };
        }

        const messages = matches
            .filter(match => match.giver.email && match.giver.email.includes('@'))
            .map(match => ({
                to: match.giver.email,
                from: {
                    name: 'Secret Santa Match',
                    email: SENDGRID_FROM_EMAIL,
                },
                subject: `Shhh... Your Secret Santa match is here!`,
                html: createEmailHtml(
                    match.giver.name,
                    match.receiver.name,
                    match.receiver.notes,
                    match.receiver.budget,
                    eventDetails,
                    theme
                ),
            }));

        if (messages.length > 0) {
            await sgMail.send(messages);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Successfully sent ${messages.length} emails.` }),
        };

    } catch (error: any) {
        console.error('Error sending emails:', error.response?.body || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send emails.' }),
        };
    }
}
