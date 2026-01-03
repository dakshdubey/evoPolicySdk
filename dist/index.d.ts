type Effect = 'allow' | 'deny';
interface Policy {
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

interface Subject {
    /**
     * Unique identifier for the subject (user/service).
     */
    id: string;
    /**
     * The role of the subject.
     */
    role: string;
    /**
     * Additional attributes for the subject (e.g., department, location).
     */
    [key: string]: any;
}

interface Resource {
    /**
     * The type of the resource (e.g., 'invoice', 'document').
     * This must match the 'resource' field in the Policy.
     */
    type: string;
    /**
     * Optional ID of the specific resource instance.
     */
    id?: string;
    /**
     * Additional attributes of the resource (e.g., amount, owner, status).
     * These attributes are used for condition evaluation.
     */
    [key: string]: any;
}

interface EvaluationRequest {
    subject: Subject;
    action: string;
    resource: Resource;
}
declare class Evaluator {
    private policies;
    constructor(policies: Policy[]);
    evaluate(request: EvaluationRequest): boolean;
    private isMatch;
}

/**
 * Interface for policy loaders.
 * Allows fetching policies from various sources (Files, Databases, APIs).
 */
interface IPolicyLoader {
    /**
     * Fetches and returns an array of policies.
     * Can be synchronous or asynchronous.
     */
    load(): Policy[] | Promise<Policy[]>;
}

declare class PolicyEngine {
    private evaluator;
    private policies;
    /**
     * Loads policies from a JSON file.
     * @param filePath - Absolute or relative path to the JSON policy file.
     */
    loadPolicies(filePath: string): void;
    /**
     * Loads policies from any custom provider (Database, API, etc.)
     * @param loader An implementation of IPolicyLoader
     */
    loadFromLoader(loader: IPolicyLoader): Promise<void>;
    /**
     * Loads policies directly from an array of Policy objects.
     * @param policies Array of Policy objects.
     */
    setPolicies(policies: Policy[]): void;
    /**
     * Evaluates if an action is allowed.
     * @param request - The evaluation request containing subject, action, and resource.
     * @returns `true` if allowed, `false` otherwise.
     */
    can(request: EvaluationRequest): boolean;
}

declare class JsonPolicyLoader implements IPolicyLoader {
    private filePath;
    constructor(filePath: string);
    /**
     * Instance method to satisfy IPolicyLoader interface.
     */
    load(): Promise<Policy[]>;
    /**
     * Loads policies from a JSON file.
     * @param filePath Absolute or relative path to the JSON file.
     */
    static load(filePath: string): Policy[];
    /**
     * Loads policies from a JSON object (useful for testing or dynamic loading).
     */
    static loadFromData(data: any): Policy[];
}

/**
 * A flexible policy loader that takes a custom fetch function.
 * Useful for loading policies from databases, external APIs, or other dynamic sources.
 */
declare class CustomPolicyLoader implements IPolicyLoader {
    private fetcher;
    constructor(fetcher: () => Policy[] | Promise<Policy[]>);
    load(): Promise<Policy[]>;
}

/**
 * Parses and evaluates conditions safely without using eval().
 */
declare class ConditionParser {
    /**
     * Evaluates a condition string against a value.
     * Supports:
     * - Equality: "value", "=value"
     * - Inequality: "!=value"
     * - Comparison: ">value", "<value", ">=value", "<=value"
     * - Lists: "IN [a,b,c]", "NOT_IN [a,b,c]" (future support, basic list check implemented)
     *
     * @param condition The condition string (e.g., "<=1000", "sales")
     * @param value The actual value from the subject or resource
     * @returns true if the condition is met, false otherwise
     */
    static evaluate(condition: string, value: any): boolean;
    private static compare;
    /**
     * Evaluates a set of conditions against a context object.
     * ALL conditions must be true for the result to be true (AND logic).
     */
    static evaluateAll(conditions: Record<string, string>, context: any): boolean;
    /**
     * Safe deep property access (e.g., "resource.amount" or "amount")
     */
    private static getValueFromContext;
}

/**
 * Creates an Express middleware for fine-grained authorization using EvoPolicySdk.
 * Assumes `req.user` is populated (e.g., by authentication middleware).
 *
 * @param engine - The PolicyEngine instance
 * @param mapRequest - Optional function to map the Express request to a policy request object.
 *                     Defaults to mapping method to action, path to resource, and user to subject.
 *                     You can override this to customize how role/resources are extracted.
 */
declare const policyMiddleware: (engine: PolicyEngine, mapRequest?: (req: any) => {
    action: string;
    resource: any;
    subject: any;
}) => (req: any, res: any, next: any) => any;

export { ConditionParser, CustomPolicyLoader, type Effect, type EvaluationRequest, Evaluator, type IPolicyLoader, JsonPolicyLoader, type Policy, PolicyEngine, type Resource, type Subject, PolicyEngine as default, policyMiddleware };
