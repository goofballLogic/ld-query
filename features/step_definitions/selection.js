var favouriteReads = JSON.stringify( require( "../data/person-favourite-reads.json" ) );
var dataWithNesting = JSON.stringify( require( "../data/data-with-nesting.json" ) );
var solitaryField = JSON.stringify( require( "../data/solitary.json" ) );
var operations = JSON.stringify( require( "../data/operations.json" ) );
var selectionTests = JSON.stringify( require( "../data/selection-tests.json" ) );
var ldQuery = require( "../../src/ld-query" );
var should = require( "should" );

module.exports = function() {

     // a fallback for missing Array.isArray
    var isArray = Array.isArray || function( arg ) {

        return Object.prototype.toString.call( arg ) === "[object Array]";

    };

    this.Given(/^the sample data containing favourite reads is loaded$/, function () {

        this.data = JSON.parse( favouriteReads );

    } );

    this.Given(/^the sample data containing recursive constructs is loaded$/, function () {

         this.data = JSON.parse( dataWithNesting );

    } );

    this.Given(/^the sample data containing a solitary field is loaded$/, function () {

         this.data = JSON.parse( solitaryField );

    } );

    this.Given(/^the sample data containing operations is loaded$/, function () {

         this.data = JSON.parse( operations );

    } );

    this.Given(/^the sample data containing selection tests is loaded$/, function () {

         this.data = JSON.parse( selectionTests );

    } );

    this.Given(/^I construct an ldQuery object using the loaded data and <context>$/, function (table) {

        this.context = JSON.parse( table.hashes()[ 0 ].context );
        this.query = ldQuery( this.data, this.context );

    } );

    this.Given(/^I construct an ldQuery object using <context> only$/, function (table) {

        this.context = JSON.parse( table.hashes()[ 0 ].context );
        this.queryFactory = ldQuery( this.context );

    } );

    this.Then(/^I should get a query factory object$/, function () {

        // can only estimate this - check it is a function and not a QueryNode
        should.exist( this.queryFactory, "No query factory object found" );
        var isFunction = typeof this.queryFactory === "function";
        isFunction.should.be.true( "Query factory is not a function" );

        should.not.exist( this.queryFactory.query, "Unexpected query method found" );
        should.not.exist( this.queryFactory.queryAll, "Unexpected queryAll method found" );

    } );

    this.Given(/^I pass the loaded data to the query factory$/, function () {

        this.query = this.queryFactory( this.data );

    } );

    this.When(/^I query for( all)? "([^"]*)"$/, function ( isAll, selector ) {

        this.result = isAll ? this.query.queryAll( selector ) : this.query.query( selector );

    } );


    this.When( /^then I query the result for( all)? "([^"]*)"$/, function (isAll, selector ) {

        if ( this.result.isFinal )  {

            throw new Error( "Result was final - can't query any further" );

        }
        var querySite = [].concat( this.result || [] )[ 0 ];
        this.result = isAll ? querySite.queryAll( selector ) : querySite.query( selector );

    } );

    this.Then(/^I should obtain a QueryNode object$/, function() {

        should.exist( this.query, "No query object found" );
        should.exist( this.query.query, "No query method found" );
        should.exist( this.query.queryAll, "No queryAll method found" );

    } );

    this.Then(/^the result should be a QueryNode object$/, function() {

        should.exist( this.result, "No query object found" );
        should.exist( this.result.query, "No query method found" );
        should.exist( this.result.queryAll, "No queryAll method found" );

    } );

    this.Then(/^the result should be "([^"]*)"$/, function( expected ) {

        should.exist( this.result, "No result!" );
        this.result.should.eql( expected );

    } );

    this.Then(/^there should be no result$/, function() {

        should.not.exist( this.result );

    } );

    this.When(/^I query the result for "([^"]*)"$/, function( selector ) {

        this.result = this.result.query( selector );

    } );

    this.When(/^I get the result's json$/, function () {

       this.json = this.result.json();

    } );

    this.Then(/^the json should match$/, function (table) {

        var actual = JSON.stringify( JSON.parse( table.hashes()[ 0 ].json ) );
        var expected = JSON.stringify( this.json );
        actual.should.match( expected );

    } );

    this.Then(/^the result should be an array of (\d+) QueryNodes$/, function ( nodeCount ) {

        should.exist( this.result, "No query list object found" );
        this.result.length.should.eql( parseInt( nodeCount ) );
        if ( nodeCount > 0 ) {

            var sample = this.result[ 0 ];
            should.exist( sample.query, "No query method found" );
            should.exist( sample.queryAll, "No queryAll method found" );

        }

    } );

    this.Then(/^the result should be an array (\[ [^\]]* \])$/, function ( csv ) {

        var expected = JSON.stringify( JSON.parse( csv ) );
        var actual = JSON.stringify( this.result );
        actual.should.eql( expected );

    } );

    this.Then(/^the result should be an empty array$/, function () {

        var resultIsArray = isArray( this.result );
        resultIsArray.should.be.true();
        this.result.length.should.eql( 0 );

    } );

};
