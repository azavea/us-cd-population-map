import React, {useState} from "react";
import {XYPlot, XAxis, YAxis, MarkSeries, Hint} from 'react-vis';

const LineChart = (props) => {

	const [hintVal,setHintVal] = useState(null)

	function Chart({data,colors,onClick}) {
	  
	  const absX = Math.max(...data.map(d => Math.abs(d.x)), 0);

	  const tickVals = absX < 1 
	  ? [-1,-.5,-.2,0,.2,.5,1].filter(x=>Math.abs(x)<absX)
	  : [-10,-5,-2,0,2,5,10].filter(x=>Math.abs(x)<absX);

	  return (
	  	<XYPlot width={361} height={60} xDomain={[-1 * absX, absX]}>
	      <XAxis
		    tickValues={tickVals} 
	      	style={{
			  line: {stroke: '#ADDDE1'},
			  ticks: {stroke: '#ADDDE1'},
			  text: {stroke: 'none', fill: '#6b6b76', fontWeight: 600}
			}}
			tickFormat={(value, index, scale, tickTotal)=>{				
				if (value===0) {return value;}
				return value.toString().concat('%');
			}}
	      />
	      <MarkSeries
	      	colorType="literal"
	      	fillType="literal"
	      	strokeType="literal"
	 	    data={data}
			onNearestXY={(event,o)=>{
				const p = {'x':data[o.index].x,'label':data[o.index].label,'xOffset':o.innerX-5}
				setHintVal(p)
			}}
			onSeriesMouseOut={(event)=>{
				setHintVal(null)
			}}
			onValueClick={(d)=>{
				onClick(d)
			}}
	 	    />
	    </XYPlot>
	    )
	}

	const sortData = props.diffs.sort(function (a, b) {
		  return a.selected - b.selected;
		})

	const data = sortData.map((x,i) => ({
		'x':x.dff_prc,
		'y':0,
		'label':x.label,
		'stroke': (x.selected? '#008bff':'#484848'),
		'fill': (x.selected? '#008bff':'#373737')
	}))

	return (
		<React.Fragment>
			<div className="legend-footer-chart-label">Compared to state
			</div>
			<div className="legend-footer-chart-container">
				<div className="legend-footer-hint-container">
				{hintVal &&
					<div className='legend-footer-chart-hint' style={{left:hintVal.xOffset}}>
					<React.Fragment>
					    <div className='hint-label'>{hintVal.label}</div>
					    <div className='hint-value'>{hintVal.x.toFixed(1).concat('%')}</div>
					</React.Fragment>
				 	</div>
				}
				</div>
				<Chart data={data} onClick={props.onClick} />
			</div>
		</React.Fragment>
		)
}

export default LineChart;