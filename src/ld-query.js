( function( x ) {
 
    if( typeof module === "object" && module.exports ) {
        
        module.exports = x;
        
    } else {

        window.LD = x; 
        
    }

}( function( dataContext, context ) {

    // a fallback for missing Array.isArray
    var isArray = Array.isArray || function( arg ) {
        
        return Object.prototype.toString.call( arg ) === "[object Array]";
    
    };
    
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

    // seek a node which passess the test for the path to the node
    function seek( json, assessPath, path ) {
        
        path = path || [];
        if ( !json ) { return null; }
        if ( typeof json !== "object" ) { return null; }
        if ( isArray( json ) ) {
            
            for( var i = 0; i < json.length; i++ ) {
                
                var foundInItem = seek( json[ i ], assessPath, path.concat( [ i ] ) );
                if ( foundInItem ) { return foundInItem; }
                
            }
            
        } else {
            
            for( var key in json ) {
    
                var proposedPath = path.concat( [ key ] );
                if ( assessPath( proposedPath ) ) { 
                    
                    var found = json[ key ];
                    return isArray( found ) ? found[ 0 ] : found;
                    
                }
                var foundInProp = seek( json[ key ], assessPath, path.concat( [ key ] ) );
                if ( foundInProp ) { return foundInProp; }

            }
        
        }
        
    }
    
    // select json for this path
    function select( json, path ) {
        
        var steps = path.split( " " ).map( function( step ) { return expand( step ); } );
        if ( !steps.length ) { return { json: null }; }
        var found = seek( 
            
            json,
            function assessPath( nodePath ) {

                var bookmark = 0;
                return steps.every( function( step ) {
                    
                    bookmark = nodePath.indexOf( step, bookmark );
                    return ~bookmark // truthy if step found in the remaining part of node path
                    
                } );

            }
        
        );
        var lastStep = steps[ steps.length - 1 ];
        return {
            
            json: found ? found : null,
            isFinal: !found || lastStep === "@value"
            
        };

    }
    
    function QueryNode( jsonData ) {
    
        this.json = function() { return jsonData; };

    }
    QueryNode.prototype.query = function( path ) {

        // select the json targetted by this path    
        var selection = select( this.json(), path );
        // if the selection is "final" (e.g. @value), just return the json raw
        return selection.isFinal ? selection.json : new QueryNode( selection.json );
        
    };
    QueryNode.prototype.queryAll = function( ) {
        
        
    };
    return new QueryNode( dataContext );

} ) );
    
