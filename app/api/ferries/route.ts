import { NextResponse } from "next/server";

// WSDOT Terminal IDs: Seattle (7), Bainbridge (3), Bremerton (4)
// Mocking the WSDOT JSON structure for wait times and sailings
const MOCK_FERRY_DATA = {
  terminals: [
    {
      TerminalID: 7,
      TerminalName: "Seattle",
      WaitTimes: [
        {
          RouteID: 1,
          RouteName: "Seattle / Bainbridge Island",
          WaitTime: 45,
          WaitTimeLastUpdated: new Date().toISOString(),
        },
        {
          RouteID: 2,
          RouteName: "Seattle / Bremerton",
          WaitTime: 0,
          WaitTimeLastUpdated: new Date().toISOString(),
        }
      ],
      Sailings: [
        {
          RouteName: "Seattle to Bainbridge Island",
          ScheduledDeparture: new Date(Date.now() + 20 * 60000).toISOString(),
          VesselName: "Tacoma",
          Status: "On Time"
        },
        {
          RouteName: "Seattle to Bremerton",
          ScheduledDeparture: new Date(Date.now() + 35 * 60000).toISOString(),
          VesselName: "Chimacum",
          Status: "On Time"
        }
      ]
    },
    {
      TerminalID: 3,
      TerminalName: "Bainbridge Island",
      WaitTimes: [
        {
          RouteID: 1,
          RouteName: "Bainbridge Island / Seattle",
          WaitTime: 60,
          WaitTimeLastUpdated: new Date().toISOString(),
        }
      ],
      Sailings: [
        {
          RouteName: "Bainbridge Island to Seattle",
          ScheduledDeparture: new Date(Date.now() + 15 * 60000).toISOString(),
          VesselName: "Wenatchee",
          Status: "Delayed 10m"
        }
      ]
    },
    {
      TerminalID: 4,
      TerminalName: "Bremerton",
      WaitTimes: [
        {
          RouteID: 2,
          RouteName: "Bremerton / Seattle",
          WaitTime: 0,
          WaitTimeLastUpdated: new Date().toISOString(),
        }
      ],
      Sailings: [
        {
          RouteName: "Bremerton to Seattle",
          ScheduledDeparture: new Date(Date.now() + 45 * 60000).toISOString(),
          VesselName: "Kaleetan",
          Status: "On Time"
        }
      ]
    }
  ]
};

export async function GET() {
  // TODO: Implement WSDOT API fetch once API key is provided
  // const apiKey = process.env.WSDOT_API_KEY;
  
  // For now, return the mock data that mimics the expected structure
  return NextResponse.json(MOCK_FERRY_DATA);
}
