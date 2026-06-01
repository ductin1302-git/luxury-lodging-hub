import { ExternalLink, MapPin, Navigation } from "lucide-react";

type LocationMapProps = {
  title: string;
  address: string;
  subtitle?: string;
  language: "vi" | "en";
};

const LocationMap = ({ title, address, subtitle, language }: LocationMapProps) => {
  const normalizedAddress = String(address || "").trim();

  if (!normalizedAddress) return null;

  const encodedAddress = encodeURIComponent(normalizedAddress);
  const mapSrc = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[16/10] w-full bg-slate-100">
        <iframe
          title={title}
          src={mapSrc}
          className="h-full w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-gold">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-lg font-bold text-slate-950">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            <p className="mt-2 text-sm leading-6 text-slate-600">{normalizedAddress}</p>
          </div>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-gold hover:text-primary"
        >
          <Navigation className="h-4 w-4" />
          {language === "en" ? "Get directions" : "Chỉ đường"}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
};

export default LocationMap;
