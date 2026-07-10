/**
 * YarnFlow Mobile — API Alignment Test
 * Tests every endpoint the mobile app uses against the server.
 * Run: node scripts/test-api-alignment.js
 *
 * Requires env vars or uses production URL by default.
 */

const BASE_URL = process.env.API_URL || 'https://yarnflow-production.up.railway.app/api';
const ROOT_URL = BASE_URL.replace(/\/api$/, '');
const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

let authToken = '';
let pass = 0;
let fail = 0;

async function req(method, endpoint, body, token) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  let data = {};
  try { data = await res.json(); } catch (_) {}
  return { status: res.status, data };
}

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    pass++;
  } else {
    console.log(`  ❌ ${label}${detail ? ': ' + detail : ''}`);
    fail++;
  }
}

async function run() {
  console.log(`\n🔗 Testing: ${BASE_URL}\n`);

  // ── Server health ──────────────────────────────────────────────────────────
  console.log('🚀 Server Health');
  // Health is at root (/) not /api — hit ROOT_URL directly
  const healthRes = await fetch(ROOT_URL);
  const health = { status: healthRes.status, data: await healthRes.json().catch(() => ({})) };
  ok('Health check responds 200', health.status === 200, `got ${health.status}`);
  ok('Health check has success:true', health.data?.success === true);

  // ── Auth — unauthenticated blocks ──────────────────────────────────────────
  console.log('\n🔐 Auth — Unauthenticated Blocks');
  for (const endpoint of [
    '/dashboard/stats', '/grn', '/purchase-orders', '/sales-orders',
    '/sales-challans', '/inventory', '/master-data/customers',
    '/master-data/suppliers', '/master-data/categories', '/master-data/products',
    '/warehouses', '/users', '/reports/inventory'
  ]) {
    const r = await req('GET', endpoint);
    ok(`GET ${endpoint} → 401 without token`, r.status === 401, `got ${r.status}`);
  }

  // ── Auth — Login ───────────────────────────────────────────────────────────
  console.log('\n🔐 Auth — Login');
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.log('  ⚠️  TEST_EMAIL / TEST_PASSWORD not set — skipping authenticated tests');
    console.log('     Run: TEST_EMAIL=you@example.com TEST_PASSWORD=pass node scripts/test-api-alignment.js');
  } else {
    const loginRes = await req('POST', '/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD });
    ok('Login returns 200', loginRes.status === 200, `got ${loginRes.status}`);
    ok('Login returns token', !!loginRes.data?.token);
    authToken = loginRes.data?.token || '';

    if (authToken) {
      // ── Token verify ─────────────────────────────────────────────────────
      console.log('\n🔐 Auth — Verify Token');
      const verify = await req('GET', '/auth/verify', null, authToken);
      ok('Verify token → success', verify.data?.success === true, `got ${verify.status}`);

      // ── Dashboard ─────────────────────────────────────────────────────────
      console.log('\n📊 Dashboard');
      const dash = await req('GET', '/dashboard/stats', null, authToken);
      ok('Dashboard stats → 200', dash.status === 200, `got ${dash.status}`);
      ok('Dashboard has data', !!dash.data?.data || dash.data?.success === true);

      // ── Master Data ───────────────────────────────────────────────────────
      console.log('\n📦 Master Data');
      for (const ep of ['/customers', '/suppliers', '/categories', '/products', '/units']) {
        const r = await req('GET', `/master-data${ep}`, null, authToken);
        ok(`GET /master-data${ep} → 200`, r.status === 200, `got ${r.status}`);
      }

      // ── Warehouses ────────────────────────────────────────────────────────
      console.log('\n🏭 Warehouses');
      const wh = await req('GET', '/warehouses', null, authToken);
      ok('GET /warehouses → 200', wh.status === 200, `got ${wh.status}`);
      ok('Warehouses returns array', Array.isArray(wh.data?.data), `got ${typeof wh.data?.data}`);

      // ── Purchase Orders ───────────────────────────────────────────────────
      console.log('\n🛒 Purchase Orders');
      const po = await req('GET', '/purchase-orders', null, authToken);
      ok('GET /purchase-orders → 200', po.status === 200, `got ${po.status}`);

      // ── GRN ───────────────────────────────────────────────────────────────
      console.log('\n📥 GRN');
      const grn = await req('GET', '/grn', null, authToken);
      ok('GET /grn → 200', grn.status === 200, `got ${grn.status}`);
      const grnStats = await req('GET', '/grn/stats', null, authToken);
      ok('GET /grn/stats → 200', grnStats.status === 200, `got ${grnStats.status}`);

      // ── Inventory ─────────────────────────────────────────────────────────
      console.log('\n📦 Inventory');
      const inv = await req('GET', '/inventory', null, authToken);
      ok('GET /inventory → 200', inv.status === 200, `got ${inv.status}`);
      const invStats = await req('GET', '/inventory/stats', null, authToken);
      ok('GET /inventory/stats → 200', invStats.status === 200, `got ${invStats.status}`);

      // ── Sales Orders ──────────────────────────────────────────────────────
      console.log('\n💰 Sales Orders');
      const so = await req('GET', '/sales-orders', null, authToken);
      ok('GET /sales-orders → 200', so.status === 200, `got ${so.status}`);

      // ── Sales Challans ────────────────────────────────────────────────────
      console.log('\n🚚 Sales Challans');
      const sc = await req('GET', '/sales-challans', null, authToken);
      ok('GET /sales-challans → 200', sc.status === 200, `got ${sc.status}`);
      const scStats = await req('GET', '/sales-challans/stats', null, authToken);
      ok('GET /sales-challans/stats → 200', scStats.status === 200, `got ${scStats.status}`);

      // ── Reports ───────────────────────────────────────────────────────────
      console.log('\n📈 Reports');
      for (const ep of ['/inventory', '/grn', '/purchase-orders', '/sales-orders', '/sales-challans', '/master-data']) {
        const r = await req('GET', `/reports${ep}`, null, authToken);
        ok(`GET /reports${ep} → 200`, r.status === 200, `got ${r.status}`);
      }

      // ── Security — invalid token ───────────────────────────────────────────
      console.log('\n🛡️ Security');
      const badToken = await req('GET', '/dashboard/stats', null, 'bad.token.here');
      ok('Invalid token → 401', badToken.status === 401, `got ${badToken.status}`);

      // ── Validation — bad input ────────────────────────────────────────────
      console.log('\n🔧 Validation');
      const badLogin = await req('POST', '/auth/login', { email: 'bad@bad.com', password: 'wrongpassword' });
      ok('Invalid credentials → 401', badLogin.status === 401, `got ${badLogin.status}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = pass + fail;
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Results: ${pass}/${total} passed  |  ${fail} failed`);
  if (fail === 0) {
    console.log('🎉 All mobile API endpoints aligned with server!\n');
  } else {
    console.log('⚠️  Some endpoints need attention — see ❌ above\n');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err.message);
  process.exit(1);
});
