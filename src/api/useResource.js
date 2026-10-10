import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One GET, with the four states a dashboard panel actually needs: loading,
 * data, error, and a way to ask again.
 *
 * Why a hook rather than a context like ReferenceContext: reference data is
 * fetched once for the whole app, while these are per-page and per-filter —
 * the register for a date, children in a room — so they belong to the panel
 * that shows them and have to refetch when the filter changes.
 *
 *   const rooms = useResource((signal) => api.listClassrooms({ signal }), []);
 *   const register = useResource(
 *     (signal) => api.getAttendance({ date }, { signal }),
 *     [date],
 *   );
 *
 * The fetcher is handed an AbortSignal and must pass it through, or a fast
 * filter change leaves two requests racing and the slower one wins.
 *
 * `deps` is the dependency list exactly as useEffect takes one. It is not
 * inferred, because a fetcher closing over `date` looks identical to one
 * that does not. Keep it to values that serialise — strings, numbers, dates,
 * plain objects — since the key below is how a stale result is recognised.
 */
export function useResource(fetcher, deps = [], { enabled = true } = {}) {
  // Loading is DERIVED from whether the stored result belongs to the request
  // the current props would make. Nothing tracks it separately: a stored
  // `loading` flag costs an extra render and gives two sources of truth that
  // can disagree, which is how a panel ends up stuck on a spinner.
  //
  // The key is computed during render from the deps, so there is no ref to
  // read and no state to set from inside the effect.
  const [reloadToken, setReloadToken] = useState(0);
  const key = `${reloadToken}|${JSON.stringify(deps)}`;

  const [result, setResult] = useState({ key: null, data: null, error: null });

  // The fetcher is held in a ref so that its identity changing every render —
  // which an inline arrow does — cannot restart the request on its own. It is
  // synced in an effect rather than assigned during render, because writing a
  // ref mid-render is unsafe when a render can be discarded. This effect has
  // no dependency list, so it runs on every commit, and being declared ABOVE
  // the fetching effect it runs first — so the fetch sees the current closure.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    // Nothing to fetch yet — a panel waiting on a child id, say.
    if (!enabled) return undefined;

    const controller = new AbortController();
    let live = true;

    Promise.resolve(fetcherRef.current(controller.signal))
      .then((data) => {
        if (live) setResult({ key, data, error: null });
      })
      .catch((error) => {
        // An aborted request is this effect being cleaned up, not a failure
        // to report — surfacing it would flash an error on every keystroke.
        if (error?.name === "AbortError" || !live) return;
        setResult({ key, data: null, error });
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [key, enabled]);

  if (!enabled) {
    return { data: null, error: null, loading: false, reload };
  }

  const settled = result.key === key;
  return {
    data: settled && !result.error ? result.data : null,
    error: settled ? result.error : null,
    loading: !settled,
    reload,
  };
}

/**
 * A write, with the state a button needs: busy, and what went wrong.
 *
 *   const save = useAction(() => api.createChild(payload));
 *   <Btn disabled={save.busy} onClick={() => save.run().then(onDone)} />
 *
 * `run` resolves with the result on success and rethrows on failure, so a
 * caller can both await it and let the hook hold the error for display.
 */
export function useAction(action) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const actionRef = useRef(action);
  useEffect(() => {
    actionRef.current = action;
  });

  const run = useCallback(async (...args) => {
    setBusy(true);
    setError(null);
    try {
      return await actionRef.current(...args);
    } catch (caught) {
      setError(caught);
      throw caught;
    } finally {
      setBusy(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { run, busy, error, clearError };
}

/** The pager a list endpoint hangs off its array, or sensible defaults. */
export function pagerOf(rows) {
  const meta = rows?.meta || {};
  const page = meta.page || 1;
  const totalPages = meta.total_pages || 1;
  return {
    page,
    perPage: meta.per_page || (Array.isArray(rows) ? rows.length : 0),
    total: meta.total ?? (Array.isArray(rows) ? rows.length : 0),
    totalPages,
    hasMore: page < totalPages,
  };
}
