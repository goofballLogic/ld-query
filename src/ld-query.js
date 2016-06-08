( function( x ) {
 
    if( typeof module === "object" && module.exports ) {
        
        module.exports = x;
        
    } else {

        window.LD = x; 
        
    }

}( function( dataContext, context ) {

    // this builds a set of nested functions which are capable of expanding namespace alises to full prefixes
    var expand = Object.keys( context )

        // for each alias (e.g. "so"), create a function to add to our chain
        .reduce( function( prior, alias ) {
            
            // create a regex for this alias    
            var expr = new RegExp( "^" + alias + ":", "g" );
            
            // return a new function to process the property name 
            return function( propName ) {
                
                // if there are already functions in the chain, call them first
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
                
                path = expand( path ); // expand our prefix to a full property name
                return this.dataContext[ 0 ][ path ][ 0 ][ "@value" ];
                
            } 
            
        } );
        
    }
    ldQuery.prototype.query = function( path ) {
        
        return new ldQuery( this.dataContext, path );

    };
    return new ldQuery( dataContext );

} ) );
    
