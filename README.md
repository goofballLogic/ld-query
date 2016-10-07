[![Build Status](https://travis-ci.org/goofballLogic/ld-query.svg?branch=master)](https://travis-ci.org/goofballLogic/ld-query)

# ld-query

A tiny lib to assist in the querying of (expanded) JSON-LD documents.
The library uses ES5-compatible code, so you can run it on older browsers or servers without needing to transpile it.

tl;dr: [Examples](#examples)

The JSON-LD format is defined in the [W3C JSON-LD recommendation].

An example of a JSON-LD document:

```
{
  "@context": {
    "@vocab": "http://schema.org/",
    "note-to-self": "http://www.example.org#note-to-self",
    "firstName": "http://xmlns.com/foaf/0.1/firstName",
    "accountName": "http://xmlns.com/foaf/0.1/accountName",
    "favouriteReads": {
      "@id": "http://www.example.org#favouriteReads",
      "@container": "@index"
    }
  },
  "@type": "Person",
  "description": "Linked person",
  "favouriteReads": {
    "banks-exc": {
      "@id": "http://www.isbnsearch.org/isbn/9780553575378",
      "author": "Iain M Banks",
      "name": "Excession"
    },
    "pynchon-gr": {
      "@id": "http://www.isbnsearch.org/isbn/9780143039945",
      "author": "Thomas Pynchon",
      "name": "Gravity's Rainbow",
      "note-to-self": "Need to finish reading this"
    }
  },
  "accountName": "goofballLogic",
  "firstName": "Andrew",
  "name": "Andrew Goofball"
}
```

##Expansion is a pre-requisite

> WTF? Why would I do this to my data?
> Here's [a video explaining] the mechanism, which goes some way in justifying what we're doing here.

> In addition, we feel that the compaction algorithm isn't completely dependable when you're not sure what data documents you are merging together, so it feels "safer" to process the expanded form.

This library aims to assist with querying json-ld documents **in their expanded form**. It is worth noting that although the JSON-LD expansion algorithm is defined in the [JSON-LD Processing Algorithms and API recommendation], there's no implementation of the expansion algorithm in this library.

To use this library, your data needs to be in exapnded form. You can use existing implementations of the expansion API to achieve this. For example, [jsonld.js] is a fairly mature implementation of the standard.

An example of an expanded JSON-LD document:

```
[
  {
    "@type": [
      "http://schema.org/Person"
    ],
    "http://schema.org/description": [
      {
        "@value": "Linked person"
      }
    ],
    "http://www.example.org#favouriteReads": [
      {
        "@id": "http://www.isbnsearch.org/isbn/9780553575378",
        "@index": "banks-exc",
        "http://schema.org/author": [
          {
            "@value": "Iain M Banks"
          }
        ],
        "http://schema.org/name": [
          {
            "@value": "Excession"
          }
        ]
      },
      {
        "@id": "http://www.isbnsearch.org/isbn/9780143039945",
        "@index": "pynchon-gr",
        "http://schema.org/author": [
          {
            "@value": "Thomas Pynchon"
          }
        ],
        "http://schema.org/name": [
          {
            "@value": "Gravity's Rainbow"
          }
        ],
        "http://www.example.org#note-to-self": [
          {
            "@value": "Need to finish reading this"
          }
        ]
      }
    ],
    "http://xmlns.com/foaf/0.1/accountName": [
      {
        "@value": "goofballLogic"
      }
    ],
    "http://xmlns.com/foaf/0.1/firstName": [
      {
        "@value": "Andrew"
      }
    ],
    "http://schema.org/name": [
      {
        "@value": "Andrew Goofball"
      }
    ],
    "http://www.example.org#friendCount": [
      {
        "@value": 0
      }
    ]
  }
]
```

##Structure

We are trying to implement functionality which follows where possible the definition established by the [DOM querySelector] and [DOM querySelectorAll] APIs. Because the definitions will only ever by analogous to each other, we use "query" and "queryAll" rather than "querySelector" and "querySelectorAll".

##Examples

We would like to be able to query the data in a fairly simple manner, like this:

Start by creating the ld-query object:

```
var context = LD( {
  "@vocab": "http://www.schema.org/",
  "foaf": "http://xmlns.com/foaf/0.1/",
  "ex": "http://www.example.org#"
} );

var doc = context( data );
```

or
```
var doc = LD( data, {
   "@vocab": "http://www.schema.org/",
   "foaf": "http://xmlns.com/foaf/0.1/",
   "ex": "http://www.example.org#"
} );
```

The resulting object can be queried for the properties we need:


```
doc.query("foaf:firstName");                                      // QueryNode object
doc.query("foaf:firstName @value");                               // "Andrew"

doc.query("description @value");                                  // "Linked person"
doc.query("@value");                                              // "goofballLogic"

doc.query("ex:friendCount @value");                               // 0

doc.query("ex:favouriteReads");                                   // QueryNode object
doc.query("ex:favouriteReads").query("author @value")             // "Iain M Banks"
doc.query("ex:favouriteReads author @value");                     // "Iain M Banks"
doc.query("author @value")                                        // "Iain M Banks"
doc.query("ex:favouriteReads @value");                            // "Iain M Banks"

doc.query("ex:favouriteReads author").json();                     // { "http://schema.org/author": [ { "@value": "Iain M Banks" } ], http://schema.org/name": [ { "@value": "Excession" } ], "@index": "banks-exc" }

doc.queryAll("ex:favouriteReads author");                         // array of 2 QueryNode objects
doc.queryAll("ex:favouriteReads author @value");                  // [ "Iain M Banks", "Thomas Pynchon" ]
doc.queryAll("ex:favouriteReads").length;                         // 1

doc.queryAll("ex:favouriteReads")[0]                              // QueryNode object

doc.queryAll("firstName @value");                                 // [ "Andrew" ]
doc.queryAll("firstName").length;                                 // 1

doc.query("firstName").length;                                    // 1

doc.query("somepropertynotinyourdocument");                       // null
doc.query("somepropertynotinyourdocument @value")                 // null

doc.queryAll("somepropertynotinyourdocument @value")              // []

doc.query("ex:favouriteReads[@index=pynchon_gp] name @value")     // "Gravity's Rainbow"

doc.queryAll("ex:favouriteReads @index")                          // [ "banks-exc", "pynchon-gr" ]
doc.query("ex:favouriteReads @id")                                // [ "http://www.isbnsearch.org/isbn/9780553575378" ]

doc.queryAll("name @value")                                       // [ "Excession", "Gravity's Rainbox", "Andrew Goofball" ]
doc.queryAll("> name @value")                                     // [ "Andrew Goofball" ]
doc.queryAll("ex:favouriteReads > name @value")                   // [ "Excession", "Gravity's Rainbox" ]

```

[W3C JSON-LD recommendation]: https://www.w3.org/TR/json-ld/
[JSON-LD Processing Algorithms and API recommendation]: https://www.w3.org/TR/json-ld-api/#expansion
[jsonld.js]: https://github.com/digitalbazaar/jsonld.js
[a video explaining]: https://www.youtube.com/watch?v=Tm3fD89dqRE
[DOM querySelector]: https://www.w3.org/TR/selectors-api2/#queryselector
[DOM querySelectorAll]: https://www.w3.org/TR/selectors-api2/#queryselectorall
