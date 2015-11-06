/**
 * Fangular – A (fake) angular module loader.
 *
 * Simulates a subset of AngularJS' module loading system allowing easy
 * dependency-injection for headless browsers (nodeJS).
 *
 * Currently only module.factory() and module.run() are supported.
 *
 *
 * Example:
 *
 var app = fangular.module('app', []);

 app.run(function(ResourceUtil) {
    // ResourceUtil will be auto-magically injected
 });

 app.factory('ResourceUtil', function() {
   // Create and return the ResourceUtil singleton
 });

 fangular.start();
 */

(function(context) {
    function Module(name, deps, sharedComponents) {
        var modules = this.modules = {};

        this.name = name;
        this.deps = deps || [];
        _.each(this.deps, function(name) {
            modules[name] = null;
        });

        // Store types of components
        this.fns = {
            run: [],
            factory: []
        };

        this.comps = sharedComponents;

        this.ready = (this.deps.length === 0);
        this.started = false;
    }

    Module.prototype.start = function() {
        var self = this;
        this.started = true;

        _.each(this.fns.run, function(componentFactory) {
            self.startComponent(componentFactory);
        });
    };

    Module.prototype.startComponent = function(componentFactory) {
        if (componentFactory.result) return componentFactory.result;
        var self = this;

        var compDependencies = _.map(componentFactory.deps, function(compName) {
            var compDepDef = self.comps[compName];
            if (!compDepDef) return console.error("[FAnglar] Unknown dependency '" + compName +
                "' in module '" + self.name + "'");
            return self.startComponent(compDepDef);
        });

        var result = componentFactory.fn.apply(componentFactory, compDependencies);
        return componentFactory.result = result;
    };

    // --------- Component type definitions ---------

    Module.prototype.run = function(runFn) {
        this.analyzeDependencies('anonymous', runFn, 'run');
    };

    Module.prototype.factory = function(compName, componentFactory) {
        this.analyzeDependencies(compName, componentFactory, 'factory');
    };

    /*
     TODO: Support services in the future:
     Module.prototype.service = function(compName, componentFactory) {};
     */

    Module.prototype.analyzeDependencies = function(name, componentFactory, type) {
        // If it's a function, parse out the dependencies
        if (_.isFunction(componentFactory)) {
            this.analyzeDependenciesAsFn(name, componentFactory, type);
        } else {
            this.analyzeDependenciesAsArray(name, componentFactory, type);
        }
    };

    Module.prototype.analyzeDependenciesAsFn = function(name, compDefFn, type) {
        var deps = this.getArgumentNames(compDefFn);
        this.defineComp(name, deps, compDefFn, type);
    };

    Module.prototype.analyzeDependenciesAsArray = function(name, compDefArray, type) {
        var compFn = _.last(compDefArray);
        var deps = _.dropRight(compDefArray);
        this.defineComp(name, deps, compFn, type);
    };

    Module.prototype.getArgumentNames = function(compDefFn) {
        var fnAsStr = compDefFn.toString();
        var depsStr = /function \(([\w,\s]*)\)/.exec(fnAsStr)[1];
        var deps = [];
        if (depsStr.length > 0) deps = depsStr.split(', ');
        return deps;
    };

    Module.prototype.defineComp = function(name, deps, compFn, type) {
        var componentFactory = {
            name: name,
            fn: compFn,
            deps: deps
        };
        this.fns[type].push(componentFactory);
        this.comps[name] = componentFactory;
    };


    // Simulate "$injector" as a component that is always available
    function createInjector(fangular) {
        return {
            name: '$injector',
            fn: function() {
                return {
                    get: function(compName) {
                        return fangular.sharedComponents[compName].result;
                    }
                };
            },
            deps: []
        };
    }

    // --------- fangular API ---------

    var fangular = {
        lazyInit: function() {
            if (this.initialized) return;
            this.sharedComponents = {
                $injector: createInjector(this)
            };
            this.modules = {};
            this.initialized = true;
        },

        module: function(name, deps) {
            var self = this;
            this.lazyInit();

            var module = new Module(name, deps, this.sharedComponents);
            this.modules[name] = module;

            _.each(this.modules, function(module, moduleName) {
                self.updateDependencies(moduleName);
            });
            return module;
        },

        updateDependencies: function(moduleName) {
            var self = this;
            var module = this.modules[moduleName];
            _.each(module.modules, function(value, depName) {
                module.modules[depName] = self.modules[depName];
            });
        },

        start: function() {
            var self = this;
            var autoFns = {};
            if (this.started) return;
            _.each(this.modules, function(moduleDef, name) {
                var autoFn;
                var startFn = function(callback) {
                    moduleDef.start();
                    callback();
                };
                if (moduleDef.deps.length === 0) {
                    autoFn = startFn;
                } else {
                    autoFn = _.flatten([moduleDef.deps, startFn]);
                }
                autoFns[name] = autoFn;
            });

            async.auto(autoFns, function() {
                // console.log('FAngular bootstrap complete!');
                self.started = true;
            });
        }
    };

    context.fangular = fangular;
})(window);
