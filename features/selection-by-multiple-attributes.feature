Feature: select values by type using multiple attributes
  As a developer working with JSON-LD
  I want to be able to use familiar syntax to query a JSON-LD document
  So that I don't need to manually parse the expanded JSON tree

  Background: Load sample data
    Given the sample data containing selection tests is loaded
    And I construct an ldQuery object using the loaded data and <context>
        | context                             |
        | { "ex": "http://www.example.org#" } |

    Scenario: Query for index and attribute, then first value
        When I query for "ex:type[@id=ex:type1][@index=index1] ex:grabThis @value"
        Then the result should be "One-Two"

    Scenario: Query for index and attribute, then direct value
        When I query for "ex:type[@id=ex:type1][@index=index1] > ex:grabThis @value"
        Then the result should be "One"

    Scenario: Stacked queries must match the same node
        When I query for "ex:type[@id=ex:type1][@index=index2] ex:grabThis @value"
        Then there should be no result

    Scenario: Query by id on one node and index on another
        When I query for "ex:type[@id=ex:type1] ex:type[@index=index2] ex:grabThis @value"
        Then the result should be "One-Two"

    Scenario: Query should match any part of the tree
        When I query for "ex:type[@id=ex:type4][@index=index4] ex:grabThis @value"
        Then the result should be "Three-Four"

    Scenario: Query by two values of the same attribute
        When I query for "ex:type[@type=ex:type-child][@type=four-noindex] > ex:grabThis @value"
        Then the result should be "Three-NoIndex"

    Scenario: Query for attributes with whitespace inside attributes
        When I query for "ex:type[ @id=ex:type1 ][ @index=index1 ] ex:grabThis @value"
        Then the result should be "One-Two"
    
    Scenario: Query for attributes with whitespace between operator and values
        When I query for "ex:type[@id = ex:type1][@index=index1] ex:grabThis @value"
        Then the result should be "One-Two"

    Scenario: Attribute selectors should work on their own
        When I query for "ex:parent [@index=index2] @value"
        Then the result should be "I am child 2"
