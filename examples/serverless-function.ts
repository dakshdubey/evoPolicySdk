import { PolicyEngine } from '../src';

const engine = new PolicyEngine();
// In serverless, load policies once outside the handler (cold start optimization)
engine.setPolicies([{ effect: 'allow', role: 'admin', action: 'delete', resource: 'db' }]);

export const handler = async (event: any) => {
    const user = event.requestContext.authorizer; // Assumes AuthZ

    const allowed = engine.can({
        subject: {
            id: user.sub,
            role: user.role
        },
        action: event.routeKey, // e.g., "DELETE /db" or custom action mapping
        resource: {
            type: 'db',
            region: event.region
        }
    });

    if (!allowed) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: "Access Denied" })
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Operation Successful" })
    };
};
