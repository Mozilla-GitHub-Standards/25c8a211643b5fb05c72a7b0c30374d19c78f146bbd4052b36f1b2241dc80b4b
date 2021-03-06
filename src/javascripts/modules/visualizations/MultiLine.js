/* global Waypoint */
import * as constants from '../constants';
import $ from 'jquery';
import * as d3 from 'd3';
import '../../plugins/noframework.waypoints';
window.$ = $;

class MultiLine {
  constructor(el, dataUrl) {
    this.el = el;
    this.dataUrl = dataUrl;
    this.parseDate = d3.timeParse(`%d-%m-%Y`);
    this.margin = {top: 20, right: 20, bottom: 30, left: 40};
    this.classes = [`multiline__container`, `multiline__svg`, `multiline__data`, `multiline__dataset`, `x-axis`, `y-axis`];
    this.legendClasses = [`legend`, `legend--multiline`, `legend__item`, `legend__key`, `legend__name`];
    this.svg = d3.select(this.el)
      .append(`div`)
        .attr(`class`, this.classes[0])
      .append(`svg`)
        .attr(`class`, this.classes[1]);
    this.g = this.svg.append(`g`)
      .attr(`transform`, `translate(${this.margin.left},${this.margin.top})`);
  }

  setSizes(transition = false) {
    this.width = $(this.el).width();
    this.height = constants.getWindowWidth() < constants.breakpointM ? 400 : Math.ceil(this.width * 0.52);
    this.innerWidth = this.width - this.margin.left - this.margin.right;
    this.innerHeight = this.height - this.margin.top - this.margin.bottom;

    this.svg
      .attr(`width`, this.width)
      .attr(`height`, this.height);

    this.x = d3.scaleTime()
      .range([0, this.innerWidth]);
    this.y = d3.scaleLinear()
      .range([this.innerHeight, 0]);
    this.z = d3.scaleOrdinal()
      .range(constants.colorRange);

    this.line = d3.line()
      // .curve(d3.curveBasis)
      .x(d => this.x(d.date))
      .y(d => this.y(d.dataValue));

    this.x.domain(d3.extent(this.data, d => d.date));
    this.y.domain([
      d3.min(this.dataColumns, (c) => d3.min(c.values, d => d.dataValue)),
      d3.max(this.dataColumns, (c) => d3.max(c.values, d => d.dataValue))
    ]);
    this.z.domain(this.dataColumns.map((c) => c.id));

    this.svg.select(`.${this.classes[4]}`)
      .attr(`transform`, `translate(0,${this.innerHeight})`)
      .call(d3.axisBottom(this.x).tickFormat(d3.timeFormat(`%Y`)));

    this.svg.select(`.${this.classes[5]}`)
      .call(d3.axisLeft(this.y));

    this.svg.selectAll(`.${this.classes[2]}`)
      .attr(`d`, d => this.line(d.values))
      .style(`stroke`, d => this.z(d.id));

    if (transition) {
      this.renderLegend();
      this.animateChart();
    }
  }

  animateChart() {
    this.svg.selectAll(`.${this.classes[2]}`)
      .style(`opacity`, 0);

    $(this.el).addClass(`is-active`);

    const paths = this.svg.selectAll(`.${this.classes[2]}`);
    const pathsLength = paths.size();

    for (let i = 0; i < pathsLength; i++) {
      const pathLength = paths
        .filter((d, index) => index === i)
        .node().getTotalLength();

      paths
        .filter((d, index) => index === i)
        .attr(`stroke-dasharray`, `${pathLength} ${pathLength}`)
        .attr(`stroke-dashoffset`, pathLength)
        .style(`opacity`, 1)
        .transition()
          .duration(500)
          .delay(i * 100)
          .ease(d3.easePolyInOut)
          .attr(`stroke-dashoffset`, 0)
          .on(`end`, () => {
            paths.filter((d, index) => index === i)
              .attr(`stroke-dasharray`, `none`);
          });
    }
  }

  render() {
    d3.tsv(this.dataUrl, this.type.bind(this), (error, data) => {
      if (error) {
        throw error;
      }

      this.data = data;
      this.dataColumns = data.columns.slice(1).map((id) => {
        return {
          id: id,
          values: data.map(d => {
            return {
              date: d.date,
              dataValue: d[id]
            };
          })
        };
      });

      this.g.append(`g`)
        .attr(`class`, this.classes[4]);

      this.g.append(`g`)
        .attr(`class`, this.classes[5]);

      this.g.selectAll(`.${this.classes[3]}`)
        .data(this.dataColumns)
        .enter().append(`g`)
          .attr(`class`, this.classes[3])
        .append(`path`)
          .attr(`class`, this.classes[2]);

      const waypoint = new Waypoint({
        element: document.getElementById(this.el.substr(1)),
        handler: () => {
          this.setSizes(true);
          waypoint.destroy();
        },
        offset: `50%`,
      });
    });

    $(window).on(`resize`, this.resize.bind(this));
  }

  renderLegend() {
    const legend = d3.select(this.el).insert(`ul`)
      .lower()
      .attr(`class`, `${this.legendClasses[0]} ${this.legendClasses[1]}`);

    const legendItems = legend.selectAll(`li`)
      .data(this.dataColumns)
      .enter().append(`li`)
      .attr(`class`, this.legendClasses[2]);

    legendItems.append(`span`)
      .attr(`class`, this.legendClasses[3])
      .style(`background-color`, d => this.z(d.id));

    legendItems.append(`span`)
      .attr(`class`, this.legendClasses[4])
      .text((d, i) => this.dataColumns[i][`id`]);
  }

  resize() {
    this.setSizes();
  }

  type(d, _, columns) {
    d.date = this.parseDate(d.date);
    for (let i = 1, n = columns.length, c; i < n; i++) {
      d[c = columns[i]] = +d[c];
    }
    return d;
  }
}

const loadMultiLineCharts = () => {
  const $line = $(`.js-multiline`);

  $line.each((index) => {
    const $this = $line.eq(index);
    const id = $this.attr(`id`);
    const url = $this.data(`url`);

    new MultiLine(`#${id}`, url).render();
  });
};

export { loadMultiLineCharts };
