import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import MapboxGLMap from './MapboxGLMap';


export default function OuterContainer() {
  
  return (
    <div >
      <Router>
        <Switch>
          <Route path="/:router_id" children={<MapboxGLMap />} />
        </Switch>
        <Switch>
          <Route exact path="/" children={<MapboxGLMap />} />
        </Switch> 
      </Router>
    </div>
  );

}