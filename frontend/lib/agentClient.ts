const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Listing {
  listing_id: string;
  host_id: string;
  host_name: string;
  title: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    lat: number;
    lon: number;
  };
  stadium_distances: {
    metlife_minutes: number;
    metlife_transit_mode: string;
  };
  pricing: {
    price_per_night: number;
    cleaning_fee: number;
    currency: string;
  };
  availability: Array<{ date: string; available: boolean }>;
  amenities: string[];
  house_rules: string;
  languages_spoken: string[];
  team_welcome: string[];
  max_guests: number;
  photos: string[];
  host_verified: boolean;
  status: string;
}

export interface Match {
  match_id: string;
  date: string;
  time: string;
  stadium: string;
  home_team: string;
  away_team: string;
  round: string;
  expected_attendance: "low" | "medium" | "high";
  surge_indicator: boolean;
}

export interface Booking {
  booking_id: string;
  listing_id: string;
  host_id: string;
  fan_id: string;
  fan_name: string;
  dates: {
    check_in: string;
    check_out: string;
  };
  guests: number;
  total_price: number;
  status: "requested" | "accepted" | "confirmed" | "active" | "completed" | "cancelled";
  contract_url: string;
  match_reference: string;
  team_rooting_for?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  role: "assistant";
  content: string;
  recommended_listings?: Listing[];
  matched_matches?: Match[];
}

export async function sendChatMessage(messages: ChatMessage[], language = "en"): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, language }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}

export async function fetchListings(params?: {
  query?: string;
  dates?: string;
  max_price?: number;
  languages?: string;
  team_preference?: string;
}): Promise<Listing[]> {
  const queryParams = new URLSearchParams();
  if (params?.query) queryParams.append("query", params.query);
  if (params?.dates) queryParams.append("dates", params.dates);
  if (params?.max_price) queryParams.append("max_price", params.max_price.toString());
  if (params?.languages) queryParams.append("languages", params.languages);
  if (params?.team_preference) queryParams.append("team_preference", params.team_preference);

  const res = await fetch(`${API_BASE_URL}/api/listings?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch listings");
  return res.json();
}

export async function fetchListingById(id: string): Promise<Listing> {
  const res = await fetch(`${API_BASE_URL}/api/listings/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch listing ${id}`);
  return res.json();
}

export interface ListingCreateInput {
  host_id: string;
  host_name: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lon: number;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  house_rules: string;
  amenities: string[];
  languages_spoken: string[];
  team_welcome: string[];
  availability_dates: string[];
  currency: string;
}

export async function createListing(listingData: ListingCreateInput): Promise<Listing> {
  const res = await fetch(`${API_BASE_URL}/api/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(listingData),
  });
  if (!res.ok) throw new Error("Failed to create listing");
  return res.json();
}

export async function createBookingRequest(bookingData: {
  listing_id: string;
  host_id: string;
  fan_id: string;
  fan_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  language?: string;
  team_rooting_for?: string;
}): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData),
  });
  if (!res.ok) throw new Error("Failed to create booking request");
  return res.json();
}

export async function fetchBookings(userId: string, role: "host" | "fan"): Promise<Booking[]> {
  const res = await fetch(`${API_BASE_URL}/api/bookings?user_id=${userId}&role=${role}`);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

export async function updateBookingStatus(bookingId: string, status: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update booking status");
  return res.json();
}

export async function deleteBooking(bookingId: string): Promise<{ status: string; booking_id: string }> {
  const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete booking");
  return res.json();
}

export async function fetchContract(bookingId: string): Promise<{ booking_id: string; contract_text: string }> {
  const res = await fetch(`${API_BASE_URL}/api/contracts/${bookingId}`);
  if (!res.ok) throw new Error("Failed to fetch contract");
  return res.json();
}

export async function fetchMatches(dateRange?: string, stadium?: string): Promise<Match[]> {
  const queryParams = new URLSearchParams();
  if (dateRange) queryParams.append("date_range", dateRange);
  if (stadium) queryParams.append("stadium", stadium);
  const res = await fetch(`${API_BASE_URL}/api/matches?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

export interface User {
  id: string;
  name: string;
  role: "fan" | "host";
  avatarUrl: string;
  email: string;
}

export async function registerUser(firstName: string, lastName: string, email: string, code: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ first_name: firstName, last_name: lastName, email, code }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Registration failed");
  }
  return res.json();
}

export async function loginUser(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Login failed");
  }
  return res.json();
}

export async function fetchUserById(userId: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}
