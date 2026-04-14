package com.travelview.model;

public class WeatherResponse {
    private String city;
    private String country;
    private double temp;
    private double feelsLike;
    private int humidity;
    private double windSpeed;
    private String description;
    private String icon;
    private double lat;
    private double lon;

    public WeatherResponse() {}

    public WeatherResponse(String city, String country, double temp, double feelsLike,
                           int humidity, double windSpeed, String description, String icon,
                           double lat, double lon) {
        this.city = city;
        this.country = country;
        this.temp = temp;
        this.feelsLike = feelsLike;
        this.humidity = humidity;
        this.windSpeed = windSpeed;
        this.description = description;
        this.icon = icon;
        this.lat = lat;
        this.lon = lon;
    }

    // Getters and Setters
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public double getTemp() { return temp; }
    public void setTemp(double temp) { this.temp = temp; }

    public double getFeelsLike() { return feelsLike; }
    public void setFeelsLike(double feelsLike) { this.feelsLike = feelsLike; }

    public int getHumidity() { return humidity; }
    public void setHumidity(int humidity) { this.humidity = humidity; }

    public double getWindSpeed() { return windSpeed; }
    public void setWindSpeed(double windSpeed) { this.windSpeed = windSpeed; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLon() { return lon; }
    public void setLon(double lon) { this.lon = lon; }
}
