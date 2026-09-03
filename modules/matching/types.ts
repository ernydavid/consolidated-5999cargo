export type InvoiceMatchStatus =
  | "auto_matched"
  | "suggested"
  | "ambiguous"
  | "unmatched"
  | "duplicate"
  | "manual_matched";

export type InvoiceFilenameSignals = {
  normalizedFilename: string;
  detectedEmails: string[];
  detectedLast4: string[];
  matchedTrackingNumbers: string[];
};

export type InvoiceMatchReason = {
  code:
    | "exact_tracking"
    | "last4_with_customer"
    | "filename_last4"
    | "customer_email"
    | "customer_name_exact"
    | "customer_name_partial"
    | "conflicting_email"
    | "conflicting_tracking"
    | "conflicting_customer_name";
  label: string;
  score: number;
};

export type InvoiceMatchCandidate = {
  packageId: string;
  score: number;
  reasons: InvoiceMatchReason[];
  flags: {
    exactTracking: boolean;
    emailMatch: boolean;
    exactNameMatch: boolean;
    partialNameMatch: boolean;
    last4Match: boolean;
    duplicatedLast4: boolean;
  };
};

export type InvoiceMatchEvaluation = {
  status: InvoiceMatchStatus;
  candidates: InvoiceMatchCandidate[];
  signals: InvoiceFilenameSignals;
};
