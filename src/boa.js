/* global document:false, MutationObserver:false, window:false */
'use strict';

var Boa = {
  VERSION: '0.0.1',
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

Boa.init();
