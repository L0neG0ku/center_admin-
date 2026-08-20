/**
 * Kribble Centre Onboarding Acknowledgement.
 *
 * Extracted verbatim from public/"Kribble Centre Acknowledgement (1) 2.doc".
 * Wording is the legal text as supplied — edit the source document and
 * re-generate rather than paraphrasing here.
 */

export const agreementMeta = {
  title: "Centre Onboarding Acknowledgement",
  operator: "Platform operated by Little Orbit Technologies Private Limited (proposed under incorporation)",
  version: "Version 1.0",
  kind: "Preliminary onboarding acknowledgement",
};

/** Intro and definitions, before the numbered clauses. */
export const agreementPreamble = [
  "This Centre Onboarding Acknowledgement (\"Acknowledgement\") records the understanding between the childcare, preschool, daycare, activity, enrichment, sporting or educational establishment completing onboarding (the \"Centre\", \"you\") and Kribble, a brand, platform and technology service operated by Little Orbit Technologies Private Limited, a company proposed to be incorporated under the Companies Act, 2013 in India (\"Kribble\", \"we\", \"us\", \"Company\").",
  "This Acknowledgement is a preliminary, good faith record completed at the point of onboarding. It is not the definitive commercial contract between the parties. The full, legally binding terms will be set out in the Definitive Centre Agreement to be issued to the Centre after the Company's incorporation is completed. By completing onboarding and accepting this Acknowledgement, the Centre confirms it has read, understood and agrees to the matters set out below.",
  "For the purposes of this Acknowledgement:",
  "\"Platform\" means the Kribble website, mobile applications, Centre dashboard, CRM, and related technology systems and services.",
  "\"Definitive Centre Agreement\" means the detailed, legally binding agreement governing the commercial relationship, to be executed or accepted electronically following the Company's incorporation.",
  "\"Parent Data\" and \"Child Data\" have the meanings given in Part C.",
  "\"DPDP Act\" means the Digital Personal Data Protection Act, 2023 and any rules, regulations or notifications issued under it, as amended from time to time.",
  "\"Access Fee\" means the parent side platform access fee described in Part E.",
  "\"Settlement Balance\" means the Centre's prepaid commercial float described in Part F.",
  "Kribble Sourced Family\" means a parent, guardian, child or enrolment that was discovered, referred, introduced or facilitated through the Platform.",
];

/** The 30 numbered clauses. */
export const agreementSections = [
  {
    heading: "1. Entity and Pre-Incorporation Status",
    paragraphs: [
      "1.1. The Platform is operated under the \"Kribble\" brand by Little Orbit Technologies Private Limited, which is in the process of incorporation. All references to \"Kribble\" in this Acknowledgement refer to that entity and, until incorporation is complete, to its promoters acting on its behalf for the purpose of establishing the business.",
      "1.2. The Centre acknowledges that, as the Company is not yet fully incorporated, this Acknowledgement is preliminary and does not create binding commercial or financial obligations on either party. Upon incorporation, the Company may adopt, ratify and give effect to onboarding steps completed during this period, and the relationship will be governed by the Definitive Centre Agreement.",
      "1.3. Nothing in this Acknowledgement obliges either party to proceed to a Definitive Centre Agreement, and either party may decline to proceed prior to its execution, without liability, subject to applicable law.",
    ],
  },
  {
    heading: "2. Role of Kribble",
    paragraphs: [
      "2.1. Kribble operates solely as a technology, discovery, enablement and service facilitation layer. Kribble does not itself provide the childcare, educational, recreational, sporting, enrichment, daycare or activity services offered by the Centre, and does not employ, supervise or control the Centre's personnel, unless expressly agreed in writing.",
      "2.2. The Centre at all times remains the provider of its own services and remains solely responsible for their delivery, safety and quality, as further set out in Part G.",
    ],
  },
  {
    heading: "3. Electronic Acceptance",
    paragraphs: [
      "3.1. The Centre agrees that acceptance of this Acknowledgement by clicking \"I Acknowledge & Proceed\" (or equivalent), and any subsequent electronic acceptance of the Definitive Centre Agreement, constitutes a valid, binding and enforceable electronic record and signature under the Information Technology Act, 2000 and applicable law, to the extent such acceptance is intended to be binding.",
      "3.2. The Centre confirms that the individual completing onboarding is duly authorised to act on behalf of the Centre and to provide the information, permissions and confirmations recorded during onboarding.",
    ],
  },
  {
    heading: "4. Data Collected Through Online and Offline Channels",
    paragraphs: [
      "4.1. The Centre acknowledges that Kribble may collect, receive, access, store and process information through both digital and physical/offline interactions, including: directly through the Platform; through the Centre dashboard or CRM; through Centre administered forms; through onboarding conducted by Kribble personnel; through information entered by authorised Centre personnel into Kribble systems; through bookings, enrolments, walk-in or offline enrolments subsequently recorded on Kribble; through attendance, activity, payment or communication records; through photographs, videos or other content uploaded to the Platform; and through other lawful channels connected with the services.",
      "4.2. The fact that information is collected offline rather than directly through the Platform does not exclude it from Kribble's data protection, security, retention and processing framework once it is entered into, transferred to or otherwise processed through Kribble's systems.",
    ],
  },
  {
    heading: "5. Parent Data and Child Data",
    paragraphs: [
      "5.1. Parent Data may include, without limitation: parent/guardian name, mobile number, alternate contact number, email address, residential or other address, relationship to the child, emergency contact information, booking and enrolment information, transaction information, communication records, service preferences, and other information reasonably necessary for the relevant service.",
      "5.2. Child Data may include, without limitation: name; date of birth or age; gender where reasonably necessary; parent/guardian relationship; attendance; enrolment; activity participation; session and learning history; instructor observations; achievements; photographs and videos; emergency contact and authorised pickup information; and relevant health, allergy or emergency information where necessary.",
      "5.3. Parent Data and Child Data may originate from the parent/guardian directly, or from the Centre or its authorised personnel.",
    ],
  },
  {
    heading: "6. Children's Personal Data - DPDP Act Compliance (Critical)",
    paragraphs: [
      "6.1. The Centre expressly acknowledges that Child Data relates to individuals who are children under applicable law and is therefore subject to heightened protection under the DPDP Act.",
      "6.2. The Centre shall not enter, upload, transfer or record any Child Data on the Platform unless the Centre has first obtained verifiable consent of the child's parent or lawful guardian for such collection, disclosure to Kribble, and processing through the Platform for the purposes of providing, administering, securing and improving the services. The obligation to obtain and evidence such consent rests with the Centre.",
      "6.3. The Centre acknowledges that Kribble shall not undertake tracking, behavioural monitoring, or targeted advertising directed at children, consistent with the DPDP Act, and the Centre shall not request or expect Kribble to do so.",
      "6.4. The Centre shall promptly provide Kribble with reasonable assistance and evidence of parental/guardian consent upon request, and shall promptly notify Kribble if any consent is withdrawn, disputed or found to be invalid in respect of any Child Data it has supplied.",
      "6.5. Where the Centre fails to obtain or evidence a lawful basis or consent required by applicable law in respect of data it supplies, the Centre shall be responsible for the consequences of such failure, subject to the allocation of responsibilities in the Definitive Centre Agreement and applicable law.",
    ],
  },
  {
    heading: "7. Allocation of Data Roles",
    paragraphs: [
      "7.1. The parties acknowledge that their respective roles and responsibilities as data fiduciary, data processor, or joint participants (as those or equivalent concepts apply under the DPDP Act) in respect of different categories and flows of personal data will be defined in the Definitive Centre Agreement. Pending that agreement, each party shall handle personal data in accordance with applicable law.",
    ],
  },
  {
    heading: "8. Responsibility for Centre Supplied Data",
    paragraphs: [
      "8.1. The Centre is responsible for the accuracy, lawfulness and authority of information it directly supplies or enters into Kribble's systems.",
      "8.2. The Centre shall not knowingly enter: false information; unauthorised personal information; unnecessary sensitive information; information relating to a person without appropriate authority where legally required; or information the Centre knows to have been unlawfully obtained.",
      "8.3. The Centre shall reasonably cooperate with Kribble where an individual requests access, correction, deletion, or other action concerning information originally supplied by the Centre.",
    ],
  },
  {
    heading: "9. Student ID and Continuous Record",
    paragraphs: [
      "9.1. The Centre acknowledges that Kribble may create and maintain a unique, persistent student identifier (\"Student ID\") for each child recorded on the Platform, together with an associated record of the child's enrolment, stage progression, attendance and activity within the Kribble ecosystem, for the purposes of providing continuity of service, safety, personalisation, and the features of the Platform.",
      "9.2. The Student ID and associated Platform records, systems, software and databases are and remain the property of Kribble, subject to the data protection rights of the underlying individuals and applicable law. The Centre obtains no ownership of the Platform or its records by virtue of using the Platform.",
    ],
  },
  {
    heading: "10. Fees, Commission and Access Fee (Disclosure)",
    paragraphs: [
      "10.1. The Centre acknowledges and understands that the Platform operates on a commercial model that will be detailed in the Definitive Centre Agreement, and that this model is expected to include one or more of the following, so that the Centre is not taken by surprise:",
      "(a) a parent side Access Fee (currently intended to be a fixed monthly amount per child) payable by the parent/guardian for access to the Platform's parent facing features, which may be added to the Centre's invoice and collected together with the Centre's own fees;",
      "(b) an enrolment commission payable to Kribble in respect of Kribble Sourced Families;",
      "(c) charges for optional or value added services such as verification badges, featured placement, camera/CCTV access, corporate tie-ups, and activity or camp facilitation; and",
      "(d) applicable payment processing charges, which may be borne as set out in the Definitive Centre Agreement.",
      "10.2. The Centre acknowledges that the Access Fee is Kribble's charge to the parent/guardian, and that the Centre's own tuition, daycare or service fees are set and retained by the Centre save for amounts properly payable to Kribble under the Definitive Centre Agreement.",
      "10.3. Final commercial figures, rates and mechanics are not fixed by this Acknowledgement and will be confirmed in the Definitive Centre Agreement. Nothing here obliges the Centre to any particular fee or commission until that agreement is accepted.",
      "10.4. Payment-Gateway Charges Borne by the Centre. The Centre acknowledges that payment-processing/payment-gateway charges (currently approximately 2% per transaction, as levied by the applicable payment provider) on payments routed through the Platform shall be borne by the Centre, and that Kribble may deduct or account for such charges as set out in the Definitive Centre Agreement.",
      "10.5. Optional Services Are Opt-In; Centre Bears Cost Only If Chosen. The Centre acknowledges that advertising, featured placement, and the verification badge are entirely optional and opt-in. The Centre is under no obligation to purchase any of them, and will bear the associated charges only if it chooses to opt in, as set out in the Definitive Centre Agreement. In respect of CCTV/camera access, the Centre may provide such access to parents free of charge if it wishes, and separately has the right but not the obligation to charge parents for such access at its own discretion; where the Centre provides or arranges CCTV access itself, Kribble charges no commission on it. No optional or value-added service is mandatory, and the Centre bears the cost of only those services it elects to take.",
    ],
  },
  {
    heading: "11. Prepaid Settlement Balance (\"Wallet\")",
    paragraphs: [
      "11.1. The Centre acknowledges that, to enable collection of amounts payable to Kribble (including the Access Fee) on transactions the Centre settles in cash or offline, Kribble may operate a prepaid Settlement Balance within the Centre dashboard.",
      "11.2. The Centre acknowledges and agrees that the Settlement Balance:",
      "(a) is funded with the Centre's own money, pre-loaded by the Centre;",
      "(b) is a closed loop commercial settlement facility used solely to settle amounts owed by the Centre to Kribble, and is not a payment instrument issued to consumers, does not store parent or third-party money, and cannot be used to make payments to third parties, transfer funds, or withdraw cash;",
      "(c) when the Centre marks an invoice as paid in cash, the corresponding Access Fee (and any other amount properly due to Kribble) may be automatically deducted from the Settlement Balance; and",
      "(d) may be permitted to run to a small negative balance up to a defined threshold, after which the Centre's dashboard functions may be suspended until the Centre restores the Settlement Balance to good standing.",
      "11.3. The Centre authorises Kribble to make the deductions described above. The precise threshold, top-up mechanics and operation of the Settlement Balance will be set out in the Definitive Centre Agreement.",
    ],
  },
  {
    heading: "12. Payment Collection and Deductions",
    paragraphs: [
      "12.1. Where Kribble facilitates payment for the Centre's services through an integrated payment provider, payment processing, settlement, refunds, reversals and disputes may be subject to that provider's terms and to applicable law.",
      "12.2. Kribble may deduct applicable commissions, fees, the Access Fee, refunds, reversals, taxes, chargebacks and other amounts properly payable or recoverable under the Definitive Centre Agreement before settling the balance to the Centre.",
    ],
  },
  {
    heading: "13. Settlement Cycle",
    paragraphs: [
      "13.1. Subject to the payment provider's process, the intended standard settlement cycle is: eligible payments received Monday to Sunday are ordinarily released to the Centre, net of permitted deductions, on the following Tuesday.",
      "13.2. The Centre acknowledges that the actual settlement date may vary where a payment is delayed, disputed, reversed, held, under investigation, affected by a bank holiday, or subject to circumstances outside Kribble's reasonable control.",
    ],
  },
  {
    heading: "14. Settlement Holds and Adjustments",
    paragraphs: [
      "14.1. Kribble may, subject to applicable law and the Definitive Centre Agreement, delay, hold, adjust or offset a settlement where reasonably necessary due to: a pending refund; payment reversal; chargeback or dispute; suspected fraud or unauthorised transaction; unresolved parent complaint; service non-delivery; material service dispute; safety incident; inaccurate Centre information; legal or regulatory requirements; payment provider requirements; or amounts otherwise recoverable from the Centre.",
      "14.2. A settlement shown as \"pending\" does not necessarily mean Kribble has permanently withheld funds.",
    ],
  },
  {
    heading: "15. Refunds and Recovery Rights",
    paragraphs: [
      "15.1. Where a parent/guardian has paid through Kribble and a qualifying Centre side issue results in a refund being due, Kribble may process or facilitate the refund.",
      "15.2. Where a refund arises from the Centre's failure to deliver the contracted or represented service, Kribble may recover the amount from the Centre by deducting it from an upcoming settlement, adjusting the Centre's account or Settlement Balance, offsetting it against amounts payable, or seeking reimbursement - subject to the Definitive Centre Agreement and applicable law.",
    ],
  },
  {
    heading: "16. Centre Service Responsibility",
    paragraphs: [
      "16.1. The Centre remains solely responsible for the actual delivery of its services, including: supervision; safety; premises; equipment; instructors and staff; service quality; representations made about the service; adherence to the booked schedule; delivery of the booked service; applicable professional standards; applicable licences and registrations; health and safety requirements; and compliance with applicable law.",
    ],
  },
  {
    heading: "17. Centre Side Service Failure",
    paragraphs: [
      "17.1. Where a Centre fails to provide a booked or paid service - including failure to provide the service, material deviation from what was represented, cancellation without an appropriate alternative or refund, material deficiency, unauthorised charges, misrepresentation, or serious safety or quality concerns - Kribble may investigate and take appropriate action, including cancelling the booking, suspending the Centre, withholding or adjusting settlement, initiating or processing a refund to the parent/guardian where permitted, or recovering amounts from the Centre.",
    ],
  },
  {
    heading: "18. Safety Incidents and Serious Events",
    paragraphs: [
      "18.1. The Centre is responsible for maintaining appropriate safety standards for its premises, activities, equipment, personnel and services.",
      "18.2. If a serious incident involving a child occurs at or in connection with the Centre's service, the Centre shall: take immediate steps to protect the child and others; contact emergency services or authorities where required; promptly notify the parent/guardian; promptly notify Kribble where the incident relates to a service booked, managed or facilitated through the Platform; preserve relevant records and evidence; cooperate with any lawful investigation; and provide Kribble with information reasonably required for incident management, support, legal compliance or dispute resolution.",
      "18.3. Nothing in this Acknowledgement excludes liability that cannot lawfully be excluded.",
    ],
  },
  {
    heading: "19. Parent Disputes",
    paragraphs: [
      "19.1. Parents/guardians may raise service related complaints through Kribble where the relevant transaction or service was facilitated through the Platform. Kribble may request information from the Centre and the parent/guardian to investigate, and the Centre agrees to reasonably cooperate. Where the dispute relates primarily to the Centre's delivery of its service, the Centre remains responsible for providing relevant records, explanations and supporting information.",
    ],
  },
  {
    heading: "20. Kribble's Role and Limitation of Responsibility",
    paragraphs: [
      "20.1. Kribble does not guarantee that any Centre will provide a particular level of service, outcome, result or experience.",
      "20.2. Except to the extent expressly assumed by Kribble in writing or required by applicable law, Kribble is not responsible for the independent acts, omissions, negligence, misconduct, representations, service quality, premises, equipment, personnel or operations of a Centre. The Centre remains responsible for the actual service delivered to the child.",
      "20.3. Any limitation, exclusion, indemnity or allocation of liability applicable to Kribble will be expressly set out in the Definitive Centre Agreement and subject to applicable law. Nothing here excludes or limits liability that cannot lawfully be excluded or limited.",
    ],
  },
  {
    heading: "21. Anti Circumvention (Non Bypass)",
    paragraphs: [
      "21.1. The Centre acknowledges that Kribble invests in discovering and introducing families to the Centre. Accordingly, in respect of Kribble Sourced Families, the Centre agrees, in good faith, not to deliberately route, record or divert such families through offline or non Platform channels for the purpose of avoiding amounts properly payable to Kribble, and not to solicit or induce parents to transact outside the Platform in order to circumvent the Platform's fees or Access Fee. The detailed and enforceable terms of this obligation will be set out in the Definitive Centre Agreement.",
    ],
  },
  {
    heading: "22. Intellectual Property",
    paragraphs: [
      "22.1. The Platform, the Kribble brand, the Student ID system, software, databases, designs, and all associated intellectual property are and remain the exclusive property of Little Orbit Technologies Private Limited and its licensors. The Centre is granted only a limited, non-exclusive, non-transferable, revocable right to access and use the Platform for onboarding and, subsequently, as permitted under the Definitive Centre Agreement. The Centre shall not copy, reverse-engineer, resell, or create derivative works from the Platform.",
    ],
  },
  {
    heading: "23. Confidentiality",
    paragraphs: [
      "23.1. Each party shall keep confidential any non-public commercial, technical or business information disclosed by the other in connection with the Platform, and shall use it only for the purposes of the relationship, save where disclosure is required by law or to professional advisors under confidentiality. This does not restrict either party's use of its own information or information lawfully in the public domain.",
    ],
  },
  {
    heading: "24. Taxes",
    paragraphs: [
      "24.1. Each party is responsible for taxes, levies, duties and statutory obligations applicable to it. Where Kribble is required by law to deduct or withhold any amount, it may do so.",
    ],
  },
  {
    heading: "25. Payment Provider Terms",
    paragraphs: [
      "25.1. Where payments are processed through a third-party payment provider, certain aspects of processing, refunds, reversals, disputes and settlement may be governed by that provider's terms. Kribble may change the payment provider or infrastructure where reasonably necessary.",
    ],
  },
  {
    heading: "26. Suspension",
    paragraphs: [
      "26.1. Kribble may suspend or limit a Centre's access to the Platform where reasonably necessary due to non-payment, a negative Settlement Balance beyond the permitted threshold, suspected fraud, a serious safety concern, a material breach, or a legal or regulatory requirement, subject to the Definitive Centre Agreement and applicable law.",
    ],
  },
  {
    heading: "27. Governing Law and Jurisdiction",
    paragraphs: [
      "27.1. This Acknowledgement and the relationship between the parties shall be governed by the laws of India, and the courts at [New Delhi / Gurugram, Haryana - to be confirmed] shall have jurisdiction, subject to any dispute resolution mechanism specified in the Definitive Centre Agreement.",
    ],
  },
  {
    heading: "28. Force Majeure",
    paragraphs: [
      "28.1. Neither party shall be liable for delay or failure in performance caused by events beyond its reasonable control, including acts of God, natural disasters, epidemics or pandemics, government action, strikes, failure of utilities, telecommunications or payment infrastructure, or internet outages.",
    ],
  },
  {
    heading: "29. Notices",
    paragraphs: [
      "29.1. Kribble may send notices, the Definitive Centre Agreement, and related communications to the Centre's registered email address and registered mobile number provided during onboarding. The Centre is responsible for keeping these current.",
    ],
  },
  {
    heading: "30. Definitive Agreement (Supersession)",
    paragraphs: [
      "30.1. The detailed rules governing refunds, cancellation, chargebacks, settlement, payment holds, Centre liability, indemnification, service failures, safety incidents, parent disputes, insurance, limitation of liability, commissions, the Access Fee, the Settlement Balance, data protection roles, taxes, termination and recovery of amounts will be set out in the Definitive Centre Agreement, expected to be issued to the Centre within 5 to 8 working days of onboarding, following the Company's incorporation.",
      "30.2. Where the Definitive Centre Agreement addresses a matter covered generally by this Acknowledgement, the Definitive Centre Agreement shall prevail.",
    ],
  },
];

/** The closing 'By clicking I Acknowledge & Proceed' summary. */
export const acknowledgementLead = "By clicking \"I Acknowledge & Proceed\", the authorised representative of the Centre confirms that it has read, understood and agrees that:";

export const acknowledgementPoints = [
  "The Platform is operated under the \"Kribble\" brand by Little Orbit Technologies Private Limited (under incorporation), and this Acknowledgement is preliminary and will be superseded by the Definitive Centre Agreement;",
  "Parent Data and Child Data may be collected both online and offline, including data entered by authorised Centre personnel into the CRM or dashboard;",
  "Child Data is subject to heightened protection, and the Centre must have obtained verifiable parental/guardian consent before entering any Child Data on the Platform;",
  "The Centre remains responsible for the lawfulness and accuracy of the information it supplies, and for the services it delivers to children;",
  "The Platform operates a commercial model - including a parent side Access Fee, commission on Kribble Sourced Families, and optional paid services - the final terms of which will be set out in the Definitive Centre Agreement;",
  "On cash/offline payments, amounts due to Kribble (including the Access Fee) may be deducted from the Centre's prepaid Settlement Balance, which holds the Centre's own funds and may run to a small negative threshold before dashboard suspension;",
  "Payments follow a Monday to Sunday settlement cycle with ordinary settlement on the following Tuesday, subject to permitted deductions, holds and adjustments;",
  "The Centre will not deliberately bypass the Platform to avoid amounts properly payable to Kribble in respect of Kribble Sourced Families;",
  "Kribble is a technology and enablement layer and is not responsible for the independent acts, omissions, service quality or operations of the Centre, except as expressly agreed or required by applicable law;",
  "No provision of this Acknowledgement excludes or limits liability that cannot legally be excluded or limited; and",
  "The Definitive Centre Agreement will contain the final and legally binding provisions governing the relationship.",
];

export const agreementDisclaimer = "This is a preliminary onboarding acknowledgement, not the definitive commercial contract. It has been prepared as a business document and does not constitute legal advice. Before the Definitive Centre Agreement is issued for signature, it should be reviewed by a qualified Indian lawyer, particularly the provisions concerning children's data (DPDP Act), payments and the Settlement Balance, and limitation of liability.";
