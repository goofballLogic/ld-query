Feature: select values by type using multiple attributes
  As a developer working with JSON-LD
  I want to be able to use familiar syntax to query a JSON-LD document
  So that I don't need to manually parse the expanded JSON tree

  Background: Load sample data
    Given the sample data containing selection tests is loaded
    And I construct an ldQuery object using the loaded data and <context>
        | context                             |
        | { "ex": "http://www.example.org#" } |

    Scenario: Query for direct path under root node should not retrieve other matching paths
        When I query for "> @type"
        And I get the result's json
        Then the json should match
        | json                                                               |
        | ["http://www.example.org#unrealistic-data-with-no-decent-analogy"] |

    Scenario: Query for direct path under current node should not retrieve other matching paths
        When I query for "ex:type[@index=index3]"
        And I query the result for "> ex:grabThis @value"
        Then the result should be "Three"

    Scenario: Query should match any part of the tree
        When I query for all "ex:type[@id=ex:type4] > ex:grabThis @value"
        Then the result should be an array [ "Three-Four", "Three-NoIndex" ]
