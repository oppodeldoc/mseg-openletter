// Role labels shown in the signature form, in display order. Stored as-is in the
// signatures.occupation column. No free text: the API rejects anything else
// (keep api/config/roles.js in sync).
export const ROLES = [
  'Parent/Guardian',
  'Student',
  'Teacher',
  'Staff',
  'Principal/Administrator',
  'School Board Director',
  'Community Member',
  'Labor Leader',
  'City Official',
  'Other',
];
