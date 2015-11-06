# Fangular

Fangular implements a subset of [AngularJS](https://angularjs.org/) dependency injection and module loading system. It's a lightweight alternative to using the entire Angular library or using other DI libraries such as [Bearcat](https://github.com/bearcatjs/bearcat).

### Notes
  - Can be used in NodeJS / Cocos2d-js and other situations when there is no DOM available
  - Allows DRY auto-magic depdency injection using JavaScript magic
  - It doesn't require any dependencies on AngularJS

### Example
```js
 var app = fangular.module('app', []);
 
 app.run(function(DependencyC) {
    // DependencyC will be auto-magically injected
 });
 app.factory('DependencyA', function() {
   // Create and return DependencyA
 });
 app.factory('DependencyB', function() {
   // Create and return DependencyB
 });
 app.factory('DependencyC', function(DependencyA, DependencyB) {
   // DependencyA and DependencyB are both available!
   // Create and return DependencyC
 });

 fangular.start();
```

### Version
0.1.0


### Todos

 - Tests!
 - Implement all of angular's service providers
   - service()
   - provider()
   - config()
   - etc...
 - Add circular dependency detection and provide better logging

License
----

MIT
