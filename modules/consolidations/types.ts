export type ConsolidationPreviewFormValues = {
  reference: string;
  carrier: string;
  flightDate: string;
  originalFilename: string;
};

export type ConsolidationPreviewRow = {
  sourceRowNumber: number;
  warehouseReference: string | null;
  trackingNumber: string;
  trackingLast4: string;
  customerNameRaw: string;
  customerNameNormalized: string;
  customerEmail: string | null;
  descriptionRaw: string | null;
  weightLb: string;
  dimensionsRaw: string | null;
};

export type ConsolidationInvalidRow = {
  sourceRowNumber: number;
  reasons: string[];
  preview: {
    warehouseReference: string | null;
    trackingNumber: string | null;
    customerNameRaw: string | null;
    customerEmail: string | null;
    descriptionRaw: string | null;
    weightLb: string | null;
    dimensionsRaw: string | null;
  };
};

export type DuplicateTrackingGroup = {
  trackingNumber: string;
  rowNumbers: number[];
};

export type ConsolidationCustomerSummary = {
  key: string;
  label: string;
  email: string | null;
  packageCount: number;
  totalWeightLb: string;
};

export type ConsolidationImportPreview = {
  token: string;
  form: ConsolidationPreviewFormValues;
  validRows: ConsolidationPreviewRow[];
  invalidRows: ConsolidationInvalidRow[];
  duplicateTrackingNumbers: DuplicateTrackingGroup[];
  customerSummaries: ConsolidationCustomerSummary[];
  totals: {
    packageCount: number;
    customerCount: number;
    totalWeightLb: string;
    invalidRowCount: number;
    duplicateTrackingCount: number;
  };
};

export type StoredConsolidationImportPreview = ConsolidationImportPreview & {
  organizationId: string;
  actorUserId: string;
  workbookTempPath: string;
  createdAt: string;
};
