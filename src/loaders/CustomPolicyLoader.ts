import { Policy } from '../models/Policy';
import { IPolicyLoader } from './IPolicyLoader';

/**
 * A flexible policy loader that takes a custom fetch function.
 * Useful for loading policies from databases, external APIs, or other dynamic sources.
 */
export class CustomPolicyLoader implements IPolicyLoader {
    constructor(private fetcher: () => Policy[] | Promise<Policy[]>) { }

    async load(): Promise<Policy[]> {
        return await this.fetcher();
    }
}
