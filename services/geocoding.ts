export interface ReverseGeocodeResult {
  fullAddress: string;
  locality?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  landmark?: string;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  county?: string;
  city_district?: string;
  suburb?: string;
  neighbourhood?: string;
  state?: string;
  postcode?: string;
  country?: string;
  road?: string;
  residential?: string;
  pedestrian?: string;
  path?: string;
  amenity?: string;
  building?: string;
  public_building?: string;
  shop?: string;
  attraction?: string;
  landmark?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

const buildNominatimUrl = (lat: number, lng: number) => {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: 'json',
    addressdetails: '1',
    zoom: '18',
    extratags: '1',
  });
  return `${NOMINATIM_ENDPOINT}?${params.toString()}`;
};

const pickAddressValue = (address: NominatimAddress, keys: (keyof NominatimAddress)[]) => {
  for (const key of keys) {
    const value = address[key];
    if (value) {
      return value;
    }
  }
  return '';
};

export const reverseGeocode = async (lat: number, lng: number): Promise<ReverseGeocodeResult> => {
  const response = await fetch(buildNominatimUrl(lat, lng), {
    headers: {
      'User-Agent': 'CivicFixApp/1.0',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    throw new Error('Unable to reach the geocoding service.');
  }

  const data = (await response.json()) as NominatimResponse;
  if (!data.address) {
    throw new Error('No address found for this location.');
  }

  const address = data.address;
  const street = pickAddressValue(address, ['road', 'residential', 'pedestrian', 'path']);
  const locality = pickAddressValue(address, ['suburb', 'neighbourhood', 'city_district', 'village', 'town']);
  const city = pickAddressValue(address, ['city', 'town', 'village', 'hamlet', 'municipality', 'county']);
  const landmark = pickAddressValue(address, ['amenity', 'building', 'public_building', 'shop', 'attraction', 'landmark']);

  const fullAddress = data.display_name || [street, locality, city].filter(Boolean).join(', ');
  if (!fullAddress) {
    throw new Error('No address found for this location.');
  }

  return {
    fullAddress,
    locality: locality || undefined,
    street: street || undefined,
    city: city || undefined,
    state: address.state || undefined,
    pincode: address.postcode || undefined,
    country: address.country || undefined,
    landmark: landmark || undefined,
  };
};
