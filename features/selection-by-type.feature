Feature: select values by type using query syntax
  As a developer working with JSON-LD
  I want to be able to find query the @type attribute that may be an array
  So that I can find elements entries match a specific need

  Background: Load sample data
    Given the sample data containing operations is loaded
    And I construct an ldQuery object using the loaded data and <context>
        | context                                                                          |
        | { "ex": "http://www.example.org#", "hydra": "http://www.w3.org/ns/hydra/core#" } |

    Scenario: Query for operation by first type
        When I query for "hydra:operation[@type=ex:deleteOperation] hydra:title @value"
        Then the result should be "Delete the thing"

    Scenario: Query for operation by second type
        When I query for "hydra:operation[@type=hydra:CreateResourceOperation] hydra:title @value"
        Then the result should be "Create the thing"
