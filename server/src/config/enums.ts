export const Scope = { ALL: 0, DEPARTMENT: 1, YEAR_LEVEL: 2, SECTION: 3 } as const;
export const ClearanceStatus = { PENDING: 0, IN_PROGRESS: 1, CLEARED: 2, REJECTED: 3 } as const;
export const ClearanceVerifStatus = { PENDING: 0, SIGNED: 1, REJECTED: 2 } as const;
export const NotifType = {
    OBLIGATION_ASSIGNED:  1,
    PAYMENT_SUBMITTED:    2,
    PAYMENT_APPROVED:     3,
    PAYMENT_REJECTED:     4,
    PAYMENT_RETURNED:     5,
    CLEARANCE_SIGNED:     6,
    CLEARANCE_CLEARED:    7,
    CLEARANCE_UNAPPROVED: 8,
    ACCOUNT_STATUS:       9,
} as const;
export const PaymentType = { GCASH: 1, CASH: 2 } as const;
export const PaymentStatus = { PENDING: 0, APPROVED: 1, REJECTED: 2 } as const;
export const VerifStatus = { PENDING: 0, APPROVED: 1, REJECTED: 2, RETURNED: 3 } as const;
export const ObligStatus = { UNPAID: 0, PENDING_VERIFICATION: 1, PAID: 2, WAIVED: 3 } as const;
export const Semester = { FIRST: 1, SECOND: 2, SUMMER: 3 } as const;
export const Gender = { MALE: 1, FEMALE: 2, OTHER: 3 } as const;
