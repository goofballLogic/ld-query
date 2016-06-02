( function( x ) {
 
    if( typeof module === "object" && module.exports ) {
        
        module.exports = x;
        
    } else {

        window.LD = x; 
        
    }

}( function( dataContext, context ) {

    // create a function which de-aliases each key in the context object in turn
    var expand = Object.keys( context )
        // for each key, start with the function so far and the alias we want to de-alias
        .reduce( function( prior, alias ) {
            
            // create a regex for this alias    
            var expr = new RegExp( "^" + alias + ":", "g" );
            // return a new master function to process the property name 
            return function( propName ) {
                
                // if there was already a de-aliasing function built-up, call it first
                if ( prior ) { propName = prior( propName ); }
                // then return the result of de-aliasing this alias
                return ( propName || "" ).replace( expr, context[ alias ] );
            
                
            }
        
        }, null );
    
    function ldQuery( data, path ) {
        
        this.dataContext = data;
        Object.defineProperty( this, "length", { 
            
            value: 1 
            
        } );
        Object.defineProperty( this, "value", {
            
            get: function() {
                
                path = expand( path );
                return this.dataContext[ 0 ][ path ][ 0 ][ "@value" ];
                
            } 
            
        } );
        
    }
    ldQuery.prototype.query = function( path ) {
        
        return new ldQuery( this.dataContext, path );

    };
    return new ldQuery( dataContext );

} ) );
    
