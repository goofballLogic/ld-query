Feature: select values by type using child combinators
  As a developer working with JSON-LD
  I want to be able to use the child combinator in my selections
  So that I can better control how I represent the exact elements I need

  Background: Load sample data
    Given the sample data containing selection tests is loaded
    And I construct an ldQuery object using the loaded data and <context>
        | context                             |
        | { "ex": "http://www.example.org#" } |

    Scenario: Query for child path under root node should not retrieve other matching paths
        When I query for "> @type"
        And I get the result's json
        Then the json should match
        | json                                                               |
        | ["http://www.example.org#unrealistic-data-with-no-decent-analogy"] |

    Scenario: Query for child path under current node should not retrieve other matching paths
        When I query for "ex:type[@index=index3]"
        And I query the result for "> ex:grabThis @value"
        Then the result should be "Three"

    Scenario: Query should match any part of the tree
        When I query for all "ex:type[@id=ex:type4] > ex:grabThis @value"
        Then the result should be an array [ "Three-Four", "Three-NoIndex" ]
