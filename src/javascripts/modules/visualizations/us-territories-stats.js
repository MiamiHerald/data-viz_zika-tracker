import $ from 'jquery';
import * as d3 from 'd3';
import { TweenMax } from 'gsap';
import numeral from 'numeral';
import noUiSlider from 'no-ui-slider';
import moment from 'moment';

class USTerritoriesStats {
  constructor() {
    this.dataUrl = 'http://media.miamiherald.com/static/media/projects/2016/zika-interactive-v2/data/usZika.json';
    this.totals = [
      '.territories__stat--local-as',
      '.territories__stat--travel-as',
      '.territories__stat--total-as',
      '.territories__stat--local-pr',
      '.territories__stat--travel-pr',
      '.territories__stat--total-pr',
      '.territories__stat--local-usvi',
      '.territories__stat--travel-usvi',
      '.territories__stat--total-usvi',
      '.territories__stat--local-totals',
      '.territories__stat--travel-totals',
      '.territories__stat--total-totals'
    ];
  }

  render() {
    this.loadData();
  }

  loadData() {
    d3.queue()
      .defer(d3.json, this.dataUrl)
      .await(this.loadStats.bind(this));
  }

  loadStats(error, caseData) {
    if (error) throw error;

    this.caseData = caseData;
    this.drawSlider();
    this.totals.forEach(i => {
      this.setTotals(i);
    });
    this.stepSlider.noUiSlider.on('update', () => {
      this.totals.forEach(i => {
        this.setTotals(i);
        this.setDate();
      });
    });
    this.switchTabs();
  }

  setTotals(el) {
    this.dataColumn = $('.tabs__link--us-territories-100k.is-active').data('number');

    var counterStart = {var: $(el).text()};
    var counterEnd = null;

    if (this.dataColumn === 'total') {
      if (el === '.territories__stat--local-as') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['American Samoa'].local};
      } else if (el === '.territories__stat--travel-as') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['American Samoa'].travel};
      } else if (el === '.territories__stat--total-as') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['American Samoa'].total};
      } else if (el === '.territories__stat--local-pr') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['Puerto Rico'].local};
      } else if (el === '.territories__stat--travel-pr') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['Puerto Rico'].travel};
      } else if (el === '.territories__stat--total-pr') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['Puerto Rico'].total};
      } else if (el === '.territories__stat--local-usvi') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['United States Virgin Islands'].local};
      } else if (el === '.territories__stat--travel-usvi') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['United States Virgin Islands'].travel};
      } else if (el === '.territories__stat--total-usvi') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['United States Virgin Islands'].total};
      } else if (el === '.territories__stat--local-totals') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territoryTotalLocal};
      } else if (el === '.territories__stat--travel-totals') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territoryTotalTravel};
      } else if (el === '.territories__stat--total-totals') {
        counterEnd = {var: +this.caseData[this.unformatSlider()].territoryTotalLocal + (+this.caseData[this.unformatSlider()].territoryTotalTravel)};
      }
    } else if (this.dataColumn === 'per100k') {
      if (el === '.territories__stat--local-as') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['American Samoa'].per100KLocal};
      } else if (el === '.territories__stat--travel-as') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['American Samoa'].per100KTravel};
      } else if (el === '.territories__stat--total-as') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['American Samoa'].per100KTotal};
      } else if (el === '.territories__stat--local-pr') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['Puerto Rico'].per100KLocal};
      } else if (el === '.territories__stat--travel-pr') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['Puerto Rico'].per100KTravel};
      } else if (el === '.territories__stat--total-pr') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['Puerto Rico'].per100KTotal};
      } else if (el === '.territories__stat--local-usvi') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['United States Virgin Islands'].per100KLocal};
      } else if (el === '.territories__stat--travel-usvi') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['United States Virgin Islands'].per100KTravel};
      } else if (el === '.territories__stat--total-usvi') {
        counterEnd = {var: this.caseData[this.unformatSlider()].territories['United States Virgin Islands'].per100KTotal};
      } else if (el === '.territories__stat--local-totals') {
        counterEnd = {var: this.caseData[this.unformatSlider()].per100KTerritoryTotalLocal};
      } else if (el === '.territories__stat--travel-totals') {
        counterEnd = {var: this.caseData[this.unformatSlider()].per100KTerritoryTotalTravel};
      } else if (el === '.territories__stat--total-totals') {
        counterEnd = {var: +this.caseData[this.unformatSlider()].per100KTerritoryTotalLocal + (+this.caseData[this.unformatSlider()].per100KTerritoryTotalTravel)};
      }
    }

    TweenMax.to(counterStart, 0.3, {var: counterEnd.var, onUpdate: () => {
        $(el).html(Math.ceil(counterStart.var));
      },
      ease:Circ.easeOut
    });
  }

  drawSlider() {
    this.stepSlider = $('#js-slider-us-territories')[0];
    let slider = noUiSlider .create(this.stepSlider, {
      animate: true,
      animationDuration: 3000,
      start: 0,
      step: 1,
      range: {
        'min': [ 0 ],
        'max': [ this.caseData.length - 1 ]
      }
    });

    $(() => this.stepSlider.noUiSlider.set(this.caseData.length - 1));

    $('.js-play--territories').click(() => {
      this.stepSlider.noUiSlider.set(this.caseData.length - 1);
    });
    $('.js-step-down--territories').click(() => {
      this.stepSlider.noUiSlider.set(this.unformatSlider() - 1);
    });
    $('.js-step-up--territories').click(() => {
      this.stepSlider.noUiSlider.set(this.unformatSlider() + 1);
    });
  }

  switchTabs() {
    $('.tabs__link--us-territories-100k').click(() => {
      event.preventDefault();

      $('.tabs__link--us-territories-100k').removeClass('is-active');
      $(event.currentTarget).addClass('is-active');

      this.totals.forEach(i => {
        this.setTotals(i);
      });
    });
  }

  setDate() {
    $('#js-date-us-territories').html(moment(this.caseData[this.unformatSlider()].date).format('MMM. D, YYYY'));
  }

  unformatSlider() {
    return numeral().unformat(this.stepSlider.noUiSlider.get());
  }
}

const loadUSTerritoriesStats = () => {
  new USTerritoriesStats().render();
};

export { loadUSTerritoriesStats };
