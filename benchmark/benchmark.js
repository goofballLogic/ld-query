var Benchmark = require("benchmark");
var spawn = require("child_process").spawnSync;
var fs = require("fs");
var Table = require("easy-table");
var tmp = require("tmp");
var selectionSuite = require("./selection.js");
tmp.setGracefulCleanup();

var OPTS = ( function(args) {
    var ret = {

        benchmark: /.*/,
        compareTo: "master",
        precision: 6

    };

    for ( var ii = 0; ii < args.length; ii++ ) {

        var arg = args[ ii ];

        switch( arg ) {

        case "--compare-to":
            ret.compareTo = args[ ++ii ];
            break;

        case "--benchmark":
            ret.benchmark = new RegExp(args[ ++ii ]);
            break;

        case "--precision":
            ret.precision = args[ ++ii ];
            break;

        default:
            console.log( "Unknown argument: " + arg );

        }

    }

    return ret;

}( process.argv.slice( 2 ) ) );

function createSuite( name, LD ) {
    var suite = new Benchmark.Suite( name );

    var benchmarks = selectionSuite( LD );

    var bmFilter = OPTS.benchmark;
    return benchmarks
        .filter( function( bm ) { return bmFilter.test( bm.name ); } )
        .reduce( function( s, bm ) { return s.add( bm.name, bm.fn ); },
            suite );

}

function checkoutModuleAtPath(path) {

    var file = tmp.fileSync();

    var source = spawn( "git", [
        "show",
        path + ":src/ld-query.js",
    ] ).stdout;

    fs.writeFileSync( file.fd, source );

    return file.name;

}

var compareToPath = OPTS.compareTo;

var modules = [ [ "Working Copy", "../src/ld-query.js" ],
    [ compareToPath, checkoutModuleAtPath( compareToPath ) ] ];
var suites = [];
var results = [];

modules
    .map( function( m ) { return createSuite( m[0], require( m[1] ) ); } )
    .forEach(function( m ) { suites.push( m ); } );

function indexBenchmarksByName(result, bm) {

    result[ bm.name ] = { mean: bm.stats.mean };
    return result;

}

function checkSuitesForErrors(suites) {

    var errors = suites
        .map(function(suite) {
            return suite
                .filter(function(bm) { return !!bm.error; })
                .map(function(bm) { return [suite.name, bm.name, bm.error]; });
        })
        .reduce(function(results, suiteResults) {
            return results.concat(suiteResults);
        }, []);

    if (0 !== errors.length) {

        errors.forEach(function(r) {
            var suite     = r[0];
            var benchmark = r[1];
            var error     = r[2];
            console.log("Suite: " + suite +
                        ", Benchmark: " + benchmark +
                        " failed with error:\n", error);
        });

        throw new Error("Benchmarks failed");
    }

}

function processResults() {
    checkSuitesForErrors(results);

    var current = results[ 0 ];
    var currentByName = current.reduce( indexBenchmarksByName, {} );

    var other = results[ 1 ];
    var otherByName = other.reduce( indexBenchmarksByName, {} );

    var resultTable = new Table;
    var numberFormat = Table.number( OPTS.precision );

    Object.keys(currentByName).forEach( function( bmName ) {

        resultTable.cell( "Benchmark", bmName );
        var currBM = currentByName[ bmName ];
        var otherBM = otherByName[ bmName ];

        resultTable.cell( current.name, currBM.mean * 1000, numberFormat );
        resultTable.cell( other.name, otherBM.mean * 1000, numberFormat );

        var diffPercentage =
            ( ( currBM.mean - otherBM.mean ) / otherBM.mean ) * 100;
        resultTable.cell( "% Difference", diffPercentage, numberFormat );

        resultTable.newRow();

    } );

    console.log( "\nResults:\n" );
    console.log( "Mean Execution Time (milliseconds):\n" );
    console.log( resultTable.toString() );

}

function executeSuites() {

    if ( 0 === suites.length ) {

        processResults();

    } else {

        var suite = suites.shift();

        console.log("Benchmarking:", suite.name);

        suite
            .on("complete", function() {

                results.push( this );
                executeSuites();

            })
            .run();
    }

}

executeSuites();
