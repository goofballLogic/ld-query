Feature: select values using query syntax
  As a developer working with JSON-LD
  I want to be able to use familiar syntax to query a JSON-LD document
  So that I don't need to manually parse the expanded JSON tree

  Background: Load sample data
    Given the sample data containing favourite reads is loaded
    And I construct an ldQuery object using the loaded data and <context>
        | context                                                                                               |
        | { "@vocab": "http://schema.org/", "foaf": "http://xmlns.com/foaf/0.1/", "ex": "http://www.example.org#" } |

    Scenario: Query for the first name node
      When I query for "foaf:firstName"
      Then the result should be a QueryNode object

    Scenario: Query for first name values
      When I query for "foaf:firstName @value"
      Then the result should be "Andrew"

    Scenario: Query for description value
      When I query for "description @value"
      Then the result should be "Linked person"

    Scenario: Query for the first value
      When I query for "@value"
      Then the result should be "goofballLogic"

    Scenario: Query for a property which isn't present on every branch of the tree
      When I query for "ex:note-to-self @value"
      Then the result should be "Need to finish reading this"

    Scenario: Query for item in collection
      When I query for "ex:favouriteReads author @value"
      Then the result should be "Iain M Banks"

    Scenario: Query for an item in a collection using method chaining
      Given I query for "ex:favouriteReads"
      When I query the result for "author @value"
      Then the result should be "Iain M Banks"

    Scenario: Query for the first item in a collection not at the top level
      When I query for "author @value"
      Then the result should be "Iain M Banks"

    Scenario: Get the JSON for a selected item
      Given I query for "ex:favouriteReads"
      When I get the result's json
      Then the json should match
        | json                                                                                                                                             |
        | [{ "@id": "http://www.isbnsearch.org/isbn/9780553575378", "@index": "banks-exc", "http://schema.org/author": [{ "@value": "Iain M Banks" }], "http://schema.org/name": [{ "@value": "Excession" }] }, { "@id": "http://www.isbnsearch.org/isbn/9780143039945", "@index": "pynchon-gr", "http://schema.org/author": [{ "@value": "Thomas Pynchon" }], "http://schema.org/name": [{ "@value": "Gravity's Rainbow" }], "http://www.example.org#note-to-self": [{ "@value": "Need to finish reading this" }] }] |

    Scenario: Query for the author nodes
        When I query for all "ex:favouriteReads author"
        Then the result should be an array of 2 QueryNodes

    Scenario: Query for author nodes, then for names
        When I query for all "ex:favouriteReads author"
        And then I query the result for all "@value"
        Then the result should be an array [ "Iain M Banks" ]

    Scenario: Query for author nodes, by index
        When I query for "ex:favouriteReads[@index=banks-exc]"
        And I get the result's json
        Then the json should match
        | json                                                                                                                                             |
        | {"@id":"http://www.isbnsearch.org/isbn/9780553575378","@index":"banks-exc","http://schema.org/author":[{"@value":"Iain M Banks"}],"http://schema.org/name":[{"@value":"Excession"}]} |

    Scenario: Query for favourite reads by index
        When I query for "ex:favouriteReads[@index=banks-exc]"
        And I get the result's json
        Then the json should match
        | json                                                                                                                                             |
        | {"@id":"http://www.isbnsearch.org/isbn/9780553575378","@index":"banks-exc","http://schema.org/author":[{"@value":"Iain M Banks"}],"http://schema.org/name":[{"@value":"Excession"}]} |

    Scenario: Query for favourite reads by index, then get id
        When I query for "ex:favouriteReads[@index=banks-exc] @id"
        Then the result should be "http://www.isbnsearch.org/isbn/9780553575378"

    Scenario: Query for a path that does not exist
      When I query for "alice:bob"
      Then there should be no result

    Scenario: Query all for a path that does not exist
      When I query for all "alice:bob"
      Then the result should be an empty array
    
    Scenario: Query for a numberic falsey value (0)
      When I query for "ex:friendCount @value"
      Then the result should be the number 0
