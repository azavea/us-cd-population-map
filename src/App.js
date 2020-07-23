import React from 'react';
import logo from './logo.svg';
import OuterContainer from './components/OuterContainer';

function App() {
  
  var url = new URL(window.location.href);
  var embedParam = url.searchParams.get('embed');
  const embed = (embedParam === 'true')? true : false;
  
  return (
    <div className="App">
    	<div className={"App-header"+(embed?' embed':'')}>
          <div className="App-header-title">
          	DistrictBuilder
          </div>
        </div>    
      	<OuterContainer />
    </div>
  );
}

export default App;
