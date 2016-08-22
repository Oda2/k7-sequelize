'use strict';

// Load modules

const Hoek = require('hoek');
const Glob = require('glob');
const Path = require('path');
const Sequelize = require('sequelize');

const cwd = process.cwd();

let internals = {};

internals.defaults = {
  connectionString: null,
  connectionOptions: null,
  models: ['models/**.js']
};

module.exports = internals.K7Sequelize = function (options) {
  options = Hoek.applyToDefaults(internals.defaults, options);

  this.settings = options;
  this.db = {};
  this.db['Sequelize'] = Sequelize;
};

internals.K7Sequelize.prototype.load = function () {
  let sequelize;
  if (this.settings.connectionString) {
    sequelize = new Sequelize(this.settings.connectionString, this.settings.connectionOptions);
  } else {
    sequelize = new Sequelize(this.settings.connectionOptions.database,
                              this.settings.connectionOptions.username,
                              this.settings.connectionOptions.password,
                              this.settings.connectionOptions.options);
  }

  this.sequelize = sequelize;
  this.db = this.getModels();

  this.doAssociations();

  this.db['sequelize'] = sequelize;
  this.db['Sequelize'] = Sequelize;

  return this.db;
};

internals.K7Sequelize.prototype.getModels = function () {
  let files = this.settings.models.reduce((arr, model) => {
    return arr.concat(Glob.sync(model, { nodir: true }));
  }, []);

  return files.reduce((db, model) => {
    try {
      let modelPath = Path.isAbsolute(model) ? model : Path.join(cwd, model);
      let m = this.sequelize.import(modelPath);
      db[m.name] = m;
      return db;
    } catch (err) {
      console.log(err);
    }
  }, {});
};

internals.K7Sequelize.prototype.doAssociations = function () {
  Object.keys(this.db).forEach((model) => {
    if ('associate' in this.db[model]) {
      this.db[model].associate(this.db);
    }
  });
};

internals.K7Sequelize.attributes = {
  pkg: require('../package.json')
};
