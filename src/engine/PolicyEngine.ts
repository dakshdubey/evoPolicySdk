import { Policy } from '../models/Policy';
import { Evaluator, EvaluationRequest } from '../evaluator/Evaluator';
import { JsonPolicyLoader } from '../loaders/JsonPolicyLoader';
import { IPolicyLoader } from '../loaders/IPolicyLoader';

export class PolicyEngine {
    private evaluator: Evaluator | null = null;
    private policies: Policy[] = [];

    /**
     * Loads policies from a JSON file.
     * @param filePath - Absolute or relative path to the JSON policy file.
     */
    loadPolicies(filePath: string): void {
        this.policies = JsonPolicyLoader.load(filePath);
        this.evaluator = new Evaluator(this.policies);
    }

    /**
     * Loads policies from any custom provider (Database, API, etc.)
     * @param loader An implementation of IPolicyLoader
     */
    async loadFromLoader(loader: IPolicyLoader): Promise<void> {
        this.policies = await loader.load();
        this.evaluator = new Evaluator(this.policies);
    }

    /**
     * Loads policies directly from an array of Policy objects.
     * @param policies Array of Policy objects.
     */
    setPolicies(policies: Policy[]): void {
        this.policies = policies;
        this.evaluator = new Evaluator(this.policies);
    }

    /**
     * Evaluates if an action is allowed.
     * @param request - The evaluation request containing subject, action, and resource.
     * @returns `true` if allowed, `false` otherwise.
     */
    can(request: EvaluationRequest): boolean {
        if (!this.evaluator) {
            console.warn("PolicyEngine: No policies loaded. Access denied by default.");
            return false;
        }

        return this.evaluator.evaluate(request);
    }
}
