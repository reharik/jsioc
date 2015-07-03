/**
 * Created by rharik on 6/30/15.
 */

var path = require('path');
var invariant = require('invariant');
var Dependency = require('./Dependency');
var appRoot = path.resolve('./');
var _ = require('lodash');

module.exports = class Graph{
    constructor(){
        this._items = [];
    }

    addItem(dependency){
        invariant(dependency,'You must provide a dependency to add');
        _.remove(this._items, x=>x.name == dependency.name);
        this._items.push(dependency);
    }

    _findItem(dependencyName){
        invariant(dependencyName, 'You must provide a dependency name to find');
        for(let i of this._items){
            if(i.name === dependencyName){
                return i;
            }
        }
    }

    findRequiredDependency(caller, dependency) {
        var item = this._findItem(dependency);
        if(item){ return item; }
        invariant(false, 'Module ' + caller + ' has a dependency that can not be resolved: ' + dependency);
    }

    findDependency(type){
        var item = this._findItem(type);
        if(item){ return item.resolvedInstance; }
    }

    mapItems(func){
        return _items.map(func);
    }

    buildGraph(pjson){
        invariant(pjson,'You must provide a json object to build graph from');
        if(pjson.dependencies){
            Object.keys(pjson.dependencies).forEach(x=> {
                this._items.push(new Dependency(x.replace(/-/g, ''), x));
            });
        }
        if(pjson.internalDependencies) {
            Object.keys(pjson.internalDependencies).forEach(x=> {
                this._items.push(new Dependency(x, path.join(appRoot + pjson.internalDependencies[x]), true));
            });
        }
    }

    items(){
        return this._items;
    }

};
