var bus = bus || {};

bus = {
	stopPlot : function() {
		var margin = {top: 20, right: 20, bottom: 20, left: 20},
			width = 760,
			height = 120,
			xValue = function(d) { return d[0]; },
			yValue = function(d) { return d[1]; },
			xScale = d3.time.scale(),
			yScale = d3.scale.linear()

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

				// Update the outer dimensions.
				svg .attr("width", width)
					.attr("height", height);

				// Update the inner dimensions.
				var g = svg.select("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


				g.selectAll(".stops").data(data).enter()
						.append("g").attr("class","stops")
						.append("circle")
								.attr("r", 3)
								.attr("cx", function(d){return xScale(d[0]);})
								.attr("cy", 0);

				g.append("g").attr("class","line")
					.append("line")
						.style('stroke', "#000")
						.attr("x1",0)
						.attr("y1",0)
						.attr("x2",xScale.range()[1])
						.attr("y2",0);

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
			area = d3.svg.area(),
			stack =  d3.layout.stack().offset("wiggle").order('inside-out'),
			color = d3.interpolateRgb("#ff0000", "#0000ff");

		function chart(selection) {
			selection.each(function(data,i) {

				data = data.map(function(d) {
							d.values = d.values.map(function(j,i) {
								return { type:d.type, x: xValue.call(data, j, i), y: yValue.call(data, j, i)};
							});
							return d;
						});

				var mergedValues = d3.merge(data.map(function(d) {return d.values;}));
				//console.log(data, mergedValues)

				stack
					.x(function(d,i) {return d.x; })
					.y(function(d,i) {return d.y; })
					.values(function(d,i) {return d.values; });

				// Select the svg element, if it exists.
				var svg = d3.select(this).selectAll("svg").data([stack(data)]);

				xScale
					.domain(d3.extent(mergedValues, function(d) { return d.x; }))
					.range([0, width - margin.left - margin.right]);

				// Update the y-scale.
				yScale
					.domain([0, d3.max(mergedValues, function(d) {return d.y+d.y0;})])
					.range([height - margin.top - margin.bottom, 0]);

				// this needs to be called after the stack(data) call...hmm
				area
					.interpolate("cardinal")
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
				//  .attr("d", function(d,i) { console.log(d); return area(d.values) });

				g.selectAll(".area").data(data).enter()
									.append("path").attr("class", "area")
									.style("fill", function() { return color(Math.random()); })
									.attr("d", function(d,i) {return area(d.values) });

				var timeLookup = d3.nest()
									.key(function(d) { return d.x; })
									.entries(mergedValues);


				svg.on("mousemove", function(d,i) {
						var e = d3.event;
						var timePos = xScale.invert(e.offsetX-margin.left);

						//use d3 mapping?
						timeLookup.forEach(function(h,i) {
							//console.log(h)
							var stopTime = new Date(h.key);
							if (stopTime.getTime() == timePos.getTime()) {
								console.log(timeLookup[i]);

							}
						});

				/*var domainIndexScale = d3.time.scale()
										.domain(d3.extent(mergedValues, function(d) { return d.x; }))
										.range([0, data.length]);
				*/
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

	d3.select("#stream")
		.datum(data)
		.call(stopPlot);
});

d3.json("scripts/test_stream.json", function(data) {
	var formatDate = d3.time.format("%H:%M%p");

	var streamPlot = bus.streamPlot()
					.x(function(d) { return formatDate.parse(d[0]);  })
					.y(function(d) { return d[1]; })

	d3.select("#stream")
		.datum(data)
		.call(streamPlot);



});



/*  var formatDate = d3.time.format("%H:%M%p");
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