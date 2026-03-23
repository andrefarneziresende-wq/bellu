/**
 * Geocoding service using OpenStreetMap Nominatim (free, no API key needed)
 * For production with high volume, consider Google Maps Geocoding API.
 */

interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const encoded = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Bellu-App/1.0',
          'Accept-Language': 'pt-BR,pt,en',
        },
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as NominatimResult[];
    if (data.length === 0) return null;

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch {
    return null;
  }
}

interface AddressSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
}

export async function searchAddresses(query: string, limit = 5): Promise<AddressSuggestion[]> {
  try {
    const encoded = encodeURIComponent(query);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=${limit}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Bellu-App/1.0',
          'Accept-Language': 'pt-BR,pt,en',
        },
      },
    );

    if (!response.ok) return [];

    const data = (await response.json()) as NominatimResult[];
    return data.map((item) => ({
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}
