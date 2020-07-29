import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import style from "../utils/style";
import bbox from "../utils/bbox.js";
import "mapbox-gl/dist/mapbox-gl.css";
import "../scss/index.scss";
import "../";
import closeIcon from "../images/times-regular.svg";

import LineChart from "./LineChart";

const MapboxGLMap = () => {
  const [map, setMap] = useState(null);
  const mapContainer = useRef(null);
  let { router_id } = useParams();
  const [focusDistrict, setFocusDistrict] = useState(
    router_id ? router_id.toUpperCase() : null
  );
  const [initialLoad, setInitialLoad] = useState(false);
  const [display, setDisplay] = useState(null);
  const [chartDiffs, setChartDiffs] = useState([]);
  var hoveredDistrictId;
  var selectedDistrictId;
  const [selectedStateDistrictId, setSelectedStateDistrictId] = useState();
  const [trigger, setTrigger] = useState();
  const singleDistrictStates = ["AK", "WY", "MT", "ND", "SD", "VT", "DE", "DC"];

  useEffect(() => {
    setFocusDistrict(router_id);
  }, [router_id]);

  useEffect(() => {
    if (map) {
      setLegend(map);
      setChartDiffs(calcChartDiffs(map));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusDistrict]);

  useEffect(() => {
    if (map) {
      triggerCallback(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiYXphdmVhIiwiYSI6IkFmMFBYUUUifQ.eYn6znWt8NzYOa3OrWop8A";
    const initializeMap = ({ setMap, mapContainer }) => {
      var [xmin, ymin, xmax, ymax] = [
        -20.026114086648512,
        -13.080309755245814,
        19.700190980283185,
        12.703790184833048,
      ];

      var url = new URL(window.location.href);
      var embedParam = url.searchParams.get("embed");
      const embed = embedParam === "true" ? true : false;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: style,
        center: [-0.34, -0.62],
        bearing: 0,
        pitch: 0,
        minZoom: 2,
        maxZoom: 11,
        hash: false,
        maxBounds: [
          [xmin - 40, ymin - 40],
          [xmax + 40, ymax + 40],
        ],
      });

      var nav = new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: true,
      });

      map.addControl(nav, "top-left");

      map.fitBounds(
        [
          [xmax, ymax],
          [xmin, ymin],
        ],
        {
          padding: embed
            ? 5
            : {
                left: 10,
                right: 340,
                top: 0,
                bottom: 0,
              },
        }
      );
      initZoomToState(map);
      map.dragRotate.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disableRotation();
      map.on("load", () => {
        setMap(map);
        loadMap(map);
      });
      window.history.replaceState({}, "", "/");
    };

    if (!map) initializeMap({ setMap, mapContainer });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  const loadMap = function (map, layerName, styleMode) {
    map.on("mousemove", "cd-polygons", (e) => {
      onMouseMove(e, map);
    });
    map.on("mouseleave", "cd-polygons", () => {
      onMouseLeave(map);
    });
    map.on("click", "cd-polygons", (e) => {
      handleClickDistrict(e, map);
    });
    const waiting = () => {
      if (!map.areTilesLoaded()) {
        setTimeout(waiting, 200);
      } else {
        setLegend(map);
        setChartDiffs(calcChartDiffs(map));
        initMapLoadDistrictHighlight(map);
      }
    };
    waiting();
  };

  const handleClickDistrict = (e, map) => {
    if (e.features.length > 0) {
      zoomToState(e.features[0].properties.state_fips, map);
      setOverlayState(e.features[0].properties.state_abbr, map);
      setFocusDistrict(e.features[0].properties.label);
      setDistrictSelectedHighlight(map);
      return;
    }
  };

  const setOverlayState = (stAbbr, map) => {
    console.log(stAbbr);
    var filter = ["all", ["match", ["get", "abbr"], [stAbbr], false, true]];
    map.setFilter("states-masks", filter);
  };

  const initZoomToState = (map) => {
    if (!focusDistrict) {
      setInitialLoad(true);
      return;
    }
    const st = focusDistrict.split("-")[0].toUpperCase();
    var stFips = bbox.find((x) => x.abbr === st);
    if (!stFips || !stFips.fips) {
      setInitialLoad(true);
      return;
    }
    zoomToState(stFips.fips, map);
    setInitialLoad(true);
  };

  const zoomToState = (stFips, map) => {
    const box = bbox.find((x) => x.fips === stFips).bbox;
    var [xmin, ymin, xmax, ymax] = [...box];
    map.fitBounds(
      [
        [xmax, ymax],
        [xmin, ymin],
      ],
      {
        padding: { left: 15, bottom: 15, right: 300, top: 15 },
      }
    );
  };

  const setLegend = (map) => {
    if (!focusDistrict) {
      return;
    }
    var results = map
      .querySourceFeatures("composite", {
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        filter: ["==", "label", focusDistrict],
      })
      .map((x) => x.properties);
    if (results.length === 0) {
      return;
    }
    setDisplay(results[0]);
  };

  const onMouseMove = (e, map) => {
    if (e.features.length > 0) {
      map.getCanvas().style.cursor = "pointer";
      if (hoveredDistrictId) {
        map.setFeatureState(
          {
            source: "composite",
            sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
            id: hoveredDistrictId,
          },
          { hover: false }
        );
      }
      hoveredDistrictId = e.features[0].id;
      setDistrictHover(map);
    }
  };

  const calcChartDiffs = (map) => {
    if (!focusDistrict) {
      return;
    }
    const st = (focusDistrict.split("-")[0] || "").toUpperCase();
    var results = map
      .querySourceFeatures("composite", {
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        filter: ["==", "state_abbr", st],
      })
      .map((x) => ({
        dff_prc: x.properties.dff_prc * 100,
        selected: x.properties.label === focusDistrict,
        label: x.properties.label,
      }));
    return results;
  };

  const initMapLoadDistrictHighlight = (map) => {
    if (!focusDistrict) {
      return;
    }
    var results = map
      .querySourceFeatures("composite", {
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        filter: ["==", "label", focusDistrict],
      })
      .map((x) => x.id);
    hoveredDistrictId = results[0];
    setDistrictSelectedHighlight(map);
    const validPaths = bbox.map((x) => x.abbr);
    const st = (focusDistrict.split("-")[0] || "").toUpperCase();
    if (validPaths.includes(st)) {
      setOverlayState(st, map);
    }
  };

  const setDistrictHover = (map) => {
    map.setFeatureState(
      {
        source: "composite",
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        id: hoveredDistrictId,
      },
      { hover: true }
    );
  };

  const triggerCallback = (map) => {
    if (selectedStateDistrictId) {
      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: selectedStateDistrictId,
        },
        { selected: false }
      );
    }
  };

  const setDistrictSelectedHighlight = (map) => {
    if (selectedDistrictId) {
      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: selectedDistrictId,
        },
        { selected: false }
      );
    }

    map.setFeatureState(
      {
        source: "composite",
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        id: hoveredDistrictId,
      },
      { selected: true }
    );
    selectedDistrictId = hoveredDistrictId;
    setTrigger(new Date().getTime());
    setSelectedStateDistrictId(hoveredDistrictId);
  };

  const handleChartClick = (d) => {
    setFocusDistrict(d.label);
    var results = map
      .querySourceFeatures("composite", {
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        filter: ["==", "label", d.label],
      })
      .map((x) => x.id);

    if (selectedStateDistrictId) {
      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: selectedStateDistrictId,
        },
        { selected: false }
      );
    }

    map.setFeatureState(
      {
        source: "composite",
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        id: results[0],
      },
      { selected: true }
    );

    setSelectedStateDistrictId(results[0]);
    return;
  };

  const onMouseLeave = (map) => {
    map.getCanvas().style.cursor = "";
    if (hoveredDistrictId) {
      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: hoveredDistrictId,
        },
        { hover: false }
      );
    }
    hoveredDistrictId = null;
  };

  const handleLegendClearClick = (selectedStateDistrictId) => {
    setDisplay(null);
    var filter = ["all", ["match", ["get", "abbr"], [""], true, false]];
    map.setFilter("states-masks", filter);
    if (selectedStateDistrictId) {
      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: selectedStateDistrictId,
        },
        { selected: false }
      );
    }
    setSelectedStateDistrictId(null);
    setFocusDistrict(null);
  };

  const PanelHeader = () => {
    const displayLabel = display
      ? display.state_name.concat(", ", display.label)
      : "Overpopulated and Underpopulated Districts";

    return (
      <React.Fragment>
        <div className="panel-header">
          {!display && <h1 className="panel-title">{displayLabel}</h1>}
          {display && (
            <React.Fragment>
              <h2 className="panel-detail">{displayLabel}</h2>
              <div
                className="panel-clear"
                onClick={() => handleLegendClearClick(selectedStateDistrictId)}
              >
                <div className="clear-button">
                  <img src={closeIcon} className="close-icon" alt="Close" />
                </div>
              </div>
            </React.Fragment>
          )}
        </div>
        {display && <hr />}
      </React.Fragment>
    );
  };

  const SingleDistrictBody = () => {
    const stateName = display.state_name;

    return (
      <div className="panel-body-description">
        <p>{`${stateName} has one, at-large representative, due to how representatives are reapportioned based on population. This state's population is not large enough to receive more than one representative.`}</p>
      </div>
    );
  };

  const MultiDistrictBody = () => {
    return (
      <div>
        <div className="panel-row">
          <div className="panel-item">
            <div className="panel-item-figure">
              {display.estimat.toLocaleString()}
            </div>
            <div className="panel-item-description">2018 Population</div>
          </div>
          <div className="panel-item">
            <div className="panel-item-figure">
              {display.trgtp18.toLocaleString()}
            </div>
            <div className="panel-item-description">Target Population</div>
          </div>
        </div>
        <div className="panel-row">
          <div className="panel-item">
            <div className="panel-item-figure">
              {display.diff.toLocaleString()}
            </div>
            <div className="panel-item-description">Difference</div>
          </div>
          <div className="panel-item">
            <div className="panel-item-figure">
              {(display.dff_prc * 100).toFixed(1).concat("%")}
            </div>
            <div className="panel-item-description">Difference, Percent</div>
          </div>
        </div>
      </div>
    );
  };

  const PanelBody = () => {
    return (
      <div className="panel-body">
        {!display ? (
          <div className="panel-body-description">
            <p>
              This map displays the latest population estimates for
              Congressional districts in the U.S. and compares it to the state's
              target population for districts. The target population is what the
              districts would be, ideally, if they were redrawn based on the
              latest estimates.
            </p>
            <p>
              Use this map to see which districts are over-or-under populated.
              For more information, read the corresponding
              <a href="https://www.azavea.com/blog/">blog</a>.
            </p>
          </div>
        ) : singleDistrictStates.includes(display.state_abbr) ? (
          <SingleDistrictBody />
        ) : (
          <MultiDistrictBody />
        )}
      </div>
    );
  };

  const renderSelectedFooter = () => {
    return (
      <React.Fragment>
        {!singleDistrictStates.includes(display.state_abbr) && (
          <LineChart diffs={chartDiffs} onClick={handleChartClick} />
        )}
      </React.Fragment>
    );
  };

  const PanelFooter = () => {
    return (
      <div className="panel-footer">
        {!display ? <React.Fragment /> : renderSelectedFooter()}
      </div>
    );
  };

  const Legend = () => {
    return (
      <div className="legend">
        <div className="legend-scale">
          <div
            className="legend-scale-item"
            style={{ backgroundColor: "#8b5109" }}
          ></div>
          <div
            className="legend-scale-item"
            style={{ backgroundColor: "#f6e8c3" }}
          ></div>
          <div
            className="legend-scale-item"
            style={{ backgroundColor: "#f0f0f0" }}
          ></div>
          <div
            className="legend-scale-item"
            style={{ backgroundColor: "#c8eae5" }}
          ></div>
          <div
            className="legend-scale-item"
            style={{ backgroundColor: "#02665e" }}
          ></div>
        </div>
        <div className="legend-scale-label-container">
          <div className="legend-scale-label-item">Underpopulated</div>
          <div className="legend-scale-label-item">Balanced</div>
          <div className="legend-scale-label-item">Overpopulated</div>
        </div>
      </div>
    );
  };

  const Panel = () => {
    return (
      <div className={`panel ${display ? "view--detail" : "view--default"}`}>
        <PanelHeader />
        <PanelBody />
        <PanelFooter />
      </div>
    );
  };

  return (
    <React.Fragment>
      <div className="map" ref={(el) => (mapContainer.current = el)} />
      {map && initialLoad && <Panel />}
      <Legend />
    </React.Fragment>
  );
};

export default MapboxGLMap;
