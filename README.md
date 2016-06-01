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
    "banksExcession": {
      "author": "Iain M Banks",
      "name": "Excession"
    },
    "pynchonGravitysRainbow": {
      "author": "Thomas Pynchon",
      "name": "Gravity's Rainbow"
    }
  }
}
```

##Expansion is a pre-requisite

> WTF? Why would I do this to my data?
> Here's a video explaining the mechanism, which goes some way in justifying what we're doing here: https://www.youtube.com/watch?v=Tm3fD89dqRE

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
        "@index": "banksExcession"
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
        "@index": "pynchonGravitysRainbow"
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

[W3C JSON-LD recommendation]: https://www.w3.org/TR/json-ld/
[JSON-LD Processing Algorithms and API recommendation]: https://www.w3.org/TR/json-ld-api/#expansion
[jsonld.js]: https://github.com/digitalbazaar/jsonld.js
