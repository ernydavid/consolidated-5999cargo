CREATE TABLE "invoice_package_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_document_id" text NOT NULL,
	"package_id" text NOT NULL,
	"score" integer NOT NULL,
	"match_status" text NOT NULL,
	"match_method" text NOT NULL,
	"reasons_json" jsonb NOT NULL,
	"selected_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_package_matches" ADD CONSTRAINT "invoice_package_matches_invoice_document_id_invoice_documents_id_fk" FOREIGN KEY ("invoice_document_id") REFERENCES "public"."invoice_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_package_matches" ADD CONSTRAINT "invoice_package_matches_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_package_matches" ADD CONSTRAINT "invoice_package_matches_selected_by_user_id_users_id_fk" FOREIGN KEY ("selected_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_package_matches_invoice_package_unique" ON "invoice_package_matches" USING btree ("invoice_document_id","package_id");--> statement-breakpoint
CREATE INDEX "invoice_package_matches_invoice_document_id_idx" ON "invoice_package_matches" USING btree ("invoice_document_id");--> statement-breakpoint
CREATE INDEX "invoice_package_matches_package_id_idx" ON "invoice_package_matches" USING btree ("package_id");--> statement-breakpoint
CREATE INDEX "invoice_package_matches_status_idx" ON "invoice_package_matches" USING btree ("match_status");