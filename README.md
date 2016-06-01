# ld-query

A tiny lib to assist in the querying of (expanded) JSON-LD documents.

The JSON-LD format is defined in the [W3C JSON-LD recommendation].

```
{
  "@context": {
    "name": "https://schema.org/name",
    "description": "https://schema.org/description",
    "author": "https://schema.org/author",
    "firstName": "http://xmlns.com/foaf/0.1/",
    "accountName": "http://xmlns.com/foaf/0.1/accountName",
    "favouriteReads": {
      "@id": "http://www.example.org#favouriteReads",
      "@container": "@index"
    }
  },
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
This library aims to assist with querying json-ld documents **in their expanded form**. It is worth noting that although the JSON-LD expansion algorithm is defined in the [JSON-LD Processing Algorithms and API recommendation], there's no implementation of the expansion algorithm.


##Pre-requisites

To use this library, your data needs to be in exapnded form. You can use existing implementations of the expansion API to achieve this. For example, [jsonld.js] is a fairly mature implementation of the standard. 


[W3C JSON-LD recommendation]: https://www.w3.org/TR/json-ld/
[JSON-LD Processing Algorithms and API recommendation]: https://www.w3.org/TR/json-ld-api/#expansion
[jsonld.js]: https://github.com/digitalbazaar/jsonld.js
