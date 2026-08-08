import { supabase } from "../lib/supabase";

const ADMIN_STORAGE_KEY = "admin";
const SESSION_TOKEN_KEY = "adminSessionToken";
const DEVICE_ID_KEY = "adminDeviceId";

// Active Admin pages refresh the session every 60 seconds.
export const ADMIN_SESSION_HEARTBEAT_MS = 60 * 1000;

// If the browser is closed without pressing Logout,
// the session will automatically expire after 5 minutes.
export const ADMIN_SESSION_TTL_MS = 5 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| GET STORED ADMIN
|--------------------------------------------------------------------------
| Reads the currently logged-in administrator from localStorage.
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
| GET SESSION TOKEN
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
| Every browser/device receives its own permanent ID.
|
| Example:
| Laptop Chrome = one device ID
| Another laptop = another device ID
| Another browser = another device ID
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
| CHECK LOCAL SESSION
|--------------------------------------------------------------------------
| This only checks whether the browser contains the required local session
| information.
|
| ProtectedAdminRoute will still verify the session against Supabase.
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
}

/*
|--------------------------------------------------------------------------
| CLAIM ADMIN SESSION
|--------------------------------------------------------------------------
| Called after the email and password are successfully validated.
|
| Only one active browser/device should be able to claim the Admin account.
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

  const now = new Date();

  const nowIso =
    now.toISOString();

  const expiresAt =
    new Date(
      now.getTime() +
        ADMIN_SESSION_TTL_MS
    ).toISOString();

  /*
    Login can continue only when:

    1. There is currently no session.
    2. The old session already expired.
    3. The same browser/device is reclaiming its own session.

    Another browser/device with an active session will not match this query.
  */
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

    This means another device/browser currently owns
    the active session.
  */
  if (!data) {
    return {
      success: false,
      reason: "already_active",
    };
  }

  /*
    Keep the original Admin information in localStorage
    so Profile, Sidebar, Settings, etc. continue working.
  */
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

  return {
    success: true,
    sessionToken,
    expiresAt,
  };
}

/*
|--------------------------------------------------------------------------
| VERIFY / REFRESH SESSION
|--------------------------------------------------------------------------
| ProtectedAdminRoute calls this repeatedly.
|
| It verifies that:
|
| - Admin still exists
| - Local session token exists
| - Database contains the same token
| - Session has not expired
|
| A valid session is then extended another 5 minutes.
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
      - token was removed,
      - another session replaced it,
      - or session expired.
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
| Called when the administrator presses Logout.
|
| It clears the database session FIRST.
| Then it clears localStorage.
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
    /*
      Local logout always happens even when there
      is a network problem.
    */
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
  /*
    Modern browsers support crypto.randomUUID().
  */
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  /*
    Fallback for browsers without randomUUID().
  */
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

  /*
    Last fallback.
  */
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}