/*global LD, expect*/

describe( "Upon calling LD with data about me and my favourite books, and a context", function() {
    
    var doc;
    
    beforeEach( function() {
        
        doc = LD( this.data, {
            
            "so": "http://schema.org/",
            "foaf": "http://xmlns.com/foaf/0.1/",
            "ex": "http://www.example.org#"
            
        } );         
        
    } );
    
    it( "should have created an ld-query object", function() {
        
        expect( doc ).toBeTruthy();
        
    } );
    
    describe( "Query for first name node", function() {
        
        var found;
        beforeEach( function() {
            
            found = doc.query( "so:firstName" );
            
        } );
        
        it( "should have found one node", function() {
            
            expect( found.length ).toBe( 1 );
            
        } );
        
    } );
    
    describe( "Query for first name", function() {
        
        var found;
        beforeEach( function() { 
            
            found = doc.query( "foaf:firstName" ).value;
            
        } );
        
        it( "should have found my first name", function() {
            
            expect( found ).toBe( "Andrew" );
            
        } );
        
    } );
    
    describe( "Query for my description", function() {
    
        var found;
        beforeEach( function() {
        
            found = doc.query("so:description").value;
            
        } );
        
        it( "should have found my account name", function() {
            
            expect( found ).toBe( "Linked person" );
            
        } );
        
    } );
    
} );