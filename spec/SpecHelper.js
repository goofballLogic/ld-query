beforeEach( function()  {
  
  this.data = [
    {
      "@type": [
        "http://schema.org/Person"
      ],
      "http://xmlns.com/foaf/0.1/accountName": [
        {
          "@value": "goofballLogic"
        }
      ],
      "http://schema.org/description": [
        {
          "@value": "Linked person"
        }
      ],
      "http://www.example.org#favouriteReads": [
        {
          "http://schema.org/author": [
            {
              "@value": "Iain M Banks"
            }
          ],
          "http://schema.org/name": [
            {
              "@value": "Excession"
            }
          ],
          "@index": "banks-exc"
        },
        {
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
          "@index": "pynchon-gr"
        }
      ],
      "http://xmlns.com/foaf/0.1/firstName": [
        {
          "@value": "Andrew"
        }
      ]
    }
  ];
  
} );
