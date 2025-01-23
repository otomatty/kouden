import type { Driver, DriveStep } from "driver.js";

export type DriverRef = Driver | null;

export type Step = DriveStep;

export interface TourState {
	isActive: boolean;
	isCompleted: boolean;
}
