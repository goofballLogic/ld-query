var favouriteReads = JSON.stringify(require("../data/person-favourite-reads.json"));
var dataWithNesting = JSON.stringify(require("../data/data-with-nesting.json"));
var deepData = JSON.stringify(require("../data/deep-data.json"));
var solitaryField = JSON.stringify(require("../data/solitary.json"));
var operations = JSON.stringify(require("../data/operations.json"));
var selectionTests = JSON.stringify(require("../data/selection-tests.json"));
var nestedIdentifiedNodes = JSON.stringify(require("../data/nested-identified-nodes.json"));
var ldQuery = require("../../src/ld-query");
var should = require("should");

var { Given, When, Then } = require("cucumber");



Given("the sample data containing nested identified nodes is loaded", function () {

    this.data = JSON.parse(nestedIdentifiedNodes);

});

Given("the sample data containing favourite reads is loaded", function () {

    this.data = JSON.parse(favouriteReads);

});

Given("the sample data containing recursive constructs is loaded", function () {

    this.data = JSON.parse(dataWithNesting);

});

Given("the sample data containing a solitary field is loaded", function () {

    this.data = JSON.parse(solitaryField);

});

Given("the sample data containing operations is loaded", function () {

    this.data = JSON.parse(operations);

});

Given("the sample data containing selection tests is loaded", function () {

    this.data = JSON.parse(selectionTests);

});

Given("the sample data containing deep data is loaded", function () {

    this.data = JSON.parse(deepData);

});

Given("I construct an ldQuery object using the loaded data and <context>", function (table) {

    this.context = JSON.parse(table.hashes()[0].context);
    this.query = ldQuery(this.data, this.context);

});

Given("I construct an ldQuery object using <context> only", function (table) {

    this.context = JSON.parse(table.hashes()[0].context);
    this.queryFactory = ldQuery(this.context);

});

Then("I should get a query factory object", function () {

    // can only estimate this - check it is a function and not a QueryNode
    should.exist(this.queryFactory, "No query factory object found");
    var isFunction = typeof this.queryFactory === "function";
    isFunction.should.be.true("Query factory is not a function");

    should.not.exist(this.queryFactory.query, "Unexpected query method found");
    should.not.exist(this.queryFactory.queryAll, "Unexpected queryAll method found");

});

Given("I pass the loaded data to the query factory", function () {

    this.query = this.queryFactory(this.data);

});

When("I query for {string}", function (selector) {

    this.result = this.query.query(selector);

});

When("I query for all {string}", function(selector) {

    this.result = this.query.queryAll(selector);

});


When("then I query the result for {string}", function (selector) {

    if (this.result.isFinal) {

        throw new Error("Result was final - can't query any further");

    }
    var querySite = [].concat(this.result || [])[0];
    this.result = querySite.query(selector);

});

When("then I query the result for all {string}", function (selector) {

    if (this.result.isFinal) {

        throw new Error("Result was final - can't query any further");

    }
    var querySite = [].concat(this.result || [])[0];
    this.result = querySite.queryAll(selector);

});

When("I navigate to the parent {int} times", function (repeats) {

    while (repeats > 0) {

        this.result = this.result.parent();
        repeats--;

    }

});

Then("I should obtain a QueryNode object", function () {

    should.exist(this.query, "No query object found");
    should.exist(this.query.query, "No query method found");
    should.exist(this.query.queryAll, "No queryAll method found");

});

Then("the result should be a QueryNode object", function () {

    should.exist(this.result, "No query object found");
    should.exist(this.result.query, "No query method found");
    should.exist(this.result.queryAll, "No queryAll method found");

});

Then("the result should be {string}", function (expected) {

    should.exist(this.result, "No result!");
    this.result.should.eql(expected);

});

Then("there should be no result", function () {

    should.not.exist(this.result);

});

When("I query the result for {string}", function (selector) {

    this.result = this.result.query(selector);

});

When("I get the result's json", function () {

    this.json = this.result.json();

});

Then("the json should match", function (table) {

    var expected = JSON.stringify(JSON.parse(table.hashes()[0].json));
    var actual = JSON.stringify(this.json);
    actual.should.match(expected);

});

Then("the result should be an array of {int} QueryNodes", function (nodeCount) {

    should.exist(this.result, "No query list object found");
    this.result.length.should.eql(parseInt(nodeCount));
    if (nodeCount > 0) {

        var sample = this.result[0];
        should.exist(sample.query, "No query method found");
        should.exist(sample.queryAll, "No queryAll method found");

    }

});

Then("the result should be the array {}", function (csv) {

    var expected = JSON.stringify(JSON.parse(csv));
    var actual = JSON.stringify(this.result);
    actual.should.eql(expected);

});

Then("the result should be an array of arrays", function (tableOfArrays) {

    function asArray(x) { return JSON.parse("[" + x[0] + "]"); }
    var expected = JSON.stringify(tableOfArrays.raw().map(asArray));
    var actual = JSON.stringify(this.result);
    actual.should.eql(expected);

});

Then("the result should be an empty array", function () {

    JSON.stringify(this.result).should.eql("[]");

});

Then("the result should be the number {int}", function (expected) {

    this.result.should.equal(parseInt(expected));

});