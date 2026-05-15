import RocketData from "./rocketData";

export function getFlightChartParameteres(rocketData: RocketData) {
  // Main trajectory trace
  const trajectoryTrace = {
    x: rocketData.x,
    y: rocketData.y,
    z: rocketData.z,
    mode: "lines",
    type: "scatter3d",
    name: "Flight Path",
    line: {
      color: "#1f77b4",
      width: 3,
    },
  };

  // Current position marker
  const currentPositionTrace = {
    x: rocketData.x.length > 0 ? [rocketData.x[rocketData.x.length - 1]] : [0],
    y: rocketData.y.length > 0 ? [rocketData.y[rocketData.y.length - 1]] : [0],
    z: rocketData.z.length > 0 ? [rocketData.z[rocketData.z.length - 1]] : [0],
    mode: "markers",
    type: "scatter3d",
    name: "Current Position",
    marker: {
      color: "#ff0000",
      size: 8,
      symbol: "diamond",
    },
  };

  const layout = {
    title: "🚀 Rocket Flight Trajectory - Live Data",
    scene: {
      xaxis: {
        title: "X - Distance (m)",
      },
      yaxis: {
        title: "Y - Altitude (m)",
      },
      zaxis: {
        title: "Z - Lateral (m)", // Исправлено: было Pa, но это высота
      },
      camera: {
        eye: { x: 0.1, y: 2, z: 0.1 },
      },
      aspectratio: { x: 1, y: 1, z: 1 },
    },
    margin: { l: 0, r: 0, b: 0, t: 50 },
    height: 360,
    showlegend: false,
  };
  return [[trajectoryTrace, currentPositionTrace], layout];
}

export function getHeightChartParameteres(rocketData: RocketData) {
  // Main trajectory trace
  const trajectoryTrace = {
    x: rocketData.time,
    y: rocketData.z,
    mode: "lines",
    type: "scatter",
    name: "Height Path",
    line: {
      color: "#1f77b4",
      width: 3,
    },
  };

  // Current position marker
  const currentPositionTrace = {
    x: rocketData.time.length > 0 ? [rocketData.time[rocketData.time.length - 1]] : [0],
    y: rocketData.z.length > 0 ? [rocketData.z[rocketData.z.length - 1]] : [0],
    mode: "markers", // Исправлено: было "lines", лучше "markers" для позиции
    type: "scatter",
    name: "Current Position",
    marker: {
      color: "#ff0000",
      size: 8,
      symbol: "circle",
    },
  };

  const layout = {
    title: "Height vs Time",
    xaxis: {
      title: "Time (ms)",
      showgrid: true,
    },
    yaxis: {
      title: "Height (m)",
      showgrid: true,
    },
    margin: { l: 80, r: 50, b: 60, t: 60 },
    height: 360,
    showlegend: true,
    legend: {
      x: 0,
      y: 1.1,
      orientation: "h",
    },
  };
  return [[trajectoryTrace, currentPositionTrace], layout];
}

export function getPressureChartParameteres(rocketData: RocketData, startPressure?: number) {
  // Main trajectory trace
  const trajectoryTrace = {
    x: rocketData.time,
    y: rocketData.pressure,
    mode: "lines",
    type: "scatter",
    name: "Pressure",
    line: {
      color: "#1f77b4",
      width: 3,
    },
  };

  // Current position marker
  const currentPositionTrace = {
    x: rocketData.time.length > 0 ? [rocketData.time[rocketData.time.length - 1]] : [0],
    y: rocketData.pressure.length > 0 ? [rocketData.pressure[rocketData.pressure.length - 1]] : [101325],
    mode: "markers",
    type: "scatter",
    name: "Current Position",
    marker: {
      color: "#ff0000",
      size: 8,
      symbol: "circle",
    },
  };

  const layout = {
    title: "Pressure vs Time",
    xaxis: {
      title: "Time (ms)",
      showgrid: true,
    },
    yaxis: {
      title: "Pressure (Pa)",
      showgrid: true,
    },
    margin: { l: 80, r: 50, b: 60, t: 60 },
    height: 360,
    showlegend: true,
    legend: {
      x: 0,
      y: 1.1,
      orientation: "h",
    },
  };
  
  // Добавляем линию стартового давления, если оно передано
  if (startPressure && startPressure > 0) {
    layout.shapes = [{
      type: "line",
      x0: 0,
      x1: 1,
      xref: "paper",
      y0: startPressure,
      y1: startPressure,
      line: {
        color: "#ff0000",
        width: 2,
        dash: "dash",
      },
    }];
  }
  
  return [[trajectoryTrace, currentPositionTrace], layout];
}

export function getAccelerationChartParameteres(rocketData: RocketData) {
  // Main trajectory trace (XY acceleration)
  const trajectoryTrace = {
    x: rocketData.aX,
    y: rocketData.aY,
    mode: "lines",
    type: "scatter",
    name: "Horizontal Acceleration",
    line: {
      color: "#1f77b4",
      width: 3,
    },
  };

  // Current position marker
  const currentPositionTrace = {
    x: rocketData.aX.length > 0 ? [rocketData.aX[rocketData.aX.length - 1]] : [0],
    y: rocketData.aY.length > 0 ? [rocketData.aY[rocketData.aY.length - 1]] : [0],
    mode: "markers",
    type: "scatter",
    name: "Current Position",
    marker: {
      color: "#ff0000",
      size: 10,
      symbol: "circle",
    },
  };

  const layout = {
    title: "Horizontal Acceleration (X vs Y)",
    xaxis: {
      title: "X Acceleration (m/s²)",
      showgrid: true,
      zeroline: true,
    },
    yaxis: {
      title: "Y Acceleration (m/s²)",
      showgrid: true,
      zeroline: true,
    },
    margin: { l: 80, r: 50, b: 60, t: 60 },
    height: 360,
    showlegend: true,
    legend: {
      x: 0,
      y: 1.1,
      orientation: "h",
    },
  };
  return [[trajectoryTrace, currentPositionTrace], layout];
}

export function getZAccelerationChartParameteres(rocketData: RocketData) {
  // Main trajectory trace
  const trajectoryTrace = {
    x: rocketData.time,
    y: rocketData.aZ,
    mode: "lines",
    type: "scatter",
    name: "Vertical Acceleration",
    line: {
      color: "#1f77b4",
      width: 3,
    },
    connectgaps: false,
  };

  // Current position marker
  const currentPositionTrace = {
    x: rocketData.time.length > 0 ? [rocketData.time[rocketData.time.length - 1]] : [0],
    y: rocketData.aZ.length > 0 ? [rocketData.aZ[rocketData.aZ.length - 1]] : [0],
    mode: "markers",
    type: "scatter",
    name: "Current Position",
    marker: {
      color: "#ff0000",
      size: 8,
      symbol: "circle",
    },
  };

  const layout = {
    title: "Vertical Acceleration vs Time",
    xaxis: {
      title: "Time (ms)",
      showgrid: true,
      zeroline: true,
    },
    yaxis: {
      title: "Z Acceleration (m/s²)",
      showgrid: true,
      zeroline: true,
    },
    margin: { l: 80, r: 50, b: 60, t: 60 },
    height: 360,
    showlegend: true,
    legend: {
      x: 0,
      y: 1.1,
      orientation: "h",
    },
    // Горизонтальная линия на уровне 0 (нулевое ускорение)
    shapes: [{
      type: "line",
      x0: 0,
      x1: 1,
      xref: "paper",
      y0: 0,
      y1: 0,
      line: {
        color: "#2ca02c",
        width: 1,
        dash: "dash",
      },
    }],
  };
  return [[trajectoryTrace, currentPositionTrace], layout];
}

export function getSpeedChartParameters(rocketData: RocketData) {
  // Main trajectory trace - ИСПРАВЛЕНО: используем speed вместо aZ
  const trajectoryTrace = {
    x: rocketData.time,
    y: rocketData.speed,
    mode: "lines",
    type: "scatter",
    name: "Speed",
    line: {
      color: "#1f77b4",
      width: 3,
    },
    connectgaps: false,
  };

  // Current position marker - ИСПРАВЛЕНО: используем speed
  const currentPositionTrace = {
    x: rocketData.time.length > 0 ? [rocketData.time[rocketData.time.length - 1]] : [0],
    y: rocketData.speed.length > 0 ? [rocketData.speed[rocketData.speed.length - 1]] : [0],
    mode: "markers",
    type: "scatter",
    name: "Current Position",
    marker: {
      color: "#ff0000",
      size: 8,
      symbol: "circle",
    },
  };

  const layout = {
    title: "Speed vs Time",
    xaxis: {
      title: "Time (ms)",
      showgrid: true,
      zeroline: true,
    },
    yaxis: {
      title: "Speed (m/s)",
      showgrid: true,
      zeroline: true,
    },
    margin: { l: 80, r: 50, b: 60, t: 60 },
    height: 360,
    showlegend: true,
    legend: {
      x: 0,
      y: 1.1,
      orientation: "h",
    },
    // Горизонтальная линия на уровне 0
    shapes: [{
      type: "line",
      x0: 0,
      x1: 1,
      xref: "paper",
      y0: 0,
      y1: 0,
      line: {
        color: "#2ca02c",
        width: 1,
        dash: "dash",
      },
    }],
  };
  return [[trajectoryTrace, currentPositionTrace], layout];
}