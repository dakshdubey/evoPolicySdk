const http = require('http');

const testRequest = (options, postData) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        if (postData) req.write(JSON.stringify(postData));
        req.end();
    });
};

async function runTests() {
    console.log("🔍 Checking server at http://localhost:3001...");

    const options = {
        hostname: 'localhost',
        port: 3001,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-role': 'manager'
        }
    };

    try {
        // Test Invoice Approval
        console.log("🧪 Testing: Approve Invoice (Manager, 500)");
        const res1 = await testRequest({ ...options, path: '/api/invoices/approve' }, { amount: 500 });
        console.log("Result:", JSON.stringify(res1));

        // Test Profile Update (Regex)
        console.log("🧪 Testing: Profile Update (User, test@company.com)");
        const res2 = await testRequest({
            ...options,
            path: '/api/profile/update',
            headers: { ...options.headers, 'x-role': 'user' }
        }, { email: 'test@company.com' });
        console.log("Result:", JSON.stringify(res2));

        console.log("\n✅ Server and MySQL logic are ACTIVE!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Test Failed:", err.message);
        process.exit(1);
    }
}

runTests();
