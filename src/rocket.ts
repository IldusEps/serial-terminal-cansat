/* eslint-disable no-case-declarations */

import * as Plotly from "plotly.js-dist";
import {
  getAccelerationChartParameteres,
  getFlightChartParameteres,
  getPressureChartParameteres,
  getZAccelerationChartParameteres,
} from "./chart";
import RocketData from "./rocketData";

export default class Rocket {
  startTrackingButton: HTMLElement = document.getElementById(
    "start-rocket-chart"
  ) as HTMLElement;
  flightChartContainer: HTMLElement = document.getElementById(
    "flight-chart"
  ) as HTMLElement;

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
  }

  /**
   * Starts rocket data tracking
   */
  startRocketTracking(): void {
    if (this.isRocketTracking) return;

    const startPressureElement = document.getElementById(
      "start-pressure"
    ) as HTMLInputElement;
    this.startPressure = Number(startPressureElement.value);
    startPressureElement.disabled = true;
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
    };
    this.dataPointCount = 0;
    this.lastUpdateTime = 0;

    // this.updateTelemetryDisplay();

    if (this.startPressure) {
      Plotly.purge("flight-chart");
      Plotly.purge("pressure-chart");
      Plotly.purge("acceleration-chart");
      Plotly.purge("zAcceleration-chart");
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
   * Updates telemetry display
   */
  //   updateTelemetryDisplay(): void {
  //     const lastIndex = this.rocketData.x.length - 1;

  //     if (lastIndex >= 0) {
  //       document.getElementById("pos-x")!.textContent =
  //         this.rocketData.x[lastIndex].toFixed(2);
  //       document.getElementById("pos-y")!.textContent =
  //         this.rocketData.y[lastIndex].toFixed(2);
  //       document.getElementById("pos-z")!.textContent =
  //         this.rocketData.z[lastIndex].toFixed(2);

  //       const currentVelocity = this.rocketData.velocity[lastIndex] || 0;
  //       const currentAcceleration = this.rocketData.acceleration[lastIndex] || 0;

  //       document.getElementById("velocity")!.textContent =
  //         currentVelocity.toFixed(2);
  //       document.getElementById("acceleration")!.textContent =
  //         currentAcceleration.toFixed(2);
  //     }

  //     document.getElementById("point-count")!.textContent =
  //       this.rocketData.x.length.toString();
  //     document.getElementById("last-update")!.textContent =
  //       new Date().toLocaleTimeString();
  //   }

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
    },
    update = true
  ): void {
    const maxPoints = 100000;

    // Add new data
    this.rocketData.x.push(data.x);
    this.rocketData.y.push(data.y);
    this.rocketData.z.push(data.z);
    this.rocketData.time.push(Date.now() / 1000); // Current timestamp in seconds
    this.rocketData.aX.push(data.aX || 0);
    this.rocketData.aY.push(data.aY || 0);
    this.rocketData.aZ.push(data.aZ || 0);
    this.rocketData.gX.push(data.gX || 0);
    this.rocketData.gY.push(data.gY || 0);
    this.rocketData.gZ.push(data.gZ || 0);
    this.rocketData.pressure.push(data.pressure || this.startPressure);
    this.rocketData.temperature.push(data.temperature || 0);

    // Remove old data if exceeding max points
    if (this.rocketData.x.length > maxPoints) {
      this.rocketData.x.shift();
      this.rocketData.y.shift();
      this.rocketData.z.shift();
      this.rocketData.time.shift();
      this.rocketData.pressure.shift();
      this.rocketData.temperature.shift();
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
      x: [this.rocketData.x],
      y: [this.rocketData.y],
      z: [this.rocketData.z],
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
      x: [this.rocketData.time],
      y: [this.rocketData.pressure],
    };

    // Update current position marker
    updatePosition = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.pressure[lastIndex]]],
    };

    Plotly.extendTraces("pressure-chart", updateTrajectory, [0]);
    Plotly.restyle("pressure-chart", updatePosition, [1]);

    lastIndex = this.rocketData.aX.length - 1;

    // Update trajectory
    updateTrajectory = {
      x: [this.rocketData.aX],
      y: [this.rocketData.aY],
    };

    // Update current position marker
    updatePosition = {
      x: [[this.rocketData.aX[lastIndex]]],
      y: [[this.rocketData.aY[lastIndex]]],
    };

    Plotly.extendTraces("acceleration-chart", updateTrajectory, [0]);
    Plotly.restyle("acceleration-chart", updatePosition, [1]);

    lastIndex = this.rocketData.aZ.length - 1;

    // Update trajectory
    updateTrajectory = {
      x: [this.rocketData.time],
      y: [this.rocketData.aZ],
    };

    // Update current position marker
    updatePosition = {
      x: [[this.rocketData.time[lastIndex]]],
      y: [[this.rocketData.aZ[lastIndex]]],
    };

    Plotly.extendTraces("zAcceleration-chart", updateTrajectory, [0]);
    Plotly.restyle("zAcceleration-chart", updatePosition, [1]);

    // Auto-scale the view if it's the first few points
    // if (this.rocketData.x.length <= 10) {
    //   Plotly.relayout("flight-chart", "scene.camera.eye", {
    //     x: 1.5,
    //     y: 1.5,
    //     z: 1.5,
    //   });
    // }
  }
}
