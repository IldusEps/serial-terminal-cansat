/* eslint-disable no-case-declarations */

import * as Plotly from "plotly.js-dist";
import * as chartsConfig from "./chart";
import RocketData from "./rocketData";
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default class Rocket {
  startTrackingButton: HTMLElement = document.getElementById(
    "start-rocket-chart"
  ) as HTMLElement;
  flightChartContainer: HTMLElement = document.getElementById(
    "flight-chart"
  ) as HTMLElement;
  startPressureElement = document.getElementById(
    "start-pressure"
  ) as HTMLInputElement;
  minimumPressure = document.getElementById(
    "minimum-pressure"
  ) as HTMLButtonElement;

  private dataBuffer: any[] = [];
  private updateTimer: number | null = null;
  private readonly UPDATE_INTERVAL = 100; // мс (10 Гц обновления)
  
  // Счётчик для вывода в терминал (редко)
  private terminalOutputCounter = 0;
  private readonly TERMINAL_OUTPUT_INTERVAL = 5; // выводить каждые 5 пакетов

  // Флаг для принудительного обновления
  private isUpdatePending = false;

  info = document.getElementById("info") as HTMLDivElement;
  gps = document.getElementById("gps") as HTMLDivElement;
  flightInfo = document.getElementById("flight-info") as HTMLDivElement;
  pressureInfo = document.getElementById("pressure-info") as HTMLDivElement;
  zAccelerationInfo = document.getElementById(
    "zAcceleration-info"
  ) as HTMLDivElement;
  speedInfo = document.getElementById("speed-info") as HTMLDivElement;

  map: L.Map | null = null;
  marker: L.Marker | null = null;
  polyline: L.Polyline | null = null;
  latlngs: L.LatLng[] = [];
  mapInitialized = false;

  rocketChart: any = null;
  startPressure = 0;
  private startTime = 0;
  rocketData: RocketData = {
      time: [],
      pressure: [],
      temperature: [],
      x: [],
      y: [],
      z: [],
      aX: [],
      aY: [],
      aZ: [],
      gX: [],
      gY: [],
      gZ: [],
      speed: [],
      latitude: [],  
      longitude: []
  };
  rocketInterval: number | null = null;
  isRocketTracking = false;
  dataPointCount = 0;
  lastUpdateTime = 0;
  rocketPos = { x: 0.0, y: 0.0, z: 0.0 };

  initializeMap(): void {
  const mapElement = document.getElementById('map');
  if (!mapElement) {
    console.warn('Map container not found');
    return;
  }

  // Если карта уже создана, не пересоздаём
  if (this.map) return;

  this.map = L.map(mapElement, {
    center: [55.751244, 37.618423], // координаты по умолчанию (Москва)
    zoom: 17,
    zoomControl: true,
  });

  // Добавляем слой OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(this.map);

  // Создаём маркер (пока скрыт)
  this.marker = L.marker([0, 0], { opacity: 0 }).addTo(this.map);

  // Создаём полилинию для трека
  this.polyline = L.polyline([], { color: '#ff0000', weight: 3 }).addTo(this.map);

  this.mapInitialized = true;
  document.getElementById('tab-btn-7')?.addEventListener('click', () => {
    setTimeout(() => this.map?.invalidateSize(), 300);
  });

  document.getElementsByClassName("leaflet-attribution-flag")[0].style.paddingTop = 30;
}

  /**
   * Initializes the 3D rocket flight chart
   */
  initializeRocketChart(): void {
    const flightChartContainer = document.getElementById("flight-chart");
    const pressureChartContainer = document.getElementById("pressure-chart");
    const accelerationChartContainer =
      document.getElementById("acceleration-chart");

    if (!flightChartContainer) {
      console.error("Rocket chart container not found");
      return;
    }
    if (!pressureChartContainer) {
      console.error("Pressure chart container not found");
      return;
    }
    if (!accelerationChartContainer) {
      console.error("Acceleration chart container not found");
      return;
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToAdd: [
        "drawline",
        "drawopenpath",
        "eraseshape",
        "toImage",
      ],
    };

    const flightParameters = chartsConfig.getFlightChartParameteres(this.rocketData);
    this.rocketChart = Plotly.newPlot(
      "flight-chart",
      flightParameters[0],
      flightParameters[1],
      config
    );
    
    const tempParameters = chartsConfig.getTempChartParameteres(this.rocketData);
    this.rocketChart = Plotly.newPlot(
      "temp-chart",
      tempParameters[0],
      tempParameters[1],
      config
    );

    const heightParameters = chartsConfig.getHeightChartParameteres(this.rocketData);
    this.rocketChart = Plotly.newPlot(
      "height-chart",
      heightParameters[0],
      heightParameters[1],
      config
    );

    const pressureParameters = chartsConfig.getPressureChartParameteres(
      this.rocketData,
      this.startPressure
    );
    this.rocketChart = Plotly.newPlot(
      "pressure-chart",
      pressureParameters[0],
      pressureParameters[1],
      config
    );

    const accelerationParameters = chartsConfig.getAccelerationChartParameteres(
      this.rocketData
    );
    this.rocketChart = Plotly.newPlot(
      "acceleration-chart",
      accelerationParameters[0],
      accelerationParameters[1],
      config
    );

    const zAccelerationParameters = chartsConfig.getZAccelerationChartParameteres(
      this.rocketData
    );
    this.rocketChart = Plotly.newPlot(
      "zAcceleration-chart",
      zAccelerationParameters[0],
      zAccelerationParameters[1],
      config
    );

    const speedParameters = chartsConfig.getSpeedChartParameters(this.rocketData);
    this.rocketChart = Plotly.newPlot(
      "speed-chart",
      speedParameters[0],
      speedParameters[1],
      config
    );

    this.initializeMap();
  }

  /**
   * Starts rocket data tracking
   */
  startRocketTracking(): void {
    if (this.isRocketTracking) return;

    if (this.minimumPressure.style.backgroundColor == "green") {
      this.startPressure = Number(this.startPressureElement.value);
    }
    this.startPressureElement.disabled = true;
    this.isRocketTracking = true;
    this.startTrackingButton.textContent = "Stop Tracking";
    this.startTrackingButton.style.backgroundColor = "green";

    // Show telemetry info
    const telemetryInfo = document.getElementById("telemetry-info");
    if (telemetryInfo) {
      telemetryInfo.style.display = "block";
    }

    console.log("Rocket tracking started - waiting for serial data...");
  }

  /**
   * Stops rocket tracking
   */
  stopRocketTracking(): void {
    this.isRocketTracking = false;
    (document.getElementById("start-pressure") as HTMLInputElement).disabled =
      false;
    this.startTrackingButton.textContent = "Start Tracking";
    this.startTrackingButton.style.backgroundColor = "red";
    this.startPressureElement.disabled = false;

    // Hide telemetry info
    const telemetryInfo = document.getElementById("telemetry-info");
    if (telemetryInfo) {
      telemetryInfo.style.display = "none";
    }

    console.log("Rocket tracking stopped");
  }

  /**
   * Clears rocket trajectory data
   */
  clearRocketChart(): void {
    this.rocketData = {
      time: [],
      pressure: [],
      temperature: [],
      x: [],
      y: [],
      z: [],
      aX: [],
      aY: [],
      aZ: [],
      gX: [],
      gY: [],
      gZ: [],
      speed: [],
      latitude: [],  
      longitude: []
  };
    this.dataPointCount = 0;
    this.lastUpdateTime = 0;

    // this.updateTelemetryDisplay();

    if (this.startPressure) {
      Plotly.purge("flight-chart");
      Plotly.purge("temp-chart");
      Plotly.purge("pressure-chart");
      Plotly.purge("acceleration-chart");
      Plotly.purge("zAcceleration-chart");
      Plotly.purge("speed-chart");
      Plotly.purge("height-chart");
      this.initializeRocketChart();
    }

    this.latlngs = [];
    if (this.polyline) {
      this.polyline.setLatLngs([]);
    }
    // Маркер можно скрыть
    if (this.marker) {
      this.marker.setOpacity(0);
    }

    console.log("Rocket chart data cleared");
  }

  /**
   * Resets the chart view
   */
  resetRocketView(): void {
    if (this.rocketChart) {
      Plotly.relayout("flight-chart", {
        "scene.camera.eye": { x: 0, y: 2.5, z: 0 },
      });
    }
  }

  /**
   * Processes serial data for rocket tracking
   */
  /**
 * Processes serial data for rocket tracking
 */
processSerialDataForRocket(data: any, update = true): void {
    function calculateAltitudeFromPressure(
        pressure: number,
        seaLevelPressure = 101325,
        seaLevelTemperature = 293.15
    ) {
        const L = 0.0065; // Temperature lapse rate (K/m)
        const g = 9.80665; // Gravitational acceleration (m/s²)
        const M = 0.0289644; // Molar mass of Earth's air (kg/mol)
        const R = 8.31432; // Universal gas constant (J/(mol·K))

        const altitude =
            (seaLevelTemperature / L) *
            (1 - Math.pow(pressure / seaLevelPressure, (R * L) / (g * M)));
console.log(seaLevelPressure);
console.log(pressure);
        return altitude;
    }

    if (this.minimumPressure.style.backgroundColor == "green") {
        if (this.rocketData.pressure.length < 10) {
          const maxPressure = Math.max(...this.rocketData.pressure);
            this.startPressureElement.value = maxPressure.toString();
            this.startPressure = maxPressure;
        }
    }

    if (!this.isRocketTracking) return;

    // Проверяем, что данные получены и имеют нужные поля
    if (!data) return;

    // Получаем значения с учётом нового формата
    const pressure = data.pressure || data.pressurePa || 0;
    const temperature = data.temperature || data.temperatureC || 0;
    let time = data.time || data.timeMs || 0;
    if (this.rocketData.time.length === 0) {
        this.startTime = time;
    }
    time = time - this.startTime;
    // потом используем relativeTime в parsedData

    
    // Ускорения могут быть уже в физических величинах или в сырых значениях
    let aX = data.aX || data.acceleration?.x || 0;
    let aY = data.aY || data.acceleration?.y || 0;
    let aZ = data.aZ || data.acceleration?.z || 0;
    
    // Если это сырые значения из decodeTelemetry (int16), конвертируем
    if (typeof aX === 'number' && Math.abs(aX) > 1000 && aX !== 0) {
        aX = aX / 1000.0;
        aY = aY / 1000.0;
        aZ = aZ / 1000.0;
    }
    
    // Гироскопы
    let gX = data.gX || data.gyroscope?.x || 0;
    let gY = data.gY || data.gyroscope?.y || 0;
    let gZ = data.gZ || data.gyroscope?.z || 0;
    
    if (typeof gX === 'number' && Math.abs(gX) > 100 && gX !== 0) {
        gX = gX / 10.0;
        gY = gY / 10.0;
        gZ = gZ / 10.0;
    }

    let altitude = 0;
    // Рассчитываем высоту из давления
    if (this.rocketData.pressure.length > 1) {
      altitude = calculateAltitudeFromPressure(pressure, this.startPressure);
    }
    
    // Рассчитываем скорость
    let speed = 0;
    if (this.rocketData.pressure.length > 0 && this.rocketData.time.length > 0) {
        const previousPressure = this.rocketData.pressure[this.rocketData.pressure.length - 1];
        const previousTime = this.rocketData.time[this.rocketData.time.length - 1];
        const deltaTime = time - previousTime;
        if (deltaTime > 0) {
            speed = this.calculateVerticalSpeedFromPressure(
                pressure,
                previousPressure,
                deltaTime
            );
        }
    }

    const parsedData = {
        time: time,
        pressure: pressure,
        temperature: temperature,
        x: data.x || 0,
        y: data.y || 0,
        z: altitude,
        aX: aX,
        aY: aY,
        aZ: aZ,
        gX: gX,
        gY: gY,
        gZ: gZ,
        speed: speed,
        // Сохраняем GPS данные, если есть
        gps: data.gps || { latitude: 0, longitude: 0 }
    };

    this.addRocketDataPoint(parsedData, update);
}

  /**
   * Adds a new data point to the rocket chart
   */
  addRocketDataPoint(
    data: {
        time: number;
        pressure: number;
        temperature: number;
        x: number;
        y: number;
        z: number;
        aX: number;
        aY: number;
        aZ: number;
        gX: number;
        gY: number;
        gZ: number;
        speed: number;
        gps?: { latitude: number; longitude: number };
    },
    update = true
  ): void {
      const maxPoints = 100000;

      // Add new data
      this.rocketData.x.push(data.x);
      this.rocketData.y.push(data.y);
      this.rocketData.z.push(data.z);
      this.rocketData.time.push(data.time);
      this.rocketData.aX.push(data.aX || 0);
      this.rocketData.aY.push(data.aY || 0);
      this.rocketData.aZ.push(data.aZ || 0);
      this.rocketData.gX.push(data.gX || 0);
      this.rocketData.gY.push(data.gY || 0);
      this.rocketData.gZ.push(data.gZ || 0);
      this.rocketData.pressure.push(data.pressure);
      this.rocketData.temperature.push(data.temperature || 0);
      this.rocketData.speed.push(Math.round(data.speed));
      
      // Добавляем GPS данные если есть
      if (data.gps) {
          this.rocketData.latitude.push(data.gps.latitude);
          this.rocketData.longitude.push(data.gps.longitude);
      } else if (this.rocketData.latitude) {
          this.rocketData.latitude.push(this.rocketData.latitude[this.rocketData.latitude.length - 1] || 0);
          this.rocketData.longitude.push(this.rocketData.longitude[this.rocketData.longitude.length - 1] || 0);
      }

      // Remove old data if exceeding max points
      if (this.rocketData.x.length > maxPoints) {
          this.rocketData.x.shift();
          this.rocketData.y.shift();
          this.rocketData.z.shift();
          this.rocketData.time.shift();
          this.rocketData.pressure.shift();
          this.rocketData.temperature.shift();
          this.rocketData.speed.shift();
          if (this.rocketData.latitude) {
              this.rocketData.latitude.shift();
              this.rocketData.longitude.shift();
          }
      }

      // Update chart
      if (update && (this.rocketData.aX.length % 5 == 0 || this.rocketData.aX.length < 30)) 
        setTimeout(() => this.updateRocketChart(), 10);

      this.dataPointCount++;
      this.lastUpdateTime = Date.now();
  }

  /**
   * Updates the rocket chart with current data
   */
  updateRocketChart(): void {
    if (!this.rocketChart || this.rocketData.x.length === 0) return;

    let lastIndex = this.rocketData.x.length - 1;

    // Update trajectory
    const updateTrajectory = {
      x: [[this.rocketData.x[lastIndex]]],
      y: [[this.rocketData.y[lastIndex]]],
      z: [[this.rocketData.z[lastIndex]]],
    };

    // Update current position marker
    const updatePosition = {
      x: [[this.rocketData.x[lastIndex]]],
      y: [[this.rocketData.y[lastIndex]]],
      z: [[this.rocketData.z[lastIndex]]],
    };

    Plotly.extendTraces("flight-chart", updateTrajectory, [0]);
    Plotly.restyle("flight-chart", updatePosition, [1]);
    
    // После обновления pressure-chart
    lastIndex = this.rocketData.temperature.length - 1;
    let updateTrajectory1 = {
        x: [[this.rocketData.time[lastIndex]]],
        y: [[this.rocketData.temperature[lastIndex]]],
    };
    let updatePosition1 = {
        x: [[this.rocketData.time[lastIndex]]],
        y: [[this.rocketData.temperature[lastIndex]]],
    };
    Plotly.extendTraces("temp-chart", updateTrajectory1, [0]);
    Plotly.restyle("temp-chart", updatePosition1, [1]);
    Plotly.relayout("temp-chart", { "yaxis.autorange": true });

    lastIndex = this.rocketData.z.length - 1;

    // Update trajectory
    updateTrajectory1 = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.z[lastIndex]]],
    };

    // Update current position marker
    updatePosition1 = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.z[lastIndex]]],
    };

    Plotly.extendTraces("height-chart", updateTrajectory1, [0]);
    Plotly.restyle("height-chart", updatePosition1, [1]);

    lastIndex = this.rocketData.pressure.length - 1;

    // Update trajectory
    updateTrajectory1 = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.pressure[lastIndex]]],
    };

    // Update current position marker
    updatePosition1 = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.pressure[lastIndex]]],
    };

    Plotly.extendTraces("pressure-chart", updateTrajectory1, [0]);
    Plotly.restyle("pressure-chart", updatePosition1, [1]);
    Plotly.relayout("pressure-chart", {
      "yaxis.autorange": true,
    });
    this.pressureInfo.innerHTML = `
    <div>Минимальное давление: ${Math.min(...this.rocketData.pressure)}</div>
    `;

    lastIndex = this.rocketData.aX.length - 1;

    // Update trajectory
    updateTrajectory1 = {
      x: [[this.rocketData.aX[lastIndex]]],
      y: [[this.rocketData.aY[lastIndex]]],
    };

    // Update current position marker
    updatePosition1 = {
      x: [[this.rocketData.aX[lastIndex]]],
      y: [[this.rocketData.aY[lastIndex]]],
    };

    Plotly.extendTraces("acceleration-chart", updateTrajectory1, [0]);
    Plotly.restyle("acceleration-chart", updatePosition1, [1]);

    Plotly.relayout("acceleration-chart", {
      "yaxis.autorange": true,
    });

    lastIndex = this.rocketData.aZ.length - 1;

    // Update trajectory
    updateTrajectory1 = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.aZ[lastIndex]]],
    };

    // Update current position marker
    updatePosition1 = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.aZ[lastIndex]]],
    };

    Plotly.extendTraces("zAcceleration-chart", updateTrajectory1, [0]);
    Plotly.restyle("zAcceleration-chart", updatePosition1, [1]);

    Plotly.relayout("zAcceleration-chart", {
      "yaxis.autorange": true,
    });

    this.zAccelerationInfo.innerHTML = `
    <div>Наибольшее ускорение: ${Math.max(...this.rocketData.aZ).toFixed(
      2
    )}</div>
    <div>Наименьшее ускорение: ${Math.min(...this.rocketData.aZ).toFixed(
      2
    )}</div>
    `;

    lastIndex = this.rocketData.speed.length - 1;

    // Update trajectory
    updateTrajectory1 = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.speed[lastIndex]]],
    };

    // Update current position marker
    updatePosition1 = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.speed[lastIndex]]],
    };
    Plotly.extendTraces("speed-chart", updateTrajectory1, [0]);
    Plotly.restyle("speed-chart", updatePosition1, [1]);

    Plotly.relayout("speed-chart", {
      "yaxis.autorange": true,
    });

    this.speedInfo.innerHTML = `
<div>Наибольшая скорость: ${Math.max(...this.rocketData.speed).toFixed(2)}</div>
<div>Наименьшая скорость: ${Math.min(...this.rocketData.speed).toFixed(2)}</div>
    `;

    this.info.innerHTML = `
          <div>Точка максимума ракеты: ${Math.max(...this.rocketData.z).toFixed(
            2
          )}</div>
          <div>Высота: ${this.rocketData.z[lastIndex].toFixed(2)}</div>

          <div>Ускорение по Z: ${this.rocketData.aZ[lastIndex]}</div>
          <div>Ускорение по X: ${this.rocketData.aX[lastIndex]}</div>
          <div>Ускорение по Y: ${this.rocketData.aY[lastIndex]}</div>
          <div>Давление: ${this.rocketData.pressure[lastIndex]}</div>
          
          <div>Время: ${this.rocketData.time[lastIndex]}</div>
    `;
    if (this.rocketData.latitude[lastIndex] != 0) {
     this.gps.innerHTML = `
<div>latitude: ${this.rocketData.latitude[lastIndex]} </div>
<div>longitude: ${this.rocketData.longitude[lastIndex]}</div>
    `;
    // После обновления информации о GPS
    if (this.rocketData.latitude[lastIndex] !== 0 && this.rocketData.longitude[lastIndex] !== 0) {
      const lat = this.rocketData.latitude[lastIndex];
      const lng = this.rocketData.longitude[lastIndex];

      // Обновляем маркер
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
        this.marker.setOpacity(1);
        // Можно добавить всплывающую подсказку
        this.marker.bindPopup(`Высота: ${this.rocketData.z[lastIndex].toFixed(1)} м`);
      }

      // Добавляем точку в трек
      this.latlngs.push(L.latLng(lat, lng));
      if (this.polyline) {
        this.polyline.setLatLngs(this.latlngs);
      }

      // Центрируем карту на новой точке
      if (this.map) {
        this.map.panTo([lat, lng]);
      }
    }
    }
  }

  /**
   * Расчет вертикальной скорости по изменению давления
   * @param {number} currentPressure - Текущее давление (Па)
   * @param {number} previousPressure - Предыдущее давление (Па)
   * @param {number} deltaTime - Время между измерениями (миллисекунды)
   * @param {number} temperature - Температура воздуха (К)
   * @param {number} seaLevelPressure - Давление на уровне моря (Па)
   * @returns {number} Вертикальная скорость (м/с, положительная вверх)
   */
  calculateVerticalSpeedFromPressure(
    currentPressure: number,
    previousPressure: number,
    deltaTime: number,
    temperature = 293.15,
    seaLevelPressure = 101325
  ) {
    // Константы
    const g = 9.80665; // Ускорение свободного падения (м/с²)
    const M = 0.0289644; // Молярная масса воздуха (кг/моль)
    const R = 8.31432; // Универсальная газовая постоянная (Дж/(моль·К))

    // Проверка входных данных
    if (deltaTime <= 0) {
      console.log("deltaTime must be positive");
      return 0;
    }
    if (previousPressure <= 0 || !previousPressure) {
      previousPressure = this.startPressure;
    }
    if (currentPressure <= 0 || previousPressure <= 0) {
      console.log("Pressure values must be positive");
      return 0;
    }

    // Относительное изменение давления
    const pressureRatio = currentPressure / previousPressure;

    // Вертикальная скорость через барометрическую формулу
    const verticalSpeed =
      (((R * temperature) / (g * M)) * Math.log(pressureRatio)) /
      (deltaTime / 1000);

    return verticalSpeed;
  }
}
