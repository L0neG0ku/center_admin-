import { createContext } from "react";
import * as fallback from "../data/signup.js";

/**
 * Static option lists, used until GET /daycares/reference answers — and as the
 * permanent fallback if it never does, so the form is never left with empty
 * dropdowns.
 */
export const STATIC_REFERENCE = {
  centreTypes: fallback.centreTypes,
  ownershipTypes: fallback.ownershipTypes,
  preschoolSlotOptions: fallback.preschoolSlotOptions,
  curriculumOptions: fallback.curriculumOptions,
  primaryLanguages: fallback.primaryLanguages,
  preschoolRatios: fallback.preschoolRatios,
  daycareRatios: fallback.daycareRatios,
  ageGroups: fallback.ageGroups,
  weekdays: fallback.weekdays,
  indianStates: fallback.indianStates,
  businessProofTypes: fallback.businessProofTypes,
  photoCategories: fallback.photoCategories,
  uploadLimits: { maxFileBytes: 5 * 1024 * 1024, accept: ".pdf,.jpg,.jpeg,.png" },

  /**
   * Mirrors the backend's REQUIRE_PHONE_VERIFICATION. The server sends this in
   * the reference payload and that value wins; VITE_REQUIRE_PHONE_VERIFICATION
   * is only a local override for when the field isn't present yet.
   *
   * Defaults to false because the server is the real gate — it rejects an
   * unverified phone on its own when the flag is on. The client-side check
   * exists to warn earlier, not to enforce, so defaulting it off can't let
   * anything past the backend that the backend wouldn't already allow.
   */
  requirePhoneVerification:
    String(import.meta.env.VITE_REQUIRE_PHONE_VERIFICATION ?? "false") === "true",
};

/** API field name → the key this app uses. */
export const REFERENCE_ALIASES = {
  centre_types: "centreTypes",
  ownership_types: "ownershipTypes",
  preschool_shifts: "preschoolSlotOptions",
  curriculum: "curriculumOptions",
  curriculum_options: "curriculumOptions",
  languages: "primaryLanguages",
  preschool_ratios: "preschoolRatios",
  daycare_ratios: "daycareRatios",
  age_groups: "ageGroups",
  working_days: "weekdays",
  states: "indianStates",
  business_proof_types: "businessProofTypes",
  photo_categories: "photoCategories",
  upload_limits: "uploadLimits",
  require_phone_verification: "requirePhoneVerification",
};

export const ReferenceContext = createContext({ ...STATIC_REFERENCE, loaded: false });
