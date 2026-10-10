import NotBuilt from "../../components/dash/NotBuilt.jsx";

/**
 * Enquiries and admissions are not built. The API has children and guardian
 * invites, which is enrolment — there is no pipeline before it.
 */
export default function Admissions() {
  return (
    <NotBuilt
      icon="userPlus"
      title="Admissions"
      sub="Tracking enquiries and tours before a child is enrolled is not built yet."
      instead="add a child under Children once a family has decided. That
        creates their enrolment and invites the parent."
    />
  );
}
