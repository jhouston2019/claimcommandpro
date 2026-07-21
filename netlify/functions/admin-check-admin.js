/**
 * Admin Check Endpoint
 * Verifies admin access via JWT and ai_admins table lookup
 */

const ALLOWED_ROLES = new Set(['superadmin', 'admin', 'editor']);

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: ''
    };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: JSON_HEADERS,
      body: JSON.stringify({ success: false, data: null, error: 'Unauthorized' })
    };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return {
      statusCode: 401,
      headers: JSON_HEADERS,
      body: JSON.stringify({ success: false, data: null, error: 'Unauthorized' })
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!userResponse.ok) {
      return {
        statusCode: 401,
        headers: JSON_HEADERS,
        body: JSON.stringify({ success: false, data: null, error: 'Unauthorized' })
      };
    }

    const userData = await userResponse.json();
    const uid = userData?.id;
    if (!uid) {
      return {
        statusCode: 401,
        headers: JSON_HEADERS,
        body: JSON.stringify({ success: false, data: null, error: 'Unauthorized' })
      };
    }

    const adminResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_admins?user_id=eq.${encodeURIComponent(uid)}&select=role`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`
        }
      }
    );

    if (!adminResponse.ok) {
      return {
        statusCode: 403,
        headers: JSON_HEADERS,
        body: JSON.stringify({ success: false, data: null, error: 'Forbidden' })
      };
    }

    const rows = await adminResponse.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        statusCode: 403,
        headers: JSON_HEADERS,
        body: JSON.stringify({ success: false, data: null, error: 'Forbidden' })
      };
    }

    const role = rows[0]?.role;
    if (!ALLOWED_ROLES.has(role)) {
      return {
        statusCode: 403,
        headers: JSON_HEADERS,
        body: JSON.stringify({ success: false, data: null, error: 'Forbidden' })
      };
    }

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: true,
        data: { admin: true, role },
        error: null
      })
    };
  } catch (error) {
    console.error('Admin check error:', error);
    return {
      statusCode: 401,
      headers: JSON_HEADERS,
      body: JSON.stringify({ success: false, data: null, error: 'Unauthorized' })
    };
  }
};
