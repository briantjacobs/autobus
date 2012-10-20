var bus = bus || {};

bus = {
	stopPlot : function() {
		var margin = {top: 20, right: 20, bottom: 20, left: 20},
			width = 760,
			height = 120,
			xValue = function(d) { return d[0]; },
			yValue = function(d) { return d[1]; },
			xScale = d3.time.scale(),
			yScale = d3.scale.linear(),
			xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickSize(6, 0),
			area = d3.svg.area().x(X).y1(Y),
			line = d3.svg.line().x(X).y(Y);
			//circle = d3.svg.arc().x(X).y(Y);

		function chart(selection) {
			selection.each(function(data) {
				// Convert data to standard representation greedily;
				// this is needed for nondeterministic accessors.
				data = data.map(function(d, i) {
					return [xValue.call(data, d, i), yValue.call(data, d, i)];
				});

				// Update the x-scale.
				xScale
					.domain(d3.extent(data, function(d) { return d[0]; }))
					.range([0, width - margin.left - margin.right]);

				// Update the y-scale.
				yScale
					.domain([0, d3.max(data, function(d) { return d[1]; })])
					.range([height - margin.top - margin.bottom, 0]);


				// Select the svg element, if it exists.
				var svg = d3.select(this).selectAll("svg").data([data]);

				// Otherwise, create the skeletal chart.
				var gEnter = svg.enter().append("svg").append("g");
				gEnter.append("path").attr("class", "area");
				gEnter.append("path").attr("class", "line");
				gEnter.append("circle").attr("class", "circle");
				gEnter.append("g").attr("class", "x axis");

				// Update the outer dimensions.
				svg .attr("width", width)
					.attr("height", height);

				// Update the inner dimensions.
				var g = svg.select("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				// Update the area path.
				g.select(".area")
					.attr("d", area.y0(yScale.range()[0]));

				// Update the line path.
				g.select(".line")
					.attr("d", line);

				// Update the x-axis.
				g.select(".x.axis")
					.attr("transform", "translate(0," + yScale.range()[0] + ")")
					.call(xAxis);

				var enterStops = g.selectAll(".stops").data(data).enter()
									.append("g").attr("class","stops");
				
					enterStops.append("circle")
						.attr("r", 3)
						.attr("cx", function(d){return xScale(d[0]);})
						.attr("cy", yScale.range()[0]);


			});
		}

		// The x-accessor for the path generator; xScale âˆ˜ xValue.
		function X(d) {
			return xScale(d[0]);
		}

		// The x-accessor for the path generator; yScale âˆ˜ yValue.
		function Y(d) {
			return yScale(d[1]);
		}

		chart.margin = function(_) {
			if (!arguments.length) return margin;
			margin = _;
			return chart;
		};

		chart.width = function(_) {
			if (!arguments.length) return width;
			width = _;
			return chart;
		};

		chart.height = function(_) {
			if (!arguments.length) return height;
			height = _;
			return chart;
		};

		chart.x = function(_) {
			if (!arguments.length) return xValue;
			xValue = _;
			return chart;
		};

		chart.y = function(_) {
			if (!arguments.length) return yValue;
			yValue = _;
			return chart;
		};

		return chart;
	},

	streamPlot : function() {
		var margin = {top: 20, right: 20, bottom: 20, left: 20},
			width = 760,
			height = 120,
			xValue = function(d) { return d.x; },
			yValue = function(d) { return d.y; },
			xScale = d3.time.scale(),
			yScale = d3.scale.linear(),
			xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickSize(6, 0),
			area = d3.svg.area(),
			stack =  d3.layout.stack().offset("wiggle").order('inside-out'),
			//stack = d3.layout.stack().offset("wiggle"),
			color = d3.interpolateRgb("#ff0000", "#0000ff");

		function chart(selection) {
			selection.each(function(data,i) {
				/*data = data.map(function(d) {
			              return d.values.map(function(d,i) {
			                return { x: xValue(), y: yValue()};
			              })
			            });*/
          

				data = data.map(function(d) {
			             d.values = d.values.map(function(d,i) {
			                return { x: xValue.call(data, d, i), y: yValue.call(data, d, i)};
			              })
			            	return d;
			            });
           
				stack
					.x(function(d,i) {return d.x; })
					.y(function(d,i) {return d.y; })
					.values(function(d,i) {return d.values; });

 				//console.log(stack(data));
				// Select the svg element, if it exists.
				var svg = d3.select(this).selectAll("svg").data([stack(data)]);

				xScale
					.domain(d3.extent(data[0].values.map(function(d) { return d.x; }).concat([])))
					.range([0, width - margin.left - margin.right]);

				// Update the y-scale.
				yScale
					.domain([0, d3.max(d3.merge(data.map(function(d) {return d.values })), function(d) {return d.y+d.y0})])
					.range([height - margin.top - margin.bottom, 0]);

				area
					.x(function(d){return xScale(d.x);})
					.y0(function(d){return yScale(d.y0);})
					.y1(function(d) { return yScale(d.y0 + d.y); });


				// Otherwise, create the skeletal chart.
				var gEnter = svg.enter().append("svg").append("g");
				gEnter.append("g").attr("class", "x axis");

				// Update the outer dimensions.
				svg .attr("width", width)
					.attr("height", height);

				// Update the inner dimensions.
				var g = svg.select("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				// Update the area path.
				//g.select(".area")
				//	.attr("d", function(d,i) { console.log(d); return area(d.values) });


				// Update the x-axis.
				g.select(".x.axis")
					.attr("transform", "translate(0," + yScale.range()[0] + ")")
					.call(xAxis);

				g.selectAll(".area").data(data).enter()
									.append("path").attr("class", "area")
									.style("fill", function() { return color(Math.random()); })
									.attr("d", function(d,i) {return area(d.values) })
									.on("mouseover", function(d, i) {
									  console.log(d)
									});

			});
		}

		// The x-accessor for the path generator; xScale âˆ˜ xValue.
		function X(d) {
			return xScale(d.x);
		}

		// The x-accessor for the path generator; yScale âˆ˜ yValue.
		function Y(d) {
			return yScale(d.y);
		}
	

		chart.margin = function(_) {
			if (!arguments.length) return margin;
			margin = _;
			return chart;
		};

		chart.width = function(_) {
			if (!arguments.length) return width;
			width = _;
			return chart;
		};

		chart.height = function(_) {
			if (!arguments.length) return height;
			height = _;
			return chart;
		};

		chart.x = function(_) {
			if (!arguments.length) return xValue;
			xValue = _;
			return chart;
		};

		chart.y = function(_) {
			if (!arguments.length) return yValue;
			yValue = _;
			return chart;
		};

		return chart;
	}


};




$(function(){



d3.json("scripts/23_stops.json", function(data) {

var formatDate = d3.time.format("%H:%M%p");
var stopPlot = bus.stopPlot()
		.x(function(d) { return formatDate.parse(d.arrival_time); })
		.y(function(d) { return +Math.random(10); });

	d3.select("#stops")
		.datum(data)
		.call(stopPlot);
});

d3.json("scripts/test_stream.json", function(data) {
	var formatDate = d3.time.format("%H:%M%p");

 	var streamPlot = bus.streamPlot()
					.x(function(d) { return new Date(d[0]);  })
					.y(function(d) { return d[1]; })
					


	d3.select("#stream")
		.datum(data)
		.call(streamPlot);

});



/*	var formatDate = d3.time.format("%H:%M%p");
d3.select("#stream")
		.call(bus.mychart
				.height(500)
				.x(function(d) { return formatDate.parse(d.arrival_time);  })
);
*/




/*  d3.json('scripts/23.json', function(data) {

		//preprocess dates
		var format = d3.time.format("%H:%M%p");
		data.forEach(function(d) {
			d.arrival_time = format.parse(d.arrival_time);
		});

		bus.drawStream({
			data: data,
			viz: viz,
			type: "demographics"
		});
	}); */
});