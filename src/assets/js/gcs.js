// ECharts is loaded globally from CDN script tag
console.log("GCS component loaded");

// Load GeoJSONs for world + Switzerland and register them
Promise.all([
  fetch("/assets/json/world.json").then((r) => r.json()),
  fetch("/assets/json/ch.geo.json").then((r) => r.json()),
])
  .then(([worldGeoJson, chGeoJson]) => {
    echarts.registerMap("world", worldGeoJson);
    echarts.registerMap("switzerland", chGeoJson);

    // Now safe to init maps
    initMaps();
  })
  .catch((error) => {
    console.error("Failed to load map data:", error);
    // Fallback to init maps even if map data fails to load
    initMaps();
  });

// Get the element and parse JSON content for i18n
const el = document.getElementById("i18n-gcs");
const i18n = JSON.parse(el.textContent);

// World map data (regions aggregated from user-provided dataset)
// Fields:
//  - ongoing: number of ongoing projects (B in previous naming)
//  - under_construction: number of projects under construction
//  - planned: number of planned projects
//  - mt_per_year: object with mt for ongoing/under_construction/planned when provided

const worldMapData = [
  {
    name: i18n.world.north_america,
    ongoing: 30, // USA 22 + Canada 8
    under_construction: 22, // USA 15 + Canada 7
    planned: 326, // USA 270 + Canada 56
    mt_per_year: {
      ongoing: 28, // USA 19 + Canada 9
      under_construction: 31.4, // USA 18 + Canada 13.4
      planned: 654.3, // USA 500 + Canada 154.3
    },
  },
  {
    name: i18n.world.europe,
    ongoing: 9,
    under_construction: 19,
    planned: 300,
    mt_per_year: {
      ongoing: 3.3,
      under_construction: 20,
      planned: 430,
    },
  },
  {
    name: i18n.world.middle_east,
    ongoing: 0, // unspecified (user wrote 'X projets en cours' — assume 0 or unknown)
    under_construction: 14, // construction/ planned grouped in input
    planned: 14,
    mt_per_year: {
      ongoing: 3.3, // user provided 3.3 Mt/yr for 'en cours' (kept as metric)
      under_construction: 39.5,
      planned: 39.5,
    },
  },
  {
    name: i18n.world.china,
    ongoing: 15,
    under_construction: 25,
    planned: 25,
    mt_per_year: {
      ongoing: 4,
      under_construction: 39.7,
      planned: 39.7,
    },
  },
  {
    name: i18n.world.australia,
    ongoing: 2,
    under_construction: 0,
    planned: 34,
    mt_per_year: {
      ongoing: 3.3,
      under_construction: 0,
      planned: 70,
    },
  },
  {
    name: i18n.world.south_america,
    ongoing: 0,
    under_construction: 0,
    planned: 0,
    mt_per_year: {
      ongoing: 0.5, // user said 'moins de 1 Mt CO2/an' — represented as 0.5
      under_construction: 0,
      planned: 0,
    },
  },
  {
    name: i18n.world.africa,
    ongoing: 0,
    under_construction: 0,
    planned: 0,
    mt_per_year: {
      ongoing: 0,
      under_construction: 0,
      planned: 0, // user said 'rien en cours mais beaucoup de choses prévues' — counts unknown
    },
  },
];

// Switzerland map data

const switzerlandMapData = [
  { name: "Valais", A: 0, B: 0, C: 0 },
  { name: "Grison", A: 0, B: 0, C: 0 },
  { name: "Jura", A: 0, B: 1, C: 0 },
  { name: "Zurich", A: 0, B: 1, C: 1 },
];

// Color schemes
const worldColors = {
  A: "#3DD0FF", // --bleu-punchy
  B: "#087065", // --vert
  C: "#5BAD91", // --vert-turquoise
};

const switzerlandColors = {
  A: "#5BAD91",
  B: "#90E036",
  C: "#087065",
};

// Helper function to get approximate center coordinates for Swiss regions
function getRegionCenter(regionName) {
  const regionCenters = {
    Valais: [7.5, 46.1],
    Grison: [9.5, 46.5],
    Jura: [7.1, 47.3],
    Zurich: [8.5, 47.4],
  };

  return regionCenters[regionName] || [8.0, 46.8]; // Default to center of Switzerland
}

// Function to initialize maps
function initMaps() {
  // Check if echarts is available
  if (typeof echarts === "undefined") {
    console.error("ECharts library not loaded");
    return;
  }

  // Find the map containers directly in the document
  const worldMapContainer = document.getElementById("world-map-container");
  const switzerlandMapContainer = document.getElementById(
    "switzerland-map-container",
  );

  if (!worldMapContainer) {
    console.log("World map container not found in document");
    return;
  }

  if (!switzerlandMapContainer) {
    console.log("Switzerland map container not found in document");
    return;
  }

  console.log("Initializing maps");

  // Initialize world map
  const worldChart = echarts.init(worldMapContainer);

  console.log("Using geographic scatter plot visualization...");
  const worldRegionCoords = {
    [i18n.world.north_america]: [-100, 40],
    [i18n.world.europe]: [15, 50],
    [i18n.world.middle_east]: [50, 30],
    [i18n.world.china]: [105, 35],
    [i18n.world.australia]: [135, -25],
    [i18n.world.south_america]: [-60, -15],
    [i18n.world.africa]: [20, 0],
  };

  const worldChartData = worldMapData.map((region) => ({
    value: worldRegionCoords[region.name] || [0, 0],
    ...region,
  }));

  // Compute extents for each metric to normalize symbol sizes (more visible variation)
  const clamp0 = (x) => Math.max(0, x || 0);
  const collect = (key) =>
    worldMapData.map((d) => clamp0(d.mt_per_year?.[key]));
  const extent = (arr) => {
    let min = Infinity,
      max = -Infinity;
    for (const v of arr) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (!isFinite(min)) min = 0;
    if (!isFinite(max)) max = 1;
    if (min === max) max = min + 1; // avoid divide by zero
    return [min, max];
  };
  const mtExtents = {
    planned: extent(collect("planned")),
    under_construction: extent(collect("under_construction")),
    ongoing: extent(collect("ongoing")),
  };

  // Log scaling that handles zeros gracefully
  const scaleLog = (v, [min, max], [rmin, rmax]) => {
    const lv = Math.log1p(v);
    const lmin = Math.log1p(min);
    const lmax = Math.log1p(max);
    const t = lmax - lmin > 0 ? (lv - lmin) / (lmax - lmin) : 0;
    return rmin + t * (rmax - rmin);
  };

  // Tweakable visual ranges per series (px)
  const RANGES = {
    planned: [16, 100],
    under_construction: [12, 80],
    ongoing: [8, 60],
  };

  // Create world map with geo-based approach
  const worldOption = {
    title: {
      text: i18n.world.image_alt,
      left: "center",
      textStyle: {
        fontSize: 16,
        color: "#f4f0eb",
        fontWeight: "normal",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: function (params) {
        const d = params.data || {};
        const mt = d.mt_per_year || {};
        return (
          `${d.name || ""}<br/>` +
          `${i18n.ongoing}: ${d.ongoing || 0} ${i18n.projects} — ${mt.ongoing || 0} ${i18n.MtCO2_per_year}<br/>` +
          `${i18n.under_construction}: ${d.under_construction || 0} ${i18n.projects} — ${mt.under_construction || 0} ${i18n.MtCO2_per_year}<br/>` +
          `${i18n.planned}: ${d.planned || 0} ${i18n.projects} — ${mt.planned || 0} ${i18n.MtCO2_per_year}<br/>` +
          `<strong>Total: ${(d.ongoing || 0) + (d.under_construction || 0) + (d.planned || 0)} ${i18n.projects}</strong>`
        );
      },
    },
    legend: {
      bottom: 10, // distance from bottom in px
      left: "center", // can be 'left', 'center', 'right' or a px/% value
      orient: "horizontal", // horizontal row (default) or vertical column

      textStyle: {
        fontSize: 16,
        color: "#f4f0eb",
        fontWeight: "normal",
      },
      icon: "circle", // shape of the legend marker ('circle','rect','roundRect','triangle','diamond','pin','arrow')
    },
    geo: {
      map: "world",
      roam: false,
      silent: true,
      itemStyle: {
        areaColor: "#f0f0f0",
        borderColor: "#999",
      },
    },
    series: [
      {
        name: `${i18n.planned}`,
        type: "scatter",
        coordinateSystem: "geo",
        symbol: "circle",

        symbolSize: (_, params) => {
          const v = clamp0(params?.data?.mt_per_year?.planned);
          return scaleLog(v, mtExtents.planned, RANGES.planned);
        },
        itemStyle: {
          color: worldColors.A,
          opacity: 0.6,
        },
        emphasis: {
          focus: "none",
          scale: false,
          itemStyle: { color: worldColors.B },
        },
        hoverAnimation: false,
        data: worldChartData,
      },
      {
        name: `${i18n.under_construction}`,
        type: "scatter",
        coordinateSystem: "geo",
        symbol: "circle",
        symbolSize: (_, params) => {
          const v = clamp0(params?.data?.mt_per_year?.under_construction);
          return scaleLog(
            v,
            mtExtents.under_construction,
            RANGES.under_construction,
          );
        },
        itemStyle: {
          color: worldColors.C,
          opacity: 0.8,
        },
        emphasis: {
          focus: "none",
          scale: false,
          itemStyle: { color: worldColors.B },
        },
        hoverAnimation: false,
        data: worldChartData,
      },
      {
        name: `${i18n.ongoing}`,
        type: "scatter",
        coordinateSystem: "geo",
        symbol: "circle",
        symbolSize: (_, params) => {
          const v = clamp0(params?.data?.mt_per_year?.ongoing);
          return scaleLog(v, mtExtents.ongoing, RANGES.ongoing);
        },
        itemStyle: {
          color: worldColors.B,
          opacity: 1,
        },
        emphasis: {
          focus: "none",
          scale: false,
          itemStyle: { color: worldColors.B },
        },
        hoverAnimation: false,
        data: worldChartData,
      },
    ],
    // graphic: [
    //   {
    //     type: "text",
    //     left: "center",
    //     bottom: 20,
    //     style: {
    //       text: "Geographic regions approximate - Circle size represents CO2 storage capacity (Mt/year, log scale)",
    //       fontSize: 11,
    //       fill: "#666",
    //     },
    //   },
    // ],
  };

  worldChart.setOption(worldOption);
  console.log("World map visualization set successfully");

  // Initialize Switzerland map
  const switzerlandChart = echarts.init(switzerlandMapContainer);
  // Prepare reusable swiss points once (deduplicate per-series data)
  const switzerlandPoints = switzerlandMapData.map((item) => ({
    name: item.name,
    value: getRegionCenter(item.name),
    A: item.A,
    B: item.B,
    C: item.C,
  }));

  // Create Switzerland map with geo-based approach
  const switzerlandOption = {
    title: {
      text: "Switzerland Geological Carbon Storage Data",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "normal",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: function (params) {
        const data = params.data;
        return `${data.name}<br/>
                Goals: ${data.A}<br/>
                Ongoing: ${data.B}<br/>
                Future: ${data.C}`;
      },
    },
    // legend: {
    //   data: ["Goals", "Ongoing", "Future"],
    //   top: 30,
    // },
    legend: {
      bottom: 10, // distance from bottom in px
      left: "center", // can be 'left', 'center', 'right' or a px/% value
      orient: "horizontal", // horizontal row (default) or vertical column
      textStyle: {
        color: "#333", // legend label text color
        fontSize: 12,
      },
      icon: "circle", // shape of the legend marker ('circle','rect','roundRect','triangle','diamond','pin','arrow')
    },
    geo: {
      map: "switzerland",
      roam: false,
      itemStyle: {
        areaColor: "#f0f0f0",
        borderColor: "#666",
      },
    },
    series: [
      {
        name: "Future",
        type: "scatter",
        coordinateSystem: "geo",
        symbol: "circle",
        symbolSize: (_, params) => {
          const d = params?.data || {};
          return d.C > 0 ? d.C * 80 + 50 : 30;
        },
        itemStyle: { color: switzerlandColors.C, opacity: 0.6 },
        emphasis: {
          focus: "none",
          scale: false,
          itemStyle: { color: switzerlandColors.C },
        },
        hoverAnimation: false,
        data: switzerlandPoints,
      },
      {
        name: "Ongoing",
        type: "scatter",
        coordinateSystem: "geo",
        symbol: "circle",
        symbolSize: (_, params) => {
          const d = params?.data || {};
          return d.B > 0 ? d.B * 70 + 40 : 25;
        },
        itemStyle: { color: switzerlandColors.B, opacity: 0.8 },
        emphasis: {
          focus: "none",
          scale: false,
          itemStyle: { color: switzerlandColors.B },
        },
        hoverAnimation: false,
        data: switzerlandPoints,
      },
      {
        name: "Goals",
        type: "scatter",
        coordinateSystem: "geo",
        symbol: "circle",
        symbolSize: (_, params) => {
          const d = params?.data || {};
          return d.A > 0 ? d.A * 60 + 30 : 20;
        },
        itemStyle: { color: switzerlandColors.A, opacity: 1 },
        emphasis: {
          focus: "none",
          scale: false,
          itemStyle: { color: switzerlandColors.A },
        },
        hoverAnimation: false,
        data: switzerlandPoints,
      },
    ],
  };

  switzerlandChart.setOption(switzerlandOption);

  // Handle window resize
  function handleResize() {
    worldChart.resize();
    switzerlandChart.resize();
  }

  window.addEventListener("resize", handleResize);

  console.log("Maps initialized");
}

// Initialize maps when the DOM is ready
// Note: initMaps will be called after maps are registered in the Promise.all block above
// So we don't need to call it again here
