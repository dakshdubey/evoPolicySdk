const { PolicyEngine, CustomPolicyLoader } = require('./dist/index');

async function verifyDatabaseSupport() {
    console.log(" Verifying Database Support...");

    const engine = new PolicyEngine();

    // 1. Simulate a Database/API fetcher
    const mockDbFetcher = async () => {
        console.log("📥 Fetching policies from 'database'...");
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network latency
        return [
            {
                effect: 'allow',
                role: 'admin',
                action: 'delete',
                resource: 'server',
                condition: { "env": "production" }
            },
            {
                effect: 'allow',
                role: 'user',
                action: 'read',
                resource: 'document'
            }
        ];
    };

    // 2. Initialize the Custom Loader
    const dbLoader = new CustomPolicyLoader(mockDbFetcher);

    try {
        // 3. Load from the loader
        await engine.loadFromLoader(dbLoader);
        console.log("✅ Policies loaded successfully from DB Loader.");

        // 4. Test permissions
        const test1 = engine.can({
            subject: { role: 'admin' },
            action: 'delete',
            resource: { type: 'server', env: 'production' }
        });
        console.log(`Test 1 (Admin delete production): ${test1 ? 'ALLOWED' : 'DENIED'} (Expected: ALLOWED)`);

        const test2 = engine.can({
            subject: { role: 'user' },
            action: 'read',
            resource: { type: 'document' }
        });
        console.log(`Test 2 (User read document): ${test2 ? 'ALLOWED' : 'DENIED'} (Expected: ALLOWED)`);

        const test3 = engine.can({
            subject: { role: 'guest' },
            action: 'read',
            resource: { type: 'document' }
        });
        console.log(`Test 3 (Guest read document): ${test3 ? 'ALLOWED' : 'DENIED'} (Expected: DENIED)`);

        if (test1 && test2 && !test3) {
            console.log("\n✨ Database Support Verification PASSED!");
        } else {
            console.error("\n❌ Database Support Verification FAILED!");
            process.exit(1);
        }

    } catch (error) {
        console.error("❌ Error during verification:", error);
        process.exit(1);
    }
}

verifyDatabaseSupport();
