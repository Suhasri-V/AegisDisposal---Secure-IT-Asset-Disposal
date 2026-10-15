process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'suhasi271426@gmail.com';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
const TEST_ADMIN_PASSWORD = 'TestAdminPassword!2026';
const TEST_USER_PASSWORD = 'TestUserPassword!2026';
const bcrypt = (await import('bcryptjs')).default;
process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash(TEST_ADMIN_PASSWORD, 12);
const { default: app } = await import('../server/index');
import { db } from '../server/db/store';
import http from 'http';

interface TestResult {
  num: number;
  scenario: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, num: number, scenario: string, details: string) {
  if (condition) {
    console.log(`[PASS] Test ${num}: ${scenario}`);
    results.push({ num, scenario, passed: true, details });
  } else {
    console.error(`[FAIL] Test ${num}: ${scenario} - ${details}`);
    results.push({ num, scenario, passed: false, details });
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('  STARTING AUTOMATED RBAC & WORKFLOW TEST SUITE       ');
  console.log('======================================================\n');

  // Reset database to ensure clean state
  db.resetToDemoData();
  const testUser = db.getUserByEmail('m.vance@aegisdefense.io');
  if (!testUser) throw new Error('Test user seed is missing.');
  db.updateUser({ ...testUser, passwordHash: await bcrypt.hash(TEST_USER_PASSWORD, 12) });

  // Start test server on random port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;
  console.log(`Test server running at ${baseUrl}`);

  let adminToken = '';
  let userToken = '';
  let registeredUserId = '';
  let testAssetId = '';
  let testDisposalReqId = '';
  let testCertId = '';

  try {
    // 1. Valid Admin login succeeds
    const adminLoginRes = await fetch(`${baseUrl}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'suhasi271426@gmail.com',
        password: TEST_ADMIN_PASSWORD,
      }),
    });
    const adminLoginData: any = await adminLoginRes.json();
    adminToken = adminLoginData.token || '';
    assert(
      adminLoginRes.status === 200 && adminLoginData.success === true && adminLoginData.user?.role === 'Admin',
      1,
      'Valid Admin login succeeds',
      `Status: ${adminLoginRes.status}, Role: ${adminLoginData.user?.role}`
    );

    // 2. Valid User login succeeds
    const userLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'm.vance@aegisdefense.io',
        password: TEST_USER_PASSWORD,
      }),
    });
    const userLoginData: any = await userLoginRes.json();
    userToken = userLoginData.token || '';
    assert(
      userLoginRes.status === 200 && userLoginData.success === true && userLoginData.user?.role === 'User',
      2,
      'Valid User login succeeds',
      `Status: ${userLoginRes.status}, Role: ${userLoginData.user?.role}`
    );

    // 3. Invalid credentials are rejected
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'm.vance@aegisdefense.io',
        password: 'WrongPassword!999',
      }),
    });
    const badLoginData: any = await badLoginRes.json();
    assert(
      badLoginRes.status === 401 && badLoginData.success === false,
      3,
      'Invalid credentials are rejected',
      `Expected 401, got ${badLoginRes.status}: ${badLoginData.message}`
    );

    const adminViaUserLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'suhasi271426@gmail.com',
        password: TEST_ADMIN_PASSWORD,
      }),
    });
    assert(
      adminViaUserLoginRes.status === 403,
      19,
      'Admin credentials cannot authenticate through the User login endpoint',
      `Expected 403, got ${adminViaUserLoginRes.status}`
    );

    const originalFetch = globalThis.fetch;
    let googleProfile = {
      sub: 'google-admin-subject',
      email: 'suhasi271426@gmail.com',
      email_verified: true,
      name: 'Attempted Google Admin',
    };
    globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200 });
      }
      if (url === 'https://openidconnect.googleapis.com/v1/userinfo') {
        return new Response(JSON.stringify(googleProfile), { status: 200 });
      }
      return originalFetch(input, init);
    };
    try {
      const adminGoogleStart = await fetch(`${baseUrl}/auth/google`, { redirect: 'manual' });
      const adminGoogleLocation = new URL(adminGoogleStart.headers.get('location') || '');
      const adminGoogleCookie = adminGoogleStart.headers.get('set-cookie')?.split(';')[0] || '';
      const adminGoogleCallback = await fetch(
        `${baseUrl}/auth/google/callback?code=test-code&state=${adminGoogleLocation.searchParams.get('state')}`,
        { headers: { Cookie: adminGoogleCookie }, redirect: 'manual' }
      );
      assert(
        adminGoogleCallback.status === 302 &&
        adminGoogleCallback.headers.get('location')?.includes('error=use_admin_login') === true &&
        !db.getUserByGoogleId('google-admin-subject'),
        20,
        'Google authentication cannot create or authenticate an Admin account',
        `Callback returned ${adminGoogleCallback.status} and did not create the Admin identity`
      );

      googleProfile = {
        sub: 'google-standard-user-subject',
        email: 'oauth-user@example.test',
        email_verified: true,
        name: 'Google Standard User',
      };
      const userGoogleStart = await fetch(`${baseUrl}/auth/google`, { redirect: 'manual' });
      const userGoogleLocation = new URL(userGoogleStart.headers.get('location') || '');
      const userGoogleCookie = userGoogleStart.headers.get('set-cookie')?.split(';')[0] || '';
      const userGoogleCallback = await fetch(
        `${baseUrl}/auth/google/callback?code=test-code&state=${userGoogleLocation.searchParams.get('state')}`,
        { headers: { Cookie: userGoogleCookie }, redirect: 'manual' }
      );
      const userGoogleDestination = userGoogleCallback.headers.get('location') || '';
      const googleToken = new URLSearchParams(userGoogleDestination.split('?')[1] || '').get('token');
      const googleMeResponse = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${googleToken}` },
      });
      const googleMeData: any = await googleMeResponse.json();
      assert(
        userGoogleCallback.status === 302 &&
        googleMeResponse.status === 200 &&
        googleMeData.user?.role === 'User',
        21,
        'New Google-authenticated accounts receive only the User role',
        `Authenticated role: ${googleMeData.user?.role}`
      );

      const googleUser = db.getUserByGoogleId('google-standard-user-subject');
      if (!googleUser) throw new Error('Google test account was not persisted.');
      const googleAdminPromotion = await fetch(`${baseUrl}/users/${googleUser.id}/role`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'Admin' }),
      });
      const googleUserMeResponse = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${googleToken}` },
      });
      const googleUserMeData: any = await googleUserMeResponse.json();
      assert(
        googleAdminPromotion.status === 400 &&
        googleUserMeResponse.status === 200 &&
        googleUserMeData.user?.role === 'User',
        22,
        'Google-linked accounts cannot be promoted to Admin',
        `Promotion returned ${googleAdminPromotion.status}; Google account role remains ${googleUserMeData.user?.role}`
      );
    } finally {
      globalThis.fetch = originalFetch;
    }

    // 4. Users cannot access Admin pages or Admin APIs
    const userAccessUsersRes = await fetch(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userAccessSettingsRes = await fetch(`${baseUrl}/settings`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgName: 'Hacked Org' }),
    });
    assert(
      userAccessUsersRes.status === 403 && userAccessSettingsRes.status === 403,
      4,
      'Users cannot access Admin APIs',
      `GET /users: ${userAccessUsersRes.status}, PUT /settings: ${userAccessSettingsRes.status}`
    );

    // 5. Admins can access authorized Admin functions
    const adminAccessUsersRes = await fetch(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminAccessData: any = await adminAccessUsersRes.json();
    assert(
      adminAccessUsersRes.status === 200 && Array.isArray(adminAccessData.users),
      5,
      'Admins can access authorized Admin functions',
      `Returned ${adminAccessData.users?.length} users`
    );

    // 6. Public users cannot create Admin accounts
    const publicAdminRegisterRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Attempting Escalation',
        email: 'attacker@evil.com',
        password: 'Password!2026',
        department: 'Security',
        role: 'Admin', // attempting privilege escalation
      }),
    });
    const publicAdminData: any = await publicAdminRegisterRes.json();
    registeredUserId = publicAdminData.user?.id || '';
    assert(
      publicAdminRegisterRes.status === 201 && publicAdminData.user?.role === 'User',
      6,
      'Public users cannot create Admin accounts (forced to User role)',
      `Requested role 'Admin', assigned role: '${publicAdminData.user?.role}'`
    );

    // 7. Users cannot change their own role
    const attackerToken = publicAdminData.token;
    const selfEscalateRes = await fetch(`${baseUrl}/auth/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${attackerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Name',
        role: 'Admin', // attempting self-demotion/promotion via profile
      }),
    });
    const selfEscalateData: any = await selfEscalateRes.json();
    assert(
      selfEscalateData.user?.role === 'User',
      7,
      'Users cannot change their own role',
      `Role remained '${selfEscalateData.user?.role}' after profile update attempt`
    );

    // 8. Users cannot access another user's private records (IDOR protection)
    // Sarah Chen (Admin) has LAP-1002 (Custodian: Elena Rostova)
    // Marcus Vance (User) attempts to fetch LAP-1002
    const idorRes = await fetch(`${baseUrl}/assets/LAP-1002`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      idorRes.status === 403,
      8,
      'Users cannot access another user\'s private records (IDOR protected)',
      `Status: ${idorRes.status} Forbidden when accessing unassigned asset`
    );

    // 9. Asset registration saves correctly
    const registerAssetRes = await fetch(`${baseUrl}/assets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceType: 'Laptop',
        brand: 'Dell',
        model: 'Latitude 7420 Pro',
        serialNumber: `SN-USER-${Date.now().toString().slice(-6)}`,
        capacity: '512GB NVMe SSD',
        assetCondition: 'Working',
      }),
    });
    const registerAssetData: any = await registerAssetRes.json();
    testAssetId = registerAssetData.asset?.id || '';
    assert(
      registerAssetRes.status === 201 && registerAssetData.asset?.assignedEmployee === 'Marcus Vance',
      9,
      'Asset registration saves correctly with ownership assignment',
      `Created Asset: ${testAssetId}, Custodian: ${registerAssetData.asset?.assignedEmployee}`
    );

    // 10. Disposal request submission saves correctly
    const submitReqRes = await fetch(`${baseUrl}/disposal-requests`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId: testAssetId,
        reason: 'End of 3-year refresh lease cycle',
        condition: 'Working',
        priority: 'High',
        notes: 'Device ready for media sanitization',
      }),
    });
    const submitReqData: any = await submitReqRes.json();
    testDisposalReqId = submitReqData.request?.id || '';
    assert(
      submitReqRes.status === 201 && submitReqData.request?.status === 'Pending Approval',
      10,
      'Disposal request submission saves correctly in Pending Approval status',
      `Request ID: ${testDisposalReqId}, Status: ${submitReqData.request?.status}`
    );

    // 11. Approval and rejection update the correct records
    // User cannot approve their own request
    const userApproveAttempt = await fetch(`${baseUrl}/disposal-requests/${testDisposalReqId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    // Admin approves request
    const adminApproveRes = await fetch(`${baseUrl}/disposal-requests/${testDisposalReqId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminApproveData: any = await adminApproveRes.json();
    assert(
      userApproveAttempt.status === 403 && adminApproveRes.status === 200 && adminApproveData.request?.status === 'Approved',
      11,
      'Approval and rejection update the correct records and prevent unauthorized user approvals',
      `User approval: ${userApproveAttempt.status} (Blocked), Admin approval: ${adminApproveRes.status} (Approved)`
    );

    // 12. Wiping and verification statuses update correctly
    // Start wiping
    const startWipeRes = await fetch(`${baseUrl}/wiping/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId: testAssetId,
        method: 'NIST 800-88 Rev 1 Purge',
        technician: 'Marcus Vance',
      }),
    });
    // Complete wiping
    const completeWipeRes = await fetch(`${baseUrl}/wiping/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId: testAssetId,
        passed: true,
      }),
    });
    // Independent verification
    const verifyRes = await fetch(`${baseUrl}/verification/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId: testAssetId,
        passed: true,
        notes: 'Cryptographic zero-fill readback validated 100% clean.',
      }),
    });
    const verifyData: any = await verifyRes.json();
    assert(
      startWipeRes.status === 200 && completeWipeRes.status === 200 && verifyRes.status === 200 && verifyData.record?.verificationResult === 'Passed',
      12,
      'Wiping and verification statuses update correctly through state machine',
      `Verification result: ${verifyData.record?.verificationResult}`
    );

    // 13. Certificates are generated only when required conditions are met
    // Attempting to generate on an unverified asset should fail
    const unverifiedCertAttempt = await fetch(`${baseUrl}/certificates/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId: 'LAP-1001' }), // LAP-1001 is Registered, not wiped
    });
    // Generating on our verified asset
    const validCertRes = await fetch(`${baseUrl}/certificates/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId: testAssetId,
        notes: 'Audited Destruction Certificate for test asset',
      }),
    });
    const validCertData: any = await validCertRes.json();
    testCertId = validCertData.certificate?.certificateId || '';
    assert(
      unverifiedCertAttempt.status === 400 && validCertRes.status === 201 && testCertId.length > 0,
      13,
      'Certificates are generated only when required conditions are met',
      `Unverified asset blocked (400), verified asset certificate generated: ${testCertId}`
    );

    // 14. Unauthorized certificate access is rejected
    // Another user tries to access this certificate
    const unauthorizedCertRes = await fetch(`${baseUrl}/certificates/${testCertId}`, {
      headers: { Authorization: `Bearer ${attackerToken}` },
    });
    assert(
      unauthorizedCertRes.status === 403,
      14,
      'Unauthorized certificate access is rejected (URL tampering IDOR prevention)',
      `Status: ${unauthorizedCertRes.status} Forbidden when attacker accessed Marcus Vance's certificate`
    );

    // 15. Audit records are created for important actions
    const auditRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData: any = await auditRes.json();
    const hasCertLog = auditData.logs?.some((l: any) => l.action.includes('Certificate') && l.assetId === testAssetId);
    assert(
      auditRes.status === 200 && hasCertLog === true,
      15,
      'Audit records are created for important actions',
      `Found certificate issuance audit log for ${testAssetId}`
    );

    // 16. Logout and token/session expiry behave correctly
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${attackerToken}` },
    });
    const invalidTokenRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.expired.token.123' },
    });
    assert(
      logoutRes.status === 200 && invalidTokenRes.status === 401,
      16,
      'Logout and token/session validation behave correctly',
      `Logout: ${logoutRes.status}, Invalid token: ${invalidTokenRes.status}`
    );

    // 17. Frontend and backend handle errors gracefully
    const duplicateAssetRes = await fetch(`${baseUrl}/assets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceType: 'Laptop',
        brand: 'Dell',
        model: 'Duplicate Test',
        serialNumber: 'PF49B901Z', // Existing serial from initial seed
      }),
    });
    const dupData: any = await duplicateAssetRes.json();
    assert(
      duplicateAssetRes.status === 409 && dupData.success === false && Boolean(dupData.message),
      17,
      'Backend returns clean, descriptive error responses for edge cases',
      `Status: ${duplicateAssetRes.status}, Error Message: ${dupData.message}`
    );

    // 18. Existing features continue to work (Dashboard statistics live from database)
    const statsRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData: any = await statsRes.json();
    assert(
      statsRes.status === 200 &&
      statsData.stats?.totalAssets >= 15 &&
      statsData.stats?.certificatesGenerated >= 1 &&
      typeof statsData.stats?.pendingRequests === 'number',
      18,
      'Existing features and real database dashboard metrics continue to work',
      `Total Assets: ${statsData.stats?.totalAssets}, Certificates: ${statsData.stats?.certificatesGenerated}`
    );

  } finally {
    server.close();
  }

  console.log('\n======================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`  TEST RESULTS: ${results.filter((r) => r.passed).length}/${results.length} PASSED`);
  console.log(`  OVERALL SUITE: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('======================================================\n');

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});
