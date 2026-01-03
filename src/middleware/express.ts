import { PolicyEngine } from '../engine/PolicyEngine';

/**
 * Creates an Express middleware for fine-grained authorization using EvoPolicySdk.
 * Assumes `req.user` is populated (e.g., by authentication middleware).
 * 
 * @param engine - The PolicyEngine instance
 * @param mapRequest - Optional function to map the Express request to a policy request object. 
 *                     Defaults to mapping method to action, path to resource, and user to subject.
 *                     You can override this to customize how role/resources are extracted.
 */
export const policyMiddleware = (
    engine: PolicyEngine,
    mapRequest?: (req: any) => { action: string; resource: any; subject: any }
) => {
    return (req: any, res: any, next: any) => {
        try {
            // Default mapping if none provided
            const requestContext = mapRequest ? mapRequest(req) : {
                // Map HTTP verbs to actions
                action: mapMethodToAction(req.method),
                // Use req.user as subject (assuming it exists)
                subject: req.user || { role: 'guest' },
                // Use basics of request as resource, can be augmented by users
                resource: {
                    type: 'api_endpoint',
                    path: req.path,
                    params: req.params,
                    body: req.body,
                    query: req.query
                }
            };

            if (engine.can(requestContext)) {
                return next();
            } else {
                return res.status(403).json({
                    error: 'Access Denied',
                    message: `You are not authorized to perform '${requestContext.action}' on this resource.`
                });
            }
        } catch (error) {
            console.error('Policy Middleware Error:', error);
            return res.status(500).json({ error: 'Internal Server Error during authorization.' });
        }
    };
};

/**
 * Helper to map HTTP methods to standard CRUD actions.
 */
function mapMethodToAction(method: string): string {
    switch (method.toUpperCase()) {
        case 'GET': return 'read';
        case 'POST': return 'create';
        case 'PUT': return 'update';
        case 'PATCH': return 'update';
        case 'DELETE': return 'delete';
        default: return 'manage'; // Fallback
    }
}
