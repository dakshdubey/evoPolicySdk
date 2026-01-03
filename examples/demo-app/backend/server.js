const express = require('express');
const cors = require('cors');
// Import locally linked SDK (in real app: import { PolicyEngine } from 'evopolicychecker')
const { PolicyEngine, policyMiddleware } = require('../../../');

const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// --- MySQL Configuration ---
const mysql = require('mysql2/promise');
let dbConnection;

async function connectDB() {
    try {
        dbConnection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '@nImesh12', // Provided by USER
            database: 'evopolicy_db'
        });
        console.log(' Connected to MySQL Database (evopolicy_db)');
    } catch (err) {
        console.error(' MySQL Connection Failed:', err.message);
        console.log(' Falling back to mock internal policies for demo safety.');
    }
}

// Initialize Policy Engine
const { CustomPolicyLoader } = require('../../../'); // Import loader
const engine = new PolicyEngine();

// Fetcher function for MySQL
const mysqlPolicyFetcher = async () => {
    if (!dbConnection) return getMockPolicies(); // Fallback if no DB
    try {
        console.log(' Fetching policies from MySQL...');
        const [rows] = await dbConnection.execute('SELECT * FROM policies');

        // Map data from DB to SDK format if necessary
        return rows.map(row => ({
            effect: row.effect,
            role: row.role,
            action: row.action,
            resource: row.resource,
            condition: typeof row.conditions === 'string' ? JSON.parse(row.conditions) : row.conditions
        }));
    } catch (err) {
        console.error(' Error fetching policies from MySQL:', err.message);
        return getMockPolicies();
    }
};

function getMockPolicies() {
    return [
        { effect: 'allow', role: 'manager', action: 'approve', resource: 'invoice', condition: { amount: '<=1000' } },
        { effect: 'allow', role: 'admin', action: '*', resource: '*' },
        { effect: 'allow', role: 'user', action: 'update', resource: 'profile', condition: { email: '~= ^[\\w-\\.]+@company\\.com$' } },
        { effect: 'allow', role: 'editor', action: 'publish', resource: 'article', condition: { publishDate: '> 2025-01-01T00:00:00Z' } }
    ];
}

// Async Initialization
(async () => {
    await connectDB();
    await engine.loadFromLoader(new CustomPolicyLoader(mysqlPolicyFetcher));
    console.log(' EvoPolicy Engine Initialized with MySQL Backend');
})();

// Middleware to simulate authentication
const mockAuthMiddleware = (req, res, next) => {
    // In a real app, this comes from JWT/Session
    const role = req.headers['x-role'] || 'guest';
    const userId = req.headers['x-user-id'] || 'anon';

    req.user = { id: userId, role };
    console.log(` [${req.method}] ${req.path} - User: ${userId} (${role})`);
    next();
};

app.use(mockAuthMiddleware);

// --- Protected Routes using Policy Middleware ---

// Use the middleware globally or per-route. Here we use it per-route for demonstration.
// We map the request to the policy context manually for some routes to match specific resource types.

// 1. Approve Invoice (Manager only, amount <= 1000)
// custom mapper not needed if we stick to standard (method=action, path=resource)
// but here we want "approve" action which is not a standard HTTP method, so we map it.
const invoiceAuth = policyMiddleware(engine, (req) => ({
    subject: req.user,
    action: 'approve', // Explicit action
    resource: {
        type: 'invoice',
        ...req.body
    }
}));

app.post('/api/invoices/approve', invoiceAuth, (req, res) => {
    res.json({ message: ' Invoice Approved Successfully!', data: req.body });
});

// 2. Admin Route
const dbAuth = policyMiddleware(engine, (req) => ({
    subject: req.user,
    action: 'delete',
    resource: { type: 'database' }
}));

app.delete('/api/database', dbAuth, (req, res) => {
    res.json({ message: ' Database Dropped (Admin only)' });
});

// 3. Profile Update (Regex Test)
// Matches policy: role: user, action: update, resource: profile, condition: email ~= ...
const profileAuth = policyMiddleware(engine, (req) => ({
    subject: req.user,
    action: 'update',
    resource: {
        type: 'profile',
        email: req.body.email // Pass email for regex check
    }
}));

app.post('/api/profile/update', profileAuth, (req, res) => {
    res.json({ message: ' Profile Updated (Valid Company Email)', data: req.body });
});

// 4. Article Publish (Date Test)
// Matches policy: role: editor, action: publish, resource: article, condition: publishDate > ...
const articleAuth = policyMiddleware(engine, (req) => ({
    subject: req.user,
    action: 'publish',
    resource: {
        type: 'article',
        publishDate: req.body.publishDate
    }
}));

app.post('/api/articles/publish', articleAuth, (req, res) => {
    res.json({ message: ' Article Scheduled (Valid Future Date)', data: req.body });
});

app.listen(port, () => {
    console.log(` Demo Backend running at http://localhost:${port}`);
});
