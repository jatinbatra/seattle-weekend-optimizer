"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  MapPin, 
  Clock, 
  ExternalLink, 
  Activity, 
  Info, 
  Loader2, 
  Car, 
  Mountain, 
  Navigation,
  Filter,
  Ship,
  Ticket,
  AlertTriangle,
  Thermometer,
  ArrowUpRight,
  RefreshCw,
  Trees,
  Building2,
  Waves,
  Milestone,
  Eye,
  CheckCircle2,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NEIGHBORHOODS } from "@/lib/data";
import { cn } from "@/lib/utils";

interface DiscoveryItem {
  id: string;
  name: string;
  location: string;
  category: "Park" | "Community Center" | "Pool" | "Landmark" | "Viewpoint";
  zipcode: string;
}

interface OccupancyStatus {
  name: string;
  status: string;
  occupancy_percent: number;
  is_peak: boolean;
  timestamp: string;
}

interface DiscoveryItemWithOccupancy extends DiscoveryItem {
  occupancy: OccupancyStatus;
}

interface ParkingData {
  id: string;
  blockface: string;
  neighborhood: string;
  occupied: number;
  total: number;
  occupancy_percent: number;
  status: string;
  timestamp: string;
}

interface TrailData {
  id: string;
  name: string;
  distance: string;
  elevationGain: string;
  difficulty: string;
  location: string;
  region: string;
  occupancy_percent: number;
  status: string;
  latestReport: string;
  timestamp: string;
}

interface PassConditions {
  LocationName: string;
  RoadCondition: string;
  TemperatureInFahrenheit: number;
  WeatherCondition: string;
}

interface HikingResponse {
  trails: TrailData[];
  passConditions: PassConditions;
  weatherForecast: string;
}

interface FerryWaitTime {
  RouteID: number;
  RouteName: string;
  WaitTime: number;
  WaitTimeLastUpdated: string;
}

interface FerrySailing {
  RouteName: string;
  ScheduledDeparture: string;
  VesselName: string;
  Status: string;
}

interface FerryTerminal {
  TerminalID: number;
  TerminalName: string;
  WaitTimes: FerryWaitTime[];
  Sailings: FerrySailing[];
}

interface FerryData {
  terminals: FerryTerminal[];
}

interface EventData {
  id: string;
  name: string;
  category?: string;
  dates: {
    start: {
      dateTime: string;
      localDate: string;
      localTime: string;
    };
  };
  _embedded: {
    venues: [{ name: string; id: string }];
  };
  url: string;
}

type Tab = "Parks & Discovery" | "Parking" | "Hiking" | "Traffic & Events";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("Parks & Discovery");
  
  // Parks & Discovery State
  const [zipcode, setZipcode] = useState("all");
  const [zipInput, setZipInput] = useState("");
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryItemWithOccupancy[]>([]);
  
  // Search and Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  
  // Parking State
  const [neighborhood, setNeighborhood] = useState("Ballard");
  const [parking, setParking] = useState<ParkingData[]>([]);
  
  // Hiking State
  const [hiking, setHiking] = useState<TrailData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [passConditions, setPassConditions] = useState<PassConditions | null>(null);
  const [weatherForecast, setWeatherForecast] = useState<string>("");

  const REGIONS = ["All", "I-90", "Hwy 2", "Mountain Loop", "Rainier", "Olympics"];

  const filteredHiking = selectedRegion === "All" 
    ? hiking 
    : hiking.filter(t => t.region === selectedRegion);

  // Traffic & Events State
  const [ferries, setFerries] = useState<FerryData | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const updateTimestamp = useCallback(() => {
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  const fetchDiscovery = useCallback(async (zip: string, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await fetch(`/api/courts?zipcode=${zip}`);
      if (!res.ok) throw new Error("Failed to fetch discovery items");
      const data = await res.json();
      setDiscoveryItems(data);
      updateTimestamp();
      setError(null);
    } catch (err) {
      setError("Failed to load discovery data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateTimestamp]);

  const fetchParking = useCallback(async (area: string, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await fetch(`/api/parking?neighborhood=${area}`);
      if (!res.ok) throw new Error("Failed to fetch parking");
      const data = await res.json();
      setParking(data);
      updateTimestamp();
      setError(null);
    } catch (err) {
      setError("Failed to load parking data.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateTimestamp]);

  const fetchHiking = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await fetch(`/api/hiking`);
      if (!res.ok) throw new Error("Failed to fetch hiking");
      const data: HikingResponse = await res.json();
      setHiking(data.trails);
      setPassConditions(data.passConditions);
      setWeatherForecast(data.weatherForecast);
      updateTimestamp();
      setError(null);
    } catch (err) {
      setError("Failed to load hiking data.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateTimestamp]);

  const fetchTrafficAndEvents = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    
    try {
      const [ferryRes, eventRes] = await Promise.all([
        fetch("/api/ferries"),
        fetch("/api/events")
      ]);

      if (!ferryRes.ok || !eventRes.ok) throw new Error("Failed to fetch traffic or events data");

      const ferryData = await ferryRes.json();
      const eventData = await eventRes.json();

      setFerries(ferryData);
      setEvents(eventData._embedded?.events || []);
      updateTimestamp();
      setError(null);
    } catch (err) {
      setError("Failed to load traffic and events data.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateTimestamp]);

  const handleRefresh = useCallback(() => {
    if (activeTab === "Parks & Discovery") fetchDiscovery(zipcode);
    else if (activeTab === "Parking") fetchParking(neighborhood);
    else if (activeTab === "Hiking") fetchHiking();
    else if (activeTab === "Traffic & Events") fetchTrafficAndEvents();
  }, [activeTab, zipcode, neighborhood, fetchDiscovery, fetchParking, fetchHiking, fetchTrafficAndEvents]);

  useEffect(() => {
    setVisibleCount(12);
    setSearchQuery("");
    
    if (activeTab === "Parks & Discovery") {
      fetchDiscovery(zipcode, true);
    } else if (activeTab === "Parking") {
      fetchParking(neighborhood, true);
    } else if (activeTab === "Hiking") {
      fetchHiking(true);
    } else if (activeTab === "Traffic & Events") {
      fetchTrafficAndEvents(true);
    }
  }, [activeTab, zipcode, neighborhood, fetchDiscovery, fetchParking, fetchHiking, fetchTrafficAndEvents]);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  const handleZipSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipInput.trim()) setZipcode(zipInput.trim());
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Park": return <Trees className="w-6 h-6 text-emerald-500" />;
      case "Community Center": return <Building2 className="w-6 h-6 text-indigo-500" />;
      case "Pool": return <Waves className="w-6 h-6 text-blue-500" />;
      case "Landmark": return <Milestone className="w-6 h-6 text-amber-500" />;
      case "Viewpoint": return <Eye className="w-6 h-6 text-purple-500" />;
      default: return <MapPin className="w-6 h-6 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("empty") || s.includes("available") || s.includes("light")) return "text-emerald-700 bg-emerald-50 border-emerald-100";
    if (s.includes("few") || s.includes("busy") || s.includes("moderate")) return "text-amber-700 bg-amber-50 border-amber-100";
    if (s.includes("full") || s.includes("extremely")) return "text-rose-700 bg-rose-50 border-rose-100";
    return "text-slate-600 bg-slate-50 border-slate-100";
  };

  const getBarColor = (percent: number) => {
    if (percent < 30) return "bg-emerald-500";
    if (percent < 70) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "easy": return "text-emerald-700 bg-emerald-50";
      case "moderate": return "text-blue-700 bg-blue-50";
      case "hard": return "text-orange-700 bg-orange-50";
      case "strenuous": return "text-orange-800 bg-orange-100";
      case "extreme": return "text-rose-700 bg-rose-50";
      default: return "text-slate-600 bg-slate-50";
    }
  };

  // Data Filtering & Pagination
  const filteredDiscovery = discoveryItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const displayedDiscovery = filteredDiscovery.slice(0, visibleCount);

  const filteredParking = parking.filter(p => 
    p.blockface.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const displayedParking = filteredParking.slice(0, visibleCount);

  const filteredHikingData = hiking.filter(t => 
    (selectedRegion === "All" || t.region === selectedRegion) &&
    (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     t.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const displayedHiking = filteredHikingData.slice(0, visibleCount);

  const filteredEvents = events.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e._embedded.venues[0].name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const displayedEvents = filteredEvents.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 antialiased tracking-tight">
      {/* Sticky Header with Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">Court Agent</h1>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                Seattle Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleRefresh}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">System Active</span>
            </div>
          </div>
        </div>
        
        {/* Navigation with Animated Active State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100/50">
          <nav className="flex items-center gap-1 py-1">
            {(["Parks & Discovery", "Parking", "Hiking", "Traffic & Events"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "relative px-4 py-3 text-sm font-semibold transition-colors duration-200 rounded-lg",
                  activeTab === tab ? "text-indigo-600" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 mx-4"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar & Stats */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
              <LayoutGrid className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-700">
                Found {
                  activeTab === "Parks & Discovery" ? filteredDiscovery.length :
                  activeTab === "Parking" ? filteredParking.length :
                  activeTab === "Hiking" ? filteredHikingData.length :
                  filteredEvents.length
                } items
              </span>
            </div>
          </div>
        </div>

        {/* Contextual Filters */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              {activeTab === "Parks & Discovery" && "Parks & Discovery"}
              {activeTab === "Parking" && "Street Parking"}
              {activeTab === "Hiking" && "Trail Conditions"}
              {activeTab === "Traffic & Events" && "Traffic & Events"}
            </h2>
            <p className="text-slate-500 mt-2 text-lg">
              {activeTab === "Parks & Discovery" && `Real-time occupancy for public and private facilities near ${zipcode === 'all' ? 'Seattle' : zipcode}.`}
              {activeTab === "Parking" && `Live parking availability in ${neighborhood} commercial zones.`}
              {activeTab === "Hiking" && "Trailhead occupancy and mountain pass conditions."}
              {activeTab === "Traffic & Events" && "Ferry wait times and major stadium event alerts."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {activeTab === "Parks & Discovery" && (
              <form onSubmit={handleZipSearch} className="relative w-full sm:w-48">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                  placeholder="Zipcode..."
                />
              </form>
            )}

            {activeTab === "Parking" && (
              <div className="relative w-full sm:w-64">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm font-medium"
                >
                  {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Navigation className="w-4 h-4" />
                </div>
              </div>
            )}
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={lastUpdated}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Last Update: {lastUpdated || "Initializing..."}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-slate-400">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-25" />
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 relative z-10" />
            </div>
            <p className="mt-6 font-semibold text-slate-900">Syncing Intelligence Engine...</p>
            <p className="text-sm mt-1">Fetching the latest data from Seattle Open Data</p>
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-rose-100 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xl shadow-rose-100/20"
          >
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-slate-900 font-extrabold text-2xl mb-3">Connection Lost</h3>
            <p className="text-slate-600 leading-relaxed mb-8">{error}</p>
            <button 
              onClick={() => handleRefresh()}
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
            >
              Retry Connection
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col gap-10"
            >
              {activeTab === "Parks & Discovery" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedDiscovery.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-indigo-50 transition-colors">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                            <p className="text-slate-400 text-xs font-medium mt-1 uppercase tracking-wider">{item.location}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border",
                          item.category === 'Park' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-indigo-700 bg-indigo-50 border-indigo-100'
                        )}>
                          {item.category}
                        </span>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-end mb-3">
                            <span className={cn("text-xs font-bold px-3 py-1.5 rounded-xl border", getStatusColor(item.occupancy.status))}>
                              {item.occupancy.status}
                            </span>
                            <div className="text-right">
                              <span className="text-sm font-black text-slate-900">{item.occupancy.occupancy_percent}%</span>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Occupancy</p>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-50">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.occupancy.occupancy_percent}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={cn("h-full rounded-full", getBarColor(item.occupancy.occupancy_percent))}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                          <div className="flex items-center gap-4">
                            {item.occupancy.is_peak && (
                              <div className="flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-100">
                                <Activity className="w-3 h-3" /> Peak
                              </div>
                            )}
                            <span className="text-slate-400 text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-widest">
                              <Clock className="w-3.5 h-3.5" /> {item.occupancy.timestamp}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{item.zipcode}</span>
                            <a 
                              href="#" 
                              className="text-slate-400 hover:text-indigo-600 transition-all p-2 bg-slate-50 hover:bg-indigo-50 rounded-xl"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "Parking" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedParking.map((p) => (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-indigo-50 transition-colors">
                          <Car className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors h-10 overflow-hidden line-clamp-2">
                            {p.blockface}
                          </h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {p.neighborhood} Zone
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <span className={cn("text-xs font-bold px-3 py-1.5 rounded-xl border", getStatusColor(p.status))}>
                            {p.status}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-black text-slate-900">{p.total - p.occupied}<span className="text-slate-400 mx-1">/</span>{p.total}</span>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Available Spaces</p>
                          </div>
                        </div>
                        
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-50">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${p.occupancy_percent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn("h-full rounded-full", getBarColor(p.occupancy_percent))}
                          />
                        </div>
                        
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 pt-2 border-t border-slate-50">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" /> Sensor Data: {p.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "Hiking" && (
                <div className="space-y-8">
                  {/* Pass Status Bar */}
                  {passConditions && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-6 shadow-sm border-l-4 border-l-indigo-600"
                    >
                      <div className="flex items-center gap-5">
                        <div className="bg-indigo-50 p-4 rounded-2xl">
                          <Navigation className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass Conditions Hub</p>
                          <p className="text-lg font-extrabold text-slate-900">
                            {passConditions.LocationName}: <span className="text-indigo-600">{passConditions.RoadCondition}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <Thermometer className="w-5 h-5 text-orange-500" />
                          <span className="text-xl font-black text-slate-900">{passConditions.TemperatureInFahrenheit}°F</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200" />
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
                          <span className="text-sm font-bold text-slate-700">{weatherForecast}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Region Filter */}
                  <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto no-scrollbar">
                    {REGIONS.map((region) => (
                      <button
                        key={region}
                        onClick={() => {
                          setSelectedRegion(region);
                          setVisibleCount(12);
                        }}
                        className={cn(
                          "px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                          selectedRegion === region 
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
                            : "bg-white text-slate-500 border-slate-200 hover:border-indigo-400 hover:text-indigo-600"
                        )}
                      >
                        {region}
                      </button>
                    ))}
                  </div>

                  {/* Trail Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayedHiking.map((trail, index) => (
                      <motion.div 
                        key={trail.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ 
                          duration: 0.4, 
                          delay: index % 12 * 0.05,
                          ease: [0.23, 1, 0.32, 1] 
                        }}
                        className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col"
                      >
                        <div className="h-40 bg-slate-900 p-8 flex flex-col justify-between relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/80 to-purple-700/80 mix-blend-multiply transition-opacity group-hover:opacity-90" />
                          <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                            <Mountain className="w-48 h-48 text-white" />
                          </div>
                          
                          <div className="flex justify-between items-start z-10">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/20",
                              getDifficultyColor(trail.difficulty)
                            )}>
                              {trail.difficulty}
                            </span>
                            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20 text-white">
                              <Mountain className="w-5 h-5" />
                            </div>
                          </div>
                          <h3 className="text-white font-black text-2xl tracking-tight z-10 leading-none group-hover:translate-x-1 transition-transform">{trail.name}</h3>
                        </div>
                        
                        <div className="p-8 flex-1 flex flex-col">
                          <div className="flex flex-wrap gap-3 mb-8">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-extrabold text-slate-700">
                              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                              {trail.elevationGain}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-extrabold text-slate-700">
                              <Navigation className="w-4 h-4 text-indigo-500" />
                              {trail.distance}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600">
                              {trail.region}
                            </div>
                          </div>

                          <div className="space-y-8 flex-1">
                            <div className="p-5 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl relative overflow-hidden group-hover:bg-indigo-50 transition-colors">
                               <div className="flex items-center gap-2 mb-3 text-indigo-700">
                                 <Info className="w-4 h-4" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Intelligence Report</span>
                               </div>
                               <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                 {trail.latestReport.includes("Parking") ? `⚠️ ${trail.latestReport}` : trail.latestReport}
                               </p>
                               <div className="mt-4 flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                 <p className="text-[10px] text-indigo-600 font-black uppercase tracking-tighter">
                                   Optimal Start: {trail.difficulty === "Strenuous" || trail.difficulty === "Extreme" ? "Before 7:00 AM" : "Before 8:15 AM"}
                                 </p>
                               </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-end mb-3">
                                <span className={cn("text-xs font-bold px-3 py-1.5 rounded-xl border", getStatusColor(trail.status))}>
                                  {trail.status}
                                </span>
                                <div className="text-right">
                                  <span className="text-sm font-black text-slate-900">{trail.occupancy_percent}%</span>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Trailhead Capacity</p>
                                </div>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-50">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${trail.occupancy_percent}%` }}
                                  transition={{ duration: 1.2, ease: "easeOut" }}
                                  className={cn("h-full rounded-full transition-colors", getBarColor(trail.occupancy_percent))}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                              <Clock className="w-4 h-4 text-indigo-400" />
                              Synced {trail.timestamp}
                            </div>
                            <div className="text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Full Profile <ArrowUpRight className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "Traffic & Events" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Ferries Section */}
                  {ferries?.terminals.filter(t => t.TerminalID !== 7).map((terminal) => (
                    <div key={terminal.TerminalID} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                            <Ship className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-xl tracking-tight leading-none">{terminal.TerminalName}</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Marine Transport Hub</p>
                          </div>
                        </div>
                        <div className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                          <span className="text-[10px] font-black text-emerald-700 uppercase">Live</span>
                        </div>
                      </div>

                      <div className="space-y-8">
                        {terminal.WaitTimes.map((wait, idx) => (
                          <div key={idx} className="space-y-4">
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Current Transit Delay</p>
                                <span className={cn("text-xs font-bold px-3 py-1.5 rounded-xl border inline-block", wait.WaitTime > 30 ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100')}>
                                  {wait.WaitTime} min wait
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-3xl font-black text-slate-900">{wait.WaitTime}</span>
                                <span className="text-sm font-bold text-slate-400 ml-1">m</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-50">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (wait.WaitTime / 90) * 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn("h-full rounded-full", wait.WaitTime > 45 ? 'bg-rose-500' : wait.WaitTime > 20 ? 'bg-amber-500' : 'bg-emerald-500')}
                              />
                            </div>
                          </div>
                        ))}

                        <div className="pt-8 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Next Scheduled Sailing</h4>
                            <div className="h-px bg-slate-100 flex-1 mx-4" />
                          </div>
                          {terminal.Sailings.slice(0, 1).map((sailing, idx) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="text-xl font-black text-slate-900">
                                  {new Date(sailing.ScheduledDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="hidden sm:block">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Vessel</p>
                                  <p className="text-xs font-bold text-slate-600">{sailing.VesselName}</p>
                                </div>
                              </div>
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border",
                                sailing.Status === 'On Time' ? 'text-emerald-700 bg-white border-emerald-100' : 'text-amber-700 bg-white border-amber-100'
                              )}>
                                {sailing.Status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Events Section */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 md:col-span-2 lg:col-span-1 flex flex-col group">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-purple-50 transition-colors">
                          <Ticket className="w-6 h-6 text-slate-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-xl tracking-tight leading-none">Stadium Pulse</h3>
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Regional Event Impact</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 flex-1">
                      {displayedEvents.map((event) => (
                        <div key={event.id} className="p-4 rounded-2xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group/item flex flex-col gap-3">
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="text-sm font-extrabold text-slate-900 group-hover/item:text-indigo-600 transition-colors line-clamp-1">
                              {event.name}
                            </h4>
                            <a href={event.url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1.5 hover:bg-white rounded-lg transition-colors">
                              <ExternalLink className="w-3.5 h-3.5 text-slate-300 hover:text-indigo-500" />
                            </a>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Date</span>
                                <span className="text-xs font-bold text-slate-700">
                                  {new Date(event.dates.start.localDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="w-px h-6 bg-slate-100" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Venue</span>
                                <span className="text-xs font-bold text-slate-700 line-clamp-1">
                                  {event._embedded.venues[0].name}
                                </span>
                              </div>
                            </div>
                            <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl shadow-lg shadow-indigo-100">
                              <span className="text-[11px] font-black tracking-tighter">
                                {event.dates.start.localTime.slice(0, 5)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Load More Button Container */}
              <div className="flex flex-col items-center gap-4 py-10">
                {(activeTab === "Parks & Discovery" && filteredDiscovery.length > visibleCount) ||
                 (activeTab === "Parking" && filteredParking.length > visibleCount) ||
                 (activeTab === "Hiking" && filteredHikingData.length > visibleCount) ||
                 (activeTab === "Traffic & Events" && filteredEvents.length > visibleCount) ? (
                  <button
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="group relative px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm hover:shadow-lg flex items-center gap-3"
                  >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Load More Results
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    You've reached the end of the line
                  </div>
                )}
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Showing {
                    activeTab === "Parks & Discovery" ? displayedDiscovery.length :
                    activeTab === "Parking" ? displayedParking.length :
                    activeTab === "Hiking" ? displayedHiking.length :
                    displayedEvents.length
                  } of {
                    activeTab === "Parks & Discovery" ? filteredDiscovery.length :
                    activeTab === "Parking" ? filteredParking.length :
                    activeTab === "Hiking" ? filteredHikingData.length :
                    filteredEvents.length
                  } Intelligence Records
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {!loading && !error && activeTab === "Parks & Discovery" && discoveryItems.length === 0 && (
          <div className="text-center py-40 bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <MapPin className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-slate-900 font-black text-2xl mb-4">No Facilities Detected</h3>
            <p className="text-slate-500 max-w-sm mx-auto text-lg leading-relaxed">
              Our intelligence engine couldn't locate active facilities in <span className="text-indigo-600 font-bold">{zipcode}</span>.
            </p>
            <button 
              onClick={() => setZipInput("98103")}
              className="mt-8 text-indigo-600 font-black uppercase tracking-widest text-xs hover:underline"
            >
              Try Seattle 98103
            </button>
          </div>
        )}

        {!loading && !error && activeTab === "Parking" && parking.length === 0 && (
          <div className="text-center py-40 bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Car className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-slate-900 font-black text-2xl mb-4">No Parking Data Found</h3>
            <p className="text-slate-500 max-w-sm mx-auto text-lg leading-relaxed">
              The sensor network in <span className="text-indigo-600 font-bold">{neighborhood}</span> is currently reporting no active records.
            </p>
          </div>
        )}
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600/10 p-2.5 rounded-xl">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tighter text-slate-900">Court Agent</span>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Intelligence Division</p>
            </div>
          </div>
          
          <p className="text-slate-500 text-xs font-bold leading-relaxed text-center md:text-left">
            &copy; {new Date().getFullYear()} Real-time simulation utilizing Seattle Open Data API. Designed for high-performance weekend planning.
          </p>
          
          <div className="flex justify-center md:justify-end gap-8">
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors text-[10px] font-black uppercase tracking-widest">System Status</a>
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors text-[10px] font-black uppercase tracking-widest">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
