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
                
            };
        
        }, null );

    
    function seek( json, assessPath, isSeekAll, path ) {

        var acc = isSeekAll ? [] : null;
        path = path || [];
        if ( !json ) { return acc; }
        if ( assessPath( path ) ) {

            if ( !isSeekAll ) { return json; }
            acc.push( json );
            
            
        } else if ( isArray( json ) ) {
            
            for( var i = 0; i < json.length; i++ ) {
                
                var found = seek( json[ i ], assessPath, isSeekAll, path )
                if ( found ) {

                    if ( !isSeekAll ) { return found; }
                    acc = acc.concat( found );

                }
                
            }
            
        } else if ( typeof json === "object" ) {
            
            for( var prop in json ) {
                
                var propPath = path.concat( prop );
                var found = seek( json[ prop ], assessPath, isSeekAll, propPath )
                if ( found ) {
                    
                    if( !isSeekAll ) { return found; }
                    acc = acc.concat( found );
                    
                }
                
            }
            
        }
        return acc;

    }
    
    function assessPathForSteps( steps ) {

        return function assessPath( nodePath ) {

            var bookmark = 0;
            if ( !nodePath ) { return false; }
            return steps.every( function( step ) {
                
                // find the next step starting from the bookmarked offset
                bookmark = nodePath.indexOf( step, bookmark );
                // the test passes if the step was found
                return ~bookmark;
                
            } );
            
        };

    }
            
    // select json for this path
    function select( json, path ) {
        
        var steps = path.split( " " ).map( expand );
        if ( !steps.length ) { return { json: null }; }
        var found = seek( json, assessPathForSteps( steps ) );
        var lastStep = steps[ steps.length - 1 ];
        return {
            
            json: found,
            isFinal: ( found === null ) || lastStep === "@value"
            
        };

    }
    
    // select jsons for this path
    function selectAll( json, path ) {
        
        var steps = path.split( " " ).map( expand );
        if ( !steps.length ) { return { json: [] }; }
        var found = seek( json, assessPathForSteps( steps ), true );
        var lastStep = steps[ steps.length - 1 ];
        return {
            
            json: found,
            isFinal: ( found === [] ) || lastStep === "@value"
            
        };
        
    }
    function QueryNode( jsonData ) {
    
        this.json = function() { return jsonData; };

    }
    
    function buildQueryNode( jsonData ) { return new QueryNode( jsonData ); }
    
    QueryNode.prototype.query = function( path ) {

        // select the json targetted by this path    
        var selection = select( this.json(), path );
        // if the result is "final" (e.g. @value), just return the json raw
        return selection.isFinal ? selection.json : new QueryNode( selection.json );
        
    };
    QueryNode.prototype.queryAll = function( path ) {
        
        // select the json targetted by this path
        var selections = selectAll( this.json(), path );
        // if the result is "final" (e.g. @value), return an array of the raw json
        return selections.isFinal ? selections.json : selections.json.map( buildQueryNode );

    };
    return new QueryNode( dataContext );

} ) );
    
