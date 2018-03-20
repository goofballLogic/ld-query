Feature: traverse back out of a JSON node to parent nodes
  As a developer working with JSON-LD
  I want to be able to go back to the "parent" of the current node, if I previously queried "into" a document
  So that I can query properties of entities which contain one I've found

  Background: Load sample data
    Given the sample data containing deep data is loaded
    And I construct an ldQuery object using the loaded data and <context>
        | context                          |
        | { "@vocab": "http://test.com/" } |

    Scenario: Query for the names of grandparents of Paul
      When I query for "name[@value=Paul]"
      And I navigate to the parent 3 times
      And I query for all "> name @value"
      Then the result should be an array [ "Sam", "Robert" ]

