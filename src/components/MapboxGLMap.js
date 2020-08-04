import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { connect } from 'react-redux'
import mapboxgl from "mapbox-gl";
import style from "../utils/style";
import bbox from "../utils/bbox.js";
import "mapbox-gl/dist/mapbox-gl.css";
import "../scss/index.scss";
import "../";
import closeIcon from "../images/times-regular.svg";
import { setHoverCd, setHighlightCd, setSelectCd} from "../redux/action-creators.js"

import LineChart from "./LineChart";

let MapboxGLMap = (props) => {

  const { hoverCd, selectCd, highlightCd } = props;
  const [map, setMap] = useState(null);
  const mapContainer = useRef(null);
  let { router_id } = useParams();
  const [focusDistrict, setFocusDistrict] = useState(
    router_id ? router_id.toUpperCase() : null
  );
  const [isFocus, toggleFocus] = useState(false)
  const [clrTrigger,invokeClrTrigger] = useState()
  const [chartTrigger,invokeChartTrigger] = useState()
  const [initialLoad, setInitialLoad] = useState(false);
  const [display, setDisplay] = useState(null);
  const [chartDiffs, setChartDiffs] = useState([]);
  const singleDistrictStates = ["AK", "WY", "MT", "ND", "SD", "VT", "DE", "DC"];

  useEffect(() => {
    setFocusDistrict(router_id);
  }, [router_id]);

  useEffect(() => {
    if (!map) {
      return;
    }
    if (!hoverCd.n.id) {
      return;
    }

    const params = {
      id: hoverCd.n.id,
      label: hoverCd.n.label
    }
    if (isFocus) {
      if (hoverCd.n.st === selectCd.n.st) {
        setHighlightCd(params)
        return
      }
      //remove highlight outside state
      const blankParams = {
        id: null,
        label: null
      }
      setHighlightCd(blankParams)
    }
    else {      
      setHighlightCd(params)
    }
  }, [map, hoverCd]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map) {
      return;
    }
    updateDistrictHover(map,highlightCd.p.id,highlightCd.n.id)
  }, [map, highlightCd]);


  useEffect(() => {
    if (!map) {
      return;
    }
    if (!selectCd.n.id && !selectCd.p.id) {
      //escape f before state initialized
      return;
    }

    if (!isFocus) {
      zoomToState(selectCd.n.st,map)
      updateDistrictHighlight(map,selectCd.p.id,selectCd.n.id)
      setLegend(map,selectCd.n.label)
      setChartDiffs(calcChartDiffs(map,selectCd.n.label,selectCd.n.st))
      setOverlayState(selectCd.n.st,map)
      toggleFocus(true)
      return
    }

    if (isFocus) {
      if (selectCd.p.st !== selectCd.n.st) {
        //lose focus
        updateDistrictHighlight(map,selectCd.p.id,null)
        setFocusDistrict(null)
        setOverlayState(null,map)
        toggleFocus(false)
        setLegend(map,null)
        const params = {
          id: null,
          label: null
        }
        setHighlightCd(params)
        return
      }
      else if (selectCd.p.id !== selectCd.n.id) {
        updateDistrictHighlight(map,selectCd.p.id,selectCd.n.id)
        setLegend(map,selectCd.n.label)
        setChartDiffs(calcChartDiffs(map,selectCd.n.label,selectCd.n.st))
        return
      }
    }
    
  }, [map, selectCd]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map) {
      return;
    }
    //remove hover
    const params = {
        id: null,
        label: null
      }
    setHighlightCd(params)
    updateDistrictHighlight(map,selectCd.n.id,null)
    setFocusDistrict(null)
    setLegend(map,null)
    setOverlayState(null,map)
    toggleFocus(false)

  }, [clrTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map) {
      return;
    }
    var results = map
      .querySourceFeatures("composite", {
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        filter: ["==", "label", chartTrigger.label]
      })

    if (!results) {return}
    const params = {
      id: results[0].id,
      label: results[0].properties.label,
      st: results[0].properties.state_abbr
    }
    setSelectCd(params)    
  }, [chartTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

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
    map.on("click", (e) => {
      handleClickDistrict(e, map);
    });
    const waiting = () => {
      if (!map.areTilesLoaded()) {
        setTimeout(waiting, 200);
      } else {
        initLoadMapFromParams(map)
      }
    };
    waiting();
  };

  const onMouseLeave = map => {
    map.getCanvas().style.cursor = "";
    const params = {
        id: null,
        label: null,
        st: null
      }
    setHoverCd(params)
  };

  const onMouseMove = (e, map) => {
    if (e.features.length > 0) {
      map.getCanvas().style.cursor = "pointer";
      const params = {
        id: e.features[0].id,
        label: e.features[0].properties.label,
        st: e.features[0].properties.state_abbr
      }
      setHoverCd( params )
    }
  };

  const handleClickDistrict = (e, map) => {
    var features = map.queryRenderedFeatures(e.point, {
        layers: ["cd-polygons"]
      });
    
    if (features.length > 0) {
      const params = {
        id: features[0].id, 
        label: features[0].properties.label,
        st: features[0].properties.state_abbr
      }
      setSelectCd(params)
      return;
    } // handle click outside map
    else {
      invokeClrTrigger( new Date().getTime() );
      return;
    }
  };

  const setOverlayState = (stLabel, map) => {
    let filter;
    if (!stLabel) {
      filter = ["all", ["match", ["get", "abbr"], [""], true, false]];
    } 
    else {
      const stAbbr = stLabel;
      filter = ["all", ["match", ["get", "abbr"], [stAbbr], false, true]];
    }    
    map.setFilter("states-masks", filter);
  };

  const initLoadMapFromParams = map => {
    if (!focusDistrict) {return}
    var results = map
      .querySourceFeatures("composite", {
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        filter: ["==", "label", focusDistrict],
      })
      
    if (results.length === 0) {
      return;
    }
    const params = {
        id: results[0].id, 
        label: results[0].properties.label,
        st: results[0].properties.state_abbr
      } 
    setSelectCd(params)
  }

  const setLegend = (map,stLabel) => {
    if (!stLabel) {
      setDisplay(null);
      return;
    }
    var results = map
      .querySourceFeatures("composite", {
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        filter: ["==", "label", stLabel]
      }).map(x=>x.properties)
      
    if (results.length === 0) {
      return;
    }
    setDisplay(results[0]);
  };

  const updateDistrictHighlight = (map,p,n) => {
    if (p) {
      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: p
        },
        { selected: false }
      );
    }
    map.setFeatureState(
      {
        source: "composite",
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        id: n
      },
      { selected: true }
    );
  }

  const initZoomToState = map => {
    if (!focusDistrict) {
      setInitialLoad(true);
      return;
    }
    const st = focusDistrict.split("-")[0].toUpperCase();
    var stFips = bbox.find(x => x.abbr === st);
    if (!stFips || !stFips.abbr) {
      setInitialLoad(true);
      return;
    }
    zoomToState(stFips.abbr, map);
    setInitialLoad(true);
  };

  const zoomToState = (stLabel, map) => {
    if (!stLabel) {return}
    const stAbbr = stLabel.split('-')[0].toUpperCase()
    const box = bbox.find(x => x.abbr === stAbbr).bbox;
    var [xmin, ymin, xmax, ymax] = [...box];
    map.fitBounds([[xmax, ymax], [xmin, ymin]], {
      padding: { left: 15, bottom: 15, right: 300, top: 15 }
    });
  };

  const calcChartDiffs = (map,stLabel,stAbbr) => {
    if (!stLabel) {return [];}
    var results = map
      .querySourceFeatures("composite", {
        sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
        filter: ["==", "state_abbr", stAbbr]
      })
      .map(x => ({
        dff_prc: x.properties.dff_prc * 100,
        selected: x.properties.label === stLabel,
        label: x.properties.label
      }));
    return results;
  };

  const updateDistrictHover = (map,p,n) => {
    if (p) {
      map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: p
        },
        { hover: false }
      );
    }

    map.setFeatureState(
        {
          source: "composite",
          sourceLayer: "azavea_us_congressional_districts_polygons_albersusa",
          id: n
        },
        { hover: true }
      );
  }

  const handleChartClick = d => {
    invokeChartTrigger(d)
  }

  const handleLegendClearClick = () => {
    invokeClrTrigger( new Date().getTime() )
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
                onClick={() => handleLegendClearClick()}
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
              For more information, read the corresponding&nbsp;<a href="https://www.azavea.com/blog/2020/07/29/which-congressional-districts-are-over-and-under-populated/">blog</a>.
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

function mapStateToProps(state) {
  return {
    highlightCd: state.highlightCd,
    hoverCd: state.hoverCd,
    selectCd: state.selectCd
  };
}

MapboxGLMap = connect(mapStateToProps)(MapboxGLMap);

export default MapboxGLMap;
