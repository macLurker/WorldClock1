/**
* @overview A JavaScript prototype for creating world clocks.
* @requires jQuery
* @requires moment
* @requires moment-timezone
* @author Bart Busschots
* @license BSD-2-Clause
*/

/* Modified for PBS26 Assignment 25-Oct-2016 */
/* Modified for PBS92 Homework 28-Mar-2020 */
//
// === Add needed JSDoc data type definitions ===
//

/**
* A TZ string from the [IANA Time Zone Database](https://en.wikipedia.org/wiki/Tz_database).
* A full list of the valid strings can be found in the
* [third column of this listing}(https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).
* @typedef {string} TimeZoneString
*/

/**
* A jQuery object.
* @typedef {object} jQuery
*/

/**
* A jQuery object representing exactly one HTML span element.
* @typedef {jQuery} jQuerySingleSpan
*/

// make sure the needed pre-requisites are installed.
if(typeof jQuery !== 'function'){
    throw new Error('jQuery is required but not loaded');
}

// init the ddr namespace safely
/**
* APIs related to the [Programming by Stealth podcast/blog series](http://bartb.ie/ddr) are grouped under this namespace.
* @namespace
*/
var ddr = ddr ? ddr : {};

// add all the API's functionality within a self-executing anonymous function
(function(ddr, $, undefined){
    //
    // === Define private helper functions and their needed data structures ===
    //

    /**
    * A helper function for testing if a given value is a {@link jQuery}.
    * @memberof ddr
    * @inner
    * @access private
    * @param {*} $s - the value to test.
    * @returns {boolean} - `true` if the value being tested is a valid
    *     {@link jQuery}, `false` otherwise.
    */
    var isjQuery = function(obj){
        if(typeof obj !== 'object'){
            return false;
        }
        if(!(obj instanceof $)){
            return false;
        }
        return true;
    };

    /**
    * A helper function for testing if a given value is a {@link jQuerySingleSpan}
    * @memberof ddr
    * @inner
    * @access private
    * @param {*} $s - the value to test.
    * @returns {boolean} - `true` if the value being tested is a valid
    *     {@link jQuerySingleSpan}, `false` otherwise.
    */
    var isSingleSpan = function($s){
        if(!isjQuery($s)){
            return false;
        }
        if($s.length !== 1){
            return false;
        }
        return $s.is('span') ? true : false;
    };

    /**
    * A lookup table for validating TZ strings. All valid strings are keys in
    * this table with value `true`.
    * @inner
    * @private
    * @const
    * @memberof ddr
    * @type {Object.<string, boolean>}
    */
    var tzLookup = {};
    moment.tz.names().forEach(function(tzn){
        tzLookup[tzn] = true;
    });

    /**
    * A helper function for testing if a given value is valid
    * {@link TimeZoneString}.
    * @memberof ddr
    * @inner
    * @private
    * @param {*} tz - the value to test.
    * @returns {boolean} - `true` if the value being tested is a valid
    *     {@link TimeZoneString}, `false` otherwise.
    */
    var isValidTimeZone = function(tz){
        if(typeof tz !== 'string'){
            return false;
        }
        return tzLookup[tz] ? true : false;
    };

    /**
    * A helper function for testing if a given value is valid
    * true or false
    * @memberof ddr
    * @inner
    * @private
    * @param {*} bv - the value to test.
    * @returns {Number} - 1 if input is value 'true', 0 if input is valid
    *     `false`; -1 otherwise.
    */
    var isValidTrueFalse = function(bv){
        if(typeof bv !== 'string'){
            //console.log ('IVTF: input is NOT a string');
            return -1;
        }

        if ((bv == 'true') || (bv == 'TRUE')) {
          //console.log ('IVTF: input is good and true');
          return 1;
        } else if ((bv == 'false') || (bv == 'FALSE')) {
          //console.log ('IVTF: input is good and false');
          return 0;
        } else {
          //console.log ('IVTF: input is bad: ' + bv);
          return -1;
        }
    };

    //
    // === Define a prototype to represent a Single World Clock ===
    //

    /**
    * @constructor
    * @classdesc A prototype to represent a single world clock.
    *
    * The timezone can be specified either as an argument to the constructor, or
    * by specifying it with the data attribute `data-timezone` on the `span` to
    * be converted into a clock. An argument to the constructor takes precedence
    * over the data attribute.
    *
    * The markup produced to represent the clock is very simple:
    *
    * ```
    * <span class="ddr-worldclock">
    *  <span class="ddr-worldclock-hours">HH</span>
    *  <span class="ddr-worldclock-separator">:</span>
    *  <span class="ddr-worldclock-minutes">MM</span>
    * </span>
    * ```
    *
    * No CSS attributes are set on any of the elements, so all styling is left
    * to the user. Below is a sample style:
    *
    * ```
    * .ddr-worldclock{
    *    font-weight: bold;
    *    display: inline-block;
    *    border: 1px solid green;
    *    border-radius: 3px;
    *    padding: 3px;
    *    background-color: black;
    *    color: lightgreen;
    *    font-family: monospace;
    * }
    * ```
    *
    * @param {jQuerySingleSpan} $span - a jQuery object representing the HTML
    *     `span` element to be transformed into a clock. Note that all existing
    *     content within the span will be  will be removed.
    * @param {TimeZoneString} [tz=Europe/London] - The timezone for the clock.
    * @param {number} [tf=24] - Time format: 12 for 12-hour clock or 24 for 24-hour clock
    * @param {string} [ds=false] - Whether clock displays seconds or not. "True" = display seconds
    * @throws {TypeError} An error is thrown when an invalid value is passed for
    *     any of the arguments.
    */
    ddr.WorldClock = function($span, tz, tf, ds, bs){
        // make sure we were passed a jQuery object representing exactly one span
        if(!isSingleSpan($span)){
            throw new TypeError('the first argument must be a jQuery object representing exactly one span element');
        }

        // make sure the span has not already been initialised as a clock
        if($span.is('.ddr-worldclock')){
            throw new Error('Cannot initialise a World Clock into a span that has already been initialised as a World Clock');
        }

        // save a reference to the span into the object
        /**
        * A jQuery object representing the span containing the clock.
        * @member {jQuerySingleSpan}
        * @private
        */
        this._$span = $span;

        // ---------------------------------
        // figure out which timezone to use
        /**
        * The clock's timezone as a string.
        * @member {TimeZoneString}
        * @private
        */
        this._timezone = 'Europe/London'; // default to Greenwich
        if(typeof tz === 'string'){
            // if there is a valid second argument, use it
            this._timezone = tz;
        }else if($span.data('timezone')){
            // if there is no second argument, but
            // there is a data attribute, use it
            this._timezone = $span.data('timezone');
        }

        // validate the timezone
        if(!isValidTimeZone(this._timezone)){
            throw new TypeError('Invalid timezone string: ' + this._timezone);
        }

        // ---------------------------------
        // Process time format argument
        /**
        * The clock's output format as decimal 12 or 24
        * @member {decimal}
        * @private
        */
        this._timeformat = 24;    // default to 24-hour format
        var newtf = this._timeformat;

        // if tf argument present
        if (tf != undefined) {
          newtf = tf;

          // check if data attribute present
        } else if ($span.data('timeformat')) {
          // if there is no second argument, but
          // there is a data attribute, use it
          newtf = Number($span.data('timeformat'));

        } else {
          //console.log ('tf is NOT defined. Use default');

        }
        // Validate time format
        if (!Number.isInteger(newtf)) {
          throw new TypeError('Time format must be integer: ' + newtf);

        }

        if ((newtf != 12) && (newtf != 24)) {
          throw new TypeError('Invalid time format (not 12 or 24): ' + newtf);
        } else {
          this._timeformat = newtf;
        }

        // ---------------------------------
        // Process include seconds argument
        /**
        * Whether clock displays seconds or not
        * @member {string} [TRUE or FALSE]
        * @private
        */
        this._displayseconds = false;    // default to not displaying seconds

        // if ds argument present
        if (ds != undefined) {
          //console.log('input argument found, type is ' + typeof ds);
          newStr = ds;

          // Validate display seconds input
          var dsResult = isValidTrueFalse(newStr);
          if (dsResult < 0) {
            //console.log ('newStr is >' + newStr + '< dsResult is ' + dsResult);

            throw new TypeError('Display seconds parameter must be TRUE or FALSE: ' + newStr);
          }
          // check if data attribute present
        } else if ($span.data('displayseconds')) {
          // if there is no third argument, but
          // there is a data attribute, use it
          daInput = $span.data('displayseconds');
          //console.log('data attribute found, is type ' + typeof daInput);
          // make sure it's the right type
          if ((typeof daInput) != 'boolean') {
            if ((typeof daInput) != 'string') {
              throw new TypeError('Display seconds parameter must be TRUE or FALSE: ' + daInput);
            } else {// input is string. Validate string
              dsResult = isValidTrueFalse(daInput);
              if (dsResult < 0) {
                throw new TypeError('Display seconds parameter must be TRUE or FALSE: ' + daInput);
              }

            }
          } else {
            dsResult = daInput;
          }

        } else {
          //console.log ('ds is NOT defined. Use default');
          dsResult = this._displayseconds;
        }

        this._displayseconds = dsResult;

        // ---------------------------------
        // Process blink separators argument
        /**
        * Whether clock blinks seperators or not
        * @member {string} [TRUE or FALSE]
        * @private
        */
        this._blink = false;    // default to not blinking

        // if bs argument present
        if (bs != undefined) {
          //console.log('blink input argument found, type is ' + typeof bs);
          newStr = bs;

          // Validate display seconds input
          var dsResult = isValidTrueFalse(newStr);
          if (dsResult < 0) {
            //console.log ('blink newStr is >' + newStr + '< dsResult is ' + dsResult);

            throw new TypeError('Blink parameter must be TRUE or FALSE (1): ' + newStr);
          }
          // check if data attribute present
        } else if ($span.data('blink')) {
          // if there is no third argument, but
          // there is a data attribute, use it
          daInput = $span.data('blink');
          //console.log('data attribute found, is type ' + typeof daInput);
          // make sure it's the right type
          if ((typeof daInput) != 'boolean') {
            if ((typeof daInput) != 'string') {
              throw new TypeError('Blink parameter must be TRUE or FALSE (2): ' + daInput);
            } else {// input is string. Validate string
              dsResult = isValidTrueFalse(daInput);
              if (dsResult < 0) {
                throw new TypeError('Blink parameter must be TRUE or FALSE (3): ' + daInput);
              }

            }
          } else {
            dsResult = daInput;
          }

        } else {
          //console.log ('bs is NOT defined. Use default');
          dsResult = this._blink;
        }

        this._blink = dsResult;

        // ---------------------------------
        // initialize a placeholder for the interval ID
        /**
        * When the clock is running, the ID of the interval controlling it,
        * otherwise, 0.
        * @member {integer}
        * @private
        */
        this._intervalId = 0; // will hold the ID for the interval

        // initialise the span
        this._$span.empty().addClass('ddr-worldclock');
        /**
        * The inner span for the hours.
        * @member {jQuerySingleSpan}
        * @private
        */
        this._$hours = $('<span />').addClass('ddr-worldclock-hours');
        this._$span.append(this._$hours);
        /**
        * The inner span for the separator between the hours and minutes.
        * @member {jQuerySingleSpan}
        * @private
        */
        this._$separatorHM = $('<span />').text(':').addClass('ddr-worldclock-separator');
        this._$span.append(this._$separatorHM);
        /**
        * The inner span for the minutes.
        * @member {jQuerySingleSpan}
        * @private
        */
        this._$minutes = $('<span />').addClass('ddr-worldclock-minutes');
        this._$span.append(this._$minutes);

        // add the MS separator
        /**
        * The inner span for the seconds.
        * @member {jQuerySingleSpan}
        * @private
        */
        this._$separatorMS = $('<span />').text(':').addClass('ddr-worldclock-separator2');
        this._$span.append(this._$separatorMS);

        this._$seconds = $('<span />').addClass('ddr-worldclock-seconds');
        this._$span.append(this._$seconds);

        // The inner span for the AM/PM
        this._$ampm = $('<span />').addClass('ddr-worldclock-ampm');
        this._$span.append(this._$ampm);

        // use accessor to set time format. Should over-ride constructor input
        //this.timeformat (12);

        // save a reference to this object into the span
        this._$span.data('ddr-Worldclock', this);

        // start the clock
        this.start();

        console.log ('time format is ' + this._timeformat + ', time zone is ' +
          this._timezone + ', ds is ' + this._displayseconds);
    };

    //
    // -- Accessor Methods --
    //

    /**
    * Get and/or set the clock's timezone.
    * @param {TimeZoneString} [tz]
    * @returns {TimeZoneString}
    * @throws {TypeError} An error is thrown if an argument is passed that is
    *     not valid.
    */

    ddr.WorldClock.prototype.timezone = function(){
        // if there is a first argument, try use it as a timezone
        //console.log ('in timezone accessor');
        if(arguments.length >= 1){
            if(!isValidTimeZone(arguments[0])){
                throw new TypeError('invalid timezone');
            }
            this._timezone = arguments[0];
        }

        // always return the current timezone
        return this._timezone;
    };

    /**
    * Get and/or set the clock's time format.
    * @param {Number} [tf]
    * @returns {Number}
    * @throws {TypeError} An error is thrown if an argument is passed that is
    *     not valid.
    */

// var clock1 = $('#clock1').data('ddrWorldclock');
// console.log(clock1.displayseconds("true"));
// console.log(clock1.blink("true"));

    ddr.WorldClock.prototype.timeformat = function(){
        // if there is a first argument, try use it as a time format
        if(arguments.length >= 1){
          // Validate time format
          var newtf = arguments[0];
          if (!Number.isInteger(newtf)) {
            //console.log ('Accessor: tf is NOT integer');
            throw new TypeError('Time format must be integer');
          }

          //console.log ('tf is integer ' + newtf);
          if ((newtf != 12) && (newtf != 24)) {
            throw new TypeError('Invalid time format (not 12 or 24): ' + newtf);
          } else {
            this._timeformat = newtf;
          }
        }

        // always return the current time format
        return this._timeformat;
    };

    /**
    * Get and/or set the clock's seconds display on/off.
    * @param {Boolean} [ds]
    * @returns {Boolean}
    * @throws {TypeError} An error is thrown if an argument is passed that is
    *     not valid.
    */

    ddr.WorldClock.prototype.displayseconds = function(){
        // if there is a first argument, try use it as a seconds on/off parameter
        if(arguments.length >= 1){
          // Validate input parameter
          var newds = arguments[0];
          //console.log ('Accessor: ds is ' + (typeof newds));
          if((typeof newds) != 'string') {

            console.log ('Accessor: ds is NOT string');
            throw new TypeError('Display seconds parameter must be true or false');
          }

          var result = isValidTrueFalse(newds);
          if (result < 0) {
            throw new TypeError('Invalid display seconds parameter (not true or false): ' + newds);
          } else {
            this._displayseconds = result;
          }
        }

        // always return the current display seconds value
        return this._displayseconds;
    };

    /**
    * Get and/or set the clock's separator blink on/off.
    * @param {Boolean} [bs]
    * @returns {Boolean}
    * @throws {TypeError} An error is thrown if an argument is passed that is
    *     not valid.
    */

    ddr.WorldClock.prototype.blink = function(){
        // if there is a first argument, try use it as a blink on/off parameter
        if(arguments.length >= 1){
          // Validate input parameter
          var newbs = arguments[0];
          if((typeof newbs) != 'string') {

            //console.log ('Accessor: bs is NOT string');
            throw new TypeError('Do-blink parameter must be true or false');
          }

          var result = isValidTrueFalse(newbs);
          if (result < 0) {
            throw new TypeError('Invalid do-blink parameter (not true or false): ' + newbs);
          } else {
            this._blink = result;
          }
        }

        // always return the current do-blink value
        return this._blink;
    };

    //
    // -- Methods for Rendering the Clock --
    //

    /**
    * Render the current time into a given clock.
    * @memberof ddr
    * @inner
    * @private
    * @param {ddr.WorldClock} clock - a reference to the clock to render the
    *     time into.
    */
    var renderClock = function(clock){
        // get the current time
        var now = moment().tz(clock._timezone);
        //var now = moment('2016-12-19 21:30');

        // render the current time
        //console.log('timeformat is ' + clock._timeformat + '<<');
        if (clock._timeformat == 12) {
          tfString = 'hh';
          tfAMPM = 'a';
        } else {
          tfString = 'HH';
          tfAMPM = '';
        }
        //console.log('tfString is ' + tfString);
        clock._$hours.text(now.format(tfString));
        clock._$minutes.text(now.format('mm'));
        // update seconds if requested
        if(clock._displayseconds) {
          clock._$seconds.text(now.format('ss'));
          clock._$separatorMS.show();
          clock._$seconds.show();
        } else {
          // hide M/S separator & seconds
          clock._$separatorMS.hide();
          clock._$seconds.hide();
        }

        // put AM/PM
        clock._$ampm.text(now.format(' '+tfAMPM));
        
        // blink the separator
        if (clock._blink) {
          if(parseInt(now.format('ss')) %2 == 0){
            $('span.ddr-worldclock-separator', clock._$span).fadeTo(500, 0.2);
            if (clock._displayseconds) {
              $('span.ddr-worldclock-separator2', clock._$span).fadeTo(500, 0.2);
            }
          }else{
            $('span.ddr-worldclock-separator', clock._$span).fadeTo(500, 1);
            if (clock._displayseconds) {
              $('span.ddr-worldclock-separator2', clock._$span).fadeTo(500, 1);
            }

          }
        } else {
          // if no blink, ensure separators are displayed
          $('span.ddr-worldclock-separator', clock._$span).fadeTo(500, 1);
          if (clock._displayseconds) {
            $('span.ddr-worldclock-separator2', clock._$span).fadeTo(500, 1);
          }

        }
    };

    /**
    * Start the clock.
    */
    ddr.WorldClock.prototype.start = function(){
        // if the clock is already started, do nothing
        if(this._intervalId !== 0){
            return;
        }

        // render the current time
        renderClock(this);

        // start an interval
        var self = this;
        this._intervalId = setInterval(function(){ renderClock(self); }, 1000);
    };

    /**
    * Stop the clock.
    */
    ddr.WorldClock.prototype.stop = function(){
        // if the clock is already stopped, do nothing
        if(this._intervalId === 0){
            return;
        }

        console.log ("stop this clock now");
		    // stop the clock
        clearInterval(this._intervalId);
        this._intervalId = 0;
    };

    //
    // === Provide Automation ===
    //
    /**
    * Stop all the clocks
    * @param {jQueryObject} [] - Stop all the clocks in the specified span
    * @throws {TypeError} - error if input parameter is not valid
    */
    ddr.WorldClock.stopAll = function($containers){
      // default the container if none was passed
      if(typeof $containers === 'undefined'){
          $containers = $(document);
      }

      // make sure we have a jQuery object to search within
      if(!isjQuery($containers)){
          throw new TypeError('the first argument must be a jQuery object');
      }

      // search the container(s) and stop each clock found
      $('span.ddr-worldclock', $containers).each(function(){
        // stop this clock
        console.log("stopping a clock");

        var aClock = $(this).data('ddr-Worldclock');
        aClock.stop();

      });

    };

    /**
    * Start all the clocks
    * @param {jQueryObject} [] - Start all the clocks in the specified span
    * @throws {TypeError} - error if input parameter is not valid
    */
    ddr.WorldClock.startAll = function($containers){
      // default the container if none was passed
      if(typeof $containers === 'undefined'){
          $containers = $(document);
      }

      // make sure we have a jQuery object to search within
      if(!isjQuery($containers)){
          throw new TypeError('the first argument must be a jQuery object');
      }

      // search the container(s) and start each clock found
      $('span.ddr-worldclock', $containers).each(function(){
        // start this clock
        var aClock = $(this).data('ddr-Worldclock');
        aClock.start();
      });

    }

    /**
    * Initialise all spans with the class `ddr-worldclock-auto` within a given
    * set of containers.
    * @param {jQueryObject} [$containers=$(document)] - the container(s) to
    *     search for spans to be automatially transformed into clocks. By
    *     default the entire document is searched.
    * @throws {TypeError} An error is thrown if the first argument is present,
    *     but not a jQuery object.
    */
    ddr.WorldClock.autoInitialise = function($containers){
        // default the container if none was passed
        if(typeof $containers === 'undefined'){
            $containers = $(document);
        }

        // make sure we have a jQuery object to search within
        if(!isjQuery($containers)){
            throw new TypeError('the first argument must be a jQuery object');
        }

        // search the container(s) and initialise each clock found
        $('span.ddr-worldclock-auto', $containers).each(function(){
            var $span = $(this);

            // initialise the clock
            new ddr.WorldClock($span);

            // remove the auto class to avoid re-initialisation
            $span.removeClass('ddr-worldclock-auto');
        });
    };

    // add an event handler to automatically initialise clocks when the document
    // becomes ready
    $(function(){ ddr.WorldClock.autoInitialise(); });
})(ddr, jQuery);
