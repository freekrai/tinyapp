var $ = require('jquery-browserify'),
  EventEmitter2 = require('eventemitter2').EventEmitter2,
  underscore = require('underscore'),
  bb = require('backbone-browserify'),

  extend = underscore.extend,
  events = new EventEmitter2(),
  deferred = function deferred() {
    return new $.Deferred();
  },
  resolved = deferred().resolve().promise(),
  rejected = deferred().reject().promise(),
  when = $.when,

  renderReady = deferred(),
  loadReady = deferred(),

  setModule = function setModule(cursor, location, value) {
    var tree = location.split('.'),
      key = tree.shift();

    while (tree.length) {
      if (cursor[key] !== undefined) {
        cursor = cursor[key];
      } else {
        cursor = cursor[key] = {};
      }
      key = tree.shift();
    }

    if (cursor[key] === undefined) {
      cursor[key] = value;
      returnValue = true;
    } else {
      returnValue = false;
    }
    return returnValue;
  },  

  trigger = function trigger() {
    var args = [].slice.call(arguments);
    events.emit.apply(events, arguments);
  },

  on = function on() {
    var args = [].slice.call(arguments),
      type = args[0],
      sourceId = args[1],
      callback = args[2],
      context = args[3] || null;

    if (args.length <= 2) {
      events.on.apply(events, arguments);
    } else {
      events.on.call(events, type, function (event) {
        if (event.sourceId === sourceId) {
          callback.call(context, event);
        }
      });
    }
  },

  off = function off() {
    var args = [].slice.call(arguments);
    events.off.apply(events, arguments);    
  },

  app = {},
  api,

  init = function init(options) {
    if (options.environment) {
      app.environment = options.environment;
    }

    if (options.beforeRender) {
      whenRenderReady = options.beforeRender;
    }

    // will pass global load and render blockers
    // in here eventually.. for now, just resolve.
    loadReady.resolve();
  },

  register = function register(ns, api) {
    var newModule = setModule(this, ns, api);

    return (newModule) ? new Error('Module exists: ', ns): this;
  };

api = extend(app, {
  '$': $,
  get: $.get,
  ajax: $.ajax,
  init: init,
  deferred: deferred,
  register: register,
  events: events,
  trigger: trigger,
  on: on,
  off: off,
  resolved: resolved,
  rejected: rejected,
  when: when,
  renderReady: function (cb) {
    renderReady.done.call(renderReady, cb);
  },
  loadReady: function (cb) {
    loadReady.done.call(renderReady, cb);
  }
});

// Emit render_ready event when renderReady resolves.
renderReady.done(function () {
  app.trigger('render_ready');
});

$(document).ready(function () {
  // TODO: change this to pageReady when beforeRender
  // support is added.
  renderReady.resolve();
});

if (typeof window !== 'undefined') {
  window.tinyapp = api;
}

module.exports = api;
