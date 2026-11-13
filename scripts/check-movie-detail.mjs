import assert from 'node:assert/strict';

const movieId = '11000000-0000-0000-0000-000000000006';
const gateway = process.env.CGV_GATEWAY_URL || 'http://localhost:8000';
const response = await fetch(`${gateway}/api/v1/catalogs/movies/${movieId}`, {
  signal: AbortSignal.timeout(15000),
});
assert.equal(response.status, 200);
const body = await response.json();
assert.equal(body.data.id, movieId);
assert.ok(Array.isArray(body.data.casts));
console.log(`${body.data.title}: detail and casts OK`);
