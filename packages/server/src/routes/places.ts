import { Router } from 'express';
import { getSetting } from '../db.js';

const router = Router();

// Haversine formula for initial sorting (before Routes API call)
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get route distance using Google Routes API
async function getRouteDistance(
  apiKey: string,
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  travelMode: 'DRIVE' | 'BICYCLE'
): Promise<number | null> {
  try {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters',
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
        destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
        travelMode,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Routes API error (${travelMode}):`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`Routes API response (${travelMode}):`, JSON.stringify(data));
    const meters = data.routes?.[0]?.distanceMeters;
    if (typeof meters === 'number') {
      return Math.round((meters * 2 / 1609.34) * 10) / 10; // Convert to miles, double for round trip, round to 1 decimal
    }
    console.log(`Routes API: No distance in response for ${travelMode}`);
    return null;
  } catch (error) {
    console.error(`Routes API error (${travelMode}):`, error);
    return null;
  }
}

interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  drivingDistance: number;
  bikingDistance: number;
}

// GET /api/places/search - Search for places near a location (using Places API New)
router.get('/search', async (req, res) => {
  const apiKey = getSetting('google_places_api_key');

  if (!apiKey) {
    return res.status(503).json({
      error: 'Google Places API key not configured. Add it in Settings.'
    });
  }

  const { query, lat, lng } = req.query;

  if (!query || !lat || !lng) {
    return res.status(400).json({
      error: 'Missing required parameters: query, lat, lng'
    });
  }

  const userLat = parseFloat(lat as string);
  const userLng = parseFloat(lng as string);

  try {
    // Using Places API (New) - Text Search
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: {
          circle: {
            center: { latitude: userLat, longitude: userLng },
            radius: 50000.0, // 50km radius
          },
        },
        maxResultCount: 10,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', response.status, errorText);
      return res.status(502).json({ error: 'Failed to search places' });
    }

    const data = await response.json();

    // First, get basic place info and sort by straight-line distance
    const rawPlaces = (data.places || []).map((place: any) => {
      const placeLat = place.location?.latitude;
      const placeLng = place.location?.longitude;
      const straight = haversineDistance(userLat, userLng, placeLat, placeLng);
      return {
        name: place.displayName?.text || 'Unknown',
        address: place.formattedAddress || '',
        lat: placeLat,
        lng: placeLng,
        straightDistance: Math.round(straight * 2 * 10) / 10 || 0,  // Double for round trip
      };
    }).filter((p: any) => p.lat && p.lng) // Filter out places without coordinates
      .sort((a: any, b: any) => a.straightDistance - b.straightDistance)
      .slice(0, 5); // Limit to 5 for Routes API calls

    console.log('Raw places found:', rawPlaces.length);

    // Get actual driving and biking distances for top results
    const places: PlaceResult[] = await Promise.all(
      rawPlaces.map(async (place: any) => {
        const [drivingDistance, bikingDistance] = await Promise.all([
          getRouteDistance(apiKey, userLat, userLng, place.lat, place.lng, 'DRIVE'),
          getRouteDistance(apiKey, userLat, userLng, place.lat, place.lng, 'BICYCLE'),
        ]);

        return {
          name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          drivingDistance: drivingDistance ?? place.straightDistance,
          bikingDistance: bikingDistance ?? place.straightDistance,
        };
      })
    );

    // Sort by driving distance
    places.sort((a, b) => a.drivingDistance - b.drivingDistance);

    res.json({ places });
  } catch (error) {
    console.error('Places search error:', error);
    res.status(500).json({ error: 'Failed to search places' });
  }
});

export default router;
