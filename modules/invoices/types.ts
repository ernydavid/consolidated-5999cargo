export type InvoiceUploadState =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
      summary: {
        created: number;
        duplicates: string[];
        rejected: Array<{
          filename: string;
          reason: string;
        }>;
      };
    };

export type PreparedInvoiceFile = {
  filename: string;
  mimeType: string;
  source: "manual_upload" | "zip_upload";
  buffer: Buffer;
};
