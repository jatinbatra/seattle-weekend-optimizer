import { NextResponse } from "next/server";

const venues = [
  { name: "Showbox", id: "v1" },
  { name: "The Crocodile", id: "v2" },
  { name: "Tractor Tavern", id: "v3" },
  { name: "Moore Theatre", id: "v4" },
  { name: "Neptune Theatre", id: "v5" },
  { name: "Paramount Theatre", id: "v6" },
  { name: "Climate Pledge Arena", id: "KovZpZAJk7lA" },
  { name: "Lumen Field", id: "KovZpZAJt71A" },
  { name: "T-Mobile Park", id: "KovZpZAJtE7A" },
  { name: "Benaroya Hall", id: "v7" },
  { name: "The Triple Door", id: "v8" },
  { name: "Neumos", id: "v9" },
  { name: "Barboza", id: "v10" },
];

const categories = ["Live Music", "Comedy", "Sports", "Farmers Market", "Festival"];

const eventNames = [
  "Jazz Night", "Rock Concert", "Stand-up Comedy", "Mariners Game", "Sounders Match", 
  "Farmers Market", "Art Festival", "Food Truck Rally", "Indie Show", "Symphony Performance",
  "Tech Meetup", "Yoga in the Park", "Outdoor Cinema", "Brewery Tour", "Vinyl Expo",
  "Trivia Night", "Karaoke Madness", "Poetry Slam", "Dance Workshop", "Cooking Class"
];

const generateMockEvents = (count: number) => {
  const events = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const venue = venues[Math.floor(Math.random() * venues.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const nameBase = eventNames[Math.floor(Math.random() * eventNames.length)];
    const eventName = `${nameBase} at ${venue.name}`;
    const offset = Math.floor(Math.random() * 30 * 86400000); // within 30 days
    const date = new Date(now + offset);
    
    events.push({
      id: `ev-${i}`,
      name: eventName,
      category: category,
      dates: {
        start: {
          dateTime: date.toISOString(),
          localDate: date.toISOString().split('T')[0],
          localTime: `${Math.floor(Math.random() * 12 + 10)}:00:00`
        }
      },
      _embedded: {
        venues: [venue]
      },
      url: "https://www.ticketmaster.com"
    });
  }
  return events;
};

export async function GET() {
  const mockEvents = generateMockEvents(160);
  return NextResponse.json({
    _embedded: {
      events: mockEvents
    }
  });
}
