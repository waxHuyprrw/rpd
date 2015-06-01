var Rpd = Rpd, Kefir = Kefir;

var RpdMatchers = RpdMatchers;

if ((typeof Rpd === 'undefined')
 && (typeof Kefir === 'undefined')
 && (typeof RpdMatchers === 'undefined')
 && (typeof require !== 'undefined')) {
    Kefir = require('../vendor/kefir.min.js');
    Rpd = require('../src/rpd.js');
    RpdMatchers = require('./matchers.js');
}

Rpd.channeltype('spec/any', { });

describe('registering', function() {

// -----------------------------------------------------------------------------
// ===============================- renderer -==================================
// -----------------------------------------------------------------------------

describe('renderer', function() {
});

// -----------------------------------------------------------------------------
// =================================- node -====================================
// -----------------------------------------------------------------------------

function withNewModel(fn) {
    var updateSpy = jasmine.createSpy();
    var renderer = Rpd.renderer('foo', function(user_conf) {
        return updateSpy;
    });

    var model = Rpd.Model.start().renderWith('foo').attachTo({});

    fn(model, updateSpy);
}

describe('node type', function() {

    beforeEach(function() {
        jasmine.addMatchers({
            toHaveBeenOrderlyCalledWith: RpdMatchers.toHaveBeenOrderlyCalledWith,
            toHaveBeenCalledOnce: RpdMatchers.toHaveBeenCalledOnce,
            toHaveBeenCalledTwice: RpdMatchers.toHaveBeenCalledTwice
        });
    });

    it('could be registered with an empty object', function() {
        expect(function() {
            Rpd.nodetype('spec/foo', {});
        }).not.toThrow();
    });

    it('redefining the type re-writes previous type');

    it('passes the specified name to every created instance');

    it('creates specified inlets for the node instance', function() {
        Rpd.nodetype('spec/foo', {
            inlets: {
                'a': { type: 'spec/any' },
                'b': { type: 'spec/any' }
            }
        });

        withNewModel(function(model, updateSpy) {

            var node = new Rpd.Node('spec/foo');

            expect(updateSpy).toHaveBeenCalledWith(
                jasmine.anything(),
                jasmine.objectContaining(
                    { type: 'inlet/add',
                      inlet: jasmine.objectContaining({
                          name: 'a',
                          type: 'spec/any'
                      }) })
            );

            expect(updateSpy).toHaveBeenCalledWith(
                jasmine.anything(),
                jasmine.objectContaining(
                    { type: 'inlet/add',
                      inlet: jasmine.objectContaining({
                          name: 'b',
                          type: 'spec/any'
                      }) })
            );

        });
    });

    it('creates specified outlets for the node instance', function() {

        Rpd.nodetype('spec/foo', {
            outlets: {
                'a': { type: 'spec/any' },
                'b': { type: 'spec/any' }
            }
        });

        withNewModel(function(model, updateSpy) {

            var node = new Rpd.Node('spec/foo');

            expect(updateSpy).toHaveBeenCalledWith(
                jasmine.anything(),
                jasmine.objectContaining(
                    { type: 'outlet/add',
                      outlet: jasmine.objectContaining({
                          name: 'a',
                          type: 'spec/any'
                      }) })
            );

            expect(updateSpy).toHaveBeenCalledWith(
                jasmine.anything(),
                jasmine.objectContaining(
                    { type: 'outlet/add',
                      outlet: jasmine.objectContaining({
                          name: 'b',
                          type: 'spec/any'
                      }) })
            );

        });
    });

    it('informs it is ready when all inlets and outlets are ready', function() {

        Rpd.nodetype('spec/foo', {
            inlets:  { 'a': { type: 'spec/any' },
                       'b': { type: 'spec/any' } },
            outlets: { 'c': { type: 'spec/any' },
                       'd': { type: 'spec/any' } }
        });

        withNewModel(function(model, updateSpy) {

            var node = new Rpd.Node('spec/foo');

            expect(updateSpy).toHaveBeenOrderlyCalledWith([
                [ jasmine.anything(), jasmine.objectContaining({ type: 'inlet/add' }) ],
                [ jasmine.anything(), jasmine.objectContaining({ type: 'outlet/add' }) ],
                [ jasmine.anything(), jasmine.objectContaining({ type: 'node/ready' }) ]
            ]);

        });
    });

    it('informs it is ready only once', function() {

        Rpd.nodetype('spec/foo', {
            inlets:  { 'a': { type: 'spec/any' } },
            outlets: { 'b': { type: 'spec/any' } }
        });

        withNewModel(function(model, updateSpy) {

            var node = new Rpd.Node('spec/foo');

            updateSpy.calls.reset();

            node.addInlet('spec/any', 'foo');

            expect(updateSpy).not.toHaveBeenCalledWith(
                jasmine.anything(),
                jasmine.objectContaining({ type: 'node/ready' }));

        });
    });

    describe('processing function', function() {

        var processSpy;

        beforeEach(function() { processSpy = jasmine.createSpy('process'); });

        it('is not called when inlets have no default values', function() {

            Rpd.nodetype('spec/foo', {
                inlets:  { 'a': { type: 'spec/any' },
                           'b': { type: 'spec/any' } },
                process: processSpy
            });

            withNewModel(function(model, updateSpy) {
                var node = new Rpd.Node('spec/foo');
                expect(processSpy).not.toHaveBeenCalled();
            });

        });

        it('is still not called when inlets have no default values and there is an outlet', function() {

            Rpd.nodetype('spec/foo', {
                inlets:  { 'a': { type: 'spec/any' },
                           'b': { type: 'spec/any' } },
                outlets: { 'c': { type: 'spec/any' } },
                process: processSpy
            });

            withNewModel(function(model, updateSpy) {
                var node = new Rpd.Node('spec/foo');
                expect(processSpy).not.toHaveBeenCalled();
            });

        });

        it('is called once when single inlet has some default value', function() {

            Rpd.nodetype('spec/foo', {
                inlets:  { 'a': { type: 'spec/any', default: 10 },
                           'b': { type: 'spec/any' } },
                process: processSpy
            });

            withNewModel(function(model, updateSpy) {
                var node = new Rpd.Node('spec/foo');
                expect(processSpy).toHaveBeenCalledWith({ 'a': 10 }, jasmine.anything());
                expect(processSpy).toHaveBeenCalledOnce();
            });

        });

        it('is called for every inlet which has a default value', function() {

            Rpd.nodetype('spec/foo', {
                inlets: { 'a': { type: 'spec/any', default: 10 },
                          'b': { type: 'spec/any', default: 5  } },
                process: processSpy
            });

            withNewModel(function(model, updateSpy) {
                var node = new Rpd.Node('spec/foo');
                expect(processSpy).toHaveBeenCalledWith({ 'a': 10 }, jasmine.anything());
                expect(processSpy).toHaveBeenCalledWith({ 'a': 10, 'b': 5 }, jasmine.anything());
            });

        });

        it('is not affected with number of outlets', function() {

            Rpd.nodetype('spec/foo', {
                inlets: { 'a': { type: 'spec/any', default: 10 },
                          'b': { type: 'spec/any', default: 5  } },
                outlets: { 'c': { type: 'spec/any' } },
                process: processSpy
            });

            withNewModel(function(model, updateSpy) {
                var node = new Rpd.Node('spec/foo');
                expect(processSpy).toHaveBeenCalledTwice();
            });

        });

        it('gets values from inlets even when there\'s no outlets', function() {

            Rpd.nodetype('spec/foo', {
                inlets:  { 'a': { type: 'spec/any' },
                           'b': { type: 'spec/any' } },
                process: processSpy
            });

            withNewModel(function(model, updateSpy) {

                var node = new Rpd.Node('spec/foo');

                node.inlets['a'].receive(2);
                node.inlets['b'].receive('abc');

                expect(processSpy).toHaveBeenCalledWith({ a: 2, b: 'abc' }, jasmine.anything());

            });

        });

        it('passes previous values with a call');

        it('does not reacts if updated channel was cold, but keeps its value for next update');

        it('passes single values to corresponding outlets');

        it('passes streamed values to corresponding outlets');

        it('switches off previous stream when new one was plugged to outlet');

        //it('if no outlet was updated, does not calls the')

        // it('still receives updates from hidden channels');

    });

});

// -----------------------------------------------------------------------------
// ===============================- channel -===================================
// -----------------------------------------------------------------------------

describe('channel type', function() {

});

// -----------------------------------------------------------------------------
// =================================- link -====================================
// -----------------------------------------------------------------------------

describe('link type', function() {

});

// -----------------------------------------------------------------------------
// ============================- node renderer -================================
// -----------------------------------------------------------------------------

describe('node renderer', function() {

});

// -----------------------------------------------------------------------------
// ==========================- channel renderer -===============================
// -----------------------------------------------------------------------------

describe('channel renderer', function() {

});

});
