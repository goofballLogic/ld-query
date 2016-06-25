/*global expect*/

describe( "Upon calling LD with data about me and my favourite books, and a context", function() {
    
    var doc;
    
    beforeEach( function() {
        
        doc = this.LD( this.data, {
            
            "so": "http://schema.org/",
            "foaf": "http://xmlns.com/foaf/0.1/",
            "ex": "http://www.example.org#"
            
        } );         
        
    } );
    
    it( "Then it should have created an ld-query object", function() {
        
        expect( doc ).toBeTruthy();
        
    } );
    
    describe( "Given a query for first name node", function() {
        
        var found;
        beforeEach( function() {
            
            found = doc.query( "foaf:firstName" );
            
        } );
        
        it( "Then it should have found one query node", function() {
            
            expect( found ).toExist();
            expect( found.query ).toExist();
            expect( found.queryAll ).toExist();
            
        } );
        
    } );
    
    describe( "Given a query for first name", function() {
        
        var found;
        beforeEach( function() { 
            
            found = doc.query( "foaf:firstName" ).value;
            
        } );
        
        it( "Then it should have found my first name", function() {
            
            expect( found ).toBe( "Andrew" );
            
        } );
        
    } );
    
    describe( "Given a query for my description", function() {
    
        var found;
        beforeEach( function() {
        
            found = doc.query("so:description").value;
            
        } );
        
        it( "Then it should have found my account name", function() {
            
            expect( found ).toBe( "Linked person" );
            
        } );
        
    } );
    
    describe( "Given a query for favourite reads", function() {
        
        var found;
        beforeEach( function() {
            
            found = doc.query("ex:favouriteReads");
            
        } );
        
        it( "Then it should have returned a query object", function() {
            
            expect( found ).toBeTruthy();
            
        } );
        
    } );
    
    describe( "Given a query for favourite reads' author", function() {
        
        var found;
        beforeEach( function() {
            
            found = doc.query("ex:favouriteReads").query("so:author").value;
            
        } );
        
        it( "Then the author query should have executed against the result of the favouriteReads query and returned the first value", function() {
            
            expect( found ).toBe( "Iain M Banks" );
            
        } );
        
    } );
    
} );