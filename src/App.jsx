import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import EventCard from "./components/EventCards";
import AboutCard from "./components/AboutEvent";

const API_BASE_URL = "/api/admin/events";
const JWT_TOKEN = import.meta.env.VITE_WELVORS_API_TOKEN;

const getValidToken = () => {
  if (!JWT_TOKEN) {
    throw new Error(
      "Authorization token is missing. Please set VITE_WELVORS_API_TOKEN in .env.local",
    );
  }

  try {
    const decoded = jwtDecode(JWT_TOKEN);
    const currentTime = Date.now() / 1000;

    if (decoded.exp && decoded.exp < currentTime) {
      throw new Error(
        "Authorization token has expired. Please update your Bearer token in .env.local.",
      );
    }
    return JWT_TOKEN;
  } catch (err) {
    if (err.message.includes("expired")) throw err;
    throw new Error("Invalid JWT Token structure.");
  }
};

// Helper: Format event dates for Details View (e.g., "Sat, Sep 14 • 7:00 PM")
const formatEventDate = (dateString) => {
  if (!dateString) return "Date TBA";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const day = date.getDate();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${dayName}, ${monthName} ${day} • ${hours}:${minutes} ${ampm}`;
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(
    window.location.hash || "#/",
  );
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All Events");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Event Details State
  const [eventDetails, setEventDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash || "#/");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getValidToken();

      const response = await fetch(`${API_BASE_URL}/get`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Unauthorized access (401/403). Please check or renew your JWT Bearer token.",
        );
      }
      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.data || data.events || [];
      setEvents(list);
      setFilteredEvents(list);
    } catch (err) {
      setError(err.message || "Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 2. Fetch Single Event Details
  const fetchEventDetails = async (id) => {
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const token = getValidToken();

      const response = await fetch(`${API_BASE_URL}/details/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized access to event details.");
      }
      if (!response.ok) {
        throw new Error(
          `Event not found or request failed (${response.status})`,
        );
      }

      const data = await response.json();
      setEventDetails(data.data || data.event || data);
    } catch (err) {
      setDetailsError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Route Handler for Event Details Page (#/events/:id)
  useEffect(() => {
    if (currentRoute.startsWith("#/events/")) {
      const eventId = currentRoute.replace("#/events/", "");
      if (eventId) {
        fetchEventDetails(eventId);
      }
    }
  }, [currentRoute]);

  // Client-side Filters & Search Logic
  useEffect(() => {
    let result = [...events];

    if (activeFilter === "Free Events") {
      result = result.filter(
        (e) =>
          !e.price || e.price === 0 || e.isFree || e.womenEntryPrice === "0",
      );
    } else if (activeFilter === "This Week") {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      result = result.filter((e) => {
        const eventDate = new Date(e.date || e.startDate || e.eventDate);
        return eventDate >= now && eventDate <= nextWeek;
      });
    }

    if (searchQuery.trim() !== "") {
      result = result.filter((e) => {
        const title = e.title || e.name || "";
        return title.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setFilteredEvents(result);
  }, [activeFilter, searchQuery, events]);

  const navigateTo = (hash) => {
    window.location.hash = hash;
  };

  const isDetailsView = currentRoute.startsWith("#/events/");

  return (
    <div className="min-h-screen bg-[#FFFDF9] font-['DM_Sans',sans-serif] text-slate-800 flex flex-col selection:bg-rose-100 selection:text-[#E6536F]">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-rose-100/60 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigateTo("#/")}
            className="text-2xl font-bold text-[#E6536F] tracking-tight hover:opacity-90 transition focus:outline-none"
          >
            Welvors
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                navigateTo("#/");
              }}
              className="hover:text-[#E6536F] transition"
            >
              Events
            </a>
            <a href="#discover" className="hover:text-[#E6536F] transition">
              Discover
            </a>
            <a href="#about" className="hover:text-[#E6536F] transition">
              About
            </a>
            <a href="#blog" className="hover:text-[#E6536F] transition">
              Blog
            </a>
            <button className="bg-[#E6536F] text-white px-5 py-2 rounded-xl font-semibold shadow-sm hover:bg-[#d4435f] transition">
              Sign In
            </button>
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 px-2 border-t border-rose-100 mt-3 flex flex-col gap-3">
            <a
              href="#/"
              onClick={() => {
                setMobileMenuOpen(false);
                navigateTo("#/");
              }}
              className="text-slate-600 font-medium py-1"
            >
              Events
            </a>
            <a
              href="#discover"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-600 font-medium py-1"
            >
              Discover
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-600 font-medium py-1"
            >
              About
            </a>
            <a
              href="#blog"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-600 font-medium py-1"
            >
              Blog
            </a>
            <button className="bg-[#E6536F] text-white w-full py-2.5 rounded-xl font-semibold mt-2">
              Sign In
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isDetailsView ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                {[
                  "All Events",
                  "This Week",
                  "This Month",
                  "Near You",
                  "Free Events",
                  "Premium",
                ].map((pill) => {
                  const isActive = activeFilter === pill;
                  return (
                    <button
                      key={pill}
                      onClick={() => setActiveFilter(pill)}
                      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-[#E6536F] text-white shadow-md shadow-rose-200"
                          : "bg-white text-slate-700 hover:bg-rose-50 border border-slate-200/80"
                      }`}
                    >
                      {pill}
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search events by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 text-sm focus:outline-none focus:border-[#E6536F] bg-white"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">
                  🔍
                </span>
              </div>
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-3xl p-4 shadow-sm animate-pulse border border-slate-100 h-[430px] flex flex-col justify-between"
                  >
                    <div className="bg-slate-200 h-48 rounded-2xl w-full"></div>
                    <div className="space-y-3 mt-4">
                      <div className="bg-slate-200 h-6 rounded-md w-3/4"></div>
                      <div className="bg-slate-200 h-4 rounded-md w-1/2"></div>
                      <div className="bg-slate-200 h-4 rounded-md w-2/3"></div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <div className="bg-slate-200 h-10 rounded-xl flex-1"></div>
                      <div className="bg-slate-200 h-10 rounded-xl flex-1"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center my-12 max-w-md mx-auto">
                <p className="text-rose-700 font-medium mb-4">{error}</p>
                <button
                  onClick={fetchEvents}
                  className="bg-[#E6536F] text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-[#d4435f] transition"
                >
                  Retry Loading
                </button>
              </div>
            )}

            {!loading && !error && filteredEvents.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 my-6">
                <h3 className="text-lg font-semibold text-slate-700">
                  No events found
                </h3>
                <p className="text-slate-500 mt-1 text-sm">
                  Try choosing another filter or resetting search query.
                </p>
              </div>
            )}

            {!loading && !error && filteredEvents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event, index) => (
                  <EventCard
                    key={event.id || event._id || index}
                    event={event}
                    index={index}
                    onNavigate={navigateTo}
                    onRegister={(title) => alert(`Registered for: ${title}`)}
                  />
                ))}
              </div>
            )}

            <div className="mt-16 bg-[#E6536F] rounded-3xl p-8 sm:p-12 text-center text-white shadow-lg relative overflow-hidden">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Premium Events Exclusive Access
              </h2>
              <p className="text-rose-100 max-w-2xl mx-auto text-sm sm:text-base mb-6">
                Upgrade to Premium membership for exclusive access to VIP
                events, private gatherings, and members-only experiences
                designed for meaningful connections.
              </p>
              <button className="bg-white text-[#E6536F] font-bold px-8 py-3 rounded-full shadow-md hover:bg-rose-50 transition">
                Explore Premium
              </button>
            </div>
          </>
        ) : (
          <div className="max-w-4xl mx-auto py-4">
            <button
              onClick={() => navigateTo("#/")}
              className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#E6536F] transition"
            >
              ← Back to Events
            </button>

            {detailsLoading && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-pulse space-y-6">
                <div className="bg-slate-200 h-64 rounded-2xl w-full"></div>
                <div className="bg-slate-200 h-8 rounded-lg w-1/2"></div>
                <div className="bg-slate-200 h-20 rounded-lg w-full"></div>
              </div>
            )}

            {detailsError && (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center my-8">
                <h3 className="text-lg font-bold text-rose-800 mb-2">
                  Event Not Found
                </h3>
                <p className="text-rose-700 text-sm mb-4">{detailsError}</p>
                <button
                  onClick={() => navigateTo("#/")}
                  className="bg-[#E6536F] text-white px-6 py-2 rounded-xl text-sm font-semibold"
                >
                  Return to Listing
                </button>
              </div>
            )}

            {!detailsLoading && !detailsError && eventDetails && (
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                <div className="relative h-72 sm:h-96 w-full bg-slate-900">
                  <img
                    src={eventDetails.heroImage || eventDetails.coverImage}
                    alt={eventDetails.title}
                    className="w-full h-full object-cover opacity-85"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-6 sm:p-10 flex flex-col justify-end text-white">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-[#E6536F] text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {eventDetails.eventType || "Featured Event"}
                      </span>
                      {eventDetails.bookingStats?.fillingFast && (
                        <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          ⚡ Filling Fast
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">
                      {eventDetails.title}
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm flex items-center gap-2">
                      <span>
                        📍 {eventDetails.fullAddress || eventDetails.location}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-10 space-y-10">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-[#FFFDF9] rounded-2xl border border-rose-100/80">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        DATE & TIME
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {formatEventDate(
                          eventDetails.eventDate || eventDetails.date,
                        )}
                      </span>
                      {eventDetails.startTime && (
                        <span className="text-xs text-slate-500 block">
                          {eventDetails.startTime} - {eventDetails.endTime}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        SPOTS LEFT
                      </span>
                      <span className="text-sm font-bold text-[#E6536F]">
                        {eventDetails.bookingStats?.spotsLeft ??
                          eventDetails.totalCapacity}{" "}
                        / {eventDetails.totalCapacity}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        {eventDetails.bookingStats?.bookingSummary}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        PRICING (MEN)
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        ₹
                        {eventDetails.menDiscountedPrice ||
                          eventDetails.menEntryPrice ||
                          "N/A"}
                      </span>
                      {eventDetails.menDiscountedPrice && (
                        <span className="text-xs text-slate-400 line-through block">
                          ₹{eventDetails.menEntryPrice}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        PRICING (WOMEN)
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        ₹
                        {eventDetails.womenDiscountedPrice ||
                          eventDetails.womenEntryPrice ||
                          "N/A"}
                      </span>
                      {eventDetails.womenDiscountedPrice && (
                        <span className="text-xs text-slate-400 line-through block">
                          ₹{eventDetails.womenEntryPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <AboutCard
                    aboutEvent={eventDetails.aboutEvent}
                    description={eventDetails.description}
                    eventPartner={eventDetails.eventPartner}
                  />

                  {eventDetails.whyShouldCome?.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 mb-4">
                        Why You Should Join
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {eventDetails.whyShouldCome.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl border border-slate-100 bg-white shadow-xs"
                          >
                            <h3 className="font-bold text-sm text-slate-800 mb-1">
                              {item.title}
                            </h3>
                            <p className="text-xs text-slate-500 leading-normal">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {eventDetails.amenities?.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 mb-3">
                        Included Amenities
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {eventDetails.amenities.map((amenity) => (
                          <span
                            key={amenity.id}
                            className="bg-rose-50 text-[#E6536F] border border-rose-100 text-xs font-semibold px-3 py-1.5 rounded-xl"
                          >
                            ✓ {amenity.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {eventDetails.galleryImages?.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 mb-3">
                        Event Gallery
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {eventDetails.galleryImages.map((img) => (
                          <img
                            key={img.id}
                            src={img.imageUrl}
                            alt="Gallery preview"
                            className="w-full h-40 object-cover rounded-2xl border border-slate-100"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {eventDetails.itinerary?.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 mb-4">
                        Event Itinerary
                      </h2>
                      <div className="space-y-4 border-l-2 border-rose-200 pl-4 sm:pl-6">
                        {eventDetails.itinerary.map((step) => (
                          <div key={step.id} className="relative">
                            <div className="absolute -left-[25px] sm:-left-[33px] top-0.5 w-3 h-3 rounded-full bg-[#E6536F] ring-4 ring-rose-50"></div>
                            <div className="flex items-center gap-2 text-xs font-bold text-[#E6536F]">
                              <span>
                                Day {step.dayNumber} • {step.time}
                              </span>
                              {step.location && (
                                <span className="text-slate-400">
                                  ({step.location})
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                              {step.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              {step.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {eventDetails.safetyFeatures?.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 mb-3">
                        Safety Measures
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {eventDetails.safetyFeatures.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl"
                          >
                            <span>🛡️</span>
                            <span>{item.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {eventDetails.faqs?.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 mb-3">
                        Frequently Asked Questions
                      </h2>
                      <div className="space-y-3">
                        {eventDetails.faqs.map((faq) => (
                          <div
                            key={faq.id}
                            className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                          >
                            <h3 className="text-xs font-bold text-slate-800 mb-1">
                              Q: {faq.question}
                            </h3>
                            <p className="text-xs text-slate-600">
                              A: {faq.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {eventDetails.termsConditions && (
                    <div className="pt-4 border-t border-slate-100">
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Terms & Conditions
                      </h2>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {eventDetails.termsConditions}
                      </p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold">
                        TICKET PRICE STARTS AT
                      </span>
                      <span className="text-xl font-bold text-[#E6536F]">
                        ₹
                        {eventDetails.womenDiscountedPrice ||
                          eventDetails.womenEntryPrice ||
                          "Free"}
                      </span>
                    </div>
                    <button
                      onClick={() => alert("Proceeding to registration...")}
                      className="bg-[#E6536F] hover:bg-[#d4435f] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition"
                    >
                      Register Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-[#1C1821] text-slate-300 pt-16 pb-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-5">
                PRODUCT
              </h3>
              <ul className="space-y-3 text-sm text-slate-400 font-medium">
                <li>
                  <a href="#download" className="hover:text-white transition">
                    Download App
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#discover" className="hover:text-white transition">
                    Discover
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-5">
                COMPANY
              </h3>
              <ul className="space-y-3 text-sm text-slate-400 font-medium">
                <li>
                  <a href="#about" className="hover:text-white transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#blog" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#careers" className="hover:text-white transition">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#press" className="hover:text-white transition">
                    Press
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-5">
                SUPPORT
              </h3>
              <ul className="space-y-3 text-sm text-slate-400 font-medium">
                <li>
                  <a href="#help" className="hover:text-white transition">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#safety" className="hover:text-white transition">
                    Safety Tips
                  </a>
                </li>
                <li>
                  <a href="#report" className="hover:text-white transition">
                    Report
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-5">
                LEGAL
              </h3>
              <ul className="space-y-3 text-sm text-slate-400 font-medium">
                <li>
                  <a href="#privacy" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" className="hover:text-white transition">
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="#community" className="hover:text-white transition">
                    Community Guidelines
                  </a>
                </li>
                <li>
                  <a href="#cookie" className="hover:text-white transition">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-medium">
              © 2024 Welvors. All rights reserved.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="#facebook"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 hover:text-white transition"
                aria-label="Facebook"
              >
                f
              </a>
              <a
                href="#x"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 hover:text-white transition"
                aria-label="X / Twitter"
              >
                𝕏
              </a>
              <a
                href="#linkedin"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 hover:text-white transition"
                aria-label="LinkedIn"
              >
                in
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
