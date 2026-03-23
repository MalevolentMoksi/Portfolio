import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  safeLocalGet,
  safeLocalSet,
  safeLocalRemove,
  safeSessionGet,
  safeSessionSet,
  safeSessionRemove,
  safeLocalGetJSON,
} from '@/utils/safeStorage';

describe('safeStorage utility', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('localStorage', () => {
    it('should set and get a value successfully', () => {
      safeLocalSet('test-key', 'test-value');
      expect(safeLocalGet('test-key')).toBe('test-value');
    });

    it('should return null for non-existent key', () => {
      expect(safeLocalGet('non-existent')).toBeNull();
    });

    it('should remove a value successfully', () => {
      safeLocalSet('test-key', 'test-value');
      safeLocalRemove('test-key');
      expect(safeLocalGet('test-key')).toBeNull();
    });

    it('should handle quota exceeded by using fallback map', () => {
      const setItemMock = vi.spyOn(Storage.prototype, 'setItem');
      setItemMock.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw, and should still work via fallback map
      safeLocalSet('fallback-key', 'fallback-value');
      expect(safeLocalGet('fallback-key')).toBe('fallback-value');
      
      setItemMock.mockRestore();
    });
  });

  describe('sessionStorage', () => {
    it('should set and get a value successfully', () => {
      safeSessionSet('session-key', 'session-value');
      expect(safeSessionGet('session-key')).toBe('session-value');
    });

    it('should remove a value successfully', () => {
      safeSessionSet('session-key', 'session-value');
      safeSessionRemove('session-key');
      expect(safeSessionGet('session-key')).toBeNull();
    });
  });

  describe('JSON helpers', () => {
    it('should parse valid JSON successfully', () => {
      const data = { foo: 'bar', baz: 123 };
      safeLocalSet('json-key', JSON.stringify(data));
      expect(safeLocalGetJSON('json-key')).toEqual(data);
    });

    it('should return fallback for invalid JSON', () => {
      safeLocalSet('bad-json', '{ invalid }');
      expect(safeLocalGetJSON('bad-json', { error: true })).toEqual({ error: true });
    });

    it('should return null for missing key', () => {
      expect(safeLocalGetJSON('missing-key')).toBeNull();
    });
  });
});
