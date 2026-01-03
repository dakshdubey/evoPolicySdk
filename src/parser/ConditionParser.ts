/**
 * Parses and evaluates conditions safely without using eval().
 */
export class ConditionParser {
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
    static evaluate(condition: string, value: any): boolean {
        if (condition === '*') return true;
        if (value === undefined || value === null) return false;

        const trimmedCondition = condition.trim();

        // Handle IN / NOT_IN
        // syntax: IN [active, pending]
        if (/^IN\s*\[.*\]$/i.test(trimmedCondition)) {
            const listContent = trimmedCondition.match(/^IN\s*\[(.*)\]$/i)?.[1];
            if (!listContent) return false;
            const list = listContent.split(',').map(s => s.trim());
            return list.includes(String(value));
        }

        if (/^NOT_IN\s*\[.*\]$/i.test(trimmedCondition)) {
            const listContent = trimmedCondition.match(/^NOT_IN\s*\[(.*)\]$/i)?.[1];
            if (!listContent) return false;
            const list = listContent.split(',').map(s => s.trim());
            return !list.includes(String(value));
        }

        // Regex Operator (~=)
        if (trimmedCondition.startsWith('~=')) {
            const regexPattern = trimmedCondition.slice(2).trim();
            try {
                // Support start/end anchors if not provided, or strict string matching? 
                // Usually regex policies are partial match unless ^$ used.
                // We'll trust the user's regex string.
                const regex = new RegExp(regexPattern);
                return regex.test(String(value));
            } catch (e) {
                console.warn(`ConditionParser: Invalid regex "${regexPattern}"`, e);
                return false;
            }
        }

        // Comparison Operators
        if (trimmedCondition.startsWith('>=')) {
            return this.compare(value, trimmedCondition.slice(2), (a, b) => a >= b);
        }
        if (trimmedCondition.startsWith('<=')) {
            return this.compare(value, trimmedCondition.slice(2), (a, b) => a <= b);
        }
        if (trimmedCondition.startsWith('>')) {
            return this.compare(value, trimmedCondition.slice(1), (a, b) => a > b);
        }
        if (trimmedCondition.startsWith('<')) {
            return this.compare(value, trimmedCondition.slice(1), (a, b) => a < b);
        }
        if (trimmedCondition.startsWith('!=')) {
            return String(value) !== trimmedCondition.slice(2).trim();
        }
        if (trimmedCondition.startsWith('=')) {
            return String(value) === trimmedCondition.slice(1).trim();
        }

        // Default: Equality check
        return String(value) === trimmedCondition;
    }

    private static compare(actual: any, targetStr: string, comparator: (a: any, b: any) => boolean): boolean {
        // Try numbers first
        const actualNum = Number(actual);
        const targetNum = Number(targetStr);

        if (!isNaN(actualNum) && !isNaN(targetNum)) {
            return comparator(actualNum, targetNum);
        }

        // Try Dates
        const actualDate = Date.parse(actual);
        const targetDate = Date.parse(targetStr);

        if (!isNaN(actualDate) && !isNaN(targetDate)) {
            return comparator(actualDate, targetDate);
        }

        // Fallback to string comparison
        return comparator(String(actual), targetStr.trim());
    }

    /**
     * Evaluates a set of conditions against a context object.
     * ALL conditions must be true for the result to be true (AND logic).
     */
    static evaluateAll(conditions: Record<string, string>, context: any): boolean {
        for (const [key, condition] of Object.entries(conditions)) {
            const value = this.getValueFromContext(context, key);
            if (!this.evaluate(condition, value)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Safe deep property access (e.g., "resource.amount" or "amount")
     */
    private static getValueFromContext(context: any, path: string): any {
        const keys = path.split('.');
        let current = context;

        for (const key of keys) {
            if (current === undefined || current === null) return undefined;
            current = current[key];
        }
        return current;
    }
}
