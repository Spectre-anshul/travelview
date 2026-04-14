from flask import Blueprint, request, jsonify
import json
import traceback
from groq_service import get_groq_feedback

groq_bp = Blueprint('groq', __name__)

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
