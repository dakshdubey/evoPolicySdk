import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyEngine } from '../src/engine/PolicyEngine';

describe('PolicyEngine', () => {
    let engine: PolicyEngine;

    beforeEach(() => {
        engine = new PolicyEngine();
    });

    it('should deny by default when no policies are loaded', () => {
        const allowed = engine.can({
            subject: { id: 'u1', role: 'admin' },
            action: 'delete',
            resource: { type: 'database' }
        });
        expect(allowed).toBe(false);
    });

    it('should allow when a matching policy exists', () => {
        engine.setPolicies([{
            effect: 'allow',
            role: 'admin',
            action: 'delete',
            resource: 'database',
            condition: { 'active': 'true' }
        }]);

        const allowed = engine.can({
            subject: { id: 'u1', role: 'admin', active: true },
            action: 'delete',
            resource: { type: 'database' }
        });
        expect(allowed).toBe(true);
    });

    it('should deny when policy exists but condition fails', () => {
        engine.setPolicies([{
            effect: 'allow',
            role: 'manager',
            action: 'approve',
            resource: 'invoice',
            condition: { 'amount': '<=1000' }
        }]);

        const allowed = engine.can({
            subject: { id: 'u2', role: 'manager' },
            action: 'approve',
            resource: { type: 'invoice', amount: 5000 }
        });
        expect(allowed).toBe(false);
    });

    it('should allow when condition passes (numeric comparison)', () => {
        engine.setPolicies([{
            effect: 'allow',
            role: 'manager',
            action: 'approve',
            resource: 'invoice',
            condition: { 'amount': '<=1000' }
        }]);

        const allowed = engine.can({
            subject: { id: 'u2', role: 'manager' },
            action: 'approve',
            resource: { type: 'invoice', amount: 500 }
        });
        expect(allowed).toBe(true);
    });

    it('should handle wildcards (*)', () => {
        engine.setPolicies([{
            effect: 'allow',
            role: 'superadmin',
            action: '*',
            resource: '*'
        }]);

        const allowed = engine.can({
            subject: { id: 's1', role: 'superadmin' },
            action: 'nuke',
            resource: { type: 'planet' }
        });
        expect(allowed).toBe(true);
    });

    it('should prioritize DENY over ALLOW', () => {
        engine.setPolicies([
            {
                effect: 'allow',
                role: 'user',
                action: 'read',
                resource: 'file'
            },
            {
                effect: 'deny',
                role: 'user',
                action: 'read',
                resource: 'file',
                condition: { 'classification': 'confidential' }
            }
        ]);

        // Case 1: Not confidential -> Allow matches, Deny doesn't match
        expect(engine.can({
            subject: { id: 'u1', role: 'user' },
            action: 'read',
            resource: { type: 'file', classification: 'public' }
        })).toBe(true);

        // Case 2: Confidential -> Allow matches, Deny matches -> Result DENY
        expect(engine.can({
            subject: { id: 'u1', role: 'user' },
            action: 'read',
            resource: { type: 'file', classification: 'confidential' }
        })).toBe(false);
    });

    it('should correctly handle IN operator', () => {
        engine.setPolicies([{
            effect: 'allow',
            role: 'user',
            action: 'view',
            resource: 'document',
            condition: { 'status': 'IN [published, archived]' }
        }]);

        expect(engine.can({
            subject: { id: 'u1', role: 'user' },
            action: 'view',
            resource: { type: 'document', status: 'published' }
        })).toBe(true);

        expect(engine.can({
            subject: { id: 'u1', role: 'user' },
            action: 'view',
            resource: { type: 'document', status: 'draft' }
        })).toBe(false);
    });
});
