"use client";

import LocationCard from "./LocationCard";
import HorizontalScroll from "./HorizontalScroll";

interface LocationsCarouselProps {
  locations: any[];
}

export default function LocationsCarousel({ locations }: LocationsCarouselProps) {
  const locationData: { [key: string]: { address: string; googleMapsUrl: string; hours: string } } = {
    'Salisbury': {
      address: '111 W Bank Street\nSalisbury, NC 28144',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=111+W+Bank+Street+Salisbury+NC+28144',
      hours: 'Daily: 11AM-9PM EST'
    },
    'Charlotte Monroe': {
      address: '3130 Monroe Road\nCharlotte, NC 28205',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=3130+Monroe+Road+Charlotte+NC+28205',
      hours: 'Daily: 11AM-9PM EST'
    },
    'Charlotte Central': {
      address: '5115 Nations Ford Road\nCharlotte, NC 28217',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=5115+Nations+Ford+Road+Charlotte+NC+28217',
      hours: 'Daily: 11AM-9PM EST'
    },
    'Blowing Rock': {
      address: '3894 US 321\nBlowing Rock, NC 28605',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=3894+US+321+Blowing+Rock+NC+28605',
      hours: 'Daily: 11AM-9PM EST'
    },
    'Elizabethton': {
      address: '2157 W Elk Ave\nElizabethton, TN 37643',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=2157+W+Elk+Ave+Elizabethton+TN+37643',
      hours: 'Daily: 11AM-9PM EST'
    }
  };

  const filteredLocations = locations.filter((loc: any) => {
    const isActive = loc.is_active === "1";
    const isAllowed = !['hamas', 'warehouse'].includes(loc.name.toLowerCase());
    return isActive && isAllowed;
  });

  return (
    <HorizontalScroll className="flex overflow-x-auto gap-0 scrollbar-hide snap-x snap-mandatory -mx-px">
      {filteredLocations.map((location: any) => {
        const data = locationData[location.name] || { 
          address: location.address_line_1 
            ? `${location.address_line_1}\n${location.city || ''}, ${location.state || ''} ${location.postal_code || ''}`.trim()
            : '',
          googleMapsUrl: '',
          hours: 'Daily: 11AM-9PM EST'
        };

        return (
          <div
            key={location.id}
            className="flex-shrink-0 w-[75vw] sm:w-[45vw] md:w-[32vw] lg:w-[18vw] snap-start"
          >
            <LocationCard
              location={location}
              address={data.address}
              googleMapsUrl={data.googleMapsUrl}
              hours={data.hours}
            />
          </div>
        );
      })}
    </HorizontalScroll>
  );
}

