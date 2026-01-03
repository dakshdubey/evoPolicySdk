// src/parser/ConditionParser.ts
var ConditionParser = class {
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
  static evaluate(condition, value) {
    if (condition === "*") return true;
    if (value === void 0 || value === null) return false;
    const trimmedCondition = condition.trim();
    if (/^IN\s*\[.*\]$/i.test(trimmedCondition)) {
      const listContent = trimmedCondition.match(/^IN\s*\[(.*)\]$/i)?.[1];
      if (!listContent) return false;
      const list = listContent.split(",").map((s) => s.trim());
      return list.includes(String(value));
    }
    if (/^NOT_IN\s*\[.*\]$/i.test(trimmedCondition)) {
      const listContent = trimmedCondition.match(/^NOT_IN\s*\[(.*)\]$/i)?.[1];
      if (!listContent) return false;
      const list = listContent.split(",").map((s) => s.trim());
      return !list.includes(String(value));
    }
    if (trimmedCondition.startsWith("~=")) {
      const regexPattern = trimmedCondition.slice(2).trim();
      try {
        const regex = new RegExp(regexPattern);
        return regex.test(String(value));
      } catch (e) {
        console.warn(`ConditionParser: Invalid regex "${regexPattern}"`, e);
        return false;
      }
    }
    if (trimmedCondition.startsWith(">=")) {
      return this.compare(value, trimmedCondition.slice(2), (a, b) => a >= b);
    }
    if (trimmedCondition.startsWith("<=")) {
      return this.compare(value, trimmedCondition.slice(2), (a, b) => a <= b);
    }
    if (trimmedCondition.startsWith(">")) {
      return this.compare(value, trimmedCondition.slice(1), (a, b) => a > b);
    }
    if (trimmedCondition.startsWith("<")) {
      return this.compare(value, trimmedCondition.slice(1), (a, b) => a < b);
    }
    if (trimmedCondition.startsWith("!=")) {
      return String(value) !== trimmedCondition.slice(2).trim();
    }
    if (trimmedCondition.startsWith("=")) {
      return String(value) === trimmedCondition.slice(1).trim();
    }
    return String(value) === trimmedCondition;
  }
  static compare(actual, targetStr, comparator) {
    const actualNum = Number(actual);
    const targetNum = Number(targetStr);
    if (!isNaN(actualNum) && !isNaN(targetNum)) {
      return comparator(actualNum, targetNum);
    }
    const actualDate = Date.parse(actual);
    const targetDate = Date.parse(targetStr);
    if (!isNaN(actualDate) && !isNaN(targetDate)) {
      return comparator(actualDate, targetDate);
    }
    return comparator(String(actual), targetStr.trim());
  }
  /**
   * Evaluates a set of conditions against a context object.
   * ALL conditions must be true for the result to be true (AND logic).
   */
  static evaluateAll(conditions, context) {
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
  static getValueFromContext(context, path2) {
    const keys = path2.split(".");
    let current = context;
    for (const key of keys) {
      if (current === void 0 || current === null) return void 0;
      current = current[key];
    }
    return current;
  }
};

// src/evaluator/Evaluator.ts
var Evaluator = class {
  constructor(policies) {
    this.policies = [];
    this.policies = policies;
  }
  evaluate(request) {
    const matchedPolicies = this.policies.filter((policy) => this.isMatch(policy, request));
    let allow = false;
    let deny = false;
    for (const policy of matchedPolicies) {
      if (policy.effect === "deny") {
        deny = true;
      } else if (policy.effect === "allow") {
        allow = true;
      }
    }
    if (deny) return false;
    return allow;
  }
  isMatch(policy, request) {
    if (policy.role !== "*" && policy.role !== request.subject.role) {
      return false;
    }
    if (policy.action !== "*" && policy.action !== request.action) {
      return false;
    }
    if (policy.resource !== "*" && policy.resource !== request.resource.type) {
      return false;
    }
    if (policy.condition) {
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
};

// src/loaders/JsonPolicyLoader.ts
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
var PolicySchema = z.object({
  id: z.string().optional(),
  effect: z.enum(["allow", "deny"]),
  role: z.string(),
  action: z.string(),
  resource: z.string(),
  condition: z.record(z.string()).optional()
});
var PolicyListSchema = z.array(PolicySchema);
var JsonPolicyLoader = class _JsonPolicyLoader {
  constructor(filePath) {
    this.filePath = filePath;
  }
  /**
   * Instance method to satisfy IPolicyLoader interface.
   */
  async load() {
    return _JsonPolicyLoader.load(this.filePath);
  }
  /**
   * Loads policies from a JSON file.
   * @param filePath Absolute or relative path to the JSON file.
   */
  static load(filePath) {
    try {
      const absolutePath = path.resolve(filePath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Policy file not found: ${absolutePath}`);
      }
      const fileContent = fs.readFileSync(absolutePath, "utf-8");
      const jsonData = JSON.parse(fileContent);
      const policies = PolicyListSchema.parse(jsonData);
      return policies;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid policy format: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }
  }
  /**
   * Loads policies from a JSON object (useful for testing or dynamic loading).
   */
  static loadFromData(data) {
    try {
      return PolicyListSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid policy format: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }
  }
};

// src/engine/PolicyEngine.ts
var PolicyEngine = class {
  constructor() {
    this.evaluator = null;
    this.policies = [];
  }
  /**
   * Loads policies from a JSON file.
   * @param filePath - Absolute or relative path to the JSON policy file.
   */
  loadPolicies(filePath) {
    this.policies = JsonPolicyLoader.load(filePath);
    this.evaluator = new Evaluator(this.policies);
  }
  /**
   * Loads policies from any custom provider (Database, API, etc.)
   * @param loader An implementation of IPolicyLoader
   */
  async loadFromLoader(loader) {
    this.policies = await loader.load();
    this.evaluator = new Evaluator(this.policies);
  }
  /**
   * Loads policies directly from an array of Policy objects.
   * @param policies Array of Policy objects.
   */
  setPolicies(policies) {
    this.policies = policies;
    this.evaluator = new Evaluator(this.policies);
  }
  /**
   * Evaluates if an action is allowed.
   * @param request - The evaluation request containing subject, action, and resource.
   * @returns `true` if allowed, `false` otherwise.
   */
  can(request) {
    if (!this.evaluator) {
      console.warn("PolicyEngine: No policies loaded. Access denied by default.");
      return false;
    }
    return this.evaluator.evaluate(request);
  }
};

// src/loaders/CustomPolicyLoader.ts
var CustomPolicyLoader = class {
  constructor(fetcher) {
    this.fetcher = fetcher;
  }
  async load() {
    return await this.fetcher();
  }
};

// src/middleware/express.ts
var policyMiddleware = (engine, mapRequest) => {
  return (req, res, next) => {
    try {
      const requestContext = mapRequest ? mapRequest(req) : {
        // Map HTTP verbs to actions
        action: mapMethodToAction(req.method),
        // Use req.user as subject (assuming it exists)
        subject: req.user || { role: "guest" },
        // Use basics of request as resource, can be augmented by users
        resource: {
          type: "api_endpoint",
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
          error: "Access Denied",
          message: `You are not authorized to perform '${requestContext.action}' on this resource.`
        });
      }
    } catch (error) {
      console.error("Policy Middleware Error:", error);
      return res.status(500).json({ error: "Internal Server Error during authorization." });
    }
  };
};
function mapMethodToAction(method) {
  switch (method.toUpperCase()) {
    case "GET":
      return "read";
    case "POST":
      return "create";
    case "PUT":
      return "update";
    case "PATCH":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return "manage";
  }
}

// src/index.ts
var index_default = PolicyEngine;
export {
  ConditionParser,
  CustomPolicyLoader,
  Evaluator,
  JsonPolicyLoader,
  PolicyEngine,
  index_default as default,
  policyMiddleware
};
