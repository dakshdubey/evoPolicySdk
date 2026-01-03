export interface Resource {
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
