import React from "react";

const formatPrice = (price) => {
  if (price === undefined || price === null || price === 0 || price === "0") {
    return "Free";
  }
  return `₹${price}`;
};

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

export default function EventCard({ event, index, onNavigate, onRegister }) {
  const cardId = event.id || event._id || index;
  const title = event.title || event.name || "Untitled Event";
  const category =
    event.eventType || event.category || event.badge || "Featured";
  const date = formatEventDate(
    event.eventDate || event.date || event.startDate,
  );
  const location =
    event.fullAddress ||
    event.location ||
    event.city ||
    event.venue ||
    "Mumbai, India";
  const attendees =
    event.bookingStats?.bookedCount || event.attendeesCount || 30;
  const priceText = formatPrice(event.womenDiscountedPrice || event.price);
  const imageUrl = event.heroImage || event.coverImage || event.image;

  const cardBgColors = ["bg-[#E6536F]", "bg-[#7E527F]", "bg-[#3A80F6]"];
  const headerBg = cardBgColors[index % cardBgColors.length];

  return (
    <div
      tabIndex={0}
      onClick={() => onNavigate(`#/events/${cardId}`)}
      onKeyDown={(e) => e.key === "Enter" && onNavigate(`#/events/${cardId}`)}
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 flex flex-col cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#E6536F]"
    >
      <div className={`relative h-52 overflow-hidden ${headerBg}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : null}

        <div className="absolute inset-0 p-6 flex flex-col justify-between text-white bg-gradient-to-t from-black/60 via-transparent to-black/20">
          <div className="flex justify-between items-start">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
              {category}
            </span>
            <span className="bg-slate-900/80 text-white px-3 py-1 rounded-full text-xs font-bold">
              {priceText}
            </span>
          </div>
          {!imageUrl && (
            <h3 className="text-3xl font-serif font-medium leading-tight">
              {title.split(" ")[0]}
            </h3>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-3">
            {title}
          </h3>
          <div className="space-y-2 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span className="line-clamp-1">{date}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span className="line-clamp-1">{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👤</span>
              <span>{attendees} attending</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(`#/events/${cardId}`);
            }}
            className="flex-1 bg-[#F5F2EB] hover:bg-[#eae5d8] text-slate-800 font-semibold py-2.5 rounded-xl text-sm transition"
          >
            Learn More
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRegister(title);
            }}
            className="flex-1 bg-[#E6536F] hover:bg-[#d4435f] text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-sm"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
