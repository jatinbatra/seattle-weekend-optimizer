import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const neighborhood = searchParams.get("neighborhood") || "Ballard";

  try {
    // Fetch latest parking data from Seattle Open Data
    // We'll filter by paidparkingarea and sort by occupancydatetime descending to get recent data
    const url = `https://data.seattle.gov/resource/rke9-rsvs.json?$where=paidparkingarea='${neighborhood}'&$order=occupancydatetime DESC&$limit=20`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch parking data");
    }

    const data = await response.json();

    const processedData = data.map((item: any) => {
      const occupied = parseInt(item.paidoccupancy) || 0;
      const total = parseInt(item.parkingspacecount) || 1;
      const percent = Math.min(Math.round((occupied / total) * 100), 100);

      return {
        id: item.sourceelementkey,
        blockface: item.blockfacename,
        neighborhood: item.paidparkingarea,
        occupied,
        total,
        occupancy_percent: percent,
        status: percent > 85 ? "Full" : percent > 50 ? "Busy" : "Available",
        timestamp: new Date(item.occupancydatetime).toLocaleTimeString("en-US", { hour12: false }),
      };
    });

    return NextResponse.json(processedData);
  } catch (error) {
    console.error("Parking API Error:", error);
    return NextResponse.json({ error: "Failed to fetch parking data" }, { status: 500 });
  }
}
