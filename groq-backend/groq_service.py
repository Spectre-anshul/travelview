import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY", "").strip()
if not api_key:
    raise ValueError("GROQ_API_KEY not found in .env file!")

client = Groq(api_key=api_key)

def get_groq_feedback(prompt: str) -> str:
    """Send a prompt to Groq and return the response text."""
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a world-class travel planning AI. You always respond with valid JSON only. No markdown, no code fences, no extra text before or after the JSON object."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=8000,
    )
    return chat_completion.choices[0].message.content
