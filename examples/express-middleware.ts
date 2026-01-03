import { PolicyEngine } from '../src';
// Mock Express types for the example
type Request = any;
type Response = any;
type NextFunction = () => void;

const engine = new PolicyEngine();
// engine.loadPolicies('./policies.json'); // Load from file in real app
engine.setPolicies([{ effect: 'allow', role: 'user', action: 'read', resource: 'profile' }]);

export const authorize = (action: string, resourceType: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Assuming user is attached to req by authentication middleware
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const allowed = engine.can({
            subject: {
                id: user.id,
                role: user.role,
                ...user // Propagate other user attributes
            },
            action: action,
            resource: {
                type: resourceType,
                ...req.params, // Use params/body as resource attributes
                ...req.body
            }
        });

        if (!allowed) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        next();
    };
};

// Usage: app.get('/profile/:id', authorize('read', 'profile'), getProfile);
