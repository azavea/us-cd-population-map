import React from "react";
import logo from "./images/districtbuilder_white.svg";
import "./App.css";
import OuterContainer from "./components/OuterContainer";

function App() {
  var url = new URL(window.location.href);
  var embedParam = url.searchParams.get("embed");
  const embed = embedParam === "true" ? true : false;

  return (
    <div className="App">
      <div className={"App-header" + (embed ? " embed" : "")}>
        <a className="logo-link" href="http://districtbuilder.org">
          <img src={logo} className="logo" alt="DistrictBuilder" />
        </a>
      </div>
      <OuterContainer />
    </div>
  );
}

export default App;
