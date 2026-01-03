import { Policy } from '../models/Policy';

/**
 * Interface for policy loaders.
 * Allows fetching policies from various sources (Files, Databases, APIs).
 */
export interface IPolicyLoader {
    /**
     * Fetches and returns an array of policies.
     * Can be synchronous or asynchronous.
     */
    load(): Policy[] | Promise<Policy[]>;
}
