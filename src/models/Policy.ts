export type Effect = 'allow' | 'deny';

export interface Policy {
    /**
     * The ID of the policy (optional, for tracking).
     */
    id?: string;

    /**
     * The effect of the policy: 'allow' or 'deny'.
     */
    effect: Effect;

    /**
     * The role that this policy applies to.
     * Can be a specific role name (e.g., 'manager') or wildcard '*' for all roles.
     */
    role: string;

    /**
     * The action that is being performed.
     * Can be a specific action (e.g., 'approve') or wildcard '*' for all actions.
     */
    action: string;

    /**
     * The resource type this policy applies to.
     * Can be a specific resource (e.g., 'invoice') or wildcard '*' for all resources.
     */
    resource: string;

    /**
     * Optional conditions for fine-grained access control.
     * Key-value pairs where keys are property paths and values are conditions.
     * Example: { "amount": "<=1000" }
     */
    condition?: Record<string, string>;
}
