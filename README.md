# ld-query

A tiny lib to assist in the querying of (expanded) JSON-LD documents.

The JSON-LD format is defined in the [W3C JSON-LD recommendation].

An example of a JSON-LD document:

```
{
  "@context": {
    "so": "https://schema.org/",
    "foaf": "http://xmlns.com/foaf/0.1/",
    "name": "so:name",
    "description": "so:description",
    "author": "so:author",
    "firstName": "foaf:firstName",
    "accountName": "foaf:accountName",
    "favouriteReads": {
      "@id": "http://www.example.org#favouriteReads",
      "@container": "@index"
    }
  },
  "@type": "so:Person",
  "firstName": "Andrew",
  "accountName": "goofballLogic",
  "description": "Linked person",
  "favouriteReads": {
    "banks-exc": {
      "author": "Iain M Banks",
      "name": "Excession"
    },
    "pynchon-gr": {
      "author": "Thomas Pynchon",
      "name": "Gravity's Rainbow"
    }
  }
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
      "https://schema.org/Person"
    ],
    "http://xmlns.com/foaf/0.1/accountName": [
      {
        "@value": "goofballLogic"
      }
    ],
    "https://schema.org/description": [
      {
        "@value": "Linked person"
      }
    ],
    "http://www.example.org#favouriteReads": [
      {
        "https://schema.org/author": [
          {
            "@value": "Iain M Banks"
          }
        ],
        "https://schema.org/name": [
          {
            "@value": "Excession"
          }
        ],
        "@index": "banks-exc"
      },
      {
        "https://schema.org/author": [
          {
            "@value": "Thomas Pynchon"
          }
        ],
        "https://schema.org/name": [
          {
            "@value": "Gravity's Rainbow"
          }
        ],
        "@index": "pynchon-gr"
      }
    ],
    "http://xmlns.com/foaf/0.1/firstName": [
      {
        "@value": "Andrew"
      }
    ]
  }
]
```
##Examples

We would like to be able to query the data in a fairly simple manner, like this:

```
// create the ld-query object
var context = {
  "so": "http://www.schema.org/",
  "foaf": "http://xmlns.com/foaf/0.1/",
  "ex": "http://www.example.org#"
};

var doc = LD( data, context );


// query for the values we need:

var firstName =    doc.query( "so:firstName" ).value;                       // "Andrew"
var accountName =  doc.query( "foaf:accountName" ).value;                   // "goofballLogic"
var authors =      doc.queryAll( "ex:favouriteReads so:author" ).value;     // [ "Iain M Banks", "Thomas Pynchon" ]

```

[W3C JSON-LD recommendation]: https://www.w3.org/TR/json-ld/
[JSON-LD Processing Algorithms and API recommendation]: https://www.w3.org/TR/json-ld-api/#expansion
[jsonld.js]: https://github.com/digitalbazaar/jsonld.js
[a video explaining]: https://www.youtube.com/watch?v=Tm3fD89dqRE
