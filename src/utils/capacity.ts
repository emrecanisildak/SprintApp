import { SprintMember } from '../types';

export function calculateIndividualCapacity(
  durationDays: number,
  dailyHours: number,
  allocationPercent: number,
  storyPointHours: number
): number {
  return (durationDays * dailyHours * (allocationPercent / 100)) / storyPointHours;
}

export function calculateTotalCapacity(
  durationDays: number,
  dailyHours: number,
  storyPointHours: number,
  members: SprintMember[]
): number {
  return members.reduce(
    (sum, m) => sum + calculateIndividualCapacity(durationDays, dailyHours, m.allocation_percent, storyPointHours),
    0
  );
}
