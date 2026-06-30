import { describe, expect, it } from 'vitest';
import { genericSort } from '~/server/helpers/zod.helper';

describe('genericSort', () => {
   it('applies defaults when input is undefined', () => {
      expect(genericSort.parse(undefined)).toEqual({ orderBy: 'createdAt', order: 'desc' });
   });

   it('applies field-level defaults for a partial object', () => {
      expect(genericSort.parse({})).toEqual({ orderBy: 'createdAt', order: 'desc' });
      expect(genericSort.parse({ orderBy: 'name' })).toEqual({ orderBy: 'name', order: 'desc' });
      expect(genericSort.parse({ order: 'asc' })).toEqual({ orderBy: 'createdAt', order: 'asc' });
   });

   it('parses a fully specified valid input', () => {
      expect(genericSort.parse({ orderBy: 'updatedAt', order: 'asc' })).toEqual({ orderBy: 'updatedAt', order: 'asc' });
   });

   it('rejects an invalid orderBy value', () => {
      expect(genericSort.safeParse({ orderBy: 'bogus' }).success).toBe(false);
   });

   it('rejects an invalid order value', () => {
      expect(genericSort.safeParse({ order: 'sideways' }).success).toBe(false);
   });
});
