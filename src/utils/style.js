export default {
  version: 8,
  name: "Albers USA",
  sources: {
    composite: {
      type: "vector",
      tiles: [window.location.origin + "/assets/tiles/{z}/{x}/{y}.pbf"],
      minzoom: 2,
      maxzoom: 8
    }
  },
  sprite: window.location.origin + "/assets/sprites/sprite",
  glyphs: window.location.origin + "/assets/fonts/{fontstack}/{range}.pbf",
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#fff" }
    },
    {
      id: "us-outline-polygons",
      type: "fill",
      source: "composite",
      "source-layer": "azavea_us_outline_albersusa",
      layout: {},
      paint: { "fill-color": "#F0F0F0" }
    },
    {
      id: "cd-polygons",
      type: "fill",
      source: "composite",
      "source-layer": "azavea_us_congressional_districts_polygons_albersusa",
      layout: {},
      paint: { "fill-color": [
        "step",
        ["get", "dff_prc"],
        "#8c510a",
        -0.05475,
        "#d8b365",
        -0.0295,
        "#f6e8c3",
        -0.01018,
        "#F0F0F0",
        0.00843,
        "#c7eae5",
        0.02871,
        "#5ab4ac",
        0.0604,
        "#01665e"
      ] }
    },
    {
      id: "urban-areas",
      type: "fill",
      source: "composite",
      "source-layer": "ne_urban_areas_clipped_us_albersusa",
      layout: {},
      paint: {
        "fill-color": "#000",
        "fill-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          0,
          6,
          0.05,
          10,
          0.05
        ]
      },
    },
    // {
    //   id: "urban-areas-pattern",
    //   type: "fill",
    //   source: "composite",
    //   "source-layer": "ne_urban_areas_clipped_us_albersusa",
    //   layout: {},
    //   paint: {
    //     "fill-pattern": "line-0",
    //     "fill-opacity": [
    //       "step",
    //       ["zoom"],
    //       0.05,
    //       6,
    //       0.05
    //     ]
    //   },
    // },
    {
      id: "road-line",
      type: "line",
      source: "composite",
      "source-layer": "ne_roads_clipped_us_albersusa",
      paint: {
        "line-color": "#000",
        "line-width": 0.25,
        "line-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          0,
          6,
          0.15,
          10,
          0.3
        ]
      }
    },
    {
      id: "states-pattern",
      type: "fill",
      source: "composite",
      "source-layer": "azavea_us_states_polygons_albersusa",
      layout: {},
      paint: { "fill-pattern": "line-0", "fill-opacity": 0.2 },
      filter: [
        "all",
        [
          "match",
          ["get", "fips"],
          [
            "30",
            "50",
            "56",
            "38",
            "46",
            "02"
          ],
          true,
          false
        ]
      ]
    },
    {
      id: "cd-innerlines",
      type: "line",
      source: "composite",
      "source-layer": "azavea_us_congressional_districts_innerlines_albersusa",
      layout: {},
      paint: {
        "line-color": "#fff",
        "line-width": [
          "step",
          ["zoom"],
          0.5,
          6,
          1.5
        ],
        "line-opacity": 1
      }
    },
    {
      id: "states-innerlines",
      type: "line",
      source: "composite",
      "source-layer": "azavea_us_states_innerlines_albersusa",
      layout: {},
      paint: {
        "line-color": "#fff",
        "line-width": [
          "step",
          ["zoom"],
          1,
          6,
          3
        ],
        "line-opacity": 1
      }
    },
    {
      id: "states-masks",
      type: "fill",
      source: "composite",
      "source-layer": "azavea_us_states_polygons_albersusa",
      layout: {},
      filter: [
        "all",
        [
          "match",
          ["get", "abbr"],
          [""],
          true,
          false
        ]
      ],
      paint: {
        "fill-color": "#fff",
        "fill-opacity": 0.85
      }
    },
    {
      id: "cd-highlight",
      type: "fill",
      source: "composite",
      "source-layer": "azavea_us_congressional_districts_polygons_albersusa",
      layout: {},
      paint: {
                'fill-color': '#000',
                'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.05, 0],
            },
    },
    {
      id: "cd-selected",
      type: "line",
      source: "composite",
      "source-layer": "azavea_us_congressional_districts_polygons_albersusa",
      layout: {},
      paint: {
                'line-color': '#008bff',
                'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.9, 0],
                'line-width': 4,
            },
    },
    {
      id: "place-points-4",
      type: "symbol",
      source: "composite",
      "source-layer": "ne_populated_places_clipped_us_4_albersusa",
      layout: {
        "text-field": ["get", "NAME"],
        "text-font": ["ag-r"],
        "text-size": [
          "step",
          ["zoom"],
          12,
          8,
          14
        ]
      },
      paint: {
        "text-color": [
          "step",
          ["zoom"],
          "#444",
          6,
          "#222"
        ],
        "text-opacity": 1,
        "text-halo-color": "#fff",
        "text-halo-width": 1.25,
        "text-halo-blur": 0
      }
    },
    {
      id: "place-points-3",
      type: "symbol",
      source: "composite",
      "source-layer": "ne_populated_places_clipped_us_3_albersusa",
      layout: {
        "text-field": ["get", "NAME"],
        "text-font": ["ag-r"],
        "text-size": [
          "step",
          ["zoom"],
          12,
          8,
          14
        ]
      },
      paint: {
        "text-color": [
          "step",
          ["zoom"],
          "#444",
          6,
          "#222"
        ],
        "text-opacity": 1,
        "text-halo-color": "#fff",
        "text-halo-width": 1.25,
        "text-halo-blur": 0
      }
    },
    {
      id: "place-points-2",
      type: "symbol",
      source: "composite",
      "source-layer": "ne_populated_places_clipped_us_2_albersusa",
      layout: {
        "text-field": ["get", "NAME"],
        "text-font": ["ag-r"],
        "text-size": 14
      },
      paint: {
        "text-color": [
          "step",
          ["zoom"],
          "#444",
          6,
          "#222"
        ],
        "text-opacity": 1,
        "text-halo-color": "#fff",
        "text-halo-width": 1.25,
        "text-halo-blur": 0
      }
    },
    {
      id: "place-points-1",
      type: "symbol",
      source: "composite",
      "source-layer": "ne_populated_places_clipped_us_1_albersusa",
      layout: {
        "text-field": ["get", "NAME"],
        "text-font": ["ag-r"],
        "text-size": 14
      },
      paint: {
        "text-color": [
          "step",
          ["zoom"],
          "#444",
          6,
          "#222"
        ],
        "text-opacity": 1,
        "text-halo-color": "#fff",
        "text-halo-width": 1.25,
        "text-halo-blur": 0
      }
    },
    {
      id: "congressional-points",
      type: "symbol",
      source: "composite",
      minzoom: 6,
      "source-layer": "azavea_us_congressional_districts_points_albersusa",
      layout: {
        "text-field": [
          "step",
          ["zoom"],
          [
            "to-string",
            ["get", "label"]
          ],
          6,
          [
            "to-string",
            ["get", "label"]
          ]
        ],
        "text-font": ["ag-m"],
        "text-letter-spacing": 0.15,
        "text-transform": [
          "step",
          ["zoom"],
          "uppercase",
          6,
          "none"
        ],
        "text-size": [
          "step",
          ["zoom"],
          14,
          9,
          16,
        ]
      },
      paint: {
        "text-color": "#999",
        "text-opacity": 1,
        "text-halo-color": "#fff",
        "text-halo-width": 1,
        "text-halo-blur": 0
      }
    },
    {
      id: "place-points-0",
      type: "symbol",
      source: "composite",
      minzoom: 4,
      "source-layer": "ne_populated_places_clipped_us_0_albersusa",
      layout: {
        "text-field": ["get", "NAME"],
        "text-font": ["ag-r"],
        "text-size": 14
      },
      paint: {
        "text-color": [
          "step",
          ["zoom"],
          "#444",
          6,
          "#222"
        ],
        "text-opacity": 1,
        "text-halo-color": "#fff",
        "text-halo-width": 1.25,
        "text-halo-blur": 0
      }
    },
    {
      id: "state-points",
      type: "symbol",
      source: "composite",
      maxzoom: 6,
      "source-layer": "azavea_us_states_points_albersusa",
      layout: {
        "text-field": [
          "step",
          ["zoom"],
          [
            "to-string",
            ["get", "short"]
          ],
          6,
          [
            "to-string",
            ["get", "name"]
          ]
        ],
        "text-font": ["ag-m"],
        "text-letter-spacing": [
          "step",
          ["zoom"],
          0.15,
          6,
          0
        ],
        "text-transform": [
          "step",
          ["zoom"],
          "uppercase",
          6,
          "none"
        ],
        "text-size": [
          "step",
          ["zoom"],
          10,
          6,
          16
        ]
      },
      paint: {
        "text-color": "#777",
        "text-opacity": 1,
        "text-halo-color": "#fff",
        "text-halo-width": 1.25,
        "text-halo-blur": 0
      }
    }
  ]
};
