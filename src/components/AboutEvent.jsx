import React from "react";

export default function AboutCard({ aboutEvent, description, eventPartner }) {
  return (
    <div className="space-y-6">
      {/* About Description */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          About This Event
        </h2>
        <p className="text-slate-600 leading-relaxed text-sm">
          {aboutEvent || description || "No detailed description available."}
        </p>
      </div>

      {/* Host/Partner Info */}
      {eventPartner && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          {eventPartner.logo && (
            <img
              src={eventPartner.logo}
              alt={eventPartner.businessName}
              className="w-12 h-12 rounded-full object-cover border border-slate-200"
            />
          )}
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {eventPartner.businessName}
            </h4>
            <p className="text-xs text-slate-500">
              Hosted by {eventPartner.contactPerson} • {eventPartner.city}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
