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
  }, [focusDistrict]);

  useEffect(() => {
    if (map) {
      triggerCallback(map);
    }
  }, [trigger]);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiYXphdmVhIiwiYSI6IkFmMFBYUUUifQ.eYn6znWt8NzYOa3OrWop8A";
    const initializeMap = ({ setMap, mapContainer }) => {
      var [xmin, ymin, xmax, ymax] = [
        -24.026114086648512,
        -13.080309755245814,
        20.700190980283185,
        12.703790184833048
      ];

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: style,
        center: [-0.34, -0.62],
        bearing: 0,
        pitch: 0,
        minZoom: 4,
        maxZoom: 11,
        hash: false
      });

      var nav = new mapboxgl.NavigationControl();
      map.addControl(nav, "top-left");
      map.fitBounds([[xmax, ymax], [xmin, ymin]], { padding: 25 });
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
  }, [map]);

  const loadMap = function(map, layerName, styleMode) {
    map.on("mousemove", "cd-polygons", e => {
      onMouseMove(e, map);
    });
    map.on("mouseleave", "cd-polygons", () => {
      onMouseLeave(map);
    });
    map.on("click", "cd-polygons", e => {
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

  const initZoomToState = map => {
    if (!focusDistrict) {
      setInitialLoad(true);
      return;
    }
    const st = focusDistrict.split("-")[0].toUpperCase();
    var stFips = bbox.find(x => x.abbr === st);
    if (!stFips || !stFips.fips) {
      setInitialLoad(true);
      return;
    }
    zoomToState(stFips.fips, map);
    setInitialLoad(true);
  };

  const zoomToState = (stFips, map) => {
    const box = bbox.find(x => x.fips === stFips).bbox;
    var [xmin, ymin, xmax, ymax] = [...box];
    map.fitBounds([[xmax, ymax], [xmin, ymin]], {
      padding: { left: 15, bottom: 15, right: 340, top: 15 }
    });
  };

  const setLegend = map => {
    if (!focusDistrict) {
      return;
    }
    var results = map
      .querySourceFeatures("composite", {
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        filter: ["==", "label", focusDistrict]
      })
      .map(x => x.properties);
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
            id: hoveredDistrictId
          },
          { hover: false }
        );
      }
      hoveredDistrictId = e.features[0].id;
      setDistrictHover(map);
    }
  };

  const calcChartDiffs = map => {
    if (!focusDistrict) {
      return;
    }
    const st = (focusDistrict.split("-")[0] || "").toUpperCase();
    var results = map
      .querySourceFeatures("composite", {
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        filter: ["==", "state_abbr", st]
      })
      .map(x => ({
        dff_prc: x.properties.dff_prc * 100,
        selected: x.properties.label === focusDistrict,
        label: x.properties.label
      }));
    return results;
  };

  const initMapLoadDistrictHighlight = map => {
    if (!focusDistrict) {
      return;
    }
    var results = map
      .querySourceFeatures("composite", {
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        filter: ["==", "label", focusDistrict]
      })
      .map(x => x.id);
    hoveredDistrictId = results[0];
    setDistrictSelectedHighlight(map);
    const validPaths = bbox.map(x => x.abbr);
    const st = (focusDistrict.split("-")[0] || "").toUpperCase();
    if (validPaths.includes(st)) {
      setOverlayState(st, map);
    }
  };

  const setDistrictHover = map => {
    map.setFeatureState(
      {
        source: "composite",
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        id: hoveredDistrictId
      },
      { hover: true }
    );
  };

  const triggerCallback = map => {
    if (selectedStateDistrictId) {
      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: selectedStateDistrictId
        },
        { selected: false }
      );
    }
  };

  const setDistrictSelectedHighlight = map => {
    if (selectedDistrictId) {
      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: selectedDistrictId
        },
        { selected: false }
      );
    }

    map.setFeatureState(
      {
        source: "composite",
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        id: hoveredDistrictId
      },
      { selected: true }
    );
    selectedDistrictId = hoveredDistrictId;
    setTrigger(new Date().getTime());
    setSelectedStateDistrictId(hoveredDistrictId);
  };

  const handleChartClick = d => {
    setFocusDistrict(d.label);
    var results = map
      .querySourceFeatures("composite", {
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        filter: ["==", "label", d.label]
      })
      .map(x => x.id);

    if (selectedStateDistrictId) {
      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: selectedStateDistrictId
        },
        { selected: false }
      );
    }

    map.setFeatureState(
      {
        source: "composite",
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        id: results[0]
      },
      { selected: true }
    );

    setSelectedStateDistrictId(results[0]);
    return;
  };

  const onMouseLeave = map => {
    map.getCanvas().style.cursor = "";
    if (hoveredDistrictId) {
      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: hoveredDistrictId
        },
        { hover: false }
      );
    }
    hoveredDistrictId = null;
  };

  const handleLegendClearClick = selectedStateDistrictId => {
    setDisplay(null);
    var filter = ["all", ["match", ["get", "abbr"], [""], true, false]];
    map.setFilter("states-masks", filter);
    if (selectedStateDistrictId) {
      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: selectedStateDistrictId
        },
        { selected: false }
      );
    }
    setSelectedStateDistrictId(null);
    setFocusDistrict(null);
  };

  const renderLegendHeader = () => {
    const displayLabel = display
      ? display.state_name.concat(", ", display.label)
      : "Overpopulated and Underpopulated Districts";

    return (
      <div className="legend-header">
        <h1 className="legend-title">{displayLabel}</h1>
        {display && (
          <div
            className="legend-clear"
            onClick={() => handleLegendClearClick(selectedStateDistrictId)}
          >
            <div className="clear-button">
              <img src={closeIcon} className="close-icon" alt="Close" />
            </div>
          </div>
        )}
      </div>
    );
  };

  const singleDistrictBody = () => {
    const stateName = display.state_name;

    return (
      <div className="legend-body-description">
        <div>{`${stateName} has only one congressional district, which means lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`}</div>
      </div>
    );
  };

  const multiDistrictBody = () => {
    return (
      <div>
        <div className="legend-row">
          <div className="legend-item">
            <div className="legend-item-figure">
              {display.estimat.toLocaleString()}
            </div>
            <div className="legend-item-description">2018 Population</div>
          </div>
          <div className="legend-item">
            <div className="legend-item-figure">
              {display.trgtp18.toLocaleString()}
            </div>
            <div className="legend-item-description">Target Population</div>
          </div>
        </div>
        <div className="legend-row">
          <div className="legend-item">
            <div className="legend-item-figure">
              {display.diff.toLocaleString()}
            </div>
            <div className="legend-item-description">Difference</div>
          </div>
          <div className="legend-item">
            <div className="legend-item-figure">
              {(display.dff_prc * 100).toFixed(1).concat("%")}
            </div>
            <div className="legend-item-description">Difference, Percent</div>
          </div>
        </div>
      </div>
    );
  };

  const renderLegendBody = () => {
    return (
      <div
        className="legend-body"
        style={{ height: !display ? "200px" : "120px" }}
      >
        {!display ? (
          <div className="legend-body-description">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p>
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Ut enim ad minim veniam,
              quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
              commodo consequat. And a{" "}
              <a href="https://cicerodata.com" target="_blank">
                link to the blog
              </a>
            </p>
          </div>
        ) : singleDistrictStates.includes(display.state_abbr) ? (
          singleDistrictBody()
        ) : (
          multiDistrictBody()
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

  const renderLegendFooter = () => {
    return (
      <div
        className="legend-footer"
        style={{ height: !display ? "60px" : "140px" }}
      >
        {!display ? (
          <React.Fragment>
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
          </React.Fragment>
        ) : (
          renderSelectedFooter()
        )}
      </div>
    );
  };

  const renderLegend = () => {
    return (
      <div className="panel">
        {renderLegendHeader()}
        {renderLegendBody()}
      </div>
    );
  };

  return (
    <React.Fragment>
      <div className="map" ref={el => (mapContainer.current = el)} />
      {map && initialLoad && renderLegend()}
      {renderLegendFooter()}
    </React.Fragment>
  );
};

export default MapboxGLMap;
