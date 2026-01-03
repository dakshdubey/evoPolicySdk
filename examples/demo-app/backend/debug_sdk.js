const sdk = require('../../../');
console.log('SDK Keys:', Object.keys(sdk));
console.log('PolicyEngine Type:', typeof sdk.PolicyEngine);
if (sdk.PolicyEngine) {
    const engine = new sdk.PolicyEngine();
    console.log('Engine Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(engine)));
    console.log('setPolicies exists:', typeof engine.setPolicies);
}
