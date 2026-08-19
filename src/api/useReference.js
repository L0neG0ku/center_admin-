import { useContext } from "react";
import { ReferenceContext } from "./referenceStore.js";

/** Dropdown/chip options from GET /daycares/reference, with static fallback. */
export function useReference() {
  return useContext(ReferenceContext);
}
