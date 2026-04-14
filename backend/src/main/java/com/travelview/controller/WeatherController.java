package com.travelview.controller;

import com.travelview.model.WeatherResponse;
import com.travelview.service.WeatherService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    /**
     * GET /api/weather?city=Paris
     * Returns weather for a single city.
     */
    @GetMapping("/weather")
    public WeatherResponse getWeather(@RequestParam String city) {
        return weatherService.getWeather(city);
    }

    /**
     * GET /api/cities
     * Returns all available cities with their weather and coordinates (for map markers).
     */
    @GetMapping("/cities")
    public List<WeatherResponse> getAllCities() {
        return weatherService.getAllCities();
    }
}
