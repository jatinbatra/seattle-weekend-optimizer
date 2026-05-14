import { DiscoveryItem } from "./data";

export interface OccupancyStatus {
  name: string;
  status: string;
  occupancy_percent: number;
  is_peak: boolean;
  timestamp: string;
}

export function getOccupancyStatus(item: DiscoveryItem): OccupancyStatus {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const hour = now.getHours();

  // Peak: 4 PM - 8 PM weekdays (16-20), 8 AM - 8 PM weekends (8-20)
  let isPeak = false;
  if (isWeekend) {
    if (hour >= 8 && hour <= 20) {
      isPeak = true;
    }
  } else {
    if (hour >= 16 && hour <= 20) {
      isPeak = true;
    }
  }

  // Simulated 'Real-time' factor (randomness)
  let occupancy: number;
  if (isPeak) {
    occupancy = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
  } else {
    occupancy = Math.floor(Math.random() * (50 - 10 + 1)) + 10;
  }

  // Status Label
  let status: string;
  if (occupancy < 30) {
    status = "Empty";
  } else if (occupancy < 70) {
    status = "Few People";
  } else {
    status = "Busy / Full";
  }

  return {
    name: item.name,
    status: status,
    occupancy_percent: occupancy,
    is_peak: isPeak,
    timestamp: now.toLocaleTimeString("en-US", { hour12: false }),
  };
}
