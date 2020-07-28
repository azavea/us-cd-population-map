import React from "react";
import logo from "./images/districtbuilder_white.svg";
import "./App.css";
import OuterContainer from "./components/OuterContainer";

function App() {
  var url = new URL(window.location.href);
  var embedParam = url.searchParams.get("embed");
  const embed = embedParam === "true" ? true : false;

  return (
    <div className={"App" + (embed ? " embed" : "")}>
      <div className="App-header">
        <a className="logo-link" href="http://districtbuilder.org">
          <img src={logo} className="logo" alt="DistrictBuilder" />
        </a>
      </div>
      <OuterContainer />
    </div>
  );
}

export default App;
