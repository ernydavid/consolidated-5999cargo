5999Cargo Customs App — Implementation Plan

1. Application objective

Build an internal application that can:

Upload a consolidado Excel file.
Import customers, tracking numbers, package weights and descriptions.
Combine package weights belonging to the same customer.
Upload invoice PDFs individually or through ZIP files.
Match invoices with packages and customers.
Handle one purchase split into several packages or several consolidados.
Extract invoice values and products.
Assign Curaçao HS codes and import-duty rates.
Calculate all customer charges.
Export a completed Excel workbook. 2. Current calculation rules

Store these in database settings. Do not hard-code them inside components.

Freight USD = Total weight in pounds × 3.80

Freight XCG = Freight USD × 1.82

Duty USD = Invoice value USD × Duty rate

Duties XCG = Duty USD × 1.82

Administrative cost = XCG 8.95

Subtotal XCG =
Freight XCG + Duties XCG + Administrative cost

Tax XCG = Subtotal XCG × 6%

Final price XCG =
Subtotal XCG + Tax XCG

For the initial version:

Invoice value includes U.S. sales tax.

The application should save the rates used for each consolidado, so historical calculations do not change when rates are updated later.

3. Recommended stack
   Front end and server
   Next.js App Router
   TypeScript strict mode
   Tailwind CSS
   Radix UI primitives
   React Server Components by default
   Server Actions for internal form mutations
   Route Handlers for uploads, exports and integrations
   Zod for validation
   Database
   Supabase PostgreSQL
   Drizzle ORM
   Drizzle Kit migrations
   `postgres` driver for Node runtime connections

Use Supabase as the default database and authentication provider.

Recommended connection strategy:

- `DATABASE_URL` for application runtime queries, preferably using the Supabase session pooler.
- `DATABASE_MIGRATION_URL` for migrations and seed/admin scripts, preferably using the direct Postgres connection.

Keep Supabase secret keys server-only. Never expose them in browser bundles.

Files
Vercel Blob for the first version
ExcelJS for reading and generating Excel files
JSZip for invoice ZIP uploads
PDF text parser for text-based PDFs
AI document extraction provider for scanned or image-based invoices
SHA-256 hashes for duplicate detection
Authentication
Supabase Auth

Initial roles:

super_admin
customs_admin
customs_agent
viewer 4. Create the project

Give Codex this setup command:

pnpm create next-app@latest 5999-customs \
 --typescript \
 --tailwind \
 --eslint \
 --app \
 --src-dir \
 --import-alias "@/\*"

Then install the base dependencies:

cd 5999-customs

pnpm add \
 drizzle-orm \
 postgres \
 @supabase/supabase-js \
 @supabase/ssr \
 zod \
 decimal.js \
 exceljs \
 jszip \
 @vercel/blob \
 date-fns \
 lucide-react \
 @radix-ui/react-dialog \
 @radix-ui/react-dropdown-menu \
 @radix-ui/react-tabs \
 @radix-ui/react-tooltip

pnpm add -D \
 drizzle-kit \
 tsx

Do not install large PDF or AI packages until the basic upload workflow works.

5. Environment variables

Create .env.example:

DATABASE_URL=
DATABASE_MIGRATION_URL=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=

BLOB_READ_WRITE_TOKEN=

AI_PROVIDER=
AI_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

DEFAULT_FREIGHT_RATE_USD=3.80
DEFAULT_USD_XCG_RATE=1.82
DEFAULT_ADMIN_COST_XCG=8.95
DEFAULT_TAX_RATE=0.06

Create a Zod-based environment validator:

src/lib/env.ts

The application must fail during startup when required variables are missing.

6. Proposed folder structure
   src/
   ├── app/
   │ ├── (auth)/
   │ │ └── login/
   │ │ └── page.tsx
   │ │
   │ ├── (dashboard)/
   │ │ ├── layout.tsx
   │ │ ├── page.tsx
   │ │ │
   │ │ └── customs/
   │ │ ├── page.tsx
   │ │ │
   │ │ ├── consolidados/
   │ │ │ ├── page.tsx
   │ │ │ ├── new/
   │ │ │ │ └── page.tsx
   │ │ │ └── [consolidationId]/
   │ │ │ ├── page.tsx
   │ │ │ ├── packages/
   │ │ │ │ └── page.tsx
   │ │ │ ├── invoices/
   │ │ │ │ └── page.tsx
   │ │ │ ├── matching/
   │ │ │ │ └── page.tsx
   │ │ │ ├── classifications/
   │ │ │ │ └── page.tsx
   │ │ │ └── export/
   │ │ │ └── page.tsx
   │ │ │
   │ │ ├── tariffs/
   │ │ │ ├── page.tsx
   │ │ │ └── import/
   │ │ │ └── page.tsx
   │ │ │
   │ │ ├── product-library/
   │ │ │ └── page.tsx
   │ │ │
   │ │ └── settings/
   │ │ └── page.tsx
   │ │
   │ ├── api/
   │ │ ├── uploads/
   │ │ ├── exports/
   │ │ ├── jobs/
   │ │ └── gmail/
   │ │
   │ ├── layout.tsx
   │ └── globals.css
   │
   ├── components/
   │ ├── customs/
   │ ├── documents/
   │ ├── forms/
   │ ├── tables/
   │ └── ui/
   │
   ├── db/
   │ ├── index.ts
   │ ├── schema/
   │ │ ├── auth.ts
   │ │ ├── organizations.ts
   │ │ ├── settings.ts
   │ │ ├── consolidations.ts
   │ │ ├── packages.ts
   │ │ ├── customers.ts
   │ │ ├── invoices.ts
   │ │ ├── purchases.ts
   │ │ ├── tariffs.ts
   │ │ ├── classifications.ts
   │ │ ├── charges.ts
   │ │ └── audit.ts
   │ └── migrations/
   │
   ├── modules/
   │ ├── consolidations/
   │ │ ├── actions.ts
   │ │ ├── queries.ts
   │ │ ├── service.ts
   │ │ ├── schemas.ts
   │ │ └── types.ts
   │ │
   │ ├── invoices/
   │ ├── invoice-extraction/
   │ ├── matching/
   │ ├── tariffs/
   │ ├── classifications/
   │ ├── calculations/
   │ ├── exports/
   │ └── gmail/
   │
   ├── jobs/
   │ ├── import-consolidation.ts
   │ ├── extract-invoice.ts
   │ ├── match-invoice.ts
   │ ├── calculate-charges.ts
   │ └── generate-export.ts
   │
   └── lib/
   ├── env.ts
   ├── money.ts
   ├── normalization.ts
   ├── hashing.ts
   ├── permissions.ts
   └── errors.ts

Business rules must live inside modules, not inside pages or React components.

7. Database design
   organizations
   id
   name
   timezone
   createdAt
   updatedAt
   users
   id
   organizationId
   name
   email
   role
   createdAt
   updatedAt
   app_settings
   id
   organizationId
   freightRateUsdPerLb
   usdToXcgRate
   adminCostXcg
   taxRate
   effectiveFrom
   effectiveTo
   createdBy
   createdAt

Use decimal database columns for rates and money.

consolidations
id
organizationId
reference
carrier
flightDate
status
sourceWorkbookBlobPath
exportWorkbookBlobPath
settingsSnapshotJson
createdBy
createdAt
updatedAt

Suggested statuses:

draft
importing
invoice_matching
classification_review
ready
exported
closed
failed
packages

One record per original consolidado row.

id
consolidationId
sourceRowNumber
warehouseReference
trackingNumber
trackingLast4
customerNameRaw
customerNameNormalized
customerEmail
descriptionRaw
weightLb
dimensionsRaw
createdAt
updatedAt

Do not replace package rows with merged customer rows. Preserve the original source data.

customers
id
organizationId
name
normalizedName
email
createdAt
updatedAt
invoice_documents
id
organizationId
customerId nullable
purchaseId nullable
source
originalFilename
blobPath
mimeType
sha256
vendorName
vendorOrderNumber
invoiceNumber
invoiceDate
subtotalUsd
salesTaxUsd
shippingUsd
grandTotalUsd
currency
extractionStatus
matchingStatus
extractedJson
createdAt
updatedAt

Place a unique index on:

organizationId + sha256

This prevents uploading the same invoice several times.

invoice_items
id
invoiceDocumentId
lineNumber
descriptionRaw
descriptionNormalized
quantity
unitPriceUsd
lineTotalUsd
brand
model
material
intendedUse
countryOfOrigin
extractedJson
createdAt
updatedAt
purchases

This table solves the split-order problem.

id
customerId
vendorName
vendorOrderNumber
invoiceTotalUsd
invoiceIncludesSalesTax
purchaseDate
status
createdAt
updatedAt

Purchase statuses:

open
partially_received
complete
review
purchase_packages

Links one purchase to several packages, including packages on different consolidados.

id
purchaseId
packageId
allocationMethod
allocatedInvoiceValueUsd
createdAt
updatedAt

Allocation methods:

item_value
vendor_package_value
manual_value
weight
tariff_versions
id
name
sourceBlobPath
effectiveFrom
effectiveTo
isActive
createdAt
tariff_codes
id
tariffVersionId
code8
hs6
chapter
descriptionNl
descriptionEn
importDutyRate
additionalChargeType
additionalChargeValue
exciseType
exciseValue
sourcePage
createdAt
invoice_item_classifications
id
invoiceItemId
tariffCodeId
suggestedBy
confidence
status
reviewedBy
reviewedAt
notes
createdAt
updatedAt

Classification statuses:

pending
approved
rejected
product_classifications

Reusable internal product library.

id
organizationId
normalizedProductKey
brand
model
descriptionPattern
tariffCodeId
confidence
status
verifiedBy
verifiedAt
notes
createdAt
updatedAt
customer_charges
id
consolidationId
customerId nullable
customerNameSnapshot

packageCount
totalWeightLb

freightRateUsdPerLb
freightUsd

usdToXcgRate
freightXcg

invoiceValueUsd
dutyUsd
dutiesXcg

adminCostXcg
subtotalXcg

taxRate
taxXcg
finalPriceXcg

calculationStatus
calculationBreakdownJson

calculatedAt
createdAt
updatedAt
audit_logs
id
organizationId
actorUserId
entityType
entityId
action
beforeJson
afterJson
createdAt

Record:

manual invoice matches;
HS-code changes;
tariff-rate changes;
invoice-value corrections;
package allocations;
recalculations;
consolidado closing or reopening. 8. Phase 1 — Project foundation

Codex should first complete only the foundation.

Deliverables
Create Next.js project.
Configure TypeScript strict mode.
Configure Supabase and Drizzle.
Create schema and initial migration.
Add dashboard layout.
Add Supabase authentication integration.
Add role-based route protection.
Add settings screen.
Seed default calculation values.
Add logging and standardized error handling.
Acceptance criteria
Application starts locally.
Database migration runs successfully.
An authenticated admin can open the dashboard.
Rates can be viewed and edited.
Monetary values use decimal-safe calculations.
Linting and type checking pass. 9. Phase 2 — Consolidado import
Upload page

Create:

/customs/consolidados/new

Fields:

consolidado reference;
carrier;
flight date;
Excel file.
Excel importer

Expected columns include:

WH
Tracking
Nombre
Email
Description
Peso
Dimensions

The importer should support small header-name differences.

Import rules
Treat tracking numbers as strings.
Preserve leading zeroes.
Extract the last four digits.
Normalize customer names.
Normalize email addresses.
Interpret Peso as pounds.
Reject negative weights.
Save source row numbers.
Flag duplicate full tracking numbers.
Preserve the original workbook.
Import review screen

Display:

Valid rows
Invalid rows
Duplicate tracking numbers
Total packages
Total customers
Total weight

The user must confirm before finalizing the import.

Acceptance criteria
Every valid Excel row produces exactly one package.
Total imported weight equals source workbook weight.
Invalid rows include the row number and reason.
Multiple packages for one customer remain separate records.
A derived customer summary is available. 10. Phase 3 — Freight calculations

Create a pure calculation service:

src/modules/calculations/calculate-freight.ts

Example:

type FreightInput = {
totalWeightLb: Decimal;
rateUsdPerLb: Decimal;
usdToXcgRate: Decimal;
};

type FreightResult = {
freightUsd: Decimal;
freightXcg: Decimal;
};

Rules:

freightUsd = weight × rate
freightXcg = freightUsd × conversion rate

Round displayed currency values to two decimals.

Keep unrounded internal values until the final calculation step.

11. Phase 4 — Invoice upload and ZIP processing
    Upload options
    Single PDF.
    Multiple PDFs.
    ZIP file.
    Images, if required later.
    Processing steps
    Validate file type and size.
    Safely extract ZIP contents.
    Reject unsupported files.
    Calculate SHA-256.
    Detect duplicate invoices.
    Store original file.
    Extract PDF text.
    Save extraction status.
    Queue matching process.
    Invoice extraction output

Use this schema:

const extractedInvoiceSchema = z.object({
vendorName: z.string().nullable(),
orderNumber: z.string().nullable(),
invoiceNumber: z.string().nullable(),
invoiceDate: z.string().nullable(),

customerName: z.string().nullable(),
customerEmail: z.string().nullable(),

trackingNumbers: z.array(z.string()),

subtotalUsd: z.string().nullable(),
salesTaxUsd: z.string().nullable(),
shippingUsd: z.string().nullable(),
grandTotalUsd: z.string().nullable(),

currency: z.string().nullable(),

items: z.array(
z.object({
description: z.string(),
quantity: z.string().nullable(),
unitPriceUsd: z.string().nullable(),
lineTotalUsd: z.string().nullable(),
brand: z.string().nullable(),
model: z.string().nullable(),
material: z.string().nullable(),
intendedUse: z.string().nullable(),
}),
),

warnings: z.array(z.string()),
});

Never trust extracted AI JSON without Zod validation.

12. Phase 5 — Invoice matching engine

Create a scoring system.

Matching signals
+100 Exact complete tracking number
+70 Last four tracking digits plus matching customer
+60 Exact customer email
+40 Exact normalized customer name
+30 Known vendor order linked to customer
+20 Filename contains last four tracking digits
+15 Filename contains customer name
-80 Conflicting email
-70 Conflicting full tracking number
-40 Strong customer-name conflict
Match results
auto_matched
suggested
ambiguous
unmatched
duplicate

Do not automatically match using only the last four digits when two packages share the same ending.

Manual matching page

Show:

invoice preview;
extracted customer;
extracted order number;
extracted tracking numbers;
candidate packages;
candidate scores;
reasons for each score;
manual selection button. 13. Phase 6 — Split-order handling

This must be implemented before automatic duty calculation.

Example
One invoice: USD 100

Package A: 2 lb, Consolidado 1331
Package B: 3 lb, Consolidado 1332
Package C: 5 lb, Consolidado 1334

Weight allocation:

A = USD 20
B = USD 30
C = USD 50
Allocation priority
Actual items assigned to package.
Vendor package value.
Manual package value.
Weight-based allocation.
Required validation
Sum of allocated values = invoice total

The system must never apply the full invoice value to every package.

14. Phase 7 — Tariff-book import

Create an administrative tariff import module.

Initial approach

Convert the Curaçao 2017 tariff PDF into structured rows:

8-digit code
6-digit HS code
description
duty percentage
additional charge
excise
page reference

Because the PDF is old, every tariff version should have:

effectiveFrom
effectiveTo
isActive

Do not overwrite the old version when a new tariff is uploaded.

Tariff search page

Allow searches by:

full code;
HS prefix;
Dutch description;
English description;
product keyword;
chapter. 15. Phase 8 — Product classification

Classification order:

Previously verified exact product.
Previously verified product pattern.
Keyword and rule-based result.
AI suggestion.
Manual selection.

Each suggestion must show:

Suggested tariff code
Duty rate
Confidence
Reason
Source tariff page
Previous matching products

Only approved classifications should be used for final billing.

16. Phase 9 — Complete charge calculation

Create:

src/modules/calculations/calculate-customer-charges.ts

Input:

type CustomerChargeInput = {
totalWeightLb: Decimal;
invoiceValueUsd: Decimal;
dutyRate: Decimal;

freightRateUsdPerLb: Decimal;
usdToXcgRate: Decimal;
adminCostXcg: Decimal;
taxRate: Decimal;
};

Output:

type CustomerChargeResult = {
freightUsd: Decimal;
freightXcg: Decimal;

dutyUsd: Decimal;
dutiesXcg: Decimal;

adminCostXcg: Decimal;
subtotalXcg: Decimal;

taxXcg: Decimal;
finalPriceXcg: Decimal;
};

Implementation:

freightUsd = totalWeightLb × freightRateUsdPerLb

freightXcg = freightUsd × usdToXcgRate

dutyUsd = invoiceValueUsd × dutyRate

dutiesXcg = dutyUsd × usdToXcgRate

subtotalXcg =
freightXcg + dutiesXcg + adminCostXcg

taxXcg = subtotalXcg × taxRate

finalPriceXcg =
subtotalXcg + taxXcg

Every result must store its input settings and calculation breakdown.

17. Phase 10 — Review dashboard

For each consolidado show:

Packages
Customers
Total weight
Invoices uploaded
Invoices matched
Invoices missing
Ambiguous matches
Items awaiting classification
Customers ready for billing

Customer review table:

Customer Packages Weight Invoice Duty Admin Subtotal 6% Final Status

Statuses:

missing_invoice
invoice_review
matching_review
classification_review
calculation_ready
approved
exported 18. Phase 11 — Excel export

Export a workbook containing:

Sheet 1 — Original data

Preserve the original consolidado.

Sheet 2 — Customer Summary
Customer
Email
Package count
Tracking numbers
Total weight
Freight USD
Freight XCG
Invoice value USD
HS code
Duty rate
Duty USD
Duties XCG
Administrative cost
Subtotal XCG
6% tax
Final price XCG
Status
Sheet 3 — Invoice Matching
Invoice filename
Customer
Tracking
Order number
Match method
Match confidence
Match status
Sheet 4 — Product Classification
Invoice
Product
HS code
Tariff description
Duty rate
Confidence
Review status

The export should use the original workbook as a template whenever possible.

19. Phase 12 — Gmail integration

Add this only after manual uploads work reliably.

Google requires OAuth 2.0 authorization for Gmail API access. For server-side access, the application should use the web-server OAuth flow and securely retain refresh tokens when offline access is required.

Gmail workflow
Admin connects the dedicated invoice mailbox.
Store encrypted OAuth tokens.
Search recent messages.
Download supported attachments.
Hash and detect duplicates.
Match invoices to open consolidados.
Show unmatched emails for review.

Suggested Gmail search:

has:attachment
(filename:pdf OR filename:jpg OR filename:png)
newer_than:90d

Do not delete, move or modify customer emails in version 1.

20. Background jobs

Do not process large ZIP files or many invoices inside a single request.

Recommended jobs:

import_consolidation
extract_invoice
match_invoice
suggest_classification
recalculate_customer
generate_export
sync_gmail

Each job should have:

queued
processing
completed
failed
retrying

Save error details and allow retrying failed jobs.

21. Security requirements
    Restrict all uploads by MIME type and file size.
    Sanitize ZIP paths to prevent ZIP-slip attacks.
    Store refresh tokens encrypted.
    Never expose storage tokens to the browser.
    Require authorization for all consolidado access.
    Log all manual calculation changes.
    Prevent one organization from reading another organization’s files.
    Do not permit an invoice classification to become verified automatically.
    Escape spreadsheet values beginning with =, +, - or @ to prevent formula injection.
22. Testing strategy
    Unit tests
    Name normalization.
    Tracking-number normalization.
    Last-four extraction.
    Freight calculation.
    Duty calculation.
    Tax calculation.
    Weight allocation.
    Invoice matching scores.
    Duplicate detection.
    Integration tests
    Excel import.
    ZIP extraction.
    Invoice upload.
    Invoice-to-package matching.
    Split purchase across several packages.
    Tariff selection.
    Export generation.
    Critical scenarios
    One customer, one package, one invoice
    One customer, multiple packages, one invoice
    One customer, multiple invoices
    One invoice, packages on different consolidados
    Two tracking numbers with the same last four digits
    Duplicate invoice uploaded twice
    Invoice without tracking number
    Customer names with spelling differences
    Missing invoice total
    Mixed products with different duty rates
23. Suggested Codex execution order

Give Codex one phase at a time.

Prompt 1 — Foundation
Create the initial Next.js App Router project foundation for an internal
5999Cargo Customs application.

Use TypeScript strict mode, Tailwind CSS, Supabase Postgres, Supabase Auth, Drizzle ORM,
Zod and Decimal.js.

Create:

- environment validation;
- database connection;
- separate app and migration connection handling for Supabase;
- modular Drizzle schema files;
- organization, user, app settings, consolidations, packages and
  customer charges tables;
- initial database migration;
- dashboard layout;
- customs navigation;
- consolidado list page;
- new consolidado page;
- settings page;
- seed script with:
  freight rate USD 3.80 per lb,
  USD-to-XCG rate 1.82,
  administrative cost XCG 8.95,
  tax rate 6%.

Keep business logic outside React components.
Use server components by default.
Add loading and error states.
Run lint and type checking and resolve every error.
Prompt 2 — Excel import
Implement consolidado Excel upload and import.

Use ExcelJS. Preserve tracking numbers as strings and preserve leading
zeroes. Detect the columns WH, Tracking, Nombre, Email, Description,
Peso and Dimensions.

Create a preview step before database insertion. Show valid rows,
invalid rows, duplicate tracking numbers, total packages, total
customers and total weight.

Save every accepted source row as an individual package with its
original source row number. Do not merge package records.

Add unit tests for normalization and import validation.
Prompt 3 — Freight summary
Implement customer grouping and freight calculations.

Group packages using exact normalized customer email first, and use
normalized name only when the email is absent. Do not merge customers
with conflicting emails.

Calculate:

freightUsd = totalWeightLb _ freightRateUsdPerLb
freightXcg = freightUsd _ usdToXcgRate

Use Decimal.js and store a calculation breakdown.
Create the consolidado customer summary page.
Prompt 4 — Invoice ZIP upload
Implement invoice PDF and ZIP upload for a consolidado.

Use JSZip safely. Reject unsupported files and unsafe ZIP paths.
Calculate SHA-256 hashes and reject duplicate invoice documents.
Store original files in Vercel Blob.

Create invoice_documents and invoice_items schema and migrations.
Create an invoice processing status page.
Do not implement AI extraction yet.
Prompt 5 — Matching engine
Implement deterministic invoice matching based on filename, complete
tracking number, last four tracking digits, customer email and
normalized customer name.

Use a scored candidate system and return auto_matched, suggested,
ambiguous, unmatched or duplicate.

Never auto-match on the last four digits alone when duplicate endings
exist. Add a manual matching review page and audit every manual change.

Continue with extraction, split-purchase allocation, tariff import and duty calculations only after these first five prompts work reliably.

24. MVP completion definition

The first useful version is complete when staff can:

Log in.
Create Consolidado 1331.
Upload its Excel file.
Review and import package rows.
Upload invoice ZIP files.
Match invoices manually or automatically.
Enter or approve invoice values.
Select approved tariff codes.
Calculate freight, duties, admin cost, 6% and final price.
Export the completed workbook.
Reopen the consolidado and see its calculation history.

The direct Gmail integration and fully automatic AI classification should be treated as the next release, not as requirements for the first working version.
