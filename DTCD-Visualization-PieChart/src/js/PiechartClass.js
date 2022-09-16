

export default class PiechartClass {
  options = {
    margin: 40,
    isDonat: false,
    width: 0,
    height: 0,
    elem: '',
    elemForLegend: '',
  }

  onClickPiePart

  constructor({
    elem,
    elemForLegend,
    width,
    height,
    data,
    colors,
    isDonat = false,
  }) {
    this.options.isDonat = isDonat;
    this.options.width = width;
    this.options.height = height;
    this.options.elem = elem;
    this.options.elemForLegend = elemForLegend;

    this.createPieChart(elemForLegend, data, colors);
  }

  createPieChart(elemForLegend, data, colors) {
    this.createColors(data, colors);

    this.createPieChartSvg();

    this.createPieChartGroup();

    this.createLegend();

    this.createDataRedy(data);
    // радиус диаграммы это половина длины или ширины, смотря что меньше и еще отступ отнимаем

    this.createPies();
  }

  createPieChartSvg() {
    const { width, height } = this.size;
    this.piechart = d3
      .select(this.elem)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
  }

  createPieChartGroup() {
    const { width, height } = this.size;
    this.piechartG = this.piechart.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
  }

  createLegend() {
    this.legend = d3.select(this.elemForLegend);
  }

  createColors(data, colors) {
    this.colors = d3
      .scaleOrdinal()
      .range(colors);
  }

  createDataRedy(data) {
    const pie = d3.pie().value((d) => d[1]);
    this.dataReady = pie(Object.entries(data));
  }

  createPies() {
    this.piechartG.selectAll('pies')
      .data(this.dataReady)
      .join('path')
      .attr('d', d3.arc().innerRadius(this.innerRadius).outerRadius(this.radius))
      .attr('class', 'piepart')
      .attr('fill', (d) => {
        return this.colors(d.data[0])
      })
      .attr('stroke', 'inherit')
      .style('stroke-width', '2px')
      .on('click', (event, d) => {
        if (typeof this.onClickPiePart === 'function') {
          this.onClickPiePart({
            label: d.data[0],
            value: d.data[1],
          });
        }
      });
  }

  get size() {
    return {
      width: this.options.width,
      height: this.options.height,
    };
  }

  set size(value) {
    this.options.width = value.width ?? this.options.width;
    this.options.height = value.height ?? this.options.height;

    this.changeSize();
  }

  get radius() {
    const { width, height } = this.size;
    return Math.min(width, height) / 2 - this.margin;
  }

  get getPiechart() {
    return this.piechart;
  }

  get getColors() {
    return this.colors;
  }

  get margin() {
    return this.options.margin;
  }

  set margin(value) {
    this.options.margin = value;
  }

  get elem() {
    return this.options.elem;
  }

  get elemForLegend() {
    return this.options.elemForLegend;
  }

  get isDonat() {
    return this.options.isDonat;
  }

  set isDonat(val) {
    this.options.isDonat = val;
    this.changeSize();
  }

  get innerRadius() {
    return this.isDonat ? this.radius / 1.5 : 0;
  }

  selectActivePiepart(selectedPieIndex, legendLineIndex) {
    this.getPiechart.selectAll('.piepart')
      .each((_, i, nodes) => {
        const node = nodes[i];
        if (i === legendLineIndex) {
          node.classList.add('piepartSelect');
        } else if (
          node.classList.contains('piepartSelect')
              && selectedPieIndex !== i
        ) {
          node.classList.remove('piepartSelect');
        }
      });
  }

  activetetPiepart(selectedPieIndex, legendLineIndex) {
    this.getPiechart.selectAll('.piepart')
      .each((_, i, nodes) => {
        const node = nodes[i];
        if (i === legendLineIndex && selectedPieIndex !== -1) {
          node.classList.add('piepartSelect');
        } else if (
          node.classList.contains('piepartSelect')
        ) {
          node.classList.remove('piepartSelect');
        }
      });
  }

  selectActiveLegendLine(legendLineIndex, legendLineClass = 'legend-line') {
    this.legend
      .selectAll(`.${legendLineClass}`)
      .each((_, i, nodes) => {
        const node = nodes[i];
        if (legendLineIndex === i) {
          node.classList.add(`${legendLineClass}_hover`);
        } else if (node.classList.contains(`${legendLineClass}_hover`)) {
          node.classList.remove(`${legendLineClass}_hover`);
        }
      });
  }

  removePiechart() {
    this.getPiechart.remove();
  }

  changeSize() {
    const { width, height } = this.size;
    this.piechart
      .attr('width', width)
      .attr('height', height);

    this.piechartG.attr('transform', `translate(${width / 2},${height / 2})`);

    this.piechartG
      .selectAll('path')
      .attr('d', d3.arc().innerRadius(this.innerRadius).outerRadius(this.radius))
      .attr('class', 'piepart')
      .attr('fill', (d) => this.colors(d.data[0]))
      .attr('stroke', 'inherit')
      .style('stroke-width', '2px');
  }

  setEvents(events) {
    events.forEach(({ eventName, callback }) => {
      this.piechart
        .selectAll('pies')
        .data(this.dataReady)
        .enter()
        .selectAll('path')
        .on(eventName, callback);
    });
  }
}
