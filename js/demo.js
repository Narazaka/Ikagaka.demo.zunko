// Generated by CoffeeScript 1.8.0
(function() {
  var Console, Nanika, NanikaStorage, NarLoader, Promise,
    __slice = [].slice;

  Promise = this.Promise;

  if (this.Ikagaka != null) {
    NarLoader = this.Ikagaka.NarLoader || this.NarLoader;
    Nanika = this.Ikagaka.Nanika || this.Nanika;
    NanikaStorage = this.Ikagaka.NanikaStorage || this.Nanika;
  } else {
    NarLoader = this.NarLoader;
    Nanika = this.Nanika;
    NanikaStorage = this.NanikaStorage;
  }

  Console = (function() {
    function Console(dom) {
      this.window = $('<div />').addClass('ConsoleWindow');
      this.console = $('<div />').addClass('Console');
      this.console.appendTo(this.window);
      this.window.appendTo(dom);
      this.window.hide();
      this.has_error = false;
    }

    Console.prototype.finish = function() {
      this.window.scrollTop(9999999);
      clearTimeout(this.hidetimer);
      if (!this.has_error) {
        return this.hidetimer = setTimeout((function(_this) {
          return function() {
            return _this.window.hide();
          };
        })(this), 3000);
      }
    };

    Console.prototype.log = function(message) {
      var text;
      this.window.show();
      text = $('<span />').addClass('log').html((message + "\n").replace(/\r\n|[\r\n]/g, '<br>'));
      this.console.append(text);
      return this.finish();
    };

    Console.prototype.warn = function(message) {
      var text;
      this.window.show();
      text = $('<span />').addClass('warn').html((message + "\n").replace(/\r\n|[\r\n]/g, '<br>'));
      this.console.append(text);
      this.has_error = true;
      return this.finish();
    };

    Console.prototype.error = function(message) {
      var text;
      this.window.show();
      text = $('<span />').addClass('error').html((message + "\n").replace(/\r\n|[\r\n]/g, '<br>'));
      this.console.append(text);
      this.has_error = true;
      return this.finish();
    };

    return Console;

  })();

  $(function() {
    var balloon_nar, con, error, ghost_nar, log, namedmanager, nanikamanager, nanikas_update, profile, storage, warn;
    con = new Console("body");
    log = console.log;
    warn = console.warn;
    error = console.error;
    console.log = (function(_this) {
      return function() {
        var args, t;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        log.apply(console, args);
        t = args.join('');
        if (!/SHIORI\/\d\.\d|^\[object Object\]$/.test(t)) {
          return con.log(t);
        }
      };
    })(this);
    console.warn = (function(_this) {
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        warn.apply(console, args);
        return con.warn(args.join(''));
      };
    })(this);
    console.error = (function(_this) {
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        error.apply(console, args);
        return con.error(args.join(''));
      };
    })(this);
    $("#nardrop").on('dragenter', (function(_this) {
      return function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
        return false;
      };
    })(this));
    $("#nardrop").on('dragover', (function(_this) {
      return function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
        return false;
      };
    })(this));
    $("#nardrop").on('drop', (function(_this) {
      return function(ev) {
        var file, _i, _len, _ref, _results;
        ev.stopPropagation();
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
        _ref = ev.dataTransfer.files;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          _results.push(load_nar(file));
        }
        return _results;
      };
    })(this));
    $("#nar").change((function(_this) {
      return function(ev) {
        var file, _i, _len, _ref, _results;
        _ref = ev.target.files;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          _results.push(load_nar(file));
        }
        return _results;
      };
    })(this));
    nanikas_update = function() {
      var dirpath, nanika, nanikas_dom, _ref, _results;
      nanikas_dom = $('.nanikas').html('');
      if (Object.keys(nanikamanager.nanikas).length) {
        _ref = nanikamanager.nanikas;
        _results = [];
        for (dirpath in _ref) {
          nanika = _ref[dirpath];
          _results.push(nanikas_dom.append($('<div />').text(nanika.ghost.descript.name + " を終了する").on('click', (function(nanika) {
            return function() {
              return nanika.send_halt('close', {
                reason: 'user'
              });
            };
          })(nanika))));
        }
        return _results;
      } else {
        return $('.nanikas').html('おそまつさまでした。');
      }
    };
    storage = new NanikaStorage();
    profile = new Profile.Baseware();
    profile.profile.balloonpath = 'origin';
    namedmanager = new NamedManager();
    $(namedmanager.element).appendTo("body");
    nanikamanager = new NanikaManager(storage, profile, namedmanager, {
      append_path: './vendor/js/',
      logging: true
    });
    nanikamanager.on('ghost.booted', nanikas_update);
    nanikamanager.on('ghost.halted', function() {
      console.log('halted');
      return nanikas_update();
    });
    ghost_nar = './vendor/nar/touhoku-zunko_or__.nar';
    balloon_nar = './vendor/nar/origin.nar';
    return Promise.all([
      (function() {
        console.log("load nar : " + balloon_nar);
        return NarLoader.loadFromURL(balloon_nar).then(function(nar) {
          console.log("nar loaded : " + balloon_nar);
          return storage.install_nar(nar);
        });
      })(), (function() {
        console.log("load nar : " + ghost_nar);
        return NarLoader.loadFromURL(ghost_nar).then(function(nar) {
          console.log("nar loaded : " + ghost_nar);
          return storage.install_nar(nar);
        });
      })()
    ]).then(function(nar) {
      nanikamanager.boot('touhoku-zunko_or__', 'boot', {
        halt: null
      });
      return $('.nanikas').html('起動中...');
    })["catch"](function(err) {
      console.error(err, err.stack);
      return alert(err);
    });
  });

}).call(this);
