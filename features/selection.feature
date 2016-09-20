Feature: select values using query syntax
  As a developer working with JSON-LD
  I want to be able to use familiar syntax to query a JSON-LD document
  So that I don't need to manually parse the expanded JSON tree

  Background: Load sample data
    Given the sample data containing favourite reads is loaded
    And I construct an ldQuery object using <context>
        | context                                                                                               |
        | { "so": "http://schema.org/", "foaf": "http://xmlns.com/foaf/0.1/", "ex": "http://www.example.org#" } |

    Scenario: Query for the first name node
      When I query for "foaf:firstName"
      Then the result should be a QueryNode object

    Scenario: Query for first name values
      When I query for "foaf:firstName @value"
      Then the result should be "Andrew"

    Scenario: Query for description value
      When I query for "so:description @value"
      Then the result should be "Linked person"

    Scenario: Query for the first value
      When I query for "@value"
      Then the result should be "goofballLogic"

    Scenario: Query for a property which isn't present on every branch of the tree
      When I query for "ex:note-to-self @value"
      Then the result should be "Need to finish reading this"

    Scenario: Query for item in collection
      When I query for "ex:favouriteReads so:author @value"
      Then the result should be "Iain M Banks"

    Scenario: Query for an item in a collection using method chaining
      Given I query for "ex:favouriteReads"
      When I query the result for "so:author @value"
      Then the result should be "Iain M Banks"

    Scenario: Query for the first item in a collection not at the top level
      When I query for "so:author @value"
      Then the result should be "Iain M Banks"

    Scenario: Get the JSON for a selected item
      Given I query for "ex:favouriteReads"
      When I get the result's json
      Then the json should match
        | json                                                                                                                                             |
        | [ { "http://schema.org/author": [ { "@value": "Iain M Banks" } ], "http://schema.org/name": [ { "@value": "Excession" } ], "@index": "banks-exc" }, { "http://schema.org/author": [ { "@value": "Iain M Banks" } ], "http://schema.org/name": [ { "@value": "The Player of Games" } ], "@index": "banks-pog" }, { "http://schema.org/author": [ { "@value": "Thomas Pynchon" } ], "http://schema.org/name": [ { "@value": "Gravity's Rainbow" } ], "http://www.example.org#note-to-self": [ { "@value": "Need to finish reading this" } ], "@index": "pynchon-gr" } ] |

    Scenario: Query for the author nodes
      Given I query for all "ex:favouriteReads so:author"
      Then the result should be an array of 3 QueryNodes

    Scenario: Query for author nodes, then for names
      Given I query for all "ex:favouriteReads so:author"
      And then I query the result for all "@value"
      Then the result should be an array [ "Iain M Banks" ]

    Scenario: Get the first result for a specific author
      Given I query for "ex:favouriteReads[so:author=Iain M Banks]"
      When I get the result's json
      Then the json should match
        | json                                                                                                                                             |
        | { "http://schema.org/author": [ { "@value": "Iain M Banks" } ], "http://schema.org/name": [ { "@value": "Excession" } ], "@index": "banks-exc" } |

    Scenario: Query for favourite reads for a specific author
      Given I query for all "ex:favouriteReads[so:author=Iain M Banks]"
      Then the result should be an array of 2 QueryNodes

    Scenario: Query for favourite reads for a specific author
      Given I query for all "ex:favouriteReads[so:author=Iain M Banks]"
      When I get the json for each result
      Then the the first json should match
        | json                                                                                                                                             |
        | { "http://schema.org/author": [ { "@value": "Iain M Banks" } ], "http://schema.org/name": [ { "@value": "Excession" } ], "@index": "banks-exc" } |
      And the second json should match
        | json                                                                                                                                             |
        | { "http://schema.org/author": [ { "@value": "Iain M Banks" } ], "http://schema.org/name": [ { "@value": "The Player of Games" } ], "@index": "banks-pog" } |

    Scenario: Query for favourite reads for a specific author, then get the title
      Given I query for all "ex:favouriteReads[so:author=Iain M Banks] so:name @value"
      Then the result should be an array [ "Excession", "The Player of Games" ]

    Scenario: Query for recursive properties