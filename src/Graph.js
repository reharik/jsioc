/**
 * Created by rharik on 6/30/15.
 */

var invariant = require('invariant');
var Dependency = require('./Dependency');
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
        try {
            var tryingRequire = require(dependencyName);
            if (tryingRequire) {
                return new Dependency({name:dependencyName,resolvedInstance: tryingRequire});
            }
        }catch(ex){
            //swallow, just a hail mary to resolve
        }
    }

    findRequiredDependency(dependencyName) {
        var item = this._findItem(dependencyName);
        if(item){ return item; }
    }

    findGroupedDependencies(caller, groupName) {
        var item = [];
        for(let i of this._items){
            if(i.groupName === groupName){
                item.push(i);
            }
        }
        if(item.length>0){ return item; }
        invariant(false, 'Module ' + caller + ' has a dependency that can not be resolved: ' + groupName);
    }

    findDependency(type){
        var item = this._findItem(type);
        if(item){ return item.resolvedInstance; }
    }

    mapItems(func){
        return this._items.map(func);
    }

    buildGraph(pjson){
        invariant(pjson,'You must provide a json object to build graph from');
        if(pjson.dependencies){
            Object.keys(pjson.dependencies).forEach(x=> {
                var name = this.normalizeName(x);
                this._items.push(new Dependency({name:name, path:x}));
            });
        }
        if(pjson.internalDependencies) {
            Object.keys(pjson.internalDependencies).forEach(x=> {
                var name = this.normalizeName(x);
                this._items.push(new Dependency({name:name, path:pjson.internalDependencies[x], internal:true}));
            });
        }
    }

    normalizeName(orig){
        var name = orig.replace(/-/g, '');
        name = name.replace(/\./g, '_');
        return name;
    }


    items(){
        return this._items;
    }

};
