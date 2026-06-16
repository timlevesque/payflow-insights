import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mixpanel from 'mixpanel';
import { URLSearchParams } from 'url';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import multer from 'multer';
import { FormData, Blob } from 'formdata-node';
import fetch from 'node-fetch';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";


dotenv.config();

const mixpanelClient = mixpanel.init(process.env.MIXPANEL_TOKEN);
const MIXPANEL_PROJECT_ID = process.env.MIXPANEL_PROJECT_ID;
const MIXPANEL_SERVICE_ACCOUNT_USERNAME = process.env.MIXPANEL_SERVICE_ACCOUNT_USERNAME;
const MIXPANEL_SERVICE_ACCOUNT_SECRET = process.env.MIXPANEL_SERVICE_ACCOUNT_SECRET;

// MongoDB Connection URL
const MONGO_URI = process.env.MONGO_URI;
let db;

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.static('public'));

// Define the whitelist of allowed domains
const whitelist = [
    'https://payflowinsights.com',        // Main domain
    /\.payflowinsights\.com$/,            // Subdomains of payflowinsights.com
    'http://localhost:3000'             // Localhost for development
];

// CORS options with a dynamic origin check
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g., mobile apps or server-to-server requests)
        if (!origin) {
            return callback(null, true);
        }

        // Check if the origin is in the whitelist
        if (whitelist.some(domain => domain.test ? domain.test(origin) : origin === domain)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],  // Restrict allowed methods if necessary
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'], // Set allowed headers
    credentials: true  // If credentials (cookies, etc.) are allowed
};

// Connect to MongoDB
MongoClient.connect(MONGO_URI)
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db('payflow-insights'); // Replace with your database name
    })
    .catch(error => console.error('Error connecting to MongoDB:', error));

// Middleware to remove .html extension from URLs
app.use((req, res, next) => {
    if (req.url.endsWith('.html')) {
        const newUrl = req.url.slice(0, -5); // Remove the .html part
        res.redirect(301, newUrl);
    } else {
        next();
    }
});

// Function to fetch existing tokens from MongoDB
async function fetchExistingTokens() {
    try {
        const tokens = await db.collection('productinfo').distinct('dataId');
        return tokens;
    } catch (error) {
        console.error('Error fetching tokens from MongoDB:', error);
        throw new Error('Failed to fetch existing tokens');
    }
}

// Function to generate a random token
function generateRandomToken(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
}

// Function to generate a unique token
async function generateUniqueToken() {
    const existingTokens = await fetchExistingTokens();
    let token;
    do {
        token = generateRandomToken(8);
    } while (existingTokens.includes(token));
    return token;
}

// Endpoint to generate and return a unique token
app.get('/generate-unique-token', cors(corsOptions), async (req, res) => {
    try {
        const uniqueToken = await generateUniqueToken();
        res.json({ uniqueToken });
    } catch (error) {
        console.error('Error generating unique token:', error);
        res.status(500).send('Error generating unique token');
    }
});

// Update this function to be async
async function generateSecretKey(length = 16) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secretKey;
    do {
        secretKey = '';
        for (let i = 0; i < length; i++) {
            secretKey += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    } while (!(await isSecretKeyUnique(secretKey)));
    return secretKey;
}

// This function remains the same
async function isSecretKeyUnique(secretKey) {
    const existingKey = await db.collection('productinfo').findOne({ secret: secretKey });
    return !existingKey;
}

// The rest of the code remains the same
app.post('/submit-product-info', cors(corsOptions), async (req, res) => {
    const formData = req.body;
    console.log('Form data:', formData);

    if (formData && formData.uniqueToken) {
        try {
            const secretKey = await generateSecretKey();
            const eventData = {
                dataId: formData.uniqueToken,
                secret: secretKey,
                companyLogo: formData.companyLogoLink,
                productImage: formData.productImageLink,
                productName: formData.productName,
                companyName: formData.companyName,
                paymentType: formData.paymentType,
                price: formData.price,
                emails: [],
                monthlyPrice: formData.monthlyPrice,
                yearlyPrice: formData.yearlyPrice,
                successMessage: formData.successMessage,
                destinationUrl: formData.destinationUrl
            };

            console.log('Mixpanel event data:', eventData);

            // Track event in Mixpanel
            mixpanelClient.track('Product Information Submitted', eventData, (err) => {
                if (err) {
                    console.error('Error tracking event in Mixpanel:', err);
                    res.status(500).send('Error tracking event in Mixpanel');
                } else {
                    console.log('Event tracked successfully in Mixpanel');
                }
            });

            // Store data in MongoDB
            const result = await db.collection('productinfo').insertOne(eventData);
            console.log('Data stored in MongoDB:', result.insertedId);

            res.json({ message: 'Event tracked and stored successfully', secretKey: secretKey });
        } catch (error) {
            console.error('Error processing form data:', error);
            res.status(500).send('Error processing form data');
        }
    } else {
        res.status(400).send('Invalid form data');
    }
});

app.get('/fetch-event-data', cors(corsOptions), async (req, res) => {
    const dataId = req.query.dataId;

    if (!dataId) {
        return res.status(400).json({ error: 'dataId query parameter is required' });
    }

    try {
        // Fetch data from MongoDB
        const data = await db.collection('productinfo').findOne({ dataId: dataId });

        if (!data) {
            return res.status(404).json({ error: 'No data found for the given dataId' });
        }

        // Remove the MongoDB _id field from the response
        const { _id, ...responseData } = data;

        res.json(responseData);
    } catch (error) {
        console.error('Error fetching event data from MongoDB:', error);
        res.status(500).json({ error: 'Failed to fetch event data' });
    }
});

// Endpoint to handle payment submissions
app.post('/submit-payment', cors(corsOptions), async (req, res) => {
    const formProperties = req.body;

    try {
        // Track the 'Payment Submitted' event in Mixpanel
        mixpanelClient.track('Payment Submitted', formProperties);

        // Store the payment data in the 'productpurchase' collection in MongoDB
        const result = await db.collection('productpurchase').insertOne(formProperties);
        console.log('Payment data stored in MongoDB:', result.insertedId);

        res.send('Payment submitted and stored successfully.');
    } catch (error) {
        console.error('Error submitting payment:', error);
        res.status(500).json({ error: 'Error submitting payment', details: error.message });
    }
});

app.get('/query-emails', cors(corsOptions), async (req, res) => {
    const { secret } = req.query;

    if (!secret) {
        return res.status(400).json({ error: 'Secret parameter is required' });
    }

    try {
        // Find the product info based on the provided secret
        const productInfo = await db.collection('productinfo').findOne({ secret: secret });

        if (!productInfo) {
            return res.status(404).json({ error: 'No product information found for the given secret' });
        }

        const dataId = productInfo.dataId;
        const emails = productInfo.emails || [];

        // Count objects in productpurchase collection with the matching dataId
        const count = await db.collection('productpurchase').countDocuments({ dataId: dataId });

        res.json({
            count: count,
            emails: emails
        });
    } catch (error) {
        console.error('Error querying MongoDB:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});
app.post('/update-email', cors(corsOptions), async (req, res) => {
    const { email, dataId } = req.body;

    if (!email || !dataId) {
        return res.status(400).json({ error: 'Email and dataId are required.' });
    }

    try {
        // Add the email to the existing emails array
        const result = await db.collection('productinfo').updateOne(
            { dataId: dataId },
            { $push: { emails: email } }  // Use $push to add the email to the emails array
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'No document found with the given dataId.' });
        }

        res.json({ message: 'Email added successfully to the emails array.' });
    } catch (error) {
        console.error('Error updating email:', error);
        res.status(500).json({ error: 'Failed to update email.' });
    }
});


// Configure Multer for handling file uploads
const upload = multer({
    limits: {
        fileSize: 700 * 1024, // 700KB limit
    }
});

// Configure AWS S3
const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: 'us-east-2'
});

// Add this new endpoint to handle image uploads
app.post('/upload-image', cors(corsOptions), upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    try {
        // Generate a unique filename for the image
        const fileName = `${Date.now()}-${req.file.originalname}`;

        // Upload the image to the S3 bucket
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        });

        await s3Client.send(command);

        // Return the S3 URL of the uploaded image
        res.json({ link: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}` });
    } catch (error) {
        console.error('Error uploading to S3:', error);
        res.status(500).json({ error: 'Error: Please ensure the size is less than 700KB' });
    }
});


// ─── V2 API Routes (visual editor flow) ───────────────────────────────────────

function genId(bytes) {
    return crypto.randomBytes(bytes).toString('hex');
}

app.post('/api/simulation', cors(corsOptions), async (req, res) => {
    try {
        const sim = {
            id: genId(4),
            dashboardKey: genId(16),
            creatorEmail: req.body.creatorEmail || '',
            productName: req.body.productName || 'Untitled Product',
            tagline: req.body.tagline || '',
            description: req.body.description || '',
            paymentType: req.body.paymentType || 'one-time',
            price: parseFloat(req.body.price) || 0,
            ctaText: req.body.ctaText || 'Pay Now',
            primaryColor: req.body.primaryColor || '#4f46e5',
            logoUrl: req.body.logoUrl || '',
            productImageUrl: req.body.productImageUrl || '',
            revealMessage: req.body.revealMessage || 'Thanks for your interest! This was a purchase simulation — no payment was taken.',
            createdAt: new Date(),
            visits: 0,
        };
        await db.collection('productinfo').insertOne(sim);
        res.json({ simId: sim.id, dashboardKey: sim.dashboardKey });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create simulation' });
    }
});

app.get('/api/simulation/:id', cors(corsOptions), async (req, res) => {
    try {
        const sim = await db.collection('productinfo').findOne({ id: req.params.id });
        if (!sim) return res.status(404).json({ error: 'Not found' });
        const { _id, dashboardKey, creatorEmail, ...pub } = sim;
        res.json(pub);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/visit', cors(corsOptions), async (req, res) => {
    try {
        await db.collection('productinfo').updateOne(
            { id: req.body.simId },
            { $inc: { visits: 1 } }
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/lead', cors(corsOptions), async (req, res) => {
    try {
        const lead = {
            simulationId: req.body.simulationId,
            buyerName: req.body.buyerName || '',
            buyerEmail: req.body.buyerEmail || '',
            quantity: parseInt(req.body.quantity) || 1,
            totalPrice: parseFloat(req.body.totalPrice) || 0,
            consented: req.body.consented === true || req.body.consented === 'true',
            stepReached: req.body.stepReached || 'completed',
            deviceType: req.body.deviceType || 'unknown',
            createdAt: new Date(),
        };
        await db.collection('productpurchase').insertOne(lead);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/dashboard/:key', cors(corsOptions), async (req, res) => {
    try {
        const sim = await db.collection('productinfo').findOne({ dashboardKey: req.params.key });
        if (!sim) return res.status(404).json({ error: 'Not found' });
        const leads = await db.collection('productpurchase').find({ simulationId: sim.id }).sort({ createdAt: -1 }).toArray();
        const { _id, dashboardKey, ...simData } = sim;
        res.json({ simulation: simData, leads: leads.map(({ _id, ...l }) => l) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ──────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
