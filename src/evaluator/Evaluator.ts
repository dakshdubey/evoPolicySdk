import { Policy } from '../models/Policy';
import { Subject } from '../models/Subject';
import { Resource } from '../models/Resource';
import { ConditionParser } from '../parser/ConditionParser';

export interface EvaluationRequest {
    subject: Subject;
    action: string;
    resource: Resource;
}

export class Evaluator {
    private policies: Policy[] = [];

    constructor(policies: Policy[]) {
        this.policies = policies;
    }

    public evaluate(request: EvaluationRequest): boolean {
        const matchedPolicies = this.policies.filter(policy => this.isMatch(policy, request));

        let allow = false;
        let deny = false;

        for (const policy of matchedPolicies) {
            if (policy.effect === 'deny') {
                deny = true;
            } else if (policy.effect === 'allow') {
                allow = true;
            }
        }

        // Deny overrides Allow
        if (deny) return false;

        // Must have at least one explicit allow
        return allow;
    }

    private isMatch(policy: Policy, request: EvaluationRequest): boolean {
        // 1. Role Match
        if (policy.role !== '*' && policy.role !== request.subject.role) {
            return false;
        }

        // 2. Action Match
        if (policy.action !== '*' && policy.action !== request.action) {
            return false;
        }

        // 3. Resource Match
        if (policy.resource !== '*' && policy.resource !== request.resource.type) {
            return false;
        }

        // 4. Conditions Match
        if (policy.condition) {
            // Merge subject and resource for condition context
            // This allows conditions to access "subject.id", "resource.amount", or just "amount" (if flattened or mapped)
            // We'll expose the full request context to the parser for maximum flexibility
            const context = {
                subject: request.subject,
                resource: request.resource,
                // Flatten resource properties for easier access if they match top-level keys in typical JSON policies
                ...request.resource,
                // Flatten subject properties ? Maybe risk of collision, but standard for these engines to prefer explicit paths or convenience
                ...request.subject
            };

            if (!ConditionParser.evaluateAll(policy.condition, context)) {
                return false;
            }
        }

        return true;
    }
}
