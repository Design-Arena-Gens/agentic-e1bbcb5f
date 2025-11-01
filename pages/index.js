import { useState, useEffect } from 'react'

export default function Home() {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchWeather()
    const interval = setInterval(fetchWeather, 600000) // Atualiza a cada 10 minutos
    return () => clearInterval(interval)
  }, [])

  const fetchWeather = async () => {
    try {
      setLoading(true)
      setError(null)

      // Coordenadas de São Paulo
      const lat = -23.5505
      const lon = -46.6333

      // API do Open-Meteo (gratuita e sem necessidade de API key)
      const currentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&timezone=America/Sao_Paulo`

      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code&timezone=America/Sao_Paulo&forecast_days=5`

      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentWeatherUrl),
        fetch(forecastUrl)
      ])

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error('Erro ao buscar dados meteorológicos')
      }

      const currentData = await currentResponse.json()
      const forecastData = await forecastResponse.json()

      setWeather(currentData)
      setForecast(forecastData)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const getWeatherIcon = (code) => {
    // Códigos WMO Weather interpretation
    if (code === 0) return '☀️'
    if (code <= 3) return '⛅'
    if (code <= 48) return '🌫️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '🌨️'
    if (code <= 82) return '🌧️'
    if (code <= 86) return '🌨️'
    if (code <= 99) return '⛈️'
    return '🌤️'
  }

  const getWeatherDescription = (code) => {
    if (code === 0) return 'Céu limpo'
    if (code <= 3) return 'Parcialmente nublado'
    if (code <= 48) return 'Neblina'
    if (code <= 67) return 'Chuva'
    if (code <= 77) return 'Neve'
    if (code <= 82) return 'Chuva forte'
    if (code <= 86) return 'Neve forte'
    if (code <= 99) return 'Tempestade'
    return 'Indefinido'
  }

  const getDayName = (dateStr) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const date = new Date(dateStr)
    return days[date.getDay()]
  }

  const willRainSoon = () => {
    if (!weather || !forecast) return false

    // Verifica se está chovendo agora
    if (weather.current.rain > 0) return true

    // Verifica previsão do dia atual
    if (forecast.daily.precipitation_probability_max[0] > 50) return true

    return false
  }

  const getNextRainInfo = () => {
    if (!forecast) return null

    for (let i = 0; i < forecast.daily.time.length; i++) {
      if (forecast.daily.precipitation_probability_max[i] > 50) {
        const date = new Date(forecast.daily.time[i])
        const today = new Date()

        if (date.toDateString() === today.toDateString()) {
          return 'Hoje'
        } else if (date.toDateString() === new Date(today.getTime() + 86400000).toDateString()) {
          return 'Amanhã'
        } else {
          return getDayName(forecast.daily.time[i])
        }
      }
    }

    return null
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">⏳ Carregando previsão do tempo para São Paulo...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">❌ {error}</div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>🌧️ Previsão de Chuva</h1>
      <div className="subtitle">São Paulo, Brasil</div>

      {willRainSoon() && (
        <div className="rain-alert">
          <h3>⚠️ Alerta de Chuva</h3>
          <p>
            {weather.current.rain > 0
              ? '🌧️ Está chovendo agora!'
              : `Previsão de chuva para ${getNextRainInfo()}`}
          </p>
        </div>
      )}

      {weather && (
        <div className="weather-card">
          <div className="weather-main">
            <div>
              <div className="temperature">
                {Math.round(weather.current.temperature_2m)}°C
              </div>
              <div className="weather-description">
                {getWeatherDescription(weather.current.weather_code)}
              </div>
            </div>
            <div className="weather-icon">
              {getWeatherIcon(weather.current.weather_code)}
            </div>
          </div>

          <div className="weather-details">
            <div className="detail-item">
              <div className="detail-label">Precipitação</div>
              <div className="detail-value">{weather.current.precipitation} mm</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Chuva</div>
              <div className="detail-value">{weather.current.rain} mm</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Umidade</div>
              <div className="detail-value">{weather.current.relative_humidity_2m}%</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Vento</div>
              <div className="detail-value">{Math.round(weather.current.wind_speed_10m)} km/h</div>
            </div>
          </div>
        </div>
      )}

      {forecast && (
        <div className="forecast-section">
          <h2 className="forecast-title">Próximos 5 dias</h2>
          <div className="forecast-grid">
            {forecast.daily.time.map((date, index) => (
              <div key={date} className="forecast-card">
                <div className="forecast-day">
                  {index === 0 ? 'Hoje' : getDayName(date)}
                </div>
                <div className="forecast-icon">
                  {getWeatherIcon(forecast.daily.weather_code[index])}
                </div>
                <div className="forecast-temp">
                  {Math.round(forecast.daily.temperature_2m_max[index])}° / {Math.round(forecast.daily.temperature_2m_min[index])}°
                </div>
                <div className="forecast-rain">
                  💧 {forecast.daily.precipitation_probability_max[index]}%
                </div>
                <div style={{fontSize: '0.9em', color: '#666', marginTop: '5px'}}>
                  {forecast.daily.precipitation_sum[index]} mm
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="last-updated">
        Última atualização: {new Date().toLocaleTimeString('pt-BR')}
      </div>
    </div>
  )
}
