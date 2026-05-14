import { NextRequest, NextResponse } from "next/server";
import { getDiscoveryItemsByZipcode, getAllDiscoveryItems } from "@/lib/data";
import { getOccupancyStatus } from "@/lib/agent";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zipcode = searchParams.get("zipcode");

  let items;
  if (!zipcode || zipcode === "all") {
    items = getAllDiscoveryItems();
  } else {
    items = getDiscoveryItemsByZipcode(zipcode);
  }
  
  const results = items.map((item) => ({
    ...item,
    occupancy: getOccupancyStatus(item),
  }));

  return NextResponse.json(results);
}
