/* eslint-disable no-case-declarations */

import * as Plotly from "plotly.js-dist";
import {
  getAccelerationChartParameteres,
  getFlightChartParameteres,
  getPressureChartParameteres,
  getZAccelerationChartParameteres,
  getSpeedChartParameters,
} from "./chart";
import RocketData from "./rocketData";

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

  info = document.getElementById("info") as HTMLDivElement;
  flightInfo = document.getElementById("flight-info") as HTMLDivElement;
  pressureInfo = document.getElementById("pressure-info") as HTMLDivElement;
  zAccelerationInfo = document.getElementById(
    "zAcceleration-info"
  ) as HTMLDivElement;
  speedInfo = document.getElementById("speed-info") as HTMLDivElement;

  rocketChart: any = null;
  startPressure = 0;
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
  };
  rocketInterval: number | null = null;
  isRocketTracking = false;
  dataPointCount = 0;
  lastUpdateTime = 0;
  rocketPos = { x: 0.0, y: 0.0, z: 0.0 };
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

    const flightParameters = getFlightChartParameteres(this.rocketData);
    this.rocketChart = Plotly.newPlot(
      "flight-chart",
      flightParameters[0],
      flightParameters[1],
      config
    );
    const pressureParameters = getPressureChartParameteres(
      this.rocketData,
      this.startPressure
    );
    this.rocketChart = Plotly.newPlot(
      "pressure-chart",
      pressureParameters[0],
      pressureParameters[1],
      config
    );
    const accelerationParameters = getAccelerationChartParameteres(
      this.rocketData
    );
    this.rocketChart = Plotly.newPlot(
      "acceleration-chart",
      accelerationParameters[0],
      accelerationParameters[1],
      config
    );
    const zAccelerationParameters = getZAccelerationChartParameteres(
      this.rocketData
    );
    this.rocketChart = Plotly.newPlot(
      "zAcceleration-chart",
      zAccelerationParameters[0],
      zAccelerationParameters[1],
      config
    );
    const speedParameters = getSpeedChartParameters(this.rocketData);
    this.rocketChart = Plotly.newPlot(
      "speed-chart",
      speedParameters[0],
      speedParameters[1],
      config
    );
  }

  /**
   * Starts rocket data tracking
   */
  startRocketTracking(): void {
    if (this.isRocketTracking) return;

    this.startPressure = Number(this.startPressureElement.value);
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
      aX: [],
      aY: [],
      aZ: [],
      gX: [],
      gY: [],
      gZ: [],
      x: [],
      y: [],
      z: [],
      speed: [],
    };
    this.dataPointCount = 0;
    this.lastUpdateTime = 0;

    // this.updateTelemetryDisplay();

    if (this.startPressure) {
      Plotly.purge("flight-chart");
      Plotly.purge("pressure-chart");
      Plotly.purge("acceleration-chart");
      Plotly.purge("zAcceleration-chart");
      Plotly.purge("speed-chart");
      this.initializeRocketChart();
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
  processSerialDataForRocket(data: string, update = true): void {
    function calculateAltitudeFromPressure(
      pressure: number,
      seaLevelPressure = 101325,
      seaLevelTemperature = 293.15
    ) {
      // Constants
      const L = 0.0065; // Temperature lapse rate (K/m)
      const g = 9.80665; // Gravitational acceleration (m/s²)
      const M = 0.0289644; // Molar mass of Earth's air (kg/mol)
      const R = 8.31432; // Universal gas constant (J/(mol·K))

      // Barometric formula for altitude
      const altitude =
        (seaLevelTemperature / L) *
        (1 - Math.pow(pressure / seaLevelPressure, (R * L) / (g * M)));

      return altitude;
    }

    if (this.minimumPressure.style.backgroundColor == "green") {
      this.startPressureElement.value = Math.max(
        ...this.rocketData.pressure
      ).toString();
    }

    if (!this.isRocketTracking) return;

    let parsedData: {
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
    } | null = null;

    const xyzValues = data.split(";").map((val) => parseFloat(val.trim()));
    xyzValues.pop();
    if (xyzValues.length >= 5 && xyzValues.every((val) => !isNaN(val))) {
      parsedData = {
        time: xyzValues[0],
        pressure: xyzValues[1],
        temperature: xyzValues[2],
        aX: xyzValues[3],
        aY: xyzValues[4],
        aZ: xyzValues[5],
        gX: xyzValues[6],
        gY: xyzValues[7],
        gZ: xyzValues[8],
        x: 0,
        y: 0,
        z: calculateAltitudeFromPressure(xyzValues[1], this.startPressure),
        speed:
          this.calculateVerticalSpeedFromPressure(
            xyzValues[1],
            this.rocketData.pressure[this.rocketData.pressure.length - 1],
            xyzValues[0] - this.rocketData.time[this.rocketData.time.length - 1]
          ) * 100,
      };
    }

    if (parsedData) {
      this.addRocketDataPoint(parsedData, update);
    }
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
    },
    update = true
  ): void {
    const maxPoints = 100000;

    // Add new data
    this.rocketData.x.push(data.x);
    this.rocketData.y.push(data.y);
    this.rocketData.z.push(data.z);
    this.rocketData.time.push(data.time); // Current timestamp in seconds
    this.rocketData.aX.push(data.aX || 0);
    this.rocketData.aY.push(data.aY || 0);
    this.rocketData.aZ.push(data.aZ || 0);
    this.rocketData.gX.push(data.gX || 0);
    this.rocketData.gY.push(data.gY || 0);
    this.rocketData.gZ.push(data.gZ || 0);
    this.rocketData.pressure.push(data.pressure || this.startPressure);
    this.rocketData.temperature.push(data.temperature || 0);
    this.rocketData.speed.push(Math.round(data.speed));
    console.log(data.speed);

    // Remove old data if exceeding max points
    if (this.rocketData.x.length > maxPoints) {
      this.rocketData.x.shift();
      this.rocketData.y.shift();
      this.rocketData.z.shift();
      this.rocketData.time.shift();
      this.rocketData.pressure.shift();
      this.rocketData.temperature.shift();
      this.rocketData.speed.shift();
    }

    // Update chart
    if (update) this.updateRocketChart();

    // Update telemetry display
    // this.updateTelemetryDisplay();

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
    let updateTrajectory = {
      x: [[this.rocketData.x[lastIndex]]],
      y: [[this.rocketData.y[lastIndex]]],
      z: [[this.rocketData.z[lastIndex]]],
    };

    // Update current position marker
    let updatePosition = {
      x: [[this.rocketData.x[lastIndex]]],
      y: [[this.rocketData.y[lastIndex]]],
      z: [[this.rocketData.z[lastIndex]]],
    };

    Plotly.extendTraces("flight-chart", updateTrajectory, [0]);
    Plotly.restyle("flight-chart", updatePosition, [1]);

    lastIndex = this.rocketData.pressure.length - 1;

    // Update trajectory
    updateTrajectory = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.pressure[lastIndex]]],
    };

    // Update current position marker
    updatePosition = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.pressure[lastIndex]]],
    };

    Plotly.extendTraces("pressure-chart", updateTrajectory, [0]);
    Plotly.restyle("pressure-chart", updatePosition, [1]);
    Plotly.relayout("pressure-chart", {
      "yaxis.autorange": true,
    });
    this.pressureInfo.innerHTML = `
    <div>Минимальное давление: ${Math.min(...this.rocketData.pressure)}</div>
    `;

    lastIndex = this.rocketData.aX.length - 1;

    // Update trajectory
    updateTrajectory = {
      x: [[this.rocketData.aX[lastIndex]]],
      y: [[this.rocketData.aY[lastIndex]]],
    };

    // Update current position marker
    updatePosition = {
      x: [[this.rocketData.aX[lastIndex]]],
      y: [[this.rocketData.aY[lastIndex]]],
    };

    Plotly.extendTraces("acceleration-chart", updateTrajectory, [0]);
    Plotly.restyle("acceleration-chart", updatePosition, [1]);

    Plotly.relayout("acceleration-chart", {
      "yaxis.autorange": true,
    });

    lastIndex = this.rocketData.aZ.length - 1;

    // Update trajectory
    updateTrajectory = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.aZ[lastIndex]]],
    };

    // Update current position marker
    updatePosition = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.aZ[lastIndex]]],
    };

    Plotly.extendTraces("zAcceleration-chart", updateTrajectory, [0]);
    Plotly.restyle("zAcceleration-chart", updatePosition, [1]);

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
    updateTrajectory = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.speed[lastIndex]]],
    };

    // Update current position marker
    updatePosition = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.speed[lastIndex]]],
    };

    Plotly.extendTraces("speed-chart", updateTrajectory, [0]);
    Plotly.restyle("speed-chart", updatePosition, [1]);

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

    // Auto-scale the view if it's the first few points
    // if (this.rocketData.x.length <= 10) {
    //   Plotly.relayout("flight-chart", "scene.camera.eye", {
    //     x: 1.5,
    //     y: 1.5,
    //     z: 1.5,
    //   });
    // }
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
      ((-(R * temperature) / (g * M)) * Math.log(pressureRatio)) /
      deltaTime /
      1000;

    return verticalSpeed;
  }
}
