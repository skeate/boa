(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Boa = factory();
  }
}(this, function() {
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

  defineProperty: function(property, func) {
    if (arguments.length !== 2) {
      throw new Error('Incorrect number of arguments to defineProperty');
    }
    if (this._properties.hasOwnProperty(property)) {
      throw new Error('Property already exists');
    }
    this._properties[property] = func;
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
    return Boa._properties[this.property](element);
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

Boa.defineProperty('clientLeft', function(e) {
  return e.getBoundingClientRect().left;
});
Boa.defineProperty('clientTop', function(e) {
  return e.getBoundingClientRect().top;
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

Boa.init();

return Boa;
}));
