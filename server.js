import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

/* =========================
   BREVO API HELPER
========================= */
async function sendBrevoEmail(toEmail, subject, textContent) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SMTP_USER || 'smehla147@gmail.com';

    if (!apiKey) {
        throw new Error('BREVO_API_KEY is not configured in environment variables.');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { email: senderEmail, name: 'North Sydney Cabs' },
            to: [{ email: toEmail }],
            subject: subject,
            textContent: textContent
        })
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(`Brevo API Error: ${data.message || JSON.stringify(data)}`);
    }
    
    return data;
}

/* =========================
   BOOKING API
========================= */
app.post('/api/book', async (req, res) => {
    const bookingRef = '#LC-' + Math.floor(1000 + Math.random() * 9000);

    try {
        const {
            pickup, dest, when, scheduledTime, vehicle, pName, pPhone, pEmail, notes
        } = req.body;

        const driverSubject = `New Taxi Booking - ${bookingRef} - ${pName}`;
        const driverText = `
New Booking Received!

Reference: ${bookingRef}

Passenger Details
-----------------
Name: ${pName}
Phone: ${pPhone}
Email: ${pEmail || 'Not provided'}

Trip Details
------------
Pickup: ${pickup}
Destination: ${dest || 'Not provided'}
When: ${when === 'now' ? 'ASAP' : 'Scheduled for ' + scheduledTime}

Vehicle: ${vehicle}

Notes
-----
${notes || 'None'}
`;

        const passengerSubject = `Booking Confirmation - ${bookingRef}`;
        const passengerText = `
Hi ${pName},

Your taxi booking has been confirmed.

Booking Reference: ${bookingRef}

Pickup Location:
${pickup}

Time:
${when === 'now' ? 'ASAP' : scheduledTime}

A driver will contact you shortly on:
${pPhone}

Thank you for choosing North Sydney Cabs.
`;

        // SEND DRIVER EMAIL
        await sendBrevoEmail(process.env.SMTP_USER || 'smehla147@gmail.com', driverSubject, driverText);
        console.log('Driver email sent successfully via Brevo API');

        // SEND PASSENGER EMAIL IF PROVIDED
        if (pEmail && pEmail.trim() !== '') {
            try {
                await sendBrevoEmail(pEmail.trim(), passengerSubject, passengerText);
                console.log('Passenger email sent successfully via Brevo API');
            } catch (passengerErr) {
                console.log('Passenger email failed (likely fake or bounced):', passengerErr.message);
            }
        }

        return res.status(200).json({
            success: true,
            ref: bookingRef
        });

    } catch (error) {
        console.error('EMAIL ERROR:', error.message);
        
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/* =========================
   FRONTEND ROUTE
========================= */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});