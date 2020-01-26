Feature: select values using query syntax against documents with recursive properties
  As a developer working with JSON-LD
  I want to be able to use familiar syntax to query a JSON-LD document
  So that I don't need to manually parse the expanded JSON tree

  Background: Load sample data
    Given the sample data containing recursive constructs is loaded
    And I construct an ldQuery object using the loaded data and <context>
        | context                                                                                               |
        | { "ex": "http://www.example.org#" } |

    Scenario: Query for the author nodes
        When I query for all "ex:div @value"
        Then the result should be the array [ "How is it hanging?", "Lots of divs here, yo?" ]