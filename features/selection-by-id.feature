Feature: select values by type using query syntax
    As a developer working with JSON-LD
    I want to be able to find query the @id attribute
    So that I can find specified elements

    Background: Load sample data
        Given the sample data containing nested identified nodes is loaded
        And I construct an ldQuery object using the loaded data and <context>
            | context                            |
            | { "test": "http://test.com/" } |

    Scenario: Query for top level node by id
        Given I query for "[@id=test:1]"
        When I query the result for "test:name @value"
        Then the result should be "Thing 1"

    Scenario: Query for nested node by id
        Given I query for "[@id=test:2]"
        When I query the result for "test:name @value"
        Then the result should be "Thing 2"