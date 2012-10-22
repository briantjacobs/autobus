var bus = bus || {};

bus = {
	genColor: function() {
		var colors = d3.scale.category20().range();
		return function(d, i) { return d.color || colors[i % colors.length]; };
	},
	stopPlot : function() {
		var margin = {top: 20, right: 20, bottom: 20, left: 20},
			width = 760,
			height = 500,
			getX = function(d) { return d._x; },
			getY = function(d) { return d._y; },
			xScale = d3.time.scale(),
			yScale = d3.scale.linear();

		function chart(selection) {
			selection.each(function(data) {
				data = data.map(function(d, i) {
					// Convert data to standard representation greedily;
					// this is needed for nondeterministic accessors.
					d._x = getX.call(data.values, d, i);
					d._y = getY.call(data.values, d, i);
					return d;
				});

				// Update the x-scale.
				xScale
					.domain(d3.extent(data, getX))
					.range([0, width - margin.left - margin.right]);

				// Update the y-scale.
				yScale
					.domain([0, d3.max(data, getY)])
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

				var stops = g.selectAll(".stops").data(data).enter()
								.append("g").attr("class","stops");
						
						stops.append("circle")
							.attr("r", 3)
							.attr("cx", function(d){return X(d);})
							.attr("cy", 0);

						var stopTarget = stops.append("rect")
							.attr("r", 3)
							.attr("x", function(d){return X(d)-6;})
							.attr("y", 0)
							.attr("width", 12)
							.style("opacity", 0)
							.attr("height", height-margin.bottom);

						stopTarget.on("mouseover",function(d,i) {
							d3.selectAll(stopTarget[0]).style("opacity", 0);
							d3.select(stopTarget[0][i]).style("opacity", 0.5).transition().duration(250);
						});


				g.append("g").attr("class","line")
					.append("line")
						.style('stroke', "#000")
						.attr("x1",0)
						.attr("y1",0)
						.attr("x2",xScale.range()[1])
						.attr("y2",0);

			});
		}

		// The x-accessor for the path generator; xScale âˆ˜ getX.
		function X(d) {
			return xScale(d._x);
		}

		// The x-accessor for the path generator; yScale âˆ˜ getY.
		function Y(d) {
			return yScale(d._y);
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
			if (!arguments.length) return getX;
			getX = _;
			return chart;
		};

		chart.y = function(_) {
			if (!arguments.length) return getY;
			getY = _;
			return chart;
		};

		return chart;
	},

barChart : function() {
	var margin = {top: 30, right: 10, bottom: 50, left: 100},
			width = 420,
			height = 420,
			yRoundBands = 0.2,
			getY = function(d) { return d._y; },
			getX = function(d) { return d._x; },
			getC = function(d) { return d.color; },
			yScale = d3.scale.ordinal(),
			xScale = d3.scale.linear(),
			forceArr = [];
			yAxis = d3.svg.axis().scale(yScale).orient("left"),
			xAxis = d3.svg.axis().scale(xScale),
			color = bus.genColor(),
			dispatch =  d3.dispatch('barMouseOver');

	function chart(selection) {
		selection.each(function(data) {
			data = data.values.map(function(d, i) {
				// Convert data to standard representation greedily;
				// this is needed for nondeterministic accessors.
				// nondeterminisitic = accessor input functions that dont infuse their 
				// variable names when executed within this scope
				d._x = getX.call(data.values, d, i);
				d._y = getY.call(data.values, d, i);
				d.color = getC.call(data.values, d, i);
				return d;
			});
			data.sort(function(a, b) {  return b._x - a._x; });


			// Update the y-scale.
			yScale
					.domain(data.map(getY))
					.rangeRoundBands([0, width - margin.left - margin.right], yRoundBands);
				 

			// Update the x-scale.
			xScale
					.domain([0,d3.max(data.map(getX ))])
					.range([0,height - margin.top - margin.bottom])
					.nice();
					

			// Select the svg element, if it exists.
			var svg = d3.select(this).selectAll("svg").data([data]);

			// Otherwise, create the skeletal chart.
			var gEnter = svg.enter().append("svg").append("g");
				gEnter.append("g").attr("class", "bars");
				gEnter.append("g").attr("class", "y axis");
				gEnter.append("g").attr("class", "x axis");
				gEnter.append("g").attr("class", "x axis zero");

			// Update the outer dimensions.
			svg .attr("width", width)
					.attr("height", height);

			// Update the inner dimensions.
			var g = svg.select("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			// Update the bars.
			var bar = svg.select(".bars").selectAll(".bar").data(data);
				bar.enter().append("rect");
				bar.exit().remove();
				bar.transition().duration(500)
					.attr("class", "bar" )
					.attr("y", function(d) { return Y(d); })
					.attr("x", function(d, i) { return 0; })
					.attr("height", yScale.rangeBand())
					.style("fill", getC)
					.attr("width", function(d, i) { return Math.abs( X(d) - X0() ); });

			// y axis at the bottom of the chart
			g.select(".y.axis").transition().duration(500)
				.call(yAxis);
		
			// Update the x-axis.
			g.select(".x.axis").transition().duration(500)
				.call(xAxis.orient("top"));
				
			//events
			bar.on("mouseover", function(d,i) {
				d3.select("#area-"+i).classed("active", true)
			});

			bar.on("mouseout", function(d,i) {
				d3.select("#area-"+i).classed("active", false)
			});


		});
	}


	// The y-accessor for the path generator; xScale ∘ getX.
	function Y(d) {
		return yScale(d._y);
	}

	function X0() {
		return xScale(0);
	}

	// The x-accessor for the path generator; yScale ∘ getY.
	function X(d) {
		return xScale(d._x);
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
		if (!arguments.length) return getX;
		getX = _;
		return chart;
	};

	chart.y = function(_) {
		if (!arguments.length) return getY;
		getY = _;
		return chart;
	};

	return chart;
},

	streamPlot : function() {
		var margin = {top: 20, right: 20, bottom: 20, left: 20},
			width = 760,
			height = 500,
			getX = function(d) { return d._x; },
			getY = function(d) { return d._y; },
			getValues = function(d) { return d.values; },
			xScale = d3.time.scale(),
			yScale = d3.scale.linear(),
			area = d3.svg.area(),
			stack =  d3.layout.stack().offset("wiggle").order('inside-out'),
			color = bus.genColor(),
			dispatch =  d3.dispatch('sliceMouseOver');


		function chart(selection) {
			selection.each(function(data,i) {
				data = data.map(function(d,index) {
							d.values = d.values.map(function(dd,i) {
								//this ensuring that the updated accessor values point to the right names
								dd._x = getX.call(data, dd, i);
								dd._y = getY.call(data, dd, i);
								//store index for proper highlighting
								dd.index = i;
								dd.color = color(d,index);
								return dd;
							});
							//store color to pass to bars
							d.color = color(d,index);
							return d;
						});


				var mergedValues = d3.merge(data.map(function(d) {return d.values;}));


				stack
					.x(getX)
					.y(getY)
					.values(getValues)
					.out(function(d, y0, y) {
						d.render = {
							y: y,
							y0: y0
						};
					});

				area
					.interpolate("cardinal")
					.x(function(d){return X(d);})
					.y0(function(d) { return yScale(d.render.y0); })
					.y1(function(d) { return yScale(d.render.y + d.render.y0); });




				// Select the svg element, if it exists.
				var svg = d3.select(this).selectAll("svg").data([stack(data)]);

				xScale
					.domain(d3.extent(mergedValues, function(d) { return d._x; }))
					.range([0, width - margin.left - margin.right]);

				// Update the y-scale.
				yScale
					.domain([0, d3.max(mergedValues, function(d) {return d._y+d.render.y0;})])
					.range([height - margin.top - margin.bottom, 0]);



				// Otherwise, create the skeletal chart.
				var gEnter = svg.enter().append("svg").append("g");
					gEnter.append("g").attr("class", "x axis");

				// Update the outer dimensions.
				svg .attr("width", width)
					.attr("height", height);

				// Update the inner dimensions.
				var g = svg.select("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				var areaPaths = g.selectAll(".area").data(data);
								areaPaths.enter().append("path");
								areaPaths.exit().remove();
								areaPaths.transition().duration(1000)
									.attr("class", "area")
									.attr("id", function(d,i) { return "area-"+i; })
									.style("fill", function(d,i) { return d.color; })
									.attr("d", function(d,i) {return area(d.values); });
											
				var timeLookup = d3.nest()
									.key(function(d) { return d._x; })
									.entries(mergedValues);

				svg.on("mousemove", function(d,i) {
					var e = d3.event;
					var timePosLeft = xScale.invert(e.offsetX-margin.left-10);
					var timePosRight = xScale.invert(e.offsetX-margin.left+10);

					timeLookup.forEach(function(h,i) {
						var stopTime = new Date(h.key);
						if (stopTime.getTime() > timePosLeft.getTime() && stopTime.getTime() < timePosRight.getTime()) {
							var barChart = bus.barChart()
								.x(function(d) { return d.render.y;  })
								.y(function(d) { return d.type; });
							d3.select("#bars")
								.datum(timeLookup[i])
								.call(barChart);
						}
					});
				});

			});
		}

		// The x-accessor for the path generator; xScale âˆ˜ getX.
		function X(d) {
			return xScale(d._x);
		}

		// The x-accessor for the path generator; yScale âˆ˜ getY.
		function Y1(d) {
			return yScale(d._y + d.y0);
		}

		function Y0(d) {
			return yScale(d.y0);
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
			if (!arguments.length) return getX;
			getX = _;
			return chart;
		};

		chart.y = function(_) {
			if (!arguments.length) return getY;
			getY = _;
			return chart;
		};

		return chart;
	}


};




$(function(){


	d3.json("scripts/test_stream.json", function(source) {
		var formatDate = d3.time.format("%H:%M%p");

		var streamPlot = bus.streamPlot()
							.x(function(d) {
								if (typeof d.x == "string") {
									return formatDate.parse(d.x);
								} else {
									return d.x;
								}
							})
							.y(function(d) { return d.y; });

		d3.select("#stream")
			.datum(source)
			.call(streamPlot);

		d3.json("scripts/test_stream2b.json", function(data2) {
			$('.button').click(function(){
					d3.select("#stream")
						.datum(data2)
						.call(streamPlot);
			});
		});

		d3.json("scripts/23_stops.json", function(source) {
		//bus.data = data;
		var formatDate = d3.time.format("%H:%M%p");
		var stopPlot = bus.stopPlot()
				.x(function(d) { return formatDate.parse(d.arrival_time); })
				.y(function(d) { return +Math.random(10); });

			d3.select("#stream")
				.datum(source)
				.call(stopPlot);
		});


	});

});