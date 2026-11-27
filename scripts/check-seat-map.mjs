import assert from 'node:assert/strict';

const gateway = process.env.CGV_GATEWAY_URL || 'http://localhost:8000';

async function get(endpoint) {
  const response = await fetch(`${gateway}${endpoint}`, { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, endpoint);
  return (await response.json()).data;
}

const list = await get(`/api/v1/catalogs/showtimes?startTimeFrom=${encodeURIComponent(new Date().toISOString())}&status=SCHEDULED&page=0&size=1&sort=startTime,asc`);
const showtime = list.data[0];
assert.ok(showtime?.roomResponse?.id, 'No upcoming showtime in demo database');
const [seats, booked, locked] = await Promise.all([
  get(`/api/v1/catalogs/seats/room/${showtime.roomResponse.id}?page=0&size=150`),
  get(`/api/v1/bookings/seat-locks/booked/${showtime.id}`),
  get(`/api/v1/bookings/seat-locks/${showtime.id}`),
]);
assert.ok(seats.data.length > 0 && seats.data.every(seat => seat.id));
assert.ok(Array.isArray(booked) && Array.isArray(locked));
console.log(`${showtime.id}: ${seats.data.length} seats, ${booked.length} booked, ${locked.length} held`);
