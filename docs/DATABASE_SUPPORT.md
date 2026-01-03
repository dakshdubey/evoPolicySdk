# Database Integration Specification

EvoPolicy is designed as a generalized authorization engine that remains agnostic to the underlying persistence layer. Integration with external data sources is standardized through the `IPolicyLoader` interface.

## Standardized Integration Patterns

### 1. Relational Systems (MySQL, PostgreSQL)

When utilizing relational databases, the integration layer is responsible for mapping tabular data into the SDK's Policy schema.

**Implementation Logic:**
1. Execute query to retrieve active authorization rules.
2. Deserialize condition strings if stored as text/JSON.
3. Return a standardized array of Policy objects.

```javascript
/* Formal MySQL Pattern */
const mysql = require('mysql2/promise');
const { PolicyEngine, CustomPolicyLoader } = require('evopolicychecker');

async function initializeSecureEngine() {
    const conn = await mysql.createConnection(config);
    const engine = new PolicyEngine();

    const fetcher = async () => {
        const [rows] = await conn.execute('SELECT * FROM sys_authorizations WHERE is_active = 1');
        return rows.map(item => ({
            effect: item.effect,
            role: item.role,
            action: item.action,
            resource: item.resource,
            condition: JSON.parse(item.conditions)
        }));
    };

    await engine.loadFromLoader(new CustomPolicyLoader(fetcher));
}
```

### 2. Distributed Document Stores (MongoDB)

EvoPolicy integrates seamlessly with NoSQL systems by utilizing native document structures for policy storage.

```javascript
/* Formal MongoDB Pattern */
const { MongoClient } = require('mongodb');
const { PolicyEngine, CustomPolicyLoader } = require('evopolicychecker');

async function initializeMongoEngine() {
    const client = new MongoClient(process.env.DB_URI);
    const db = client.db('iam_governance');
    const engine = new PolicyEngine();

    const fetcher = async () => {
        return await db.collection('live_policies').find({}).toArray();
    };

    await engine.loadFromLoader(new CustomPolicyLoader(fetcher));
}
```

### 3. API & GraphQL Orchestration

In decoupled architectures where authorization rules are managed by a central IAM service, policies can be retrieved via HTTP endpoints.

```javascript
/* Formal GraphQL Data Fetching */
const gqlFetcher = async () => {
    const raw = await fetch(ENDPOINT, {
        method: 'POST',
        headers: AUTH_HEADERS,
        body: JSON.stringify({
            query: `query { fetchActivePolicies { effect role action resource condition } }`
        })
    });
    const { data } = await raw.json();
    return data.fetchActivePolicies;
};
```

## Data Transformation Requirements

To maintain operational integrity, the integration layer must ensure all records adhere to the following data types:

| Property | Type | Constraint |
| :--- | :--- | :--- |
| `effect` | String | Must be 'allow' or 'deny' |
| `role` | String | Target identification string or '*' |
| `action` | String | Operation name or '*' |
| `resource` | String | Resource classification identifier |
| `condition` | Object | Key-value mapping of attribute constraints |

## Operational Advantages

*   **Minimized Attack Surface**: No native database drivers are bundled with the core SDK.
*   **Infrastructure Flexibility**: Support for polyglot persistence without code modification in the engine core.
*   **Reduced IO Overhead**: Authorization decisions are made in-memory, avoiding database lookups during every request.
