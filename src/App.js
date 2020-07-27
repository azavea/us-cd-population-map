import React from 'react';
import logo from './images/districtbuilder_white.svg';
import './App.css';
import OuterContainer from './components/OuterContainer';

function App() {
  return (
    <div className="App">
    	<div className="App-header">
        <a href="https://districtbuilder.org">
          <img src={logo} className="logo" alt="DistrictBuilder" />
        </a>
      </div>
      <OuterContainer />
    </div>
  );
}

export default App;
