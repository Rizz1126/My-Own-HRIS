ALTER TABLE "clients" ADD COLUMN "code" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD COLUMN "planned_start_time" varchar(10);--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD COLUMN "planned_end_time" varchar(10);--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD COLUMN "actual_start_time" varchar(10);--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD COLUMN "actual_end_time" varchar(10);