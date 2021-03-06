/**
 * Created by reharik on 7/3/15.
 */

var demand = require('must');
var Container = require('../src/Container');
var path = require('path');
var RegistryDSL = require('../src/RegistryDSL');
var Graph = require('../src/Graph');
var logger = require('../src/yowlWrapper');

describe('Dependency Tester', function() {
    var Mut;

    before(function () {
        var appRoot = require('../src/appRoot');
        appRoot.path = path.resolve('./');
        Mut = require('../src/Dependency');

    });

    beforeEach(function () {
    });

    describe('#testing instantiation', function () {
        context('when calling new dependency with out a name', function () {
            it('should throw proper error', function () {
                (function () {
                    new Mut().must.throw(Error, 'Invariant Violation: Dependency must have a valid name');
                })
            });
        });

        context('when calling new dependency with out a path', function () {
            it('should throw proper error', function () {
                (function () {
                    new Mut('uuid').must.throw(Error, 'Invariant Violation: uuid must have a valid path: uuid');
                })
            });
        });

        context('when calling new dependency with internal set to true', function () {
            it('should set interal to true', function () {
                    var mut = new Mut({name:'TestClass', path:'/tests/TestModules/TestClass', internal:true});
                mut.internal.must.be.true();
            });
        });

        context('when calling new dependency with internal not set', function () {
            it('should set interal to false', function () {
                var mut = new Mut({name:'uuid', path:'uuid'});
                mut.internal.must.be.false();
            });
        });

        context('when calling new external dependency', function () {
            it('should wrap required resource in empty function', function () {
                var mut = new Mut({name:'uuid', path:'uuid'});
                mut.wrappedInstance.toString().must.startWith('function () {');
            });
        });

        // the has dependencies requirement is because if it has no dependencies it will look just like internal = false;
        context('when calling new internal dependency that has dependencies', function () {
            it('should not wrap required resource in empty function', function () {
                var mut = new Mut({name:'TestClass', path:'/tests/TestModules/TestClass',internal:true});
                mut.wrappedInstance.toString().must.not.startWith('function () {');
            });
        });
    });

    describe('#testing resolveInstance', function () {
        // this test is legit because if it does not return right away, and it tries to
        // instantiate '123' it will throw since it's not a fuction.
        context('when calling resolveInstance with resolvedInstance', function () {
            it('should return', function () {
                var mut = new Mut({name:'TestClass', path:'/tests/TestModules/TestClass', internal:true});
                mut.resolvedInstance = '123';
                (function(){mut.resolveInstance(new Graph({}))}).must.not.throw(Error);
            });
        });

        // htis might be brittle because it depends on the internal structure of uuid
        context('when calling resolveInstance on external dep', function () {
            it('should show that the internal code is actually the expected dependency not some wrapped piece of shit', function () {
                var mut = new Mut({name:'uuid', path:'uuid'});
                var graph = new Graph();
                graph.buildGraph(require(path.join(path.resolve('./') + '/package.json')));
                mut.resolveInstance(graph);
                mut.resolvedInstance.must.startWith('function v4(')
            });
        });


        context('when calling resolveInstance item with no dependencies', function () {
            it('should set resolved instance', function () {
                var mut = new Mut({name:'logger', path:'/src/logger', internal:true});
                var graph = new Graph();
                graph.buildGraph(require(path.join(path.resolve('./') + '/package.json')));
                mut.resolveInstance(graph);
                mut.resolvedInstance.must.be.object();
            });
        });

        context('when calling resolveInstance item with dependencies', function () {
            it('should set resolved instance', function () {
                var uuid = new Mut({name:'uuid', path:'uuid'});
                var mut = new Mut({name:'pointlessDependency', path:'/tests/TestModules/pointlessDependency', internal:true});
                var graph = new Graph();
                graph.buildGraph(require(path.join(path.resolve('./') + '/package.json')));
                uuid.resolveInstance(graph);
                graph.addItem(uuid);
                mut.resolveInstance(graph);
                mut.resolvedInstance.must.not.be.null();
            });
        });

        //context('when calling resolveInstance item with dependencies that fail', function () {
        //    it('should throw proper error', function () {
        //        var mut = new Mut('TestClassBase', '../tests/TestModules/TestClassBase', true);
        //        var graph = new Graph();
        //        graph.buildGraph(require(path.join(path.resolve('./') + '/package.json')));
        //        (function(){mut.resolveInstance(graph)}).must.throw(Error, 'Invariant Violation: TestClassBase instance must resolve in resolveInstance function');
        //    });
        //});
    });


    describe('#testing getChildren', function () {
        context('when calling getChildren on dependency with children', function () {
            it('should return value of true', function () {
                var uuid = new Mut({name:'uuid', path:'uuid'});
                var mut = new Mut({name:'pointlessDependency', path:'/tests/TestModules/pointlessDependency', internal:true});
                var graph = new Graph();
                graph.buildGraph(require(path.join(path.resolve('./') + '/package.json')));
                uuid.resolveInstance(graph);
                graph.addItem(uuid);
                mut.getChildren(graph).must.be.true();
            });
        });

        context('when calling getChildren on dependency with children', function () {
            it('should set dependencies children on children array ', function () {
                var uuid = new Mut({name:'uuid', path:'uuid'});
                var mut = new Mut({name:'pointlessDependency', path:'/tests/TestModules/pointlessDependency', internal:true});
                var graph = new Graph();
                graph.buildGraph(require(path.join(path.resolve('./') + '/package.json')));
                uuid.resolveInstance(graph);
                graph.addItem(uuid);
                mut.getChildren(graph);
                mut.children()[0].must.equal(uuid);
            });
        });

        context('when calling getChildren on dependency with NO children', function () {
            it('should return null', function () {
                var mut =  new Mut({name:'logger', path:'/src/logger', internal:true});
                var graph = new Graph();
                graph.buildGraph(require(path.join(path.resolve('./') + '/package.json')));
                mut.getChildren(graph).must.be.false();
            });
        });

        context('when calling Children on dependency with NO children', function () {
            it('should return empty array', function () {
                var mut =  new Mut({name:'logger', path:'/src/logger', internal:true});
                var graph = new Graph();
                graph.buildGraph(require(path.join(path.resolve('./') + '/package.json')));
                mut.getChildren(graph);
                mut.children().must.be.empty();
            });
        });

        context('when calling Children on dependency array of dependencies', function () {
            it('should flatten array', function () {
                var d0 =  new Mut({name:'logger', resolvedInstance:logger, internal:true});
                var d1 =  new Mut({name:'logger1', path:'/src/logger', internal:true, groupName: 'testGroup'});
                var d2 =  new Mut({name:'logger2', path:'/src/logger', internal:true, groupName: 'testGroup'});
                var d3 =  new Mut({name:'logger3', path:'/src/logger', internal:true, groupName: 'testGroup'});
                var d4 =  new Mut({name:'logger4', path:'/src/logger', internal:true, groupName: 'testGroup'});
                var mut =  new Mut({name:'testWithArrayDependency', path:'/tests/testWithArrayDependency', internal:true});
                var graph = new Graph();
                graph.addItem(d0);
                graph.addItem(d1);
                graph.addItem(d2);
                graph.addItem(d3);
                graph.addItem(d4);
                graph.addItem(mut);
                mut.getChildren(graph);
                mut.children().length.must.equal(5);
            });
        });

        context('when calling resolve on dependency array of dependencies', function () {
            it('should flatten array', function () {
                var d0 =  new Mut({name:'logger', resolvedInstance:logger, internal:true});
                var d1 =  new Mut({name:'logger1', resolvedInstance:logger, internal:true, groupName: 'testGroup'});
                var d2 =  new Mut({name:'logger2', resolvedInstance:logger, internal:true, groupName: 'testGroup'});
                var d3 =  new Mut({name:'logger3', resolvedInstance:logger, internal:true, groupName: 'testGroup'});
                var d4 =  new Mut({name:'logger4', resolvedInstance:logger, internal:true, groupName: 'testGroup'});
                var mut =  new Mut({name:'testWithArrayDependency', path:'/tests/testWithArrayDependency', internal:true});
                var graph = new Graph();
                graph.addItem(d0);
                graph.addItem(d1);
                graph.addItem(d2);
                graph.addItem(d3);
                graph.addItem(d4);
                graph.addItem(mut);

                var result = mut.getCollectionOfDependencies(graph);
                result[0].must.equal(d0);
                Array.isArray(result[1]).must.be.true();

            });
        });

        context('when calling getCollectionOfDependencies on a dependency that does not resolve', ()=>{
            it('should throw proper error', ()=> {
                var Graph = require('../src/Graph');
                var graph = new Graph();
                graph.buildGraph(require(path.join(path.resolve('./') + '/package.json')));
                //new GraphResolution().recurse(graph);
                var mut = new Mut({name:'someModule', path:'./tests/TestModules/OneLevelDeeper/missingDependency',internal:true});

                (function(){mut.getCollectionOfDependencies(graph);})
                    .must.throw(Error,'Invariant Violation: Module someModule has a dependency that can not be resolved: pig');
            })
        })

    });
});
