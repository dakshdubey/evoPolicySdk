const http = require('http');

function post(path, role, body) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-role': role,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function verify() {
    console.log('--- EvoPolicy Server Verification ---');
    try {
        // 1. Admin Approve
        const r1 = await post('/api/invoices/approve', 'admin', { amount: 5000 });
        console.log('Admin Approve (Expected: 200 OK):', r1.status, r1.body.message);

        // 2. Manager Approve (Amount too high)
        const r2 = await post('/api/invoices/approve', 'manager', { amount: 5000 });
        console.log('Manager Approve High (Expected: 403 Forbidden):', r2.status, r2.body.error || r2.body.message);

        // 3. User Profile Update (Valid Regex)
        const r3 = await post('/api/profile/update', 'user', { email: 'daksh@company.com' });
        console.log('User Profile Regex OK (Expected: 200 OK):', r3.status, r3.body.message);

        // 4. User Profile Update (Invalid Regex)
        const r4 = await post('/api/profile/update', 'user', { email: 'daksh@gmail.com' });
        console.log('User Profile Regex Fail (Expected: 403 Forbidden):', r4.status, r4.body.error || r4.body.message);

        // 5. Editor Publish (Future Date)
        const r5 = await post('/api/articles/publish', 'editor', { publishDate: '2026-05-20' });
        console.log('Editor Date OK (Expected: 200 OK):', r5.status, r5.body.message);

    } catch (error) {
        console.error('Verification Error:', error.message);
    }
}

verify();
