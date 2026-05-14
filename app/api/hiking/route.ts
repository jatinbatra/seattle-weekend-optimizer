import { NextRequest, NextResponse } from "next/server";
import { TRAILS } from "@/lib/data";

export async function GET(request: NextRequest) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
  const hour = now.getHours();
  
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isMorning = hour >= 8 && hour <= 12;
  const isBusy = isWeekend && isMorning;

  const trailResults = TRAILS.map((trail) => {
    // Determine occupancy based on logic + some randomness
    let occupancy_percent: number;
    if (isBusy) {
      occupancy_percent = Math.floor(Math.random() * (100 - 80 + 1)) + 80;
    } else if (isWeekend) {
      occupancy_percent = Math.floor(Math.random() * (80 - 40 + 1)) + 40;
    } else {
      occupancy_percent = Math.floor(Math.random() * (40 - 5 + 1)) + 5;
    }

    let status: string;
    if (occupancy_percent > 85) {
      status = "Extremely Busy";
    } else if (occupancy_percent > 60) {
      status = "Moderately Busy";
    } else {
      status = "Light Traffic";
    }

    // Phase 2: Trail Sentiment
    const reports = [
      "Trail is dry and clear",
      "Slightly muddy in shaded areas",
      "Great conditions today",
      "Parking lot is half full",
      "Bugs are starting to come out",
      "Beautiful views at the summit",
      "Steady incline, but well maintained",
      "Some downed trees, but easy to navigate",
      "Wildflowers are in full bloom!",
      "Cool breeze at the top, bring a layer",
      "Very crowded near the viewpoint",
      "Hidden gem, very quiet today"
    ];
    let latestReport = reports[Math.floor(Math.random() * reports.length)];
    
    if (isMorning && occupancy_percent > 85) {
      latestReport = "Parking lot full at 9 AM";
    } else if (occupancy_percent > 70) {
      latestReport = "Parking is filling fast";
    }

    return {
      ...trail,
      occupancy_percent,
      status,
      latestReport,
      timestamp: now.toLocaleTimeString("en-US", { hour12: false }),
    };
  });

  // Phase 2: Pass Conditions (Mock WSDOT Schema)
  const passConditions = {
    LocationName: "Snoqualmie Pass",
    RoadCondition: "Bare and dry",
    TemperatureInFahrenheit: 65,
    WeatherCondition: "Clear",
    LastUpdated: now.toISOString(),
  };

  // Phase 2: Weather Forecast
  const weatherForecast = "Sunny Saturday, Rain Sunday";

  return NextResponse.json({
    trails: trailResults,
    passConditions,
    weatherForecast
  });
}
