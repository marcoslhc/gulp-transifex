// Generated by CoffeeScript 1.7.1
var assign, chalk, gutil, httpClient, path, sprintf, through;

gutil = require('gulp-util');
through = require('through2');
chalk = require('chalk');
path = require('path');
httpClient = require('http');
assign = require('object-assign');
sprintf = require('sprintf');

module.exports = {
  createClient: function(options) {
    var _paths, _this;
    
    options = assign(options, options || {});
    _paths = {
      host: options.host,
      base_path: options.base_path,
      get_or_create_resources: function(vars) {
        return sprintf(this.base_path + '%(project)s/resources/', vars);
      },
      update_resource: function(vars) {
        return sprintf(this.base_path + '%(project)s/resource/%(resource)s/content/', vars);
      }
    };
    
    _this = this;
    
    this.resources = function(callback) {
      var req, request_options;
      request_options = {
        host: _paths.host,
        port: '80',
        path: _paths.get_or_create_resources({
          project: options.project
        }),
        method: 'GET',
        auth: options.user + ':' + options.password
      };
      req = httpClient.request(request_options, function(res) {
        return res.on('data', function(data) {
          if (res.statusCode === 200) {
            callback(JSON.parse(data.toString('utf8')));
          } else {
            req.emit('error', new Error(res.statusCode + ": " + httpClient.STATUS_CODES[res.statusCode]));
          }
        });
      });
      
      req.on('error', function(err) {
        console.log(chalk.red(err));
      });
      
      return req.end();
    };
    
    this.pushResource = function(callback) {
      var stream;
      
      return stream = through.obj((function(file, enc, cb) {
        var data, msg, req, request_options;
      
        if (file.isNull() || file.isDirectory()) {
          stream.push(file);
          return cb();
        }
        
        if (file.isStream()) {
          stream.emit('error', new gutil.PluginError('gulp-transifex'), msg, {
            message: "Streams not supported"
          });
          stream.push(file);
          return cb();
        }
        
        if (file.isBuffer() && path.extname(file.path) === '.po') {
          data = {
            content: file.contents.toString('utf8')
          };
          data = JSON.stringify(data);
          request_options = {
            host: _paths.host,
            port: '80',
            path: _paths.update_resource({
              project: options.project,
              resource: path.basename(file.path, '.po') + 'po'
            }),
            method: 'PUT',
            auth: options.user + ':' + options.password,
            headers: {
              "Content-type": "application/json",
              "Content-length": data.length
            }
          };
          req = httpClient.request(request_options);
          
          gutil.log(chalk.white("updating: ") + chalk.magenta(path.basename(file.path)));
          
          msg = '';
          
          req.on('response', function(res) {
          
            if (parseInt(res.statusCode) === 200) {
              msg = chalk.green('✔ ') + chalk.blue('Upload successful');
            } else {
              if (parseInt(res.statusCode) === 404) {
                stream.pipe(_this.createNewResource());
              } else {
                msg = chalk.red('✘ ') + chalk.blue('Error: ' + httpClient.STATUS_CODES[res.statusCode]);
                
                stream.emit('error', new gutil.PluginError('gulp-transifex', msg, {
                  fileName: file.path
                }));
              }
            }
            gutil.log(msg);
            req.end();
            return cb();
          });
          req.on('error', function(err) {
            req.end();
            stream.emit('error', new gutil.PluginError('gulp-transifex', err, {
              fileName: file.path
            }));
            stream.push(file);
            return cb();
          });
          req.write(data);
          stream.push(file);
        }
      }), function(cb) {
        if (callback != null) {
          callback();
        }
        gutil.log(chalk.cyan.bold("Language files uploaded to transifex"));
        return cb();
      });
    };
    
    this.createNewResource = function(callback) {
      var stream;
    
      return stream = through.obj((function(file, enc, cb) {
        var data, req, request_options;
    
        if (file.isNull() || file.isDirectory()) {
          stream.push(file);
          return cb();
        }
        
        if (file.isStream()) {
          stream.emit('error', new gutil.PluginError('gulp-transifex', msg, {
            message: "Streams not supported"
          }));
          stream.push(file);
          return cb();
        }
        
        if (file.isBuffer() && path.extname(file.path) === '.po') {
          data = {
            content: file.contents.toString('utf8'),
            name: path.basename(file.path),
            slug: path.basename(file.path, '.po') + 'po',
            i18n_type: 'PO'
          };
          data = JSON.stringify(data);
          request_options = {
            host: _paths.host,
            port: '80',
            path: _paths.get_or_create_resources({
              project: options.project
            }),
            method: 'POST',
            auth: options.user + ':' + options.password,
            headers: {
              "Content-type": "application/json",
              "Content-length": data.length
            }
          };
          req = httpClient.request(request_options);
          
          req.on('response', function(res) {
            var msg;
            if (parseInt(res.statusCode) === 201) {
              msg = chalk.green('✔ ') + chalk.blue('Upload successful');
            } else {
              msg = chalk.red('✘ ') + chalk.blue('Error: ' + httpClient.STATUS_CODES[res.statusCode]);
              
              stream.emit('error', new gutil.PluginError('gulp-transifex', msg, {
                fileName: file.path
              }));
            }
            gutil.log(msg);
            req.end();
            return cb();
          });
          
          req.on('error', function(err) {
            req.end();
            _this.emit('error', new gutil.pluginError('gulp-transifex', err, {
              fileName: file.path
            }));
            stream.push(file);
            return cb();
          });
          
          req.write(data);
          stream.push(file);
        }
      }), function(cb) {
        if (callback != null) {
          callback();
        }
        gutil.log(chalk.cyan.bold("Language files created in transifex"));
        return cb();
      });
    };
    return _this;
  }
};
