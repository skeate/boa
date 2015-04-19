/* global document:false, MutationObserver:false, window:false */
'use strict';

var Boa = {
  VERSION: '0.2.0',
  _bindings: [],
  _properties: {},
  _sources: {},
  _style: null,

  init: function() {
    var _this = this;
    this._style = document.createElement('style');
    document.head.appendChild(this._style);
    document.addEventListener('DOMContentLoaded', function() {
      new MutationObserver(function(mutations) {
        mutations.forEach(_this._handleMutation.bind(_this));
      }).observe(document.body, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true,
        attributeFilter: ['class', 'style']
      });
    });
  },

  _handleMutation: function(mutation) {
    if (mutation.type === 'childList') {
      this._bindings.forEach(function(binding) {
        if (binding.source.listens) {
          binding._apply();
        }
      })
    }
    var changedEl = mutation.target;
    this._bindings.forEach(function(binding) {
      /* istanbul ignore else */
      if (Boa._matches(changedEl, binding.source.selector)) {
        binding._apply(binding, changedEl);
      }
    }.bind(this));
  },

  _matches: function(el, selector) {
    if (!el) {
      return false;
    }
    var matcherFunc = el.matches ||
    /* istanbul ignore next */ el.msMatchesSelector ||
    /* istanbul ignore next */ el.mozMatchesSelector ||
    /* istanbul ignore next */ el.webkitMatchesSelector;
    /* istanbul ignore if */
    if (!matcherFunc) {
      throw new Error('Boa is unsupported on this browser.');
    }
    return matcherFunc.call(el, selector);
  },

  /**
   * Finds all sources which could match a selector.
   * For example, say you have three sources:
   *  - #nav > li : color
   *  - ul li : color
   *  - .widget : color
   * Boa.findSources('li', 'color') will return the first two sources.
   *
   * @param {string} selector
   * @param {string} property
   */
  findSources: function(selector, property) {
    var sources = [];
    var key;
    for (key in Boa._sources) {
      var source = Boa._sources[key];
      if (source.property !== property) {
        continue;
      }
      if (Boa._matches(document.querySelector(source.selector), selector)) {
        sources.push(source);
      }
    }
    return sources;
  },

  setProperty: function(selector, property, value) {
    var pseudoSource = {
      value: function() {
        return value;
      }
    };
    new Boa.Binding(pseudoSource, selector, property);
  },

  source: function(selector, property) {
    var combined = selector + '.' + property;
    if (!this._sources.hasOwnProperty(combined)) {
      this._sources[combined] = new this.Source(selector, property);
    }
    return this._sources[combined];
  },

  defineProperty: function(property, listenToChildList, func) {
    if (arguments.length !== 3) {
      throw new Error('Incorrect number of arguments to defineProperty');
    }
    if (this._properties.hasOwnProperty(property)) {
      throw new Error('Property already exists');
    }
    this._properties[property] = {
      f: func,
      listen: listenToChildList
    };
  },

  defineTransform: function(name, func) {
    if (typeof name !== 'string') {
      throw new Error('name must be a string');
    }
    if (typeof func !== 'function') {
      throw new Error('func must be a function');
    }
    if (Boa.Source.prototype.hasOwnProperty(name)) {
      throw new Error('transform already exists');
    }
    Boa.Source.prototype[name] = function() {
      var transformedSource = new Boa.Source(this.selector, this.property);
      transformedSource._parentSource = this;
      transformedSource._transformArgs = arguments;
      transformedSource.value = function() {
        var parentValue = [this._parentSource.value()];
        var args = Array.prototype.concat.apply(
          parentValue,
          this._transformArgs
        );
        return func.apply(this, args);
      };
      return transformedSource;
    };
  }
};

Boa.Source = function(selector, property) {
  this._bindings = [];
  var pattern = /((\w+):)?([\w-]+)/i;
  var parsed = pattern.exec(property);
  if (parsed) {
    this._custom = parsed[2];
    this.property = parsed[3];
    var p = Boa._properties[this.property];
    if (p) {
      this.listens = Boa._properties[this.property].listen;
    }
  } else {
    throw new Error('unable to parse property');
  }
  this.selector = selector;
};
Boa.Source.prototype._applyAllBindings = function() {
  this._bindings.forEach(function(binding) {
    binding._apply();
  });
};
Boa.Source.prototype.bindTo = function(selector, property) {
  var binding = new Boa.Binding(this, selector, property);
  Boa._bindings.push(binding);
  this._bindings.push(binding);
  return binding;
};
Boa.Source.prototype.value = function() {
  var element = document.querySelector(this.selector);
  if (this._custom) {
    return Boa._properties[this.property].f(element);
  }
  return window.getComputedStyle(element).getPropertyValue(this.property);
};

Boa.Binding = function(source, selector, property) {
  this.source = source;
  this.selector = selector;
  this.property = property;
  this._apply();
};

Boa.Binding.prototype._apply = function() {
  var value = this.source.value();
  if (this.cssRule) {
    this.cssRule.style[this.property] = value;
  } else {
    var rule = this.selector + '{' + this.property + ':' + value + ';}';
    var sheet = Boa._style.sheet;
    var ruleIdx = sheet.insertRule(rule, sheet.cssRules.length);
    this.cssRule = sheet.cssRules[ruleIdx];
  }
  Boa.findSources(this.selector, this.property).forEach(function(source) {
    source._applyAllBindings();
  });
};

Boa.defineProperty('clientLeft', true, function(e) {
  return e.getBoundingClientRect().left + 'px';
});
Boa.defineProperty('clientTop', true, function(e) {
  return e.getBoundingClientRect().top + 'px';
});

var splitValueUnit = function(val) {
  var value = parseFloat(val, 10);
  var unit = val.replace(value.toString(), '');
  return {
    value: value,
    unit: unit
  };
};

var deunitify = function(f) {
  return function(v, a) {
    v = splitValueUnit(v);
    if (a instanceof Boa.Source) {
      a = splitValueUnit(a.value());
      // not sure if this is actually necessary, seems like it outputs
      // everything in pixels anyway
      //if (v.unit !== a.unit) {
        //throw new Error('Source units do not match: ' + v.unit + ', ' + a.unit);
      //}
      return f(v.value, a.value) + v.unit;
    }
    return f(v.value, a) + v.unit;
  };
};

var toHSL = function(c) {
  var r = c.r / 255;
  var g = c.g / 255;
  var b = c.b / 255;
  var xmax = Math.max(r, g, b);
  var xmin = Math.min(r, g, b);
  var l = (xmax + xmin) / 2;
  var s = (xmax === xmin) ? 0 :
          (l < 0.5 ? (xmax - xmin) / (xmax + xmin) :
          (xmax - xmin) / (2 - xmax - xmin));
  var h = (r === xmax) ? 0 + (g - b) / (xmax - xmin) :
          (g === xmax) ? 2 + (b - r) / (xmax - xmin) :
          (b === xmax) * 4 + (r - g) / (xmax - xmin) ;
  if (h < 0) { h = h + 6; }
  h *= 60; // convert to degrees
  return {h:h, s:s, l:l, a: c.a};
};

var toRGB = function(c) {
  if (c.s === 0) {
    var l = Math.floor(c.l * 255);
    return {r: l, g: l, b: l};
  }
  var temp2 = (c.l < 0.5) ? c.l * (1 + c.s) : (c.l + c.s - c.l * c.s);
  var temp1 = 2 * c.l - temp2;
  var h = c.h / 360;
  var temp3;
  function getColor(temp1, temp2, temp3) {
    return Math.floor(255 * (
      temp3 < 1 / 6 ? temp1 + (temp2 - temp1) * 6 * temp3 :
      temp3 < 1 / 2 ? temp2 :
      temp3 < 2 / 3 ? temp1 + (temp2 - temp1) * 6 * (2 / 3 - temp3) :
      temp1
    ));
  }
  temp3 = h + 1 / 3;
  if (temp3 > 1) { temp3--; }
  var r = getColor(temp1, temp2, temp3);
  var g = getColor(temp1, temp2, h);
  temp3 = h - 1 / 3;
  if (temp3 < 0) { temp3++; }
  var b = getColor(temp1, temp2, temp3);
  return {r:r, g:g, b:b, a:c.a};
};

var toRGBString = function(c) {
  return 'rgb' + ((c.a) ? 'a' : '') + '(' +
    c.r + ', ' +
    c.g + ', ' +
    c.b +
    (c.a ? ', ' + c.a : '') +
    ')';
};

var objectifyColor = function(f) {
  return function(v, a) {
    var tmp = /^rgba?\((\d+), (\d+), (\d+)(, (1|0|0.\d+))?\)$/.exec(v);
    var rgb = {
      r: tmp[1],
      g: tmp[2],
      b: tmp[3],
      a: tmp[5]
    };
    return f({
      rgb: rgb,
      hsl: toHSL(rgb)
    }, a);
  };
};

// math
Boa.defineTransform('plus', deunitify(function(v, a) {
  return v + a;
}));
Boa.defineTransform('minus', deunitify(function(v, a) {
  return v - a;
}));
Boa.defineTransform('times', deunitify(function(v, a) {
  return v * a;
}));
Boa.defineTransform('dividedBy', deunitify(function(v, a) {
  return v / a;
}));
Boa.defineTransform('mod', deunitify(function(v, a) {
  return v % a;
}));

// colors
Boa.defineTransform('lighten', objectifyColor(function(v, a) {
  var c = v.hsl;
  c.l = Math.min(1, c.l + a);
  return toRGBString(toRGB(c));
}));
Boa.defineTransform('darken', objectifyColor(function(v, a) {
  var c = v.hsl;
  c.l = Math.max(0, c.l - a);
  return toRGBString(toRGB(c));
}));
Boa.defineTransform('shiftHue', objectifyColor(function(v, a) {
  var c = v.hsl;
  c.h = (c.h + a) % 360;
  return toRGBString(toRGB(c));
}));

Boa.init();
