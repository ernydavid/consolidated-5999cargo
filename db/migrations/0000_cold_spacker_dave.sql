CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"organization_id" text,
	"role" text DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"timezone" text DEFAULT 'America/Curacao' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"freight_rate_usd_per_lb" numeric(12, 4) NOT NULL,
	"usd_to_xcg_rate" numeric(12, 4) NOT NULL,
	"admin_cost_xcg" numeric(12, 4) NOT NULL,
	"tax_rate" numeric(12, 6) NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consolidations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"reference" text NOT NULL,
	"carrier" text,
	"flight_date" timestamp with time zone,
	"status" text DEFAULT 'draft' NOT NULL,
	"source_workbook_blob_path" text,
	"export_workbook_blob_path" text,
	"settings_snapshot_json" jsonb,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" text PRIMARY KEY NOT NULL,
	"consolidation_id" text NOT NULL,
	"source_row_number" integer NOT NULL,
	"warehouse_reference" text,
	"tracking_number" text NOT NULL,
	"tracking_last4" text,
	"customer_name_raw" text NOT NULL,
	"customer_name_normalized" text NOT NULL,
	"customer_email" text,
	"description_raw" text,
	"weight_lb" numeric(12, 4) NOT NULL,
	"dimensions_raw" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_charges" (
	"id" text PRIMARY KEY NOT NULL,
	"consolidation_id" text NOT NULL,
	"customer_id" text,
	"customer_name_snapshot" text NOT NULL,
	"package_count" numeric(12, 0) NOT NULL,
	"total_weight_lb" numeric(12, 4) NOT NULL,
	"freight_rate_usd_per_lb" numeric(12, 4) NOT NULL,
	"freight_usd" numeric(12, 4) NOT NULL,
	"usd_to_xcg_rate" numeric(12, 4) NOT NULL,
	"freight_xcg" numeric(12, 4) NOT NULL,
	"invoice_value_usd" numeric(12, 4) NOT NULL,
	"duty_usd" numeric(12, 4) NOT NULL,
	"duties_xcg" numeric(12, 4) NOT NULL,
	"admin_cost_xcg" numeric(12, 4) NOT NULL,
	"subtotal_xcg" numeric(12, 4) NOT NULL,
	"tax_rate" numeric(12, 6) NOT NULL,
	"tax_xcg" numeric(12, 4) NOT NULL,
	"final_price_xcg" numeric(12, 4) NOT NULL,
	"calculation_status" text DEFAULT 'pending' NOT NULL,
	"calculation_breakdown_json" jsonb,
	"calculated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"actor_user_id" text,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"before_json" jsonb,
	"after_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consolidations" ADD CONSTRAINT "consolidations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consolidations" ADD CONSTRAINT "consolidations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_consolidation_id_consolidations_id_fk" FOREIGN KEY ("consolidation_id") REFERENCES "public"."consolidations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_charges" ADD CONSTRAINT "customer_charges_consolidation_id_consolidations_id_fk" FOREIGN KEY ("consolidation_id") REFERENCES "public"."consolidations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_charges" ADD CONSTRAINT "customer_charges_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_unique" ON "accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_unique" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_organization_id_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "app_settings_organization_id_idx" ON "app_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "consolidations_organization_id_idx" ON "consolidations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "consolidations_status_idx" ON "consolidations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "packages_consolidation_id_idx" ON "packages" USING btree ("consolidation_id");--> statement-breakpoint
CREATE INDEX "packages_tracking_number_idx" ON "packages" USING btree ("tracking_number");--> statement-breakpoint
CREATE INDEX "customer_charges_consolidation_id_idx" ON "customer_charges" USING btree ("consolidation_id");