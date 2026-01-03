import { describe, it, expect } from 'vitest';
import { ConditionParser } from '../src/parser/ConditionParser';

describe('ConditionParser', () => {
    describe('Regex (~=) Support', () => {
        it('should match simple regex', () => {
            expect(ConditionParser.evaluate('~= ^[a-z]+$', 'hello')).toBe(true);
            expect(ConditionParser.evaluate('~= ^[a-z]+$', '123')).toBe(false);
        });

        it('should match email pattern', () => {
            const emailRegex = '~= ^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$';
            expect(ConditionParser.evaluate(emailRegex, 'user@example.com')).toBe(true);
            expect(ConditionParser.evaluate(emailRegex, 'invalid-email')).toBe(false);
        });

        it('should handle invalid regex gracefully', () => {
            // Should match nothing and not crash
            expect(ConditionParser.evaluate('~= [', 'anything')).toBe(false);
        });
    });

    describe('Date Comparison', () => {
        it('should compare ISO dates correctly', () => {
            expect(ConditionParser.evaluate('> 2023-01-01T00:00:00Z', '2023-01-02T00:00:00Z')).toBe(true);
            expect(ConditionParser.evaluate('< 2023-01-01', '2022-12-31')).toBe(true);
        });

        it('should compare dates with different formats (check parsing)', () => {
            // "2023-01-02" is parsed as UTC midnight
            // "2023-01-01" is UTC midnight
            expect(ConditionParser.evaluate('> 2023-01-01', '2023-01-02')).toBe(true);
        });
    });

    describe('Numeric Comparison', () => {
        it('should still handle numbers correctly', () => {
            expect(ConditionParser.evaluate('> 10', 15)).toBe(true);
            expect(ConditionParser.evaluate('<= 10', 10)).toBe(true);
            expect(ConditionParser.evaluate('<= 10', '10')).toBe(true); // string number
        });
    });
});
