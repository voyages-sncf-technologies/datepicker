require('styles');
var toolBox = require('toolbox');
var i18n = require('i18n');

module.exports = (function () {

  /**
   * Constructor
   */
  function VscDatePicker(el, opts) {
    /* jshint validthis: true */
    // Has already been wrapped
    if (el.parentNode.classList.contains('datepicker-wrapper')) {
      return;
    }

    // Options
    var options = opts || {};

    if (typeof options !== 'object') {
      options = {
        lang: 'en',
        dateMin: new Date(),
        dateMax: null,
        topMin: 95
      };
    }

    // Lang
    if (typeof options.lang === 'undefined' || typeof i18n[options.lang] === 'undefined') {
      options.lang = 'en';
    }

    // Minimum date
    if (typeof options.dateMin === 'undefined' || !(options.dateMin instanceof Date)) {
      options.dateMin = new Date();
    }

    // Maximum date
    if (typeof options.dateMax === 'undefined' || !(options.dateMax instanceof Date)) {
      options.dateMax = null;
    }

    // Top min
    if (typeof options.topMin === 'undefined' || isNaN(options.topMin)) {
      options.topMin = 95;
    }

    toolBox.extendObject(toolBox.extendObject(toolBox.extendObject(this, VscDatePicker.DEFAULT_OPTS), options), i18n[options.lang]);

    this.input = el;
    this.bindMethodsToObj('show', 'hide', 'hideIfClickOutside', 'keydownHandler', 'selectDate');

    this.build();
    this.selectDate();
    this.hide();
  }

  /**
   * Default options
   * @type {Object}
   */
  // VscDatePicker i18n
  VscDatePicker.DEFAULT_OPTS = {
    selectableDays: [0, 1, 2, 3, 4, 5, 6],
    nonSelectable: [],
    recNonSelectable: [],
    startOfWeek: 1,
    showWeek: 0,
    selectWeek: 0,
    weekLabel: '',
    nbCalendar: 2,
    dateMin: null,
    dateMax: null
  };

  VscDatePicker.prototype = {
    build: build,
    presetInward: presetInward,
    setDateMin: setDateMin,
    setDateMax: setDateMax,
    getSelectedDate: getSelectedDate,
    renderDatepicker: renderDatepicker,
    clickEvent: clickEvent,
    selectMonth: selectMonth,
    renderMonth: renderMonth,
    renderSelectedDate: renderSelectedDate,
    selectDate: selectDate,
    isNewDateAllowed: isNewDateAllowed,
    isHoliday: isHoliday,
    changeInput: changeInput,
    dispatchChangeEvent: dispatchChangeEvent,
    show: show,
    hide: hide,
    hideIfClickOutside: hideIfClickOutside,
    keydownHandler: keydownHandler,
    setDateFormat: setDateFormat,
    stringToDate: stringToDate,
    dateToString: dateToString,
    dateToShortString: dateToShortString,
    setPosition: setPosition,
    moveDateBy: moveDateBy,
    moveDateMonthBy: moveDateMonthBy,
    moveMonthBy: moveMonthBy,
    firstMonthAllowed: firstMonthAllowed,
    nextMonthAllowed: nextMonthAllowed,
    monthName: monthName,
    getMonthSelect: getMonthSelect,
    bindToObj: bindToObj,
    bindMethodsToObj: bindMethodsToObj,
    indexFor: indexFor,
    monthNum: monthNum,
    shortMonthNum: shortMonthNum,
    shortDayNum: shortDayNum,
    daysBetween: daysBetween,
    changeDayTo: changeDayTo,
    rangeStart: rangeStart,
    rangeEnd: rangeEnd,
    isFirstDayOfWeek: isFirstDayOfWeek,
    getWeekNum: getWeekNum,
    isLastDayOfWeek: isLastDayOfWeek,
    showError: showError,
    adjustDays: adjustDays,
    strpad: strpad,
    setNbCalendar: setNbCalendar,
    drawMonthHeads: drawMonthHeads
  };

  function build() {
    /* jshint validthis: true */

    var self = this;

    // Wrapper
    this.wrapp = toolBox.createElement('<div class="datepicker-wrapper">');
    this.input.parentNode.insertBefore(this.wrapp, this.input);
    this.wrapp.appendChild(this.input);
    this.input.addEventListener('click', function () {
      self.show();
    }, false);

    // Input
    this.inputChangeHandler = (this.bindToObj(function () {
      this.selectDate();
    }));
    this.input.addEventListener('change', this.inputChangeHandler);

    // Date settings
    this.setDateFormat();

    if (typeof this.dateMax === 'undefined' || !(this.dateMax instanceof Date)) {
      this.dateMax = null;
    }

    if (typeof this.dateMin === 'undefined' || !(this.dateMin instanceof Date)) {
      this.dateMin = null;
    }

    // Nav
    var nav = toolBox.createElement('<div class="nav"/>');

    // Error
    this.errorMsg = toolBox.createElement('<div class="error_msg"/>');
    nav.appendChild(this.errorMsg);

    // Heading
    var monthHead = this.drawMonthHeads();

    // Nav buttons
    var monthNav = toolBox.createElement('<p class="month-nav">' + '<span class="button prev idp-left" title="' + this.previous + ' [Page-Up]" role="button">' + this.previous + '</span>' + '<span class="button next idp-right" title="' + this.next + ' [Page-Down]" role="button">' + this.next + '</span></p>');
    monthNav.appendChild(monthHead);

    this.prevBtn = monthNav.querySelector('.prev');
    this.nextBtn = monthNav.querySelector('.next');

    this.prevBtn.onclick = this.bindToObj(function (e) {
      this.moveMonthBy(Number('-1')); // Always go 1 month backward, even if 2 months or more are displayed
      e.preventDefault();
      e.stopPropagation();
      var newMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), -1);
      this.firstMonthAllowed(newMonth);
    });

    this.nextBtn.onclick = this.bindToObj(function (e) {
      this.moveMonthBy(1); // Always go 1 month forward, even if 2 months or more are displayed
      e.preventDefault();
      e.stopPropagation();
    });

    nav.appendChild(monthNav);

    // Months grid
    var tableShell = '<table role="grid" class="month-wrapper"><thead><tr>';

    if (this.showWeek === 1) {
      tableShell += '<th class="weekLabel">' + (this.weekLabel) + '</th>';
    }

    tableShell += '</tr></thead><tbody><tr><td></td></tr></tbody></table>';
    tableShell = toolBox.createElement(tableShell);

    this.tbody = tableShell.querySelector('tbody tr');

    // Today button
    var todayDate = toolBox.createElement('<div class="today-date" role="button">' + this.todayString + '</div>');
    todayDate.click = this.bindToObj(function () {
      this.changeInput(this.currentDate());
    });

    // Arrow
    var before = toolBox.createElement('<span class="date-selector-before"></span>');
    var after = toolBox.createElement('<span class="date-selector-after"></span>');
    this.arrowBefore = before;
    this.arrowAfter = after;

    // Date picker container
    var style = (this.input.type === 'hidden') ? ' style="display:block; position:static; margin:0 auto"' : '';
    this.dateSelector = toolBox.createElement('<div class="date-selector" aria-hidden="true"' + style + '></div>');
    this.dateSelector.appendChild(before);
    this.dateSelector.appendChild(nav);
    this.dateSelector.appendChild(nav);
    this.dateSelector.appendChild(tableShell);
    this.dateSelector.appendChild(todayDate);
    this.dateSelector.appendChild(after);
    this.input.parentNode.appendChild(this.dateSelector);
    this.rootLayers = this.dateSelector;
    this.rootHeight = this.rootLayers.offsetHeight;

    // Keep focus on the editable element (prevent blur on the corresponding input)
    this.dateSelector.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.returnValue = false;
      return false;
    }, false);

    this.dateSelector.addEventListener(this.clickEvent(), function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.returnValue = false;
      return false;
    }, false);

    // Fill inwardDate with outwardDate
    this.presetInward();

    this.selectDate();
  }

  function presetInward() {
    /* jshint validthis: true */
    var dp = this;

    if (!(dp.dependingOnInput instanceof Element)) {
      return;
    }

    var outward = dp.dependingOnInput;
    var outwardDate = [];
    var inwardDate = [];
    var month = '';
    var day = '';

    dp.input.addEventListener('focus', inputFocusHandler);

    function inputFocusHandler(e) {
      var elt = e.target;

      if (dp.stringToDate(elt.value) >= dp.stringToDate(outward.value)) {
        return;
      }

      elt.value = outward.value;

      // Case classes are 'inward' AND 'one-day-after' : set date to selected date +1
      if (elt.classList.contains('one-day-after')) {
        outwardDate = outward.value;
        outwardDate = outwardDate.split('/');
        inwardDate = new Date(outwardDate[2] + ',' + outwardDate[1] + ',' + outwardDate[0]);
        inwardDate.setTime(inwardDate.getTime() + (24 * 60 * 60 * 1000));
        month = ((inwardDate.getMonth() + 1) < 10) ? '0' + (inwardDate.getMonth() + 1) : (inwardDate.getMonth() + 1);
        day = (inwardDate.getDate() < 10) ? '0' + inwardDate.getDate() : inwardDate.getDate();
        inwardDate = day + '/' + month + '/' + inwardDate.getFullYear();
        elt.value = inwardDate;
      }

      dp.selectDate();
    }
  }

  function setDateMin(date) {
    /* jshint validthis: true */
    if (!(date instanceof Date)) {
      return;
    }
    if (this.dateMin && this.daysBetween(this.dateMin, date) === 0) {
      return;
    }

    var prevSelectedDate = this.selectedDate;

    this.dateMin = date;
    if (this.daysBetween(this.dateMin, this.selectedDate) < 0) {
      this.selectedDate = this.dateMin;
    }
    this.selectDate();
    this.renderMonth(date);
    this.renderSelectedDate();

    if (prevSelectedDate !== this.selectedDate) {
      this.dispatchChangeEvent();
    }
  }

  function setDateMax(date) {
    /* jshint validthis: true */
    if (!(date instanceof Date)) {
      return;
    }
    if (this.dateMax && this.daysBetween(date, this.dateMax) === 0) {
      return;
    }

    var prevSelectedDate = this.selectedDate;

    this.dateMax = date;
    if (this.daysBetween(this.selectedDate, this.dateMax) < 0) {
      this.selectedDate = this.dateMax;
    }
    this.selectDate();
    this.renderMonth(date);
    this.renderSelectedDate();

    if (prevSelectedDate !== this.selectedDate) {
      this.dispatchChangeEvent();
    }
  }

  function getSelectedDate() {
    return this.selectedDate;
  }

  function renderDatepicker(date) {
    /* jshint validthis: true */
    var rangeStart = this.rangeStart(date);
    var rangeEnd = this.rangeEnd(date);
    var numDays = this.daysBetween(rangeStart, rangeEnd);
    var td = document.createElement('td');
    var tableCells = '';
    var weekRow = 0;
    var adjustShortDayNames = this.adjustDays(this.shortDayNames);
    var adjustDayNames = this.adjustDays(this.dayNames);
    var i = 0;
    var len = 0;

    td.classList.add('table-month-wrapper');
    tableCells += '<table role="grid" class="month-cal"><tr>';

    for (i = 0, len = adjustShortDayNames.length; i < len; i++) {
      tableCells += '<th><abbr title="' + adjustDayNames[i] + '">' + adjustShortDayNames[i] + '</abbr></th>';
    }

    for (i = 0, len = numDays; i <= len; i++) {
      var currentDay = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + i, 12, 0);
      var firstDay = 0;
      var firstDayOfWeek = currentDay;

      if (this.isFirstDayOfWeek(currentDay)) {
        if (this.selectWeek && this.isNewDateAllowed(firstDayOfWeek)) {
          tableCells += '<tr role="row" date="' + this.dateToString(currentDay) + '" class="selectable_week">';
        } else {
          tableCells += '<tr role="row">';
        }
        weekRow++;
        if (this.showWeek === 1) {
          tableCells += '<td class="week_num">' + this.getWeekNum(currentDay) + '</td>';
        }
      }

      if ((this.selectWeek === 0 && currentDay.getMonth() === date.getMonth() && this.isNewDateAllowed(currentDay) && !this.isHoliday(currentDay)) || (this.selectWeek === 1 && currentDay.getMonth() === date.getMonth() && this.isNewDateAllowed(firstDayOfWeek))) {
        tableCells += '<td class="selectable_day" date="' + this.dateToString(currentDay) + '" role="gridcell" aria-selected="false" headers="row' + weekRow + ' ' + adjustDayNames[firstDay] + '">' + currentDay.getDate() + '</td>';
      } else if (currentDay.getMonth() === date.getMonth()) {
        tableCells += '<td class="unselected_month" date="' + this.dateToString(currentDay) + '" role="gridcell" aria-selected="false" headers="row' + weekRow + ' ' + adjustDayNames[firstDay] + '">' + currentDay.getDate() + '</td>';
      } else {
        tableCells += '<td class="unselected_month off_month" date="' + this.dateToString(currentDay) + '" role="gridcell" aria-selected="false" headers="row' + weekRow + ' ' + adjustDayNames[firstDay] + '">' + currentDay.getDate() + '</td>';
      }

      firstDay++;

      if (this.isLastDayOfWeek(currentDay)) {
        tableCells += '</tr>';
      }
    }

    // Empty line to have always the same height
    while (weekRow < 6) {
      tableCells += '<tr><td class="unselected_month off_month">N</td></tr>';
      weekRow++;
    }

    tableCells += '</tr></table>';
    td.innerHTML = tableCells;

    return td;
  }

  function clickEvent() {
    return 'click';
  }

  function selectMonth(date) {
    /* jshint validthis: true */
    var newMonth = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var i = 0;
    var l = 0;

    if (this.isNewDateAllowed(newMonth)) {
      // No current month
      // Not the same month of the same year
      if (!this.currentMonth || !(this.currentMonth.getFullYear() === newMonth.getFullYear() && this.currentMonth.getMonth() === newMonth.getMonth())) {
        this.renderMonth(date);
      }
      this.renderSelectedDate();
    }
  }

  function renderMonth(date) {
    toolBox.emptyNode(this.tbody);
    this.currentMonth = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Render the current month
    var firstMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    this.tbody.appendChild(this.renderDatepicker(date));

    var monthNameSpan = this.dateSelector.querySelectorAll('.month-head span.month-name');
    var yearNameSpan = this.dateSelector.querySelectorAll('.month-head span.year-name');

    toolBox.emptyNode(monthNameSpan[0]).textContent = this.monthNames[firstMonth.getMonth()];
    toolBox.emptyNode(yearNameSpan[0]).textContent = this.currentMonth.getFullYear();
    this.firstMonthAllowed(firstMonth);
    this.nextMonthAllowed(date);

    // Iterate to render next months
    var i;
    var l;

    if (this.nbCalendar > 1) {
      for (i = 1, l = this.nbCalendar; i < l; i++) {
        var nextMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + i, 1);
        toolBox.emptyNode(monthNameSpan[i]).textContent = this.monthNames[nextMonth.getMonth()];
        toolBox.emptyNode(yearNameSpan[i]).textContent = nextMonth.getFullYear();
        this.tbody.appendChild(this.renderDatepicker(nextMonth));
      }
    }

    var selectableDays = this.tbody.querySelectorAll('.selectable_day');
    var selectableWeeks = this.tbody.querySelectorAll('.selectable_week');
    var today = this.tbody.querySelector('td[date="' + this.dateToString(new Date()) + '"]');
    var tr = this.tbody.querySelectorAll('tr');

    /* jshint ignore:start */

    var handleDaySelection = function (event) {
      this.changeInput(event.target.getAttribute('date'));
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.returnValue = false;
      return false;
    };
    var handleWeekDaySelection = function (event) {
      this.changeInput(event.target.parentNode.getAttribute('date'));
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.returnValue = false;
      return false;
    };
    if (this.selectWeek === 0) {
      for (i = 0, l = selectableDays.length; i < l; i++) {
        selectableDays[i].addEventListener('click', this.bindToObj(handleDaySelection));
        selectableDays[i].addEventListener('touchend', this.bindToObj(handleDaySelection));
      }
    } else {
      for (i = 0, l = selectableWeeks.length; i < l; i++) {
        selectableWeeks[i].addEventListener('click', this.bindToObj(handleWeekDaySelection));
        selectableWeeks[i].addEventListener('touchend', this.bindToObj(handleWeekDaySelection));
      }
    }

    /* jshint ignore:end */

    if (today !== null) {
      today.classList.add('today');
    }

    var overHandler = function (elt, className) {
      return function () {
        elt.classList.add(className);
      };
    };

    var outHandler = function (elt, className) {
      return function () {
        elt.classList.remove(className);
      };
    };

    if (this.selectWeek === 1) {
      for (i = 0, l = tr.length; i < l; i++) {
        tr[i].onmouseover = overHandler(tr[i], 'hover');
        tr[i].onmouseout = outHandler(tr[i], 'hover');
      }
    } else {
      for (i = 0, l = selectableDays.length; i < l; i++) {
        selectableDays[i].onmouseover = overHandler(selectableDays[i], 'hover');
        selectableDays[i].onmouseout = outHandler(selectableDays[i], 'hover');
      }
    }
  }

  function renderSelectedDate() {
    var prevSelected = this.tbody.querySelectorAll('.selected');
    var currentSelected = this.tbody.querySelectorAll('td[date="' + this.selectedDateString + '"], tr[date="' + this.selectedDateString + '"]');
    for (i = 0, l = prevSelected.length; i < l; i++) {
      prevSelected[i].classList.remove('selected');
      prevSelected[i].setAttribute('aria-selected', 'true');
    }
    for (i = 0, l = currentSelected.length; i < l; i++) {
      currentSelected[i].classList.add('selected');
      currentSelected[i].setAttribute('aria-selected', 'true');
    }
  }

  function selectDate(date) {
    /* jshint validthis: true */

    if (typeof (date) === 'undefined') {
      date = this.stringToDate(this.input.value);
    }

    if (!date) {
      date = new Date();
    }

    if (this.selectWeek === 1 && !this.isFirstDayOfWeek(date)) {
      date = new Date(date.getFullYear(), date.getMonth(), (date.getDate() - date.getDay() + this.startOfWeek), 12, 0);
    }

    if (this.isNewDateAllowed(date)) {
      this.selectedDate = date;
      this.selectedDateString = this.dateToString(this.selectedDate);
      this.selectMonth(this.selectedDate);
    } else if ((this.dateMin) && this.daysBetween(this.dateMin, date) < 0) {
      this.selectedDate = this.dateMin;
      this.selectedDateString = this.dateToString(this.selectedDate);
      this.selectMonth(this.dateMin);
      this.input.value = '';
    } else {
      this.selectMonth(this.dateMax);
      this.input.value = '';
    }
  }

  function isNewDateAllowed(date) {
    /* jshint validthis: true */
    // No min or date >= min
    if (this.dateMin && this.daysBetween(this.dateMin, date) < 0) {
      return false;
    }
    // No max or date <= max
    if (this.dateMax && this.daysBetween(date, this.dateMax) < 0) {
      return false;
    }
    return true;
  }

  function isHoliday(date) {
    /* jshint validthis: true */
    return ((this.indexFor(this.selectableDays, date.getDay()) === false || this.indexFor(this.nonSelectable, this.dateToString(date)) !== false) || this.indexFor(this.recNonSelectable, this.dateToShortString(date)) !== false);
  }

  function changeInput(dateString) {
    /* jshint validthis: true */
    var vm = this;
    this.input.value = dateString;
    this.dispatchChangeEvent();
    if (this.input.type !== 'hidden') {
      setTimeout(function () {
        vm.hide();
      }, 100);
    }
  }

  function fireEvent(element, type, options) {
    var event = document.createEvent('CustomEvent');
    options = options || {};
    event.initCustomEvent(type,
      options.bubbles !== false,
      options.cancelable !== false,
      options.detail
    );
    if (options.baseEvent) {
      inheritEvent(event, options.baseEvent);
    }
    element.dispatchEvent(event);
  }

  function dispatchChangeEvent() {
    /* jshint validthis: true */
    fireEvent(this.input, 'change');
  }

  function show() {
    /* jshint validthis: true */

    if (this.rootLayers.getAttribute('aria-hidden') === 'false') {
      return;
    }

    this.errorMsg.style.display = 'none';
    this.rootLayers.setAttribute('aria-hidden', 'false');
    this.rootLayers.style.display = 'block';
    this.rootLayers.style.opacity = 1;
    document.addEventListener(this.clickEvent(), this.hideIfClickOutside);
    this.input.removeEventListener('focus', this.show);
    this.input.setAttribute('autocomplete', 'off');
    document.body.addEventListener('keydown', this.keydownHandler);
    this.setPosition();
  }

  function hide() {
    /* jshint validthis: true */
    var dp = this;
    if (dp.input.type !== 'hidden') {
      dp.rootLayers.setAttribute('aria-hidden', 'true');
      dp.rootLayers.style.opacity = 0;
      setTimeout(function () {
        if (dp.rootLayers.style.opacity === '0') {
          dp.rootLayers.style.display = 'none';
        }
      }, 200);
      document.removeEventListener(dp.clickEvent(), dp.hideIfClickOutside);
      dp.input.addEventListener('focus', dp.show);
      document.body.removeEventListener('keydown', dp.keydownHandler);
    }
  }

  function hideIfClickOutside(event) {
    /* jshint validthis: true */
    if (event.target !== this.input && event.target !== this.dateSelector && event.target.type !== 'submit') {
      this.hide();
    }
  }

  function keydownHandler(event) {
    /* jshint validthis: true */
    switch (event.keyCode) {
      // Tab & ctrl key
      case 9:
      case 27:
        this.hide();
        return;
      // Enter key
      case 13:
        if (this.isNewDateAllowed(this.stringToDate(this.selectedDateString)) && !this.isHoliday(this.stringToDate(this.selectedDateString))) {
          this.changeInput(this.selectedDateString);
        }
        break;
      // Page up key
      case 33:
        this.moveDateMonthBy(event.ctrlKey ? -12 : -1);
        break;
      // Page down key
      case 34:
        this.moveDateMonthBy(event.ctrlKey ? 12 : 1);
        break;
      // Up arrow key
      case 38:
        this.moveDateBy(-7);
        break;
      // Down arrow key
      case 40:
        this.moveDateBy(7);
        break;
      // Left arrow key
      case 37:
        if (this.selectWeek === 0) {
          this.moveDateBy(-1);
        }
        break;
      // Right arrow key
      case 39:
        if (this.selectWeek === 0) {
          this.moveDateBy(1);
        }
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  function currentDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();

    if (dd < 10) {
      dd = '0' + dd;
    }

    if (mm < 10) {
      mm = '0' + mm;
    }
    return String(dd + '\/' + mm + '\/' + yyyy);
  }

  function setNbCalendar(newNbCalendar) {
    /* jshint validthis: true */
    this.nbCalendar = newNbCalendar;
    this.drawMonthHeads();
    this.selectDate();
    this.renderMonth(this.currentMonth);
    this.renderSelectedDate();
  }

  function drawMonthHeads() {
    /* jshint validthis: true */
    var monthHead;

    if (this.dateSelector) {
      monthHead = this.dateSelector.querySelector('.month-head-wrapper');
      monthHead.innerHTML = '';
    } else {
      monthHead = toolBox.createElement('<div class="month-head-wrapper"></div>');
    }

    var monthHeading = null;
    var i;
    var l;
    var headWidth = (100 / this.nbCalendar).toFixed(2) + '%';

    this.monthNameSpan = [];
    this.yearNameSpan = [];

    for (i = 0, l = this.nbCalendar; i < l; i++) {
      monthHeading = toolBox.createElement('<span role="heading" aria-atomic="true" aria-live="assertive" class="month-head month-head-' + i + '"></span> ');
      this.monthNameSpan.push(toolBox.createElement('<span class="month-name month-name-' + i + '"></span> '));
      this.yearNameSpan.push(toolBox.createElement('<span class="year-name year-name-' + i + '"></span>'));
      monthHeading.appendChild(this.monthNameSpan[i]);
      monthHeading.appendChild(toolBox.createElement('<span> </span>'));
      monthHeading.appendChild(this.yearNameSpan[i]);
      monthHeading.style.width = headWidth;
      monthHead.appendChild(monthHeading);
    }

    return monthHead;
  }

  function setDateFormat() {
    /* jshint validthis: true */
    switch (this.dateFormat) {
      case 'dd/mm/YYYY':
        this.reg = new RegExp(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        this.dateDecode = function (matches) {
          return new Date(matches[3], parseInt(matches[2] - 1), matches[1]);
        };
        this.dateEncode = function (date) {
          /* jshint validthis: true */
          return this.strpad(date.getDate()) + '/' + this.strpad(date.getMonth() + 1) + '/' + date.getFullYear();
        };
        this.dateEncodeS = function (date) {
          /* jshint validthis: true */
          return this.strpad(date.getDate()) + '/' + this.strpad(date.getMonth() + 1);
        };
        break;
      case 'FF dd YYYY':
        this.reg = new RegExp(/^([a-zA-Z]+) (\d{1,2}) (\d{4})$/);
        this.dateDecode = function (matches) {
          return new Date(matches[3], this.indexFor(this.monthNames, matches[1]), matches[2]);
        };
        this.dateEncode = function (date) {
          /* jshint validthis: true */
          return this.monthNames[date.getMonth()] + ' ' + this.strpad(date.getDate()) + ' ' + date.getFullYear();
        };
        this.dateEncodeS = function (date) {
          /* jshint validthis: true */
          return this.monthNames[date.getMonth()] + ' ' + this.strpad(date.getDate());
        };
        break;
      case 'dd MM YYYY':
        this.reg = new RegExp(/^(\d{1,2}) ([a-zA-Z]{3}) (\d{4})$/);
        this.dateDecode = function (matches) {
          return new Date(matches[3], this.indexFor(this.shortMonthNames, matches[2]), matches[1]);
        };
        this.dateEncode = function (date) {
          /* jshint validthis: true */
          return this.strpad(date.getDate()) + ' ' + this.shortMonthNames[date.getMonth()] + ' ' + date.getFullYear();
        };
        this.dateEncodeS = function (date) {
          /* jshint validthis: true */
          return this.strpad(date.getDate()) + ' ' + this.shortMonthNames[date.getMonth()];
        };
        break;
      case 'MM dd YYYY':
        this.reg = new RegExp(/^([a-zA-Z]{3}) (\d{1,2}) (\d{4})$/);
        this.dateDecode = function (matches) {
          return new Date(matches[3], this.indexFor(this.shortMonthNames, matches[1]), matches[2]);
        };
        this.dateEncode = function (date) {
          /* jshint validthis: true */
          return this.shortMonthNames[date.getMonth()] + ' ' + this.strpad(date.getDate()) + ' ' + date.getFullYear();
        };
        this.dateEncodeS = function (date) {
          /* jshint validthis: true */
          return this.shortMonthNames[date.getMonth()] + ' ' + this.strpad(date.getDate());
        };
        break;
      case 'dd FF YYYY':
        this.reg = new RegExp(/^(\d{1,2}) ([a-zA-Z]+) (\d{4})$/);
        this.dateDecode = function (matches) {
          return new Date(matches[3], this.indexFor(this.monthNames, matches[2]), matches[1]);
        };
        this.dateEncode = function (date) {
          /* jshint validthis: true */
          return this.strpad(date.getDate()) + ' ' + this.monthNames[date.getMonth()] + ' ' + date.getFullYear();
        };
        this.dateEncodeS = function (date) {
          /* jshint validthis: true */
          return this.strpad(date.getDate()) + ' ' + this.monthNames[date.getMonth()];
        };
        break;
      // 'YYYY/mm/dd':
      default:
        this.reg = new RegExp(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
        this.dateDecode = function (matches) {
          return new Date(matches[1], parseInt(matches[2] - 1), matches[3]);
        };
        this.dateEncode = function (date) {
          /* jshint validthis: true */
          return date.getFullYear() + '/' + this.strpad(date.getMonth() + 1) + '/' + this.strpad(date.getDate());
        };
        this.dateEncodeS = function (date) {
          /* jshint validthis: true */
          return this.strpad(date.getMonth() + 1) + '/' + this.strpad(date.getDate());
        };
        break;
    }
  }

  function stringToDate(string) {
    /* jshint validthis: true */
    var matches = string.match(this.reg);
    if (matches) {
      if (matches[3] === 0 && matches[2] === 0 && matches[1] === 0) {
        return null;
      } else {
        return this.dateDecode(matches);
      }
    } else {
      return null;
    }
  }

  function dateToString(date) {
    /* jshint validthis: true */
    return this.dateEncode(date);
  }

  function dateToShortString(date) {
    /* jshint validthis: true */
    return this.dateEncodeS(date);
  }

  function setPosition() {
    /* jshint validthis: true */
    var inputRect = this.input.getBoundingClientRect();
    var rootRect = {
      height: this.rootLayers.offsetHeight,
      width: this.rootLayers.offsetWidth
    };

    // Vertical position
    if (inputRect.top >= rootRect.height + this.topMin) {
      // Enough space over input
      this.rootLayers.classList.add('on-top');
      this.rootLayers.classList.remove('under');
    } else {
      // Not enough space over
      this.rootLayers.classList.add('under');
      this.rootLayers.classList.remove('on-top');
    }

    // Horizontal position
    // Center
    var left = -(rootRect.width - inputRect.width) / 2;
    var arrowBeforeLeft = (rootRect.width - this.arrowBefore.offsetWidth) / 2;
    var arrowAfterLeft = (rootRect.width - this.arrowAfter.offsetWidth) / 2;
    if (inputRect.left + left < 0) {
      // Left
      left = -inputRect.left + 10;
      arrowAfterLeft = -left + inputRect.width / 2 - 10;
      arrowBeforeLeft = arrowAfterLeft - 10;
    } else if (inputRect.left + inputRect.width - left > document.body.offsetWidth) {
      // Right
      left = document.body.offsetWidth - (inputRect.left + rootRect.width) - 10;
      arrowAfterLeft = -left + inputRect.width / 2 - 10;
      arrowBeforeLeft = arrowAfterLeft - 10;
    }
    this.rootLayers.style.left = left + 'px';
    this.arrowBefore.style.left = arrowBeforeLeft + 'px';
    this.arrowAfter.style.left = arrowAfterLeft + 'px';
  }

  function moveDateBy(amount) {
    /* jshint validthis: true */
    var newDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate() + amount);
    this.selectDate(newDate);
  }

  function moveDateMonthBy(amount) {
    /* jshint validthis: true */
    var newDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + amount, this.selectedDate.getDate());
    if (newDate.getMonth() === this.selectedDate.getMonth() + amount + 1) {
      newDate.setDate(0);
    }
    this.selectDate(newDate);
  }

  function moveMonthBy(amount) {
    /* jshint validthis: true */
    var newMonth = null;
    if (amount < 0) {
      newMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + amount + 1, 0);
    } else {
      newMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + amount, 1);
    }
    this.selectMonth(newMonth);
  }

  function firstMonthAllowed(firstMonth) {
    /* jshint validthis: true */
    if (this.isNewDateAllowed(firstMonth)) {
      this.prevBtn.classList.remove('stop');
    } else {
      this.prevBtn.classList.add('stop');
    }
  }

  function nextMonthAllowed(month) {
    var nextMonth = new Date(month);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    if (this.isNewDateAllowed(nextMonth)) {
      this.nextBtn.classList.remove('stop');
    } else {
      this.nextBtn.classList.add('stop');
    }
  }

  function monthName(date) {
    /* jshint validthis: true */
    return this.monthNames[date.getMonth()];
  }

  function getMonthSelect() {
    /* jshint validthis: true */
    var monthSelect = '<select>';
    var i = 0;
    var len = 0;
    for (i = 0, len = this.monthNames.length; i < len; i++) {
      if (i === this.currentMonth.getMonth()) {
        monthSelect += '<option value="' + (i) + '" selected="selected">' + this.monthNames[i] + '</option>';
      } else {
        monthSelect += '<option value="' + (i) + '">' + this.monthNames[i] + '</option>';
      }
    }
    monthSelect += '</select>';

    return monthSelect;
  }

  function bindToObj(fn) {
    /* jshint validthis: true */
    var self = this;
    return function () {
      return fn.apply(self, arguments);
    };
  }

  function bindMethodsToObj() {
    /* jshint validthis: true */
    var i = 0;
    var len = 0;
    for (i = 0, len = arguments.length; i < len; i++) {
      this[arguments[i]] = this.bindToObj(this[arguments[i]]);
    }
  }

  function indexFor(array, value) {
    var i = 0;
    var len = 0;
    for (i = 0, len = array.length; i < len; i++) {
      if (value === array[i]) {
        return i;
      }
    }
    return false;
  }

  function monthNum(monthName) {
    /* jshint validthis: true */
    return this.indexFor(this.monthNames, monthName);
  }

  function shortMonthNum(monthName) {
    /* jshint validthis: true */
    return this.indexFor(this.shortMonthNames, monthName);
  }

  function shortDayNum(dayName) {
    /* jshint validthis: true */
    return this.indexFor(this.shortDayNames, dayName);
  }

  function daysBetween(start, end) {
    start = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    end = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return (end - start) / 86400000;
  }

  function changeDayTo(dayOfWeek, date, direction) {
    var difference = direction * (Math.abs(date.getDay() - dayOfWeek - (direction * 7)) % 7);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + difference);
  }

  function rangeStart(date) {
    /* jshint validthis: true */
    return this.changeDayTo(this.startOfWeek, new Date(date.getFullYear(), date.getMonth()), -1);
  }

  function rangeEnd(date) {
    /* jshint validthis: true */
    return this.changeDayTo((this.startOfWeek - 1) % 7, new Date(date.getFullYear(), date.getMonth() + 1, 0), 1);
  }

  function isFirstDayOfWeek(date) {
    /* jshint validthis: true */
    return date.getDay() === this.startOfWeek;
  }

  function getWeekNum(date) {
    /* jshint validthis: true */
    var dateWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 6);
    var firstDayOfYear = new Date(dateWeek.getFullYear(), 0, 1, 12, 0);
    var n = parseInt(this.daysBetween(firstDayOfYear, dateWeek)) + 1;
    return Math.floor((dateWeek.getDay() + n + 5) / 7) - Math.floor(dateWeek.getDay() / 5);
  }

  function isLastDayOfWeek(date) {
    /* jshint validthis: true */
    return date.getDay() === (this.startOfWeek - 1) % 7;
  }

  function showError(error) {
    /* jshint validthis: true */
    var errors = $('.error_msg', this.rootLayers);
    errors.html(error);
    errors.slideDown(400, function () {
      setTimeout(function () {
        $('.error_msg', this.rootLayers).slideUp(200);
      }, 2000);
    });
  }

  function adjustDays(days) {
    /* jshint validthis: true */
    var newDays = [];
    var i = 0;
    var len = 0;
    for (i = 0, len = days.length; i < len; i++) {
      newDays[i] = days[(i + this.startOfWeek) % 7];
    }
    return newDays;
  }

  function strpad(num) {
    if (parseInt(num) < 10) {
      return '0' + parseInt(num);
    } else {
      return parseInt(num);
    }
  }

  return VscDatePicker;
})();
