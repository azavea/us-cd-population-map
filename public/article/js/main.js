import style from "./style.js";

const bounds = [
  -20.026114086648512 - 1.8,
  -13.080309755245814,
  19.700190980283185 + 1.8,
  12.703790184833048,
];

console.log(window.location.href);

var [xmin, ymin, xmax, ymax] = bounds;

const map = new mapboxgl.Map({
  container: "map",
  style: style,
  bearing: 0,
  pitch: 0,
  minZoom: 2,
  maxZoom: 8,
  // hash: true,
  maxBounds: bounds,
  bounds: bounds,
});

var nav = new mapboxgl.NavigationControl({
  showCompass: false,
  showZoom: true,
});

map.addControl(nav, "bottom-right");
map.scrollZoom.disable();

// Add popup component

const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
  anchor: "top",
});

popup.addTo(map);

let oldHighlightId;

function updatePopup(e) {
  if (e.features.length > 0) {
    const id = e.features[0].id;
    const properties = e.features[0].properties;

    const {
      estimat,
      diff,
      dff_prc,
      trgtp18,
      state_name,
      district_number,
      label,
      state_fips,
    } = properties;

    if (id !== oldHighlightId && id !== oldHighlightId) {
      popup.addTo(map);

      typeof oldHighlightId !== "undefined" &&
        map.setFeatureState(
          {
            source: "composite",
            sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
            id: oldHighlightId,
          },
          {
            highlight: "false",
          }
        );

      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: id,
        },
        {
          highlight: "true",
        }
      );

      oldHighlightId = id;

      // Construct tooltip text
      const overOrUnder = diff > 0 ? "over" : diff < 0 ? "under" : "even with";

      const notMultipleDistricts = [
        "30",
        "50",
        "56",
        "38",
        "46",
        "02",
      ].includes(state_fips);

      const sentence = notMultipleDistricts
        ? `${state_name} has one, at-large representative, due to how representatives are reapportioned based on population.`
        : `<strong>${Math.abs(diff).toLocaleString("en", {
            useGrouping: true,
          })} ${overOrUnder}</strong> the ideal population`;

      const content = `
      <h2>${state_name}, ${label}</h2>
      <p>${sentence}</p>
    `;

      popup.setHTML(content);
    }

    popup.setLngLat(e.lngLat);
  }
}

function mouseOut(e) {
  map.setFeatureState(
    {
      source: "composite",
      sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
      id: oldHighlightId,
    },
    {
      highlight: "false",
    }
  );
  popup.remove();
  oldHighlightId = undefined;
}

map.on("style.load", function () {
  map.on("mousemove", "cd-polygons", updatePopup);
  map.on("mouseout", "cd-polygons", mouseOut);
});
