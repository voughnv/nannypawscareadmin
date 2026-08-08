import { supabase } from "../lib/supabase";

const ADMIN_STORAGE_KEY = "admin";
const SESSION_TOKEN_KEY = "adminSessionToken";
const DEVICE_ID_KEY = "adminDeviceId";
const LAST_ACTIVITY_KEY = "adminLastActivity";

// Check the active session once every minute.
export const ADMIN_SESSION_HEARTBEAT_MS = 60 * 1000;

// Automatically log the Admin out after 30 minutes
// without activity.
export const ADMIN_SESSION_TTL_MS = 30 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| GET STORED ADMIN
|--------------------------------------------------------------------------
*/
export function getStoredAdmin() {
  const storedAdmin = localStorage.getItem(
    ADMIN_STORAGE_KEY
  );

  if (!storedAdmin) {
    return null;
  }

  try {
    const admin = JSON.parse(storedAdmin);

    const hasAdminIdentity =
      admin &&
      (admin.admin_id ||
        admin.admin_email ||
        admin.admin_username);

    if (!hasAdminIdentity) {
      clearLocalAdminSession();
      return null;
    }

    return admin;
  } catch {
    clearLocalAdminSession();
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| GET STORED SESSION TOKEN
|--------------------------------------------------------------------------
*/
export function getStoredSessionToken() {
  return (
    localStorage.getItem(SESSION_TOKEN_KEY) || ""
  );
}

/*
|--------------------------------------------------------------------------
| DEVICE ID
|--------------------------------------------------------------------------
| Each browser/device receives its own ID.
*/
export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(
    DEVICE_ID_KEY
  );

  if (deviceId) {
    return deviceId;
  }

  deviceId = createSecureToken();

  localStorage.setItem(
    DEVICE_ID_KEY,
    deviceId
  );

  return deviceId;
}

/*
|--------------------------------------------------------------------------
| ADMIN ACTIVITY
|--------------------------------------------------------------------------
| Saves the last time the administrator interacted with the website.
*/
export function markAdminActivity() {
  localStorage.setItem(
    LAST_ACTIVITY_KEY,
    String(Date.now())
  );
}

export function getAdminLastActivity() {
  const storedValue =
    localStorage.getItem(LAST_ACTIVITY_KEY);

  const timestamp = Number(storedValue);

  if (
    !storedValue ||
    Number.isNaN(timestamp)
  ) {
    return 0;
  }

  return timestamp;
}

/*
|--------------------------------------------------------------------------
| INACTIVITY CHECK
|--------------------------------------------------------------------------
| Returns true once 30 minutes have passed without Admin activity.
*/
export function isAdminSessionInactive() {
  const lastActivity =
    getAdminLastActivity();

  if (!lastActivity) {
    return true;
  }

  return (
    Date.now() - lastActivity >=
    ADMIN_SESSION_TTL_MS
  );
}

/*
|--------------------------------------------------------------------------
| LOCAL SESSION CHECK
|--------------------------------------------------------------------------
*/
export function hasLocalAdminSession() {
  const admin = getStoredAdmin();

  const sessionToken =
    getStoredSessionToken();

  return Boolean(
    admin?.admin_id &&
      sessionToken
  );
}

/*
|--------------------------------------------------------------------------
| CLEAR LOCAL SESSION
|--------------------------------------------------------------------------
*/
export function clearLocalAdminSession() {
  localStorage.removeItem(
    ADMIN_STORAGE_KEY
  );

  localStorage.removeItem(
    SESSION_TOKEN_KEY
  );

  localStorage.removeItem(
    LAST_ACTIVITY_KEY
  );
}

/*
|--------------------------------------------------------------------------
| CLAIM ADMIN SESSION
|--------------------------------------------------------------------------
| Called after the Admin email/password is validated.
|
| Only one active browser/device can own the Admin session.
*/
export async function claimAdminSession(
  admin
) {
  if (!admin?.admin_id) {
    throw new Error(
      "Administrator ID was not found."
    );
  }

  const sessionToken =
    createSecureToken();

  const deviceId =
    getOrCreateDeviceId();

  const now =
    new Date();

  const nowIso =
    now.toISOString();

  const expiresAt =
    new Date(
      now.getTime() +
        ADMIN_SESSION_TTL_MS
    ).toISOString();

  const {
    data,
    error,
  } = await supabase
    .from("ADMIN")
    .update({
      admin_session_token:
        sessionToken,

      admin_session_device_id:
        deviceId,

      admin_session_started_at:
        nowIso,

      admin_session_last_seen_at:
        nowIso,

      admin_session_expires_at:
        expiresAt,
    })
    .eq(
      "admin_id",
      admin.admin_id
    )
    .or(
      [
        "admin_session_token.is.null",
        "admin_session_expires_at.is.null",
        `admin_session_expires_at.lt.${nowIso}`,
        `admin_session_device_id.eq.${deviceId}`,
      ].join(",")
    )
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  /*
    No row was updated.
    Another browser/device currently owns
    the active Admin session.
  */
  if (!data) {
    return {
      success: false,
      reason: "already_active",
    };
  }

  const storedAdmin = {
    ...admin,

    admin_session_started_at:
      data.admin_session_started_at,

    admin_session_last_seen_at:
      data.admin_session_last_seen_at,

    admin_session_expires_at:
      data.admin_session_expires_at,
  };

  localStorage.setItem(
    ADMIN_STORAGE_KEY,
    JSON.stringify(storedAdmin)
  );

  localStorage.setItem(
    SESSION_TOKEN_KEY,
    sessionToken
  );

  // Logging in counts as activity.
  markAdminActivity();

  return {
    success: true,
    sessionToken,
    expiresAt,
  };
}

/*
|--------------------------------------------------------------------------
| VERIFY / REFRESH ACTIVE SESSION
|--------------------------------------------------------------------------
| Refreshes the database expiration only when the local session
| has NOT exceeded the 30-minute inactivity limit.
*/
export async function refreshAdminSession() {
  const admin =
    getStoredAdmin();

  const sessionToken =
    getStoredSessionToken();

  if (
    !admin?.admin_id ||
    !sessionToken
  ) {
    return false;
  }

  /*
    Do not refresh a session that has already
    been inactive for 30 minutes.
  */
  if (isAdminSessionInactive()) {
    return false;
  }

  const now =
    new Date();

  const nowIso =
    now.toISOString();

  const nextExpiry =
    new Date(
      now.getTime() +
        ADMIN_SESSION_TTL_MS
    ).toISOString();

  try {
    const {
      data,
      error,
    } = await supabase
      .from("ADMIN")
      .update({
        admin_session_last_seen_at:
          nowIso,

        admin_session_expires_at:
          nextExpiry,
      })
      .eq(
        "admin_id",
        admin.admin_id
      )
      .eq(
        "admin_session_token",
        sessionToken
      )
      .gt(
        "admin_session_expires_at",
        nowIso
      )
      .select(
        `
          admin_id,
          admin_session_token,
          admin_session_last_seen_at,
          admin_session_expires_at
        `
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Unable to verify administrator session:",
        error
      );

      return false;
    }

    /*
      No matching row means:
      - session expired
      - session was removed
      - session token no longer matches
    */
    if (!data) {
      return false;
    }

    const refreshedAdmin = {
      ...admin,

      admin_session_last_seen_at:
        data.admin_session_last_seen_at,

      admin_session_expires_at:
        data.admin_session_expires_at,
    };

    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      JSON.stringify(
        refreshedAdmin
      )
    );

    return true;
  } catch (error) {
    console.error(
      "Administrator session verification failed:",
      error
    );

    return false;
  }
}

/*
|--------------------------------------------------------------------------
| RELEASE ADMIN SESSION
|--------------------------------------------------------------------------
| Called during proper Logout or automatic inactivity logout.
*/
export async function releaseAdminSession() {
  const admin =
    getStoredAdmin();

  const sessionToken =
    getStoredSessionToken();

  try {
    if (
      admin?.admin_id &&
      sessionToken
    ) {
      const {
        error,
      } = await supabase
        .from("ADMIN")
        .update({
          admin_session_token:
            null,

          admin_session_device_id:
            null,

          admin_session_started_at:
            null,

          admin_session_last_seen_at:
            null,

          admin_session_expires_at:
            null,
        })
        .eq(
          "admin_id",
          admin.admin_id
        )
        .eq(
          "admin_session_token",
          sessionToken
        );

      if (error) {
        console.error(
          "Unable to release administrator session:",
          error
        );
      }
    }
  } catch (error) {
    console.error(
      "Administrator logout error:",
      error
    );
  } finally {
    clearLocalAdminSession();

    window.dispatchEvent(
      new Event(
        "admin-session-ended"
      )
    );
  }
}

/*
|--------------------------------------------------------------------------
| CREATE SECURE SESSION TOKEN
|--------------------------------------------------------------------------
*/
function createSecureToken() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues ===
      "function"
  ) {
    const values =
      new Uint32Array(4);

    crypto.getRandomValues(
      values
    );

    return Array.from(values)
      .map((value) =>
        value
          .toString(16)
          .padStart(8, "0")
      )
      .join("-");
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}