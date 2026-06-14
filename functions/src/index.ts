import * as admin from "firebase-admin";
import { onScheduleCreated, onScheduleUpdated } from "./schedules/triggers";
import { scheduledBudgetPaymentReminderWorker, scheduledChecklistReminderWorker, scheduledReminderWorker } from "./notifications/workers";

admin.initializeApp();

export { onScheduleCreated, onScheduleUpdated, scheduledReminderWorker, scheduledBudgetPaymentReminderWorker, scheduledChecklistReminderWorker };
