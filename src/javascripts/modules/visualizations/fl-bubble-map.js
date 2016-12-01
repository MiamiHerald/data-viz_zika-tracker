import $ from 'jquery';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import { TweenLite } from 'gsap';
import numeral from 'numeral';
import noUiSlider from 'no-ui-slider';
import moment from 'moment';

class BubbleMapFl {
  constructor(el, dataUrl, shapeUrl, feedUrl) {
    this.el = el;
    this.dataUrl = dataUrl;
    this.shapeUrl = shapeUrl;
    this.newsUrl = feedUrl;
    this.aspectRatio = 0.6667;
    this.margin = {top: 0, right: 0, bottom: 0, left: 0};
    this.width = $(this.el).width() - this.margin.left - this.margin.right;
    this.height = Math.ceil(this.aspectRatio * (this.width - this.margin.top - this.margin.bottom));
    this.mapWidth = this.width;
    this.dataColumn = 'total';
    this.totals = [
      '.bubble-map__stat--local-fl',
      '.bubble-map__stat--travel-fl',
      '.bubble-map__stat--total-fl',
      '.bubble-map__stat--pregnant-fl',
      '.bubble-map__stat--non-resident-fl',
      '.bubble-map__stat--unknown-fl'
    ];
    this.newsFeedWrapper = $('#newsFeedOuter');
    this.articleFound = false;
  }

  render() {
    this.svg = d3.select(this.el).append('svg')
        .attr('width', '100%')
        .attr('height', this.height)
        .attr('class', 'bubble-map__svg-fl')
        .append('g');

    this.loadData();
    this.resizeBubbleMap();
    $(window).on('resize', this.resizeBubbleMap.bind(this));
  }


  resizeBubbleMap() {
    window.requestAnimationFrame(() => {
      const chart = $(this.el).find(`g`).first();

      this.width = $(this.el).width() - this.margin.left - this.margin.right;
      this.height = Math.ceil(this.aspectRatio * (this.width - this.margin.top - this.margin.bottom));

      TweenLite.set(chart, { scale: this.width / this.mapWidth });
      d3.select('.bubble-map__svg-fl').attr('height', this.height);
    });
  }

  loadData() {
    d3.queue()
      .defer(d3.json, this.shapeUrl)
      .defer(d3.json, this.dataUrl)
      .defer(d3.csv, this.newsUrl)
      .await(this.drawMap.bind(this));
  }

  drawMap(error, shapeData, caseData, newsData) {
    if (error) throw error;

    this.shapeData = shapeData;
    this.caseData = caseData;
    this.newsData = newsData
    const counties = topojson.feature(this.shapeData, this.shapeData.objects['places']).features

    $('.bubble-map__stat--wrapper--fl').addClass('is-animating');
    this.drawSlider();
    this.drawTooltip();
    this.totals.forEach(i => {
      this.setTotals(i);
    });

    this.projection = d3.geoEquirectangular()
      .fitSize([this.width, this.height], topojson.feature(this.shapeData, this.shapeData.objects['places']));

    this.path = d3.geoPath()
      .projection(this.projection);

    this.svg.append('g')
        .attr('class', 'bubble-map__counties')
      .selectAll('path')
        .data(counties)
      .enter().append('path')
        .attr('class', 'bubble-map__county')
        .attr('d', this.path);

    this.max = this.caseData[0].totalTravel;
    this.radius = d3.scaleSqrt()
        .domain([0, this.max])
        .range([0, 5]);

    this.svg.append('g')
        .attr('class', 'bubble-map__bubble')
      .selectAll('circle')
        .data(topojson.feature(this.shapeData, this.shapeData.objects['places']).features
          .sort((a, b) => {
            if (this.caseData[this.caseData.length - 1].counties[b.id] && this.caseData[this.caseData.length - 1].counties[a.id]) {
              return this.caseData[this.caseData.length - 1].counties[b.id][this.dataColumn] - this.caseData[this.caseData.length - 1].counties[a.id][this.dataColumn]
            }
          }))
      .enter().append('circle')
        .attr('transform', (d) => `translate(${this.path.centroid(d)})`)
        .attr('r', (d) => {
          if (this.caseData[this.unformatSlider()].counties[d.id]) {
            return this.radius(this.caseData[this.unformatSlider()].counties[d.id][this.dataColumn]);
          }
        })
        .on('mouseover', (d) => {
          this.mouse = d3.mouse(this.svg.node()).map((d) => parseInt(d))
          this.tooltip
            .classed('is-active', true)
            .style('left', `${this.mouse[0]}px`)
            .style('top', `${this.mouse[1]}px`)
            .html(() => {
              if (this.caseData[this.unformatSlider()].counties[d.id][this.dataColumn] > 1) {
                return `${d.properties.county}: ${this.caseData[this.unformatSlider()].counties[d.id][this.dataColumn]} cases`
              } else {
                return `${d.properties.county}: ${this.caseData[this.unformatSlider()].counties[d.id][this.dataColumn]} case`
              }
            });
        })
        .on('mouseout', (d) => {
          this.tooltip
            .classed('is-active', false);
        });


    this.stepSlider.noUiSlider.on('update', this.resizeBubbles.bind(this))
    this.stepSlider.noUiSlider.on('update', () => {
      this.totals.forEach(i => {
        this.setTotals(i);
      });
      this.setDate();
      this.updateNewsFeed();
    })
    this.switchTabs();
  }

  drawTooltip() {
    this.tooltip = d3.select(this.el)
      .append('div')
      .attr('class', 'bubble-map__tooltip');
  }

  drawSlider () {
    this.stepSlider = $('#js-slider-fl')[0];
    let slider = noUiSlider.create(this.stepSlider, {
      start: this.caseData.length - 1,
      step: 1,
      range: {
        'min': [ 0 ],
        'max': [ this.caseData.length - 1 ]
      }
    });

    $('.js-play--fl').click(() => {
      this.stepSlider.noUiSlider.set(this.caseData.length - 1);
    });
    $('.js-step-down--fl').click(() => {
      this.stepSlider.noUiSlider.set(this.unformatSlider() - 1);
    });
    $('.js-step-up--fl').click(() => {
      this.stepSlider.noUiSlider.set(this.unformatSlider() + 1);
    });

    this.setNewsFeed();
  }

  resizeBubbles() {
    this.dataColumn = $('.tabs__link--fl.is-active').data('case');

    this.svg
      .selectAll('circle')
        .transition()
        .duration(250)
        .attr('r', (d) => {
          if (this.caseData[this.unformatSlider()].counties[d.id]) {
            return this.radius(this.caseData[this.unformatSlider()].counties[d.id][this.dataColumn]);
          }
        });
    this.max = this.caseData[this.unformatSlider()].totalTravel
  }

  switchTabs() {
    $('.tabs__link--fl').click(() => {
      event.preventDefault();

      $('.tabs__link--fl').removeClass('is-active');
      $(event.currentTarget).addClass('is-active');

      this.resizeBubbles();
    })
  }

  setTotals(el) {
    var counterStart = {var: $(el).text()};
    if (el === '.bubble-map__stat--local-fl') {
      var counterEnd = {var: this.caseData[this.unformatSlider()].totalLocal};
    } else if (el === '.bubble-map__stat--travel-fl') {
      var counterEnd = {var: this.caseData[this.unformatSlider()].totalTravel};
    } else if (el === '.bubble-map__stat--total-fl') {
      var counterEnd = {var: +this.caseData[this.unformatSlider()].totalLocal + +this.caseData[this.unformatSlider()].totalTravel};
    } else if (el === '.bubble-map__stat--pregnant-fl') {
      var counterEnd = {var: this.caseData[this.unformatSlider()].pregnant};
    } else if (el === '.bubble-map__stat--non-resident-fl') {
      var counterEnd = {var: this.caseData[this.unformatSlider()]['non-resident-fl']};
    } else if (el === '.bubble-map__stat--unknown-fl') {
      var counterEnd = {var: this.caseData[this.unformatSlider()].undetermined ? this.caseData[this.unformatSlider()].undetermined : 0};
    }

    TweenMax.to(counterStart, 0.3, {var: counterEnd.var, onUpdate: () => {
        $(el).text(Math.ceil(counterStart.var));
      },
      ease:Circ.easeOut
    });
  }

  unformatSlider() {
    return numeral().unformat(this.stepSlider.noUiSlider.get());
  }

  setDate() {
    $('#js-date-fl').html(moment(this.caseData[this.unformatSlider()].date).format('MMM. D, YYYY'));
  }

  setNewsFeed() {
    this.newsData.forEach(v => {
      this.newsFeedWrapper.append(
        `<a href="${v.articleUrl}">${moment(v.datePublished).format('MMM. D, YYYY')}: ${v.articleHeadline}</a>`
      )
    });
  }

  updateNewsFeed() {
    this.articleFound = false;
    this.newsData.forEach(v => {
      if (!this.articleFound && moment(v.datePublished, 'MM/DD/YYYY').isSame(moment(this.caseData[this.unformatSlider()].date, 'YYYYMMDD')) || moment(v.datePublished, 'MM/DD/YYYY').isBefore(moment(this.caseData[this.unformatSlider()].date, 'YYYYMMDD'))) {
        $('#newsFeedOuter a').removeClass('is-active');
        $(`#newsFeedOuter a:contains('${v.articleHeadline}')`).addClass('is-active');
        this.articleFound = true;
      }
    });

    if (!this.articleFound) {
      $('#newsFeedOuter a').removeClass('is-active');
      $(`#newsFeedOuter a:contains('${this.newsData[this.newsData.length - 1].articleHeadline}')`).addClass('is-active');
    }
  }
}

const loadBubbleMapFl = () => {
  const $bubbleMap = $('.js-bubble-map-fl');

  $bubbleMap.each((index) => {
    const $this = $bubbleMap.eq(index);
    const id = $this.attr('id');
    const dataUrl = $this.data('url');
    const shapeUrl = $this.data('shape');
    const feedUrl = $this.data('feed');

    new BubbleMapFl(`#${id}`, dataUrl, shapeUrl).render();
  });
}

export { loadBubbleMapFl };
