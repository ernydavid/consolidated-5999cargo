CREATE TABLE "invoice_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"consolidation_id" text NOT NULL,
	"customer_id" text,
	"purchase_id" text,
	"source" text NOT NULL,
	"original_filename" text NOT NULL,
	"blob_path" text NOT NULL,
	"mime_type" text NOT NULL,
	"sha256" text NOT NULL,
	"vendor_name" text,
	"vendor_order_number" text,
	"invoice_number" text,
	"invoice_date" text,
	"subtotal_usd" numeric(12, 4),
	"sales_tax_usd" numeric(12, 4),
	"shipping_usd" numeric(12, 4),
	"grand_total_usd" numeric(12, 4),
	"currency" text,
	"extraction_status" text DEFAULT 'queued' NOT NULL,
	"matching_status" text DEFAULT 'queued' NOT NULL,
	"extracted_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_document_id" text NOT NULL,
	"line_number" text,
	"description_raw" text NOT NULL,
	"description_normalized" text,
	"quantity" numeric(12, 4),
	"unit_price_usd" numeric(12, 4),
	"line_total_usd" numeric(12, 4),
	"brand" text,
	"model" text,
	"material" text,
	"intended_use" text,
	"country_of_origin" text,
	"extracted_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_consolidation_id_consolidations_id_fk" FOREIGN KEY ("consolidation_id") REFERENCES "public"."consolidations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_document_id_invoice_documents_id_fk" FOREIGN KEY ("invoice_document_id") REFERENCES "public"."invoice_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_documents_org_sha256_unique" ON "invoice_documents" USING btree ("organization_id","sha256");--> statement-breakpoint
CREATE INDEX "invoice_documents_organization_id_idx" ON "invoice_documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_documents_consolidation_id_idx" ON "invoice_documents" USING btree ("consolidation_id");--> statement-breakpoint
CREATE INDEX "invoice_documents_extraction_status_idx" ON "invoice_documents" USING btree ("extraction_status");--> statement-breakpoint
CREATE INDEX "invoice_items_invoice_document_id_idx" ON "invoice_items" USING btree ("invoice_document_id");