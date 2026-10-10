import NotBuilt from "../../components/dash/NotBuilt.jsx";

/**
 * Fees are not built. There is no invoice table, no payment record and no
 * fee request anywhere in the API — `fee_plan` is stored on each enrolment
 * and read by nothing.
 *
 * This page previously showed invented invoices and a revenue total against
 * the centre's own name. That is the one number an owner would act on
 * without checking.
 */
export default function Billing() {
  return (
    <NotBuilt
      icon="wallet"
      title="Billing"
      sub="Fee requests, UPI collection and receipts are not built yet."
      instead="keep collecting fees the way you do now. The fee plan on each
        child's enrolment is stored and will be used when this lands."
      when="Planned for the month after the pilot, as UPI links to your own
        VPA — money never passes through Kribble."
    />
  );
}
