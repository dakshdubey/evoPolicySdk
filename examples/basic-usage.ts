import { PolicyEngine } from '../src';

const engine = new PolicyEngine();

// Load policies (mock loading for example simplicity, in real app use loadPolicies with file path)
engine.setPolicies([
    {
        effect: 'allow',
        role: 'manager',
        action: 'approve',
        resource: 'invoice',
        condition: { amount: '<=100000' }
    }
]);

const request = {
    subject: {
        id: 'u1',
        role: 'manager',
        department: 'sales'
    },
    action: 'approve',
    resource: {
        type: 'invoice',
        amount: 45000,
        owner: 'u2'
    }
};

const allowed = engine.can(request);

if (allowed) {
    console.log('✅ Access Granted');
} else {
    console.error('❌ Access Denied');
}
