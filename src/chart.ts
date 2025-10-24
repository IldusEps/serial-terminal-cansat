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
        // gridcolor: "rgb(255, 255, 255)",
        // zerolinecolor: "rgb(255, 255, 255)",
        // showbackground: true,
        // backgroundcolor: "rgb(230, 230, 230)",
      },
      yaxis: {
        title: "Y - Altitude (m)",
        // gridcolor: "rgb(255, 255, 255)",
        // zerolinecolor: "rgb(255, 255, 255)",
        // showbackground: true,
        // backgroundcolor: "rgb(230, 230, 230)",
      },
      zaxis: {
        title: "P - Lateral (Pa)",
        // gridcolor: "rgb(255, 255, 255)",
        // zerolinecolor: "rgb(255, 255, 255)",
        // showbackground: true,
        // backgroundcolor: "rgb(230, 230, 230)",
      },
      camera: {
        eye: { x: 0.1, y: 1.1, z: 0.1 },
      },
      aspectratio: { x: 1, y: 1, z: 1 },
    },
    margin: { l: 0, r: 0, b: 0, t: 50 },
    height: 400,
    showlegend: true,
  };
  return [[trajectoryTrace, currentPositionTrace], layout];
}

export function getPressureChartParameteres(rocketData: RocketData) {
  // Main trajectory trace
  const trajectoryTrace = {
    x: rocketData.time,
    y: rocketData.pressure,
    mode: "lines",
    type: "scatter",
    name: "Pressure Path",
    line: {
      color: "#1f77b4",
      width: 3,
    },
  };

  // Current position marker
  const currentPositionTrace = {
    x:
      rocketData.time.length > 0
        ? [rocketData.time[rocketData.time.length - 1]]
        : [0],
    y:
      rocketData.pressure.length > 0
        ? [rocketData.pressure[rocketData.pressure.length - 1]]
        : [103000],
    mode: "lines",
    type: "scatter",
    name: "Current Position",
    marker: {
      color: "#ff0000",
      size: 8,
      dash: "dash",
    },
  };

  const layout = {
    title: "Pressure",
    scene: {
      xaxis: {
        title: "Time",
        // gridcolor: "rgb(255, 255, 255)",
        // zerolinecolor: "rgb(255, 255, 255)",
        // showbackground: true,
        // backgroundcolor: "rgb(230, 230, 230)",
        showgrid: true,
      },
      yaxis: {
        title: "Pressure",
        // gridcolor: "rgb(255, 255, 255)",
        // zerolinecolor: "rgb(255, 255, 255)",
        // showbackground: true,
        // backgroundcolor: "rgb(230, 230, 230)",
        showgrid: true,
      },
      //   camera: {
      //     eye: { x: 0.1, y: 1.1, z: 0.1 },
      //   },
      aspectratio: { x: 1, y: 1, z: 1 },
    },
    margin: { l: 80, r: 50, b: 60, t: 60 },
    height: 400,
    showlegend: true,
    legend: {
      x: 0,
      y: 1.1,
      orientation: "h",
    },
    // shapes: [
    //   // Horizontal line at 100000 Pa
    //   {
    //     type: "line",
    //     x0: 0,
    //     x1: 1,
    //     y0: 100000,
    //     y1: 100000,
    //     xref: "paper",
    //     line: {
    //       color: "#2ca02c",
    //       width: 1,
    //       dash: "dash",
    //     },
    //   },
    // ],
  };
  return [[trajectoryTrace, currentPositionTrace], layout];
}

export function getAccelerationChartParameteres(rocketData: RocketData) {
  // Main trajectory trace
  const trajectoryTrace = {
    x: rocketData.aX,
    y: rocketData.aY,
    mode: "lines",
    type: "scatter",
    name: "Acceleration Path",
    line: {
      color: "#1f77b4",
      width: 3,
    },
  };

  // Current position marker
  const currentPositionTrace = {
    x:
      rocketData.aX.length > 0
        ? [rocketData.aX[rocketData.aX.length - 1]]
        : [0],
    y:
      rocketData.aY.length > 0
        ? [rocketData.aY[rocketData.aY.length - 1]]
        : [0],
    mode: "lines",
    type: "scatter",
    name: "Current Position",
    marker: {
      color: "#ff0000",
      size: 8,
      dash: "dash",
    },
  };

  const layout = {
    title: "Acceleration",
    scene: {
      xaxis: {
        title: "X acceleration",
        // gridcolor: "rgb(255, 255, 255)",
        // zerolinecolor: "rgb(255, 255, 255)",
        // showbackground: true,
        // backgroundcolor: "rgb(230, 230, 230)",
        showgrid: true,
      },
      yaxis: {
        title: "Y acceleration",
        // gridcolor: "rgb(255, 255, 255)",
        // zerolinecolor: "rgb(255, 255, 255)",
        // showbackground: true,
        // backgroundcolor: "rgb(230, 230, 230)",
        showgrid: true,
      },
      //   camera: {
      //     eye: { x: 0.1, y: 1.1, z: 0.1 },
      //   },
      aspectratio: { x: 1, y: 1, z: 1 },
    },
    margin: { l: 80, r: 50, b: 60, t: 60 },
    height: 400,
    showlegend: true,
    legend: {
      x: 0,
      y: 1.1,
      orientation: "h",
    },
    // shapes: [
    //   // Horizontal line at 100000 Pa
    //   {
    //     type: "line",
    //     x0: 0,
    //     x1: 1,
    //     y0: 0,
    //     y1: 1,
    //     xref: "paper",
    //     line: {
    //       color: "#2ca02c",
    //       width: 1,
    //       dash: "dash",
    //     },
    //   },
    // ],
  };
  return [[trajectoryTrace, currentPositionTrace], layout];
}
export function getZAccelerationChartParameteres(rocketData) {
  // Main trajectory trace
  const trajectoryTrace = {
    x: rocketData.time,
    y: rocketData.aZ,
    mode: "lines",
    type: "scatter",
    name: "ZAcceleration Path",
    line: {
      color: "#1f77b4",
      width: 3,
      shape: "linear",
    },
    connectgaps: false,
  };

  // Current position marker
  const currentPositionTrace = {
    x:
      rocketData.time.length > 0
        ? [rocketData.time[rocketData.time.length - 1]]
        : [0],
    y:
      rocketData.aZ.length > 0
        ? [rocketData.aZ[rocketData.aZ.length - 1]]
        : [0],
    mode: "lines",
    type: "scatter",
    name: "Current Position",
    marker: {
      color: "#ff0000",
      size: 8,
      dash: "dash",
    },
  };

  const layout = {
    title: "ZAcceleration",
    scene: {
      xaxis: {
        title: "time",
        // gridcolor: "rgb(255, 255, 255)",
        // zerolinecolor: "rgb(255, 255, 255)",
        // showbackground: true,
        // backgroundcolor: "rgb(230, 230, 230)",
        showgrid: true,
      },
      yaxis: {
        title: "Z acceleration",
        // gridcolor: "rgb(255, 255, 255)",
        // zerolinecolor: "rgb(255, 255, 255)",
        // showbackground: true,
        // backgroundcolor: "rgb(230, 230, 230)",
        showgrid: true,
      },
      //   camera: {
      //     eye: { x: 0.1, y: 1.1, z: 0.1 },
      //   },
      aspectratio: { x: 1, y: 1, z: 1 },
    },
    margin: { l: 80, r: 50, b: 60, t: 60 },
    height: 400,
    showlegend: true,
    legend: {
      x: 0,
      y: 1.1,
      orientation: "h",
    },
    shapes: [
      // Horizontal line at 100000 Pa
      {
        type: "line",
        x0: 0,
        x1: 1,
        xref: "paper",
        line: {
          color: "#2ca02c",
          width: 1,
          dash: "dash",
        },
      },
    ],
  };
  return [[trajectoryTrace, currentPositionTrace], layout];
}
