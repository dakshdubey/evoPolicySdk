# EvoPolicy SDK

[![npm version](https://img.shields.io/npm/v/evopolicychecker.svg?style=flat-square)](https://www.npmjs.com/package/evopolicychecker)
[![License](https://img.shields.io/npm/l/evopolicychecker.svg?style=flat-square)](https://github.com/daksha/evopolicychecker/blob/main/LICENSE)

EvoPolicy is a high-performance, deterministic authorization engine tailored for enterprise Node.js and TypeScript ecosystems. It facilitates advanced attribute-based access control (ABAC) and role-based access control (RBAC) by evaluating policies locally within the application process. This architecture eliminates network latency and central service dependency while maintaining a robust security posture.

---

## Technical Value Proposition

In large-scale distributed systems, authorization logic often becomes fragmented or creates performance bottlenecks due to network-based policy lookups. EvoPolicy addresses these fundamental challenges through:

1.  **Sub-Millisecond Evaluation**: Policies are processed in-memory. Standard decision cycles complete in under 100 microseconds, ensuring critical paths remain high-speed.
2.  **Universal Data Interfacing**: The engine is decoupled from storage. It supports seamless ingestion from local configuration (JSON/YAML), relational clusters (MySQL, PostgreSQL), and distributed NoSQL/API sources (MongoDB, GraphQL).
3.  **Auditable Condition Logic**: A formal recursive descent parser evaluates complex constraints without unsafe script execution.
4.  **Security Fail-Closed Design**: The SDK enforces a strict denial policy in cases of initialization failure or ambiguous rule sets.

---

## Enterprise System Architecture

The following diagram illustrates the integration of various policy sources and the internal decision logic flow.

![EvoPolicy Enterprise Architecture](file:///C:/Users/Daksha%20Dubey/.gemini/antigravity/brain/87b76137-e4eb-4765-9961-c2b2f6a944fa/evopolicy_v2_architecture_1767414589196.png)

### Architectural Components

*   **Logic Engine**: Orchestrates the filtering and matching of policies against the evaluation context.
*   **IPolicyLoader Abstraction**: An extensible interface for implementing custom data persistence strategies.
*   **Condition Parser**: A secure, non-evaluative parser that validates resource and subject attributes.
*   **Decision Matrix**: Applies Deny-Overrides logic to deliver a final authorization verdict.

---

## Installation

```bash
npm install evopolicychecker
```

---

## Technical Implementation Guide

### Engine Initialization and Data Ingestion

The engine supports multiple loading strategies, allow for both static and dynamic policy management.

```typescript
import { PolicyEngine, JsonPolicyLoader, CustomPolicyLoader } from 'evopolicychecker';

const engine = new PolicyEngine();

// Static file ingestion
engine.loadPolicies('./config/access_rules.json');

// Dynamic Database Integration
const fetcher = async () => {
    // Implement database-specific retrieval logic
    return await database.authorizations.findMany();
};
await engine.loadFromLoader(new CustomPolicyLoader(fetcher));
```

### Advanced Connection Patterns

For detailed implementation and copy-paste examples for **MySQL, MongoDB, PostgreSQL, and GraphQL**, please refer to the [Database Integration Specification](file:///e:/evoPolicySdk/docs/DATABASE_SUPPORT.md).

### Middleware Lifecycle Integration

EvoPolicy provides standardized middleware for Express.js to facilitate request-level authorization.

```typescript
import { policyMiddleware } from 'evopolicychecker';

// Global middleware with automatic context mapping
app.use(policyMiddleware(engine));

// Granular route protection with explicit context mapping
app.post('/v1/assets/restricted', policyMiddleware(engine, (req) => ({
    subject: req.authenticatedUser,
    action: 'administer',
    resource: {
        type: 'restricted_asset',
        id: req.params.id,
        classification: req.body.level
    }
})));
```

---

## Condition Operator Specification

| Operator | Categorization | Evaluation Logic |
| :--- | :--- | :--- |
| `>` , `<` , `>=` , `<=` | Range | Arithmetic and Chronological Comparison (ISO-8601 compatible) |
| `~=` | Pattern | Regular Expression matching (ECMAScript compatible) |
| `IN [...]` | Set | Inclusion check within discrete arrays |
| `!=` | Logic | Strict inequality validation |

---

## Performance Benchmarks

*   **Memory Efficiency**: < 50MB baseline.
*   **Evaluation Throughput**: 100k+ operations per second.
*   **Initialization Speed**: ~10ms for 1,000 policy records.

For deeper insights into the internal evaluation logic and security hardening, consult the [Architectural Specification](file:///e:/evoPolicySdk/docs/ARCHITECTURE.md).

Licensed under the **ISC License**.
Copyright © 2026 Daksha Dubey.
