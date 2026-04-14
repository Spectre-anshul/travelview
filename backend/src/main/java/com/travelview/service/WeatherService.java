package com.travelview.service;

import com.travelview.model.WeatherResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class WeatherService {

    @Value("${weather.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // Curated mock weather data for 20+ major travel cities
    private static final Map<String, WeatherResponse> MOCK_DATA = new LinkedHashMap<>();

    static {
        MOCK_DATA.put("paris", new WeatherResponse("Paris", "FR", 18.5, 17.2, 62, 12.3, "Partly cloudy", "02d", 48.8566, 2.3522));
        MOCK_DATA.put("london", new WeatherResponse("London", "GB", 14.2, 12.8, 78, 15.1, "Light rain", "10d", 51.5074, -0.1278));
        MOCK_DATA.put("new york", new WeatherResponse("New York", "US", 22.1, 21.5, 55, 8.7, "Clear sky", "01d", 40.7128, -74.0060));
        MOCK_DATA.put("tokyo", new WeatherResponse("Tokyo", "JP", 24.8, 25.3, 70, 6.2, "Scattered clouds", "03d", 35.6762, 139.6503));
        MOCK_DATA.put("dubai", new WeatherResponse("Dubai", "AE", 38.4, 40.1, 35, 14.8, "Clear sky", "01d", 25.2048, 55.2708));
        MOCK_DATA.put("sydney", new WeatherResponse("Sydney", "AU", 21.6, 20.9, 65, 18.4, "Broken clouds", "04d", -33.8688, 151.2093));
        MOCK_DATA.put("rome", new WeatherResponse("Rome", "IT", 26.3, 26.8, 48, 9.1, "Sunny", "01d", 41.9028, 12.4964));
        MOCK_DATA.put("bali", new WeatherResponse("Bali", "ID", 29.7, 31.2, 82, 7.3, "Tropical showers", "09d", -8.3405, 115.0920));
        MOCK_DATA.put("maldives", new WeatherResponse("Maldives", "MV", 30.1, 32.0, 78, 10.5, "Partly cloudy", "02d", 3.2028, 73.2207));
        MOCK_DATA.put("santorini", new WeatherResponse("Santorini", "GR", 27.4, 27.0, 42, 20.1, "Clear sky", "01d", 36.3932, 25.4615));
        MOCK_DATA.put("bangkok", new WeatherResponse("Bangkok", "TH", 33.2, 37.5, 75, 5.8, "Thunderstorm", "11d", 13.7563, 100.5018));
        MOCK_DATA.put("cape town", new WeatherResponse("Cape Town", "ZA", 19.8, 18.5, 58, 22.3, "Windy", "50d", -33.9249, 18.4241));
        MOCK_DATA.put("reykjavik", new WeatherResponse("Reykjavik", "IS", 4.2, 0.8, 88, 28.7, "Overcast", "04d", 64.1466, -21.9426));
        MOCK_DATA.put("singapore", new WeatherResponse("Singapore", "SG", 31.0, 34.2, 80, 8.1, "Partly cloudy", "02d", 1.3521, 103.8198));
        MOCK_DATA.put("mumbai", new WeatherResponse("Mumbai", "IN", 32.5, 36.1, 72, 12.0, "Hazy", "50d", 19.0760, 72.8777));
        MOCK_DATA.put("rio de janeiro", new WeatherResponse("Rio de Janeiro", "BR", 28.9, 30.4, 68, 9.6, "Sunny", "01d", -22.9068, -43.1729));
        MOCK_DATA.put("marrakech", new WeatherResponse("Marrakech", "MA", 34.1, 33.5, 25, 11.2, "Clear sky", "01d", 31.6295, -7.9811));
        MOCK_DATA.put("barcelona", new WeatherResponse("Barcelona", "ES", 23.7, 23.1, 55, 13.4, "Few clouds", "02d", 41.3851, 2.1734));
        MOCK_DATA.put("istanbul", new WeatherResponse("Istanbul", "TR", 20.3, 19.8, 60, 16.7, "Partly cloudy", "02d", 41.0082, 28.9784));
        MOCK_DATA.put("cairo", new WeatherResponse("Cairo", "EG", 36.8, 35.2, 20, 14.0, "Clear sky", "01d", 30.0444, 31.2357));
    }

    /**
     * Fetches weather for a city. Uses OpenWeatherMap if API key is set, otherwise returns mock data.
     */
    public WeatherResponse getWeather(String city) {
        if (apiKey != null && !apiKey.isBlank()) {
            return fetchFromApi(city);
        }
        return getMockWeather(city);
    }

    /**
     * Returns all mock cities for the map to display markers.
     */
    public List<WeatherResponse> getAllCities() {
        return new ArrayList<>(MOCK_DATA.values());
    }

    private WeatherResponse getMockWeather(String city) {
        String key = city.toLowerCase().trim();
        WeatherResponse mock = MOCK_DATA.get(key);
        if (mock != null) {
            return mock;
        }
        // Return a generic response for unknown cities
        return new WeatherResponse(city, "??", 20.0, 19.0, 50, 10.0, "Data unavailable", "01d", 0, 0);
    }

    @SuppressWarnings("unchecked")
    private WeatherResponse fetchFromApi(String city) {
        try {
            String url = String.format(
                "https://api.openweathermap.org/data/2.5/weather?q=%s&appid=%s&units=metric",
                city, apiKey
            );
            Map<String, Object> data = restTemplate.getForObject(url, Map.class);
            if (data == null) return getMockWeather(city);

            Map<String, Object> main = (Map<String, Object>) data.get("main");
            Map<String, Object> wind = (Map<String, Object>) data.get("wind");
            List<Map<String, Object>> weatherList = (List<Map<String, Object>>) data.get("weather");
            Map<String, Object> coord = (Map<String, Object>) data.get("coord");
            Map<String, Object> sys = (Map<String, Object>) data.get("sys");

            String weatherDesc = weatherList.get(0).get("description").toString();
            String weatherIcon = weatherList.get(0).get("icon").toString();

            return new WeatherResponse(
                city,
                sys != null ? sys.getOrDefault("country", "").toString() : "",
                ((Number) main.get("temp")).doubleValue(),
                ((Number) main.get("feels_like")).doubleValue(),
                ((Number) main.get("humidity")).intValue(),
                ((Number) wind.get("speed")).doubleValue(),
                weatherDesc.substring(0, 1).toUpperCase() + weatherDesc.substring(1),
                weatherIcon,
                ((Number) coord.get("lat")).doubleValue(),
                ((Number) coord.get("lon")).doubleValue()
            );
        } catch (Exception e) {
            System.err.println("API call failed for " + city + ": " + e.getMessage());
            return getMockWeather(city);
        }
    }
}
