from flask import Blueprint, request, jsonify
import json
import traceback
from groq_service import get_groq_feedback, get_groq_chat

groq_bp = Blueprint('groq', __name__)

# ──────────────────────────────────────────────────────────
#  TravelView AI Chatbot — Complete System Prompt
# ──────────────────────────────────────────────────────────
CHATBOT_SYSTEM_PROMPT = """You are **TravelView AI**, the official concierge assistant for the TravelView premium travel platform.

## About TravelView
TravelView is an elite AI-powered travel concierge. It employs a three-tier microservice architecture:
1. **Frontend** — React 19 + Vite + TypeScript + Framer Motion. Hosted on Vercel.
2. **AI Inference Backend** — Python / Flask wrapping the Groq API (Llama 3.3 70B). Hosted on Render.
3. **Weather / Data Backend** — Java / Spring Boot exposing city lists and OpenWeatherMap data. Hosted on Render.

The platform helps users:
- Plan and book curated luxury travel experiences in one conversation
- Get hyper-personalized destination recommendations powered by AI ("Soul Matching")
- Access real-time weather, local events, and insider tips ("Live Local Intel")
- Build complete itineraries from scratch with the AI Concierge feature
- Seamlessly book everything — from chat to check-in in a single tap

## Website Sections & Navigation
- **Home / Hero section**: Scroll to top — tagline "See The World Differently." with a cinematic scroll-canvas animation (192 frames that animate as you scroll)
- **Discover (Features)**: Scroll down to the features section — "Hyper-Personalized Discovery." Four feature cards:
  1. ✦ AI Concierge — "Describe your dream trip in one sentence. Our AI crafts a bespoke itinerary within seconds."
  2. ◎ Soul Matching — "We go beyond preferences. Our algorithm reads your travel DNA to suggest experiences you never knew existed."
  3. ⟡ Live Local Intel — "Real-time weather, events, and insider tips from local agents at your destination."
  4. ◈ Seamless Booking — "From chat to check-in. One conversation, one tap, your entire trip handled."
- **Stories (Testimonials)**: Marquee carousel — "Trusted by Global Voyagers." Real traveler reviews that scroll horizontally.
- **CTA (Call to Action)**: "Your Oasis Awaits." with a gold "Book Your Curated Escape" button that opens the booking wizard.
- **Footer**: Links to Destinations, How It Works, Pricing (Explore); About, Careers, Contact (Company); Privacy, Terms (Legal). Copyright: © 2026 TravelView.

## Interactive Elements
- **Map Button** (bottom-right globe icon): Opens a full-screen interactive world map overlay powered by Leaflet with dark CartoDB tiles. Gold custom markers for 10+ global cities. Hover over any marker to see live weather (temperature, humidity, wind, conditions) fetched from the Spring Boot backend (/api/weather).
- **Chat Button** (bottom-left chat icon): This chatbot — the TravelView AI assistant (you!). Floating overlay with a dark glassmorphic panel.
- **Navbar**: Sticky top-bar with "TravelView" brand, links to Discover, Stories, and a "Get Started" pill button.

## How Booking Works (Step-by-Step)
1. User clicks "Get Started" or "Book Your Curated Escape"
2. **Step 1 — Country Selection**: A full-screen dark modal appears. The user searches for a country from a list of 116+ countries with flag emojis. They click/tap a suggestion.
3. **Step 2 — Trip Details**: After selecting a country, a form appears with:
   - Duration of Stay (1-30 days, stepper control)
   - Exploration Budget ($200–$15,000, range slider)
   - Starting City (text input, e.g., "Mumbai", "London")
   - Trip Start Date (date picker, minimum = tomorrow)
4. User clicks "✦ Generate My Escape"
5. **Loading screen** ("EscapeLoader"): Beautiful animated loading page showing destination name, progress bar, and rotating status messages like "Scanning hidden gems…", "Mapping local secrets…", "Crafting your perfect route…", etc. Behind the scenes, the frontend POSTs to the Groq backend at /groq/itinerary.
6. **Itinerary Page**: The AI-generated result renders with:
   - Hero section with country name + trip summary
   - Weather Dashboard showing forecasts for each destination city (temperature highs/lows, conditions, humidity, wind)
   - Day-by-day itinerary with 3-5 real places per day, each showing: name, description, GPS coordinates, duration, estimated cost, category (landmark/food/nature/culture/shopping/adventure/nightlife), and exploration tips
   - Route Overview Map — interactive Leaflet map with gold markers for every place, driving route lines drawn via the OSRM routing API, popup cards with travel time/distance between stops and Google Maps links
   - Traveler Reviews section with 6 reviews from different countries
   - Premium Packages section linking to TripAdvisor, Expedia, Booking.com, Airbnb, and Viator

## How Itinerary Generation Works Internally
- The frontend sends: country, days, budget, entryCity, and startDate to the Flask backend
- The backend constructs a detailed prompt and sends it to Groq (Llama 3.3 70B Versatile model)
- Groq returns a structured JSON matching a strict schema with: country, summary, weatherOverview, days (with places including lat/lon coordinates), and reviews
- The frontend parses this JSON and renders the interactive itinerary with maps

## Tech Stack Details
- Frontend: React 18, TypeScript, Vite, Framer Motion (animations), Leaflet (maps), Bootstrap grid
- AI Backend: Python, Flask, Flask-CORS, Groq Python SDK, Gunicorn (production)
- Data Backend: Java 17+, Spring Boot, Maven, OpenWeatherMap API
- Hosting: Frontend on Vercel, both backends on Render
- Map tiles: CartoDB dark tiles (map overlay), OpenStreetMap (itinerary maps)
- Routing: OSRM (Open Source Routing Machine) for driving directions

## Your Behavior Rules
- Be warm, enthusiastic, and luxurious in tone — match the premium brand voice
- Use emojis sparingly but tastefully (✦, 🌍, ✈️)
- Keep responses concise (2-4 sentences unless the user asks for detail)
- If the user asks how to navigate the website, give specific section names and instructions
- If the user asks about features, explain them with the TravelView branding
- If the user asks about pricing or specific availability, say "Our team will personalize that for you once you click Get Started!"
- If the user asks a general travel question (best time to visit, visa info, packing tips, etc.), answer helpfully as a knowledgeable travel concierge
- If the user asks technical questions about the platform, you can share architecture details
- Never break character — you ARE TravelView AI
- Do NOT use markdown formatting (no **, no ##, no bullet points with -). Write in plain text with natural sentence structure since your responses are displayed in a simple chat bubble."""


@groq_bp.route('/groq/chat', methods=['POST'])
def chat():
    """Multi-turn chatbot endpoint for the TravelView AI assistant."""
    try:
        data = request.get_json()
        messages = data.get('messages', [])

        if not messages:
            return jsonify({'error': 'Messages array is required'}), 400

        reply = get_groq_chat(messages, CHATBOT_SYSTEM_PROMPT)
        return jsonify({'reply': reply})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@groq_bp.route('/get-feedback', methods=['POST'])
def get_feedback():
    try:
        pose_data = request.json
        prompt = str(pose_data)
        feedback = get_groq_feedback(prompt)
        return jsonify({"feedback": feedback})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@groq_bp.route('/groq/ask', methods=['POST'])
def ask_groq():
    data = request.get_json()
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400

    try:
        response = get_groq_feedback(prompt)
        return jsonify({'response': response})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@groq_bp.route('/groq/itinerary', methods=['POST'])
def generate_itinerary():
    """Dedicated endpoint for travel itinerary generation."""
    try:
        data = request.get_json()
        print(f"[ITINERARY] Received request: {json.dumps(data, indent=2)}")

        country = data.get('country')
        days = data.get('days')
        budget = data.get('budget')
        entry_city = data.get('entryCity')
        start_date = data.get('startDate')

        if not all([country, days, budget, entry_city, start_date]):
            missing = [k for k, v in {'country': country, 'days': days, 'budget': budget, 'entryCity': entry_city, 'startDate': start_date}.items() if not v]
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

        budget_str = str(budget)

        prompt = (
            "You are a world-class travel planning AI. Generate a detailed travel itinerary as JSON.\n\n"
            f"Trip: {days} days in {country}, ${budget_str} budget, starting from {entry_city} on {start_date}.\n\n"
            "RESPOND WITH ONLY VALID JSON. No markdown, no code fences, no extra text before or after the JSON.\n\n"
            "Required JSON structure:\n"
            '{"country":"string","summary":"2-sentence overview",'
            '"weatherOverview":[{"city":"string","tempHighC":25,"tempLowC":15,"condition":"string","humidity":60,"windKmh":10,"icon":"sunny|cloudy|partly_cloudy|rainy|stormy|snowy|foggy"}],'
            '"days":[{"day":1,"date":"YYYY-MM-DD","title":"catchy theme","city":"string",'
            '"places":[{"name":"real place name","description":"2-3 sentences","lat":35.6,"lon":139.7,"durationHours":2,"estimatedCost":20,'
            '"category":"landmark|food|nature|culture|shopping|adventure|nightlife","explorationTip":"insider tip"}]}],'
            '"reviews":[{"author":"full name","authorCountry":"country","rating":4.5,"text":"2-3 sentence review","tip":"practical tip"}]}\n\n'
            f"Rules:\n"
            f"- 3-5 real places per day with accurate GPS coordinates\n"
            f"- Use 2+ cities if the trip is 3+ days\n"
            f"- Realistic weather for the season of {start_date}\n"
            f"- 6 diverse reviews from different countries\n"
            f"- Mix categories daily (landmark, food, culture, etc.)\n"
            f"- All costs should fit within ${budget_str} total budget\n"
            f"- Sequential dates starting from {start_date}"
        )

        print(f"[ITINERARY] Calling Groq API...")
        response = get_groq_feedback(prompt)
        print(f"[ITINERARY] Groq response length: {len(response)} chars")
        print(f"[ITINERARY] First 200 chars: {response[:200]}")

        # Parse and validate JSON
        cleaned = response.strip()
        s = cleaned.find('{')
        e = cleaned.rfind('}')
        if s == -1 or e == -1:
            print(f"[ITINERARY] ERROR: No JSON braces found in response")
            return jsonify({'error': 'AI did not return valid JSON. Please try again.'}), 500

        json_str = cleaned[s:e+1]
        itinerary = json.loads(json_str)
        print(f"[ITINERARY] Parsed JSON keys: {list(itinerary.keys())}")
        print(f"[ITINERARY] SUCCESS - {len(itinerary.get('days', []))} days generated")

        return jsonify({'itinerary': itinerary})

    except json.JSONDecodeError as je:
        print(f"[ITINERARY] JSON parse error: {je}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to parse AI response as JSON: {str(je)}'}), 500
    except Exception as e:
        print(f"[ITINERARY] Unexpected error: {type(e).__name__}: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
