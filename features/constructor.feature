Feature: select values using query syntax
  As a developer working with JSON-LD
  I want to be able to use familiar syntax to query a JSON-LD document
  So that I don't need to manually parse the expanded JSON tree

  Background: Load sample data
    Given the sample data containing a solitary field is loaded

    Scenario: Construction using data and context
      When I construct an ldQuery object using the loaded data and <context>
        | context                             |
        | { "ex": "http://www.example.org#" } |
      Then I should obtain a QueryNode object

    Scenario: Construction using data and context, then perform a selection test
      When I construct an ldQuery object using the loaded data and <context>
        | context                             |
        | { "ex": "http://www.example.org#" } |
       And I query for "ex:field @value"
      Then the result should be "All by myself"

    Scenario: Construction using context only
      When I construct an ldQuery object using <context> only
        | context                             |
        | { "ex": "http://www.example.org#" } |
      Then I should get a query factory object

    Scenario: Construction using context only, then data
      When I construct an ldQuery object using <context> only
        | context                             |
        | { "ex": "http://www.example.org#" } |
       And I pass the loaded data to the query factory
      Then I should obtain a QueryNode object

    Scenario: Construction using context only, then data, then perform a selection test
      When I construct an ldQuery object using <context> only
        | context                             |
        | { "ex": "http://www.example.org#" } |
       And I pass the loaded data to the query factory
       And I query for "ex:field @value"
      Then the result should be "All by myself"
