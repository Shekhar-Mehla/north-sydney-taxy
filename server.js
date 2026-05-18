import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
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
   EMAIL TRANSPORTER
========================= */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify SMTP connection
transporter.verify((error, success) => {
    if (error) {
        console.log('SMTP ERROR:', error);
    } else {
        console.log('SMTP SERVER READY');
    }
});

/* =========================
   BOOKING API
========================= */
app.post('/api/book', async (req, res) => {
    const bookingRef = '#LC-' + Math.floor(1000 + Math.random() * 9000);

    try {
        const {
            pickup,
            dest,
            when,
            scheduledTime,
            vehicle,
            pName,
            pPhone,
            pEmail,
            notes
        } = req.body;

        // DRIVER EMAIL
        const driverMailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.SMTP_USER,
            subject: `New Taxi Booking - ${bookingRef} - ${pName}`,
            text: `
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
When: ${when === 'now'
    ? 'ASAP'
    : 'Scheduled for ' + scheduledTime}

Vehicle: ${vehicle}

Notes
-----
${notes || 'None'}
`
        };

        // PASSENGER EMAIL
        const passengerMailOptions = {
            from: process.env.SMTP_USER,
            to: pEmail,
            subject: `Booking Confirmation - ${bookingRef}`,
            text: `
Hi ${pName},

Your taxi booking has been confirmed.

Booking Reference: ${bookingRef}

Pickup Location:
${pickup}

Time:
${when === 'now'
    ? 'ASAP'
    : scheduledTime}

A driver will contact you shortly on:
${pPhone}

Thank you for choosing North Sydney Cabs.
`
        };

        // SEND DRIVER EMAIL
        await transporter.sendMail(driverMailOptions);
        console.log('Driver email sent');

        // SEND PASSENGER EMAIL IF PROVIDED
        if (pEmail && pEmail.trim() !== '') {
            try {
                await transporter.sendMail(passengerMailOptions);
                console.log('Passenger email sent');
            } catch (passengerErr) {
                console.log(
                    'Passenger email failed:',
                    passengerErr.message
                );
            }
        }

        return res.status(200).json({
            success: true,
            ref: bookingRef
        });

    } catch (error) {
        console.error('EMAIL ERROR:', error);

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