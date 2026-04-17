# TravelView Architecture & Technical Documentation

This document provides an intense, deep-researched overview of the TravelView project folder. It explains what technologies are used, how the microservices are coupled, how the data flows, and how the application is deployed into production.

---

## 1. High-Level Architecture

TravelView is an elite AI-powered travel concierge. It employs a **three-tier microservice architecture** to separate the user interface, heavy AI inference, and standard data fetching:

1. **Frontend (React + Vite)**: The client-side application. It provides an immersive UI, the itinerary generation flow, and interactive maps. Hosted on **Vercel**.
2. **AI Inference Backend (Python / Flask)**: A dedicated microservice acting as a wrapper for the **Groq API**. It handles the heavy lifting of prompting the LLM and forcing strict JSON-schema outputs for trip itineraries. Hosted on **Render**.
3. **Auxiliary Data Backend (Java / Spring Boot)**: A secondary microservice handling traditional REST payloads like fetching hardcoded city lists and interacting with the OpenWeatherMap API for live global weather. Hosted on **Render**.

---

## 2. Directory Deep Dive

### 2.1 The React Frontend (`/src` & `/`)
The frontend leverages React 19, Vite as the bundler, TypeScript for type safety, and `framer-motion` for fluid luxury animations.

- **`package.json` & `vite.config.ts`**: Defines the project, handles build scripts (`npm run build`), and maps Vite environment variables natively.
- **`/src/styles.css`**: The singular global stylesheet containing all CSS variables, typography setups, and specific scoped styles (like `.itin-map-wrap` and map popup specifics).
- **Interactive Global Elements**:
  - `MapOverlay.tsx`: A global map explorer triggered by the bottom-right globe icon. It fetches a list of cities from the Java backend (`/api/cities`) using vanilla Leaflet map instances. When the user hovers over a city marker, it triggers a live weather fetch (`/api/weather`).
  - `Chatbot.tsx`: A sticky floating AI assistant in the bottom-left. Routes conversations through the Groq backend (`/groq/chat`) using Llama 3.3 70B, with a comprehensive system prompt containing full app knowledge. Provides contextual help, navigation guidance, and travel query answers.
- **The Core Generation Flow**:
  - `BookingModal.tsx` & `TravelPage.tsx`: The wizard where users define their journey parameters (destination, dates, budget, vibe).
  - `EscapeLoader.tsx`: The suspense state. Behind the scenes, it shoots an HTTP POST request to the Python backend (`/groq/ask`) containing the user's parameters.
  - `ItineraryPage.tsx`: The results visualizer. It takes the deeply structured JSON returned by Groq and renders:
    1. A day-by-day vertical timeline card view.
    2. An interactive Route Overview Map (Vanilla Leaflet with OpenStreetMap tiles), mapping out the coordinates provided by the AI, and even drawing routing lines using the open OSRM routing API.

### 2.2 The AI Backend (`/groq-backend`)
A lightweight, lightning-fast Python API designed purely for LLM interaction.

- **`requirements.txt`**: Standard dependencies — Flask, Flask-CORS, groq, and gunicorn.
- **`app.py`**: The application shell. Sets up the Flask server, exposes a crucial `/health` endpoint for Render uptime checks, and binds CORS (`CORS(app)`) to ensure the Vercel frontend is not blocked by browser CORS policies.
- **`routes.py`**: Houses the main `/groq/ask` POST endpoint. It reads the incoming user constraints.
- **`groq_service.py`**: Contains the complex system prompt design. It queries Groq's high-speed inference models (like `llama3-70b-8192`) and provides it with a strict, complex JSON Schema. This ensures that every time Groq replies, the output perfectly matches the TypeScript interfaces expected in `ItineraryPage.tsx` (such as returning exact arrays of `lat` and `lon` for locations).

### 2.3 The Weather Data Backend (`/backend`)
A standard object-oriented Java backend.

- **`pom.xml`**: Maven dependency tree pulling in Spring Web and JSON manipulators.
- **`src/main/resources/application.properties`**: Controls the `server.port` and handles the injection of the `WEATHER_API_KEY` (OpenWeatherMap).
- **`controller/` & `service/`**: 
  - Exposes the `/api/cities` endpoint, returning an array of notable global destination coordinates.
  - Exposes the `/api/weather` endpoint. The service layer is built resiliently — if no API key is provided in production, it seamlessly defaults to returning mock weather data so the frontend map never crashes.

---

## 3. Coupling & Data Flow (How It Works Together)

The magic of TravelView is how these three completely distinct applications communicate asynchronously.

1. **Environmental Resolution (`SPRING_BACKEND` & `GROQ_BACKEND`)**:
   Instead of relying purely on Vite's build-time `.env` injection (which is prone to caching issues in CI edge cases), the frontend utilizes an intelligent runtime fallback:
   ```javascript
   const SPRING_BACKEND = import.meta.env.VITE_SPRING_BACKEND_URL 
     || (window.location.hostname !== 'localhost' ? 'https://travelview-weather.onrender.com' : 'http://localhost:8080');
   ```
   This ensures that if the app is hosted anywhere other than `localhost`, it automatically hooks into the production Render backend URLs.

2. **The End-to-End Itinerary Generation**:
   * **Client**: User fills out the form on Vercel (`TravelPage.tsx`).
   * **Network**: `EscapeLoader.tsx` POSTs the form data to `https://travelview-groq.onrender.com/groq/ask`.
   * **AI Layer**: Render server accepts the request, queries Groq via its API key securely.
   * **Response**: A massive customized JSON string is returned back to the user within seconds.
   * **Client**: `ItineraryPage.tsx` parses this JSON and dynamically paints the map components and day cards.

3. **Map Rendering & The OpenStreetMap "Gotchas"**:
   Because Vite dynamically bundles CSS, injecting Leaflet maps dynamically caused rendering bugs (blank grey tiles) in the production Vercel build. The coupling here was fixed by statically importing `import 'leaflet/dist/leaflet.css';` in `main.tsx`, forcing a container height via JS, and triggering aggressive `map.invalidateSize()` events directly after the DOM paints.

---

## 4. Production Deployment Landscape

| Service | Technology | Hosting Platform | Key Environment Variables Required |
| :--- | :--- | :--- | :--- |
| **Frontend** | React, Vite | **Vercel** (`travelview.vercel.app`) | `VITE_GROQ_BACKEND_URL`, `VITE_SPRING_BACKEND_URL` |
| **AI API** | Python, Flask | **Render** (`travelview-groq`) | `GROQ_API_KEY` |
| **Data API** | Java, Spring Boot | **Render** (`travelview-weather`) | `WEATHER_API_KEY` (Optional) |

### Key Production Configurations Addressed:
- **`vercel.json`**: Implemented on the frontend repository allowing for strict overriding of build commands and injection of security headers natively to Vercel's Edge Network caching.
- **Gunicorn**: The python application is run using the production WSGI server `gunicorn app:app` instead of the weak development Flask server, easily managing concurrent API requests when multiple visitors try generating itineraries simultaneously.
- **CORS Management**: The API strictly governs wildcard Origin parsing so `flask-cors` allows the cross-origin pre-flight requests sent from the Vercel app domain to the Render backend domain.
