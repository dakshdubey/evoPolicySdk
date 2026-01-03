export interface Subject {
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
