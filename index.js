const R = require('ramda')
const {rnorm} = require('randgen')
const DEFAULTS = {
  QUANTITY:   {VALUE: 100, MIN: 0, MAX: 2000},
  MIN:        {VALUE: 0, MIN: 0, MAX: 499},
  MAX:        {VALUE: 100, MIN: 1, MAX: 500},
  INTERCEPT:  {VALUE: 1, MIN: 0, MAX: 2}
}
const version = require('./package.json').version;

/**
 *
 * @param _val    Value to transform
 * @param def     Default value if _val is undefined
 * @param min     Minimum value allowed (inclusive)
 * @param max     Maximum value allowed (inclusive)
 * @returns {*}   {error: true, msg (str): 'error message'} or
 *                {error: false, val (int): value}
 */
const validate = (_val, def, min, max) => {
  if (_val === undefined) return {error: false, val: def};
  if (_val.match(/[^0-9]+/) !== null) return {error: true, msg: 'Illegal characters'};
  if (isNaN(_val)) return {error: true, msg: 'Not a number'};
  let val = parseInt(_val);
  if (val < min) return {error: true, msg: 'Too small'};
  if (val > max) return {error: true, msg: 'Too big'};
  return {error: false, val: val};
}

/**
 * Random number transformation function
 * input is assumed to be a uniformly distributed random number between
 * 0 and 1.  intercept is a parameter between 0 and 2 that changes the uniform distribution
 * into a skewed "triangle" distribution by shifting the left and right ends
 * of the uniform distribution up and down.  When intercept < 1 the distribution is skewed
 * left and when intercept > 1 the distribution is skewed right.
 *
 * See Fathom file RNGTranform.ftm for a demonstration of the transformation
 * This file is in the GCloud resources project, resource.mrjaffesclass.com bucket
 * and is accessible by going to
 * https://storage.googleapis.com/resources.mrjaffesclass.com/rng/RNGTransform.ftm
 * @param intercept
 * @param input
 * @returns {number}
 */
const transform = intercept => {
  return input => (intercept === 1) ?
    input :
    ((-intercept + Math.sqrt((intercept*intercept) + (4*input) - (4*input*intercept))) / (2*(1-intercept)));
}
/**
 * HTTP Cloud Function.
 * Random number generator with several defined transformation functions.
 * This is used for APCSP, AP Statistics, and CS3-4
 * Deployed to resources project in rogerjaffe@mrjaffesclass.com account
 *
 * Use https://us-central1-resources-193616.cloudfunctions.net/rng?qty=200&min=0&max=500&intercept=0.2
 * for example
 *
 * qty: Number of numbers requested
 * min: Minimum value (inclusive)
 * max: Maximum value (inclusive)
 * int: Intercept parameter used for transform function
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
const rng = (req, res) => {
  if (req.query.version) {
    res.send('Version: '+version)
  } else {
    let qty = validate(req.query.qty, DEFAULTS.QUANTITY.VALUE, DEFAULTS.QUANTITY.MIN, DEFAULTS.QUANTITY.MAX);
    let min = validate(req.query.min, DEFAULTS.MIN.VALUE, DEFAULTS.MIN.MIN, DEFAULTS.MIN.MAX);
    let max = validate(req.query.max, DEFAULTS.MAX.VALUE, DEFAULTS.MAX.MIN, DEFAULTS.MAX.MAX);
    let intError = false;

    if (qty.error) res.send('Qty: ' + qty.msg)
    if (min.error) res.send('Min: ' + min.msg)
    if (max.error) res.send('Max: ' + max.msg)
    let intercept = (req.query.intercept === undefined) ? DEFAULTS.INTERCEPT.VALUE : parseFloat(req.query.intercept)
    if (isNaN(intercept)) {
      res.send('Int: NaN');
      intError = true;
    }
    if (intercept < DEFAULTS.INTERCEPT.MIN) {
      res.send('INT: Too small')
      intError = true;
    }
    if (intercept > DEFAULTS.INTERCEPT.MAX) {
      res.send('INT: Too big')
      intError = true;
    }

    if (qty.error || min.error || max.error || intError) {
      // Error -- stop here
    } else {
      const transformFcn = transform(intercept);
      let arr = R.map(item => Math.random(), R.range(0, qty.val));
      arr = R.map(item => transformFcn(item), arr);
      arr = R.map(item => item * (max.val - min.val) + min.val, arr);
      arr = R.map(item => parseInt(item), arr)
      let csv = 'value\n'+R.join('\n', arr);
      res.append('Content-Type', 'text/csv');
      res.send(csv);
    }
  }
};

/**
 * HTTP Cloud Function.
 * Normal distribution random number generator.
 * This is used for APCSP, AP Statistics, and CS3-4
 * Deployed to resources project in rogerjaffe@mrjaffesclass.com account
 *
 * Use https://us-central1-resources-193616.cloudfunctions.net/rngN
 * for example
 *
 * qty: Number of numbers requested
 * m:   Mean
 * s:   Standard deviation
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
const rngN = (req, res) => {
  if (req.query.version) {
    res.send('Version: '+version)
  } else {
    mean = (req.query.m) ? parseFloat(req.query.m) : 0.0;
    sd = (req.query.s) ? parseFloat(req.query.s) : 1.0;
    qty = (req.query.qty) ? parseInt(req.query.qty) : 100;

    if (isNaN(mean) || isNaN(sd) || isNaN(qty)) {
      res.send("Invalid parameters")
    } else {
      let arr = R.map(item => rnorm(mean, sd), R.range(0, qty));
      let csv = 'value\n'+R.join('\n', arr);
      res.append('Content-Type', 'text/text');
      res.send(csv);
    }
  }
};

const req = {
  query: {
    qty: '100',
    m: '12.0',
    s: '3.0',
  }
}
const res = {
  append: header => console.log(header),
  send: csv => console.log(csv)
}
rngN(req, res)

exports.rng = rng
exports.rngN = rngN