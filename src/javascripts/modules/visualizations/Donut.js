import * as constants from '../constants';
import $ from 'jquery';
import * as d3 from 'd3';
window.$ = $;

class Donut {
  constructor(el, dataUrl) {
    this.el = el;
    this.dataUrl = dataUrl;
    this.legendRectSize = 18;
    this.legendSpacing = 4;
    this.legendHeight = this.legendRectSize + this.legendSpacing;
    this.color = d3.scaleOrdinal()
      .range(constants.colorRangeBlack);
    this.classes = [`donut__svg`, `donut__g`, `donut__arc`, `donut__text`, `donut__legend`, `donut__layer`, `donut__value`];
    this.svg = d3.select(this.el)
      .append(`svg`)
        .attr(`class`, this.classes[0]);
    this.svgData = this.svg.append(`g`)
      .attr(`class`, this.classes[1]);
  }

  setSizes() {
    this.width = $(this.el).width();
    this.radius = Math.min(this.width) * 0.5;
    this.arc = d3.arc()
      .innerRadius((this.radius/10) * 7)
      .outerRadius(this.radius);

    this.svg
      .attr(`width`, this.width)
      .attr(`height`, this.width);

    this.svgData
      .attr(`transform`, `translate(${this.radius}, ${this.radius})`);

    this.svg.selectAll(`.${this.classes[2]}`)
      .attr(`d`, this.arc);

    this.svg.selectAll(`.${this.classes[3]}`)
      .attr(`transform`, d => `translate(${this.arc.centroid(d)})`);

    this.svg.selectAll(`.${this.classes[6]}`)
      .attr(`transform`, `translate(${this.radius}, ${this.radius})`);

    if (!this.isSingleValue) {
      this.height = this.width + (this.color.domain().length * this.legendHeight);

      this.svg
        .attr(`height`, this.height);

      this.svg.selectAll(`.${this.classes[4]}`)
        .attr(`transform`, (d, i) => {
          const horz = 0;
          const vert = this.width + (i * this.legendHeight);

          return `translate(${horz},${vert})`;
        });
    }
  }

  render() {
    d3.csv(this.dataUrl, (error, data) => {
      if (error) {
        throw error;
      }

      this.data = data;
      this.dataKeys = constants.getDataKeys(this.data);

      this.data.forEach(this.type.bind(this));

      this.pie = d3.pie()
        .value(d => d[this.dataKeys[1]])
        .sort(null);

      this.isSingleValue = this.data.length === 1;
      if (this.isSingleValue) {
        const value = this.data[0][this.dataKeys[1]];
        const newData = {};

        newData[this.dataKeys[0]] = `other`;
        newData[this.dataKeys[1]] = 100 - value;
        this.data.push(newData);
      }

      this.svgData.selectAll(`g`)
        .data(this.pie(this.data))
        .enter()
        .append(`g`)
          .attr(`class`, this.classes[5])
        .append(`path`)
          .attr(`class`, this.classes[2])
          .attr(`fill`, (d) => this.color(d.data[this.dataKeys[0]]));

      if (!this.isSingleValue) {
        this.svg.selectAll(`.${this.classes[5]}`).append(`text`)
          .attr(`class`, this.classes[3])
          .attr(`dy`, `.5em`)
          .attr(`dx`, `-.8em`)
          .style(`font-size`, `12px`)
          .style(`fill`, `#fff`)
          .text(d => `${d.data[this.dataKeys[1]]}`);

        this.renderLegend();
      } else {
        this.svg.append(`text`)
          .attr(`class`, this.classes[6])
          .style(`font-size`, `40px`)
          .style(`fill`, `#fff`)
          .attr(`text-anchor`, `middle`)
          .attr(`alignment-baseline`, `central`)
          .text(`${this.data[0][this.dataKeys[1]]}%`);
      }

      this.setSizes();

      $(window).on(`resize`, this.resize.bind(this));
    });
  }

  type(d) {
    d[this.dataKeys[1]] = +d[this.dataKeys[1]];
    return d;
  }

  renderLegend() {
    this.svg.selectAll(`.${this.classes[4]}`)
      .data(this.color.domain())
      .enter()
      .append(`g`)
        .attr(`class`, this.classes[4]);

    this.svg.selectAll(`.${this.classes[4]}`)
      .append(`rect`)
        .attr(`width`, this.legendRectSize)
        .attr(`height`, this.legendRectSize)
        .style(`fill`, this.color)
        .style(`stroke`, this.color);

    this.svg.selectAll(`.${this.classes[4]}`)
      .append(`text`)
        .attr(`x`, this.legendRectSize + this.legendSpacing)
        .attr(`y`, this.legendRectSize - this.legendSpacing)
        .style(`font-size`, `12px`)
        .text((d) => d);
  }

  resize() {
    this.setSizes();
  }
}

const loadDonuts = () => {
  const $donuts = $(`.js-donut`);

  $donuts.each((index) => {
    const $this = $donuts.eq(index);
    const id = $this.attr(`id`);
    const url = $this.data(`url`);

    new Donut(`#${id}`, url).render();
  });
};

export { loadDonuts };
