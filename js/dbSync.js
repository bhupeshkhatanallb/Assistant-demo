// Wraps the artifact `db` capability so the app's state survives beyond
// this browser's localStorage (which a sandboxed artifact view can lose
// on reload/republish). Everywhere this resolves to null - outside the
// artifact host, or the capability isn't granted - callers fall back to
// localStorage only, so the plain GitHub-hosted copy of the app is unaffected.

const DOC_PATH = "state/app";

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      if (typeof window === "undefined" || !window.claude || typeof window.claude.use !== "function") return null;
      try {
        return await window.claude.use("db");
      } catch (e) {
        console.warn("db capability unavailable", e);
        return null;
      }
    })();
  }
  return dbPromise;
}

export async function loadFromDb() {
  const db = await getDb();
  if (!db) return null;
  try {
    const snap = await db.doc(DOC_PATH).get();
    return snap.exists ? snap.data() : null;
  } catch (e) {
    console.warn("db load failed", e);
    return null;
  }
}

export async function saveToDb(state) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.doc(DOC_PATH).set(state);
  } catch (e) {
    console.warn("db save failed", e);
  }
}

export async function subscribe(onRemoteChange) {
  const db = await getDb();
  if (!db) return () => {};
  return db.doc(DOC_PATH).onSnapshot(
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (!snap.exists) return;
      onRemoteChange(snap.data());
    },
    (err) => console.warn("db subscription error", err)
  );
}
