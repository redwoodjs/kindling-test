/**
 * Integration tests for the greeting endpoint.
 *
 * Tests verify the greeting endpoint behavior using black-box HTTP testing.
 * All scenarios are derived from behavioral specifications and test only
 * observable HTTP behavior (requests, responses, status codes, headers).
 *
 * No implementation details are tested; tests verify the contract only.
 */

import request from 'supertest';

// The app will be provided by the test setup or imported dynamically.
// For now, we assume 'app' is exported from src/server.ts
let app: any;

// Note: In a real test run, app would be imported:
// import app from '../../server';
// But since the implementation hasn't been written yet, this is a placeholder.
// The test runner will need to provide the app instance.

describe('GET /api/v1/greeting', () => {
  // ─────────────────────────────────────────────────────────────
  // Happy Path: Successful Greeting Request
  // ─────────────────────────────────────────────────────────────

  describe('happy path', () => {
    it('should return 200 with valid greeting response', async () => {
      const response = await request(app)
        .get('/api/v1/greeting')
        .expect('Content-Type', /application\/json/);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'hello world' });
    });

    it('should include correct content-type header', async () => {
      const response = await request(app)
        .get('/api/v1/greeting');

      expect(response.headers['content-type']).toMatch(
        /application\/json;\s*charset=utf-8/i
      );
    });

    it('should include cache-control header set to public, max-age=3600', async () => {
      const response = await request(app)
        .get('/api/v1/greeting');

      expect(response.headers['cache-control']).toBe('public, max-age=3600');
    });

    it('should have exactly one property in response body', async () => {
      const response = await request(app)
        .get('/api/v1/greeting');

      const keys = Object.keys(response.body);
      expect(keys).toHaveLength(1);
      expect(keys).toContain('message');
    });

    it('should return message field with exact value "hello world"', async () => {
      const response = await request(app)
        .get('/api/v1/greeting');

      expect(response.body.message).toBe('hello world');
    });

    it('should return string type for message field', async () => {
      const response = await request(app)
        .get('/api/v1/greeting');

      expect(typeof response.body.message).toBe('string');
    });

    it('should return valid JSON response body', async () => {
      const response = await request(app)
        .get('/api/v1/greeting');

      expect(() => JSON.stringify(response.body)).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Request Variations: Query Strings and Parameters
  // ─────────────────────────────────────────────────────────────

  describe('request variations with query parameters', () => {
    it('should ignore query parameters and return greeting', async () => {
      const response = await request(app)
        .get('/api/v1/greeting?foo=bar&baz=qux');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'hello world' });
    });

    it('should handle empty query string gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/greeting?');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('hello world');
    });

    it('should handle multiple query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/greeting?a=1&b=2&c=3');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('hello world');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Request Headers: Standard and Custom
  // ─────────────────────────────────────────────────────────────

  describe('request with various headers', () => {
    it('should handle request with Accept: application/json', async () => {
      const response = await request(app)
        .get('/api/v1/greeting')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('hello world');
    });

    it('should handle request with custom User-Agent', async () => {
      const response = await request(app)
        .get('/api/v1/greeting')
        .set('User-Agent', 'CustomBot/1.0');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('hello world');
    });

    it('should handle request with custom headers', async () => {
      const response = await request(app)
        .get('/api/v1/greeting')
        .set('X-Request-ID', 'abc123')
        .set('X-Custom-Header', 'value');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('hello world');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // HTTP Methods: Unsupported Methods Return 405
  // ─────────────────────────────────────────────────────────────

  describe('unsupported HTTP methods', () => {
    it('should reject POST with 405 Method Not Allowed', async () => {
      const response = await request(app)
        .post('/api/v1/greeting');

      expect(response.status).toBe(405);
      expect(response.headers['allow']).toBeDefined();
      expect(response.headers['allow']).toMatch(/GET/i);
    });

    it('should reject PUT with 405 Method Not Allowed', async () => {
      const response = await request(app)
        .put('/api/v1/greeting');

      expect(response.status).toBe(405);
      expect(response.headers['allow']).toMatch(/GET/i);
    });

    it('should reject DELETE with 405 Method Not Allowed', async () => {
      const response = await request(app)
        .delete('/api/v1/greeting');

      expect(response.status).toBe(405);
      expect(response.headers['allow']).toMatch(/GET/i);
    });

    it('should reject PATCH with 405 Method Not Allowed', async () => {
      const response = await request(app)
        .patch('/api/v1/greeting');

      expect(response.status).toBe(405);
      expect(response.headers['allow']).toMatch(/GET/i);
    });

    it('405 error response should be valid JSON', async () => {
      const response = await request(app)
        .post('/api/v1/greeting')
        .expect('Content-Type', /application\/json/);

      expect(response.status).toBe(405);
      expect(response.body).toHaveProperty('error');
    });

    it('405 response should include Allow header with GET', async () => {
      const response = await request(app)
        .post('/api/v1/greeting');

      expect(response.headers['allow']).toBeDefined();
      expect(response.headers['allow'].toLowerCase()).toContain('get');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Path Routing: Exact Match and 404
  // ─────────────────────────────────────────────────────────────

  describe('path routing and 404 handling', () => {
    it('should return 404 for nonexistent path', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent');

      expect(response.status).toBe(404);
    });

    it('should return 404 for plural "greetings"', async () => {
      const response = await request(app)
        .get('/api/v1/greetings');

      expect(response.status).toBe(404);
    });

    it('should return 404 for root path', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(404);
    });

    it('should return 404 for /api', async () => {
      const response = await request(app)
        .get('/api');

      expect(response.status).toBe(404);
    });

    it('should return 404 for /api/v1', async () => {
      const response = await request(app)
        .get('/api/v1');

      expect(response.status).toBe(404);
    });

    it('404 response should be valid JSON', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect('Content-Type', /application\/json/);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('404 error should have a non-empty message', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent');

      expect(response.body.error).toBeTruthy();
      expect(typeof response.body.error).toBe('string');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Path Case Sensitivity
  // ─────────────────────────────────────────────────────────────

  describe('path case sensitivity', () => {
    it('should return 404 for uppercase path /Greeting', async () => {
      const response = await request(app)
        .get('/api/v1/Greeting');

      expect(response.status).toBe(404);
    });

    it('should return 404 for all-caps /GREETING', async () => {
      const response = await request(app)
        .get('/api/v1/GREETING');

      expect(response.status).toBe(404);
    });

    it('should return 404 for mixed case /GrEeTiNg', async () => {
      const response = await request(app)
        .get('/api/v1/GrEeTiNg');

      expect(response.status).toBe(404);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Response Headers
  // ─────────────────────────────────────────────────────────────

  describe('response headers validation', () => {
    it('should have Content-Type application/json; charset=utf-8', async () => {
      const response = await request(app)
        .get('/api/v1/greeting');

      expect(response.headers['content-type']).toMatch(
        /application\/json.*charset=utf-8/i
      );
    });

    it('should have Cache-Control public, max-age=3600', async () => {
      const response = await request(app)
        .get('/api/v1/greeting');

      expect(response.headers['cache-control']).toBe('public, max-age=3600');
    });

    it('should not include no-cache in Cache-Control', async () => {
      const response = await request(app)
        .get('/api/v1/greeting');

      expect(response.headers['cache-control']).not.toContain('no-cache');
    });

    it('should not include no-store in Cache-Control', async () => {
      const response = await request(app)
        .get('/api/v1/greeting');

      expect(response.headers['cache-control']).not.toContain('no-store');
    });

    it('should not include private in Cache-Control', async () => {
      const response = await request(app)
        .get('/api/v1/greeting');

      expect(response.headers['cache-control']).not.toContain('private');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Idempotency and Consistency
  // ─────────────────────────────────────────────────────────────

  describe('idempotency and consistency', () => {
    it('should return identical response on multiple requests', async () => {
      const response1 = await request(app).get('/api/v1/greeting');
      const response2 = await request(app).get('/api/v1/greeting');
      const response3 = await request(app).get('/api/v1/greeting');

      expect(response1.body).toEqual(response2.body);
      expect(response2.body).toEqual(response3.body);
      expect(response1.status).toBe(response2.status);
      expect(response2.status).toBe(response3.status);
    });

    it('should always return "hello world" in message field', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/api/v1/greeting');
        expect(response.body.message).toBe('hello world');
      }
    });

    it('should always return status 200 on success', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/api/v1/greeting');
        expect(response.status).toBe(200);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Message Format Validation
  // ─────────────────────────────────────────────────────────────

  describe('message exact format', () => {
    it('should be exactly "hello world" (lowercase)', async () => {
      const response = await request(app).get('/api/v1/greeting');
      expect(response.body.message).toBe('hello world');
    });

    it('should not be "Hello World" (capitalized)', async () => {
      const response = await request(app).get('/api/v1/greeting');
      expect(response.body.message).not.toBe('Hello World');
    });

    it('should not be "HELLO WORLD" (uppercase)', async () => {
      const response = await request(app).get('/api/v1/greeting');
      expect(response.body.message).not.toBe('HELLO WORLD');
    });

    it('should not have extra whitespace', async () => {
      const response = await request(app).get('/api/v1/greeting');
      expect(response.body.message).not.toBe(' hello world');
      expect(response.body.message).not.toBe('hello world ');
      expect(response.body.message).not.toBe('hello  world');
    });

    it('should have length of 11 characters', async () => {
      const response = await request(app).get('/api/v1/greeting');
      expect(response.body.message).toHaveLength(11);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Request Body Handling
  // ─────────────────────────────────────────────────────────────

  describe('request body handling', () => {
    it('should ignore request body for GET', async () => {
      const response = await request(app)
        .get('/api/v1/greeting')
        .send({ ignored: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('hello world');
    });

    it('should accept Content-Length header', async () => {
      const response = await request(app)
        .get('/api/v1/greeting')
        .set('Content-Length', '0');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('hello world');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle path with trailing slash', async () => {
      const response = await request(app)
        .get('/api/v1/greeting/');

      // Accept either 200 or 404, depending on Express routing config
      expect([200, 404]).toContain(response.status);
    });

    it('should handle multiple slashes', async () => {
      const response = await request(app)
        .get('/api/v1//greeting');

      expect(response.status).toBe(404);
    });

    it('should handle URL-encoded parameters safely', async () => {
      const response = await request(app)
        .get('/api/v1/greeting?name=world%20test');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('hello world');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Response Status Codes
  // ─────────────────────────────────────────────────────────────

  describe('response status codes', () => {
    it('should not return 201 Created', async () => {
      const response = await request(app).get('/api/v1/greeting');
      expect(response.status).not.toBe(201);
    });

    it('should not return 204 No Content', async () => {
      const response = await request(app).get('/api/v1/greeting');
      expect(response.status).not.toBe(204);
    });

    it('should not return redirect status codes', async () => {
      const response = await request(app).get('/api/v1/greeting');
      expect([301, 302, 303, 307, 308]).not.toContain(response.status);
    });

    it('should not return 400 Bad Request', async () => {
      const response = await request(app).get('/api/v1/greeting');
      expect(response.status).not.toBe(400);
    });

    it('should not return 401 Unauthorized', async () => {
      const response = await request(app).get('/api/v1/greeting');
      expect(response.status).not.toBe(401);
    });

    it('should not return 403 Forbidden', async () => {
      const response = await request(app).get('/api/v1/greeting');
      expect(response.status).not.toBe(403);
    });

    it('should not return 500 Internal Server Error', async () => {
      const response = await request(app).get('/api/v1/greeting');
      expect(response.status).not.toBe(500);
    });
  });
});

// Note on test execution:
// These tests assume:
// 1. The app is exported from src/server.ts and can be imported
// 2. supertest is available as a testing utility
// 3. The test runner (Jest/Vitest) is configured to run TypeScript tests
// 4. The application is running or can be started in the test environment
//
// To run these tests:
// 1. Ensure package.json includes: jest, @types/jest, supertest, express
// 2. Create jest.config.js or similar test configuration
// 3. Run: npm test or jest
