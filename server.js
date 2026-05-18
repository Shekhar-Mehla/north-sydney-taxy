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

// Serve static files (HTML, CSS, JS) from the current directory
app.use(express.static(__dirname));

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false // Fixes the self-signed certificate error on Windows
    }
});

app.post('/api/book', async (req, res) => {
    // Generate reference outside the try block so it can be accessed in the catch block if needed
    const bookingRef = '#LC-' + Math.floor(1000 + Math.random() * 9000);

    try {
        const { pickup, dest, when, scheduledTime, vehicle, pName, pPhone, pEmail, notes } = req.body;

        // 1. Email for the Driver
        const driverMailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.SMTP_USER, // Always send to the driver
            subject: `New Taxi Booking - ${bookingRef} - ${pName}`,
            text: `
New Booking Received!
--------------------
Reference: ${bookingRef}
Name: ${pName}
Phone: ${pPhone}
Email: ${pEmail || 'Not provided'}

Trip Details:
-------------
Pickup: ${pickup}
Destination: ${dest || 'Not provided'}
When: ${when === 'now' ? 'ASAP' : 'Scheduled for ' + scheduledTime}
Vehicle Type: ${vehicle}

Notes from passenger:
${notes || 'None'}
`
        };

        // 2. Email for the Passenger
        const passengerMailOptions = {
            from: process.env.SMTP_USER,
            to: pEmail,
            subject: `Booking Confirmation - ${bookingRef}`,
            text: `
Hi ${pName},

Your taxi booking is confirmed! 

Booking Reference: ${bookingRef}
Pickup Location: ${pickup}
When: ${when === 'now' ? 'ASAP' : 'Scheduled for ' + scheduledTime}

Once your booking is processed, the driver will call you on ${pPhone} to confirm the details.

Thank you for choosing North Sydney Cabs!
`
        };

        // Try to send the emails if credentials are set
        if (process.env.SMTP_USER && process.env.SMTP_USER !== 'your_email@gmail.com') {
            // Send to Driver
            await transporter.sendMail(driverMailOptions);
            
            // Send to Passenger (if they provided an email)
            if (pEmail) {
                await transporter.sendMail(passengerMailOptions);
            }
        } else {
            console.log('Skipping email send because SMTP credentials are not configured.');
        }
        
        res.status(200).json({ success: true, ref: bookingRef });
    } catch (error) {
        console.error('Error sending email:', error);
        // Even if email fails, we return success to the frontend so the user sees the success screen.
        res.status(200).json({ success: true, ref: bookingRef, warning: 'Email could not be sent. Check credentials.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
