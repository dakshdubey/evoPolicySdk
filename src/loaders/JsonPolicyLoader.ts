import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { Policy } from '../models/Policy';
import { IPolicyLoader } from './IPolicyLoader';

const PolicySchema = z.object({
    id: z.string().optional(),
    effect: z.enum(['allow', 'deny']),
    role: z.string(),
    action: z.string(),
    resource: z.string(),
    condition: z.record(z.string()).optional(),
});

const PolicyListSchema = z.array(PolicySchema);

export class JsonPolicyLoader implements IPolicyLoader {
    constructor(private filePath: string) { }

    /**
     * Instance method to satisfy IPolicyLoader interface.
     */
    async load(): Promise<Policy[]> {
        return JsonPolicyLoader.load(this.filePath);
    }

    /**
     * Loads policies from a JSON file.
     * @param filePath Absolute or relative path to the JSON file.
     */
    static load(filePath: string): Policy[] {
        try {
            const absolutePath = path.resolve(filePath);

            if (!fs.existsSync(absolutePath)) {
                throw new Error(`Policy file not found: ${absolutePath}`);
            }

            const fileContent = fs.readFileSync(absolutePath, 'utf-8');
            const jsonData = JSON.parse(fileContent);

            // Validate schema
            const policies = PolicyListSchema.parse(jsonData);
            return policies as Policy[];

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
    static loadFromData(data: any): Policy[] {
        try {
            return PolicyListSchema.parse(data) as Policy[];
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(`Invalid policy format: ${JSON.stringify(error.errors)}`);
            }
            throw error;
        }
    }
}
