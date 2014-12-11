// Generated by CoffeeScript 1.8.0
(function() {
  var Ghost, Nar, ServerWorker, Worker,
    __slice = [].slice;

  Nar = this.Nar || this.Ikagaka.Nar || require("ikagaka.nar.js");

  Worker = this.Worker;

  ServerWorker = (function() {
    function ServerWorker(fn, args, imports) {
      if (imports == null) {
        imports = [];
      }
      this.url = URL.createObjectURL(new Blob([
        imports.map(function(src) {
          return "importScripts('" + src + "');\n";
        }).join("") + "\n", "(" + ServerWorker.Server + ")();\n", "(" + fn + ")(" + (args.map(JSON.stringify).join(",")) + ");"
      ], {
        type: "text/javascript"
      }));
      this.worker = new Worker(this.url);
      this.worker.addEventListener("error", function(ev) {
        var _ref;
        return console.error(((_ref = ev.error) != null ? _ref.stack : void 0) || ev.error || ev);
      });
      this.worker.addEventListener("message", (function(_this) {
        return function(_arg) {
          var args, id, _ref;
          _ref = _arg.data, id = _ref[0], args = _ref[1];
          _this.callbacks[id].apply(null, args);
          return delete _this.callbacks[id];
        };
      })(this));
      this.requestId = 0;
      this.callbacks = {};
    }

    ServerWorker.prototype.request = function() {
      var callback, data, event, id, transferable, _arg, _i;
      event = arguments[0], _arg = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      data = _arg[0], transferable = _arg[1];
      id = this.requestId++;
      this.callbacks[id] = callback;
      return this.worker.postMessage([id, event, data], transferable);
    };

    ServerWorker.prototype.terminate = function() {
      this.worker.terminate();
      return URL.revokeObjectURL(this.url);
    };

    ServerWorker.Server = function() {
      return (function() {
        var handlers;
        handlers = {};
        self.addEventListener("message", function(_arg) {
          var data, event, id, _ref;
          _ref = _arg.data, id = _ref[0], event = _ref[1], data = _ref[2];
          handlers[event](data, function() {
            return self.postMessage([id, [].slice.call(arguments)]);
          });
        });
        return self.on = function(event, callback) {
          handlers[event] = callback;
        };
      })();
    };

    return ServerWorker;

  })();

  Ghost = (function() {
    function Ghost(directory) {
      var buffer, descriptTxt;
      if (!directory["descript.txt"]) {
        throw new Error("descript.txt not found");
      }
      this.directory = directory;
      buffer = this.directory["descript.txt"];
      descriptTxt = Nar.convert(buffer);
      this.descript = Nar.parseDescript(descriptTxt);
      this.server = null;
    }

    Ghost.prototype.load = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var args, buffers, directory, fn, imports, keys, shiori, _ref, _ref1;
          if (!_this.directory[_this.descript["shiori"]] && !_this.directory["shiori.dll"]) {
            return reject("shiori not found");
          }
          keys = Object.keys(Ghost.shiories);
          shiori = keys.find(function(shiori) {
            return Ghost.shiories[shiori].detect(_this.directory);
          });
          if (!shiori) {
            return reject("unkown shiori");
          }
          if (Ghost.shiories[shiori].worker == null) {
            return reject("unsupport shiori");
          }
          _ref = Ghost.shiories[shiori].worker, fn = _ref[0], args = _ref[1];
          imports = (Ghost.shiories[shiori].imports || []).map(function(src) {
            return _this.path + src;
          });
          _this.server = new ServerWorker(fn, args, imports);
          _ref1 = Ghost.createTransferable(_this.directory), directory = _ref1[0], buffers = _ref1[1];
          _this.server.request("load", directory, buffers, function(err, code) {
            if (err != null) {
              return reject(err);
            } else {
              return resolve(code);
            }
          });
          return _this.directory = null;
        };
      })(this));
    };

    Ghost.prototype.request = function(request) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          if (_this.logging) {
            console.log(request);
          }
          return _this.server.request("request", request, function(err, response) {
            if (err != null) {
              return reject(err);
            } else {
              if (_this.logging) {
                console.log(response);
              }
              return resolve(response);
            }
          });
        };
      })(this));
    };

    Ghost.prototype.unload = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.server.request("unload", function(err, code) {
            if (err != null) {
              return reject(err);
            } else {
              return resolve(code);
            }
          });
        };
      })(this));
    };

    Ghost.prototype.path = location.protocol + "//" + location.host + location.pathname.split("/").reverse().slice(1).reverse().join("/") + "/";

    Ghost.prototype.logging = false;

    Ghost.nativeShioriWorkerScript = function(CONSTRUCTOR_NAME) {
      var prepareSatori, shiori, shiorihandler;
      shiori = new self[CONSTRUCTOR_NAME]();
      shiori.Module.logReadFiles = true;
      shiorihandler = null;
      self.on("load", function(dirs, reply) {
        var code, error;
        if (CONSTRUCTOR_NAME === "Satori") {
          dirs = prepareSatori(dirs);
        }
        shiorihandler = new NativeShiori(shiori, dirs, true);
        try {
          code = shiorihandler.load('/home/web_user/');
        } catch (_error) {
          error = _error;
        }
        return reply(error, code);
      });
      self.on("request", function(request, reply) {
        var error, response;
        try {
          response = shiorihandler.request(request);
        } catch (_error) {
          error = _error;
        }
        return reply(error, response);
      });
      self.on("unload", function(_, reply) {
        var code, error;
        try {
          code = shiorihandler.unload();
        } catch (_error) {
          error = _error;
        }
        return reply(error, code);
      });
      return prepareSatori = function(data) {
        var filepath, filestr, uint8arr;
        for (filepath in data) {
          if (/\bsatori_conf\.txt$/.test(filepath)) {
            uint8arr = new Uint8Array(data[filepath]);
            filestr = Encoding.codeToString(Encoding.convert(uint8arr, 'UNICODE', 'SJIS'));
            if (/＠SAORI/.test(filestr)) {
              filestr = filestr.replace(/＠SAORI/, '＠NO__SAORI');
              data[filepath] = new Uint8Array(Encoding.convert(Encoding.stringToCode(filestr), 'SJIS', 'UNICODE'));
            }
            break;
          }
        }
        return data;
      };
    };

    Ghost.shiories = {
      kawari: {
        detect: function(dir) {
          return !!dir["kawarirc.kis"];
        },
        imports: ["encoding.min.js", "nativeshiori.js", "kawari.js"],
        worker: [Ghost.nativeShioriWorkerScript, ["Kawari"]]
      },
      kawari7: {
        detect: function(dir) {
          return !!dir["kawari.ini"];
        },
        imports: ["encoding.min.js", "nativeshiori.js", "kawari7.js"],
        worker: [Ghost.nativeShioriWorkerScript, ["Kawari7"]]
      },
      satori: {
        detect: function(dir) {
          return !!dir["satori.dll"];
        },
        imports: ["encoding.min.js", "nativeshiori.js", "libsatori.js"],
        worker: [Ghost.nativeShioriWorkerScript, ["Satori"]]
      },
      yaya: {
        detect: function(dir) {
          return !!dir["yaya.dll"];
        },
        imports: ["encoding.min.js", "nativeshiori.js", "yaya.js"],
        worker: [Ghost.nativeShioriWorkerScript, ["YAYA"]]
      },
      aya5: {
        detect: function(dir) {
          return !!dir["aya5.dll"];
        },
        imports: ["encoding.min.js", "nativeshiori.js", "aya5.js"],
        worker: [Ghost.nativeShioriWorkerScript, ["AYA5"]]
      },
      aya: {
        detect: function(dir) {
          return !!dir["aya.dll"];
        }
      },
      miyojs: {
        detect: function(dir) {
          return !!dir["node.exe"];
        }
      },
      misaka: {
        detect: function(dir) {
          return !!dir["misaka.dll"];
        }
      }
    };

    Ghost.createTransferable = function(dic) {
      var hits, keys;
      keys = Object.keys(dic);
      hits = keys.filter(function(filepath) {
        return !!filepath;
      });
      return hits.reduce((function(_arg, key) {
        var buffer, buffers, _dic;
        _dic = _arg[0], buffers = _arg[1];
        buffer = dic[key];
        _dic[key] = buffer;
        buffers.push(buffer);
        return [_dic, buffers];
      }), [{}, []]);
    };

    Ghost.ServerWorker = ServerWorker;

    return Ghost;

  })();

  if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
    module.exports = Ghost;
  } else if (this.Ikagaka != null) {
    this.Ikagaka.Ghost = Ghost;
  } else {
    this.Ghost = Ghost;
  }

}).call(this);
