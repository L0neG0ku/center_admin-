import { useEffect, useMemo, useState } from "react";
import { getReference } from "./endpoints.js";
import {
  REFERENCE_ALIASES,
  ReferenceContext,
  STATIC_REFERENCE,
} from "./referenceStore.js";

/**
 * Fetches GET /daycares/reference once and publishes it to the form.
 * Server values win; the static lists in referenceStore.js fill any gap.
 */
export function ReferenceProvider({ children }) {
  const [remote, setRemote] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getReference({ signal: controller.signal })
      .then((data) => {
        if (!data || typeof data !== "object") return;
        const mapped = {};
        Object.entries(data).forEach(([key, value]) => {
          const local = REFERENCE_ALIASES[key] || key;
          // Never let an empty list wipe out a working fallback — but a
          // deliberate `false` is a real value and has to come through, or
          // server feature flags could never be turned off.
          if (Array.isArray(value)) {
            if (value.length) mapped[local] = value;
          } else if (value !== null && value !== undefined) {
            mapped[local] = value;
          }
        });
        setRemote(mapped);
      })
      .catch(() => {
        // Offline or endpoint not up yet — statics carry the form.
      });

    return () => controller.abort();
  }, []);

  const value = useMemo(
    () => ({ ...STATIC_REFERENCE, ...(remote || {}), loaded: Boolean(remote) }),
    [remote]
  );

  return <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>;
}
