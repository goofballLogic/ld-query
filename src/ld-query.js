( function( x ) {

    if( typeof module === "object" && module.exports ) {

        module.exports = x;

    } else {

        window.LD = x;

    }

}( function( contextOrData, context ) {

    // if only the first parameter is supplied, then use it as the context and return a factory function
    // to create documents
    var asFactory = !context;
    context = context || contextOrData;

    // a fallback for missing Array.isArray
    var isArray = Array.isArray || function( arg ) {

        return Object.prototype.toString.call( arg ) === "[object Array]";

    };

    // this builds a set of nested functions which are capable of expanding namespace alises to full prefixes
    // if two parameters are provided then use the second parameter, otherwise use the first parameter.
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

    function testObjectMatches( json, clause ) {

        var val = json[ clause.where ];
        if ( !val ) { return false; }
        if ( isArray( val ) ) {

            return !!~val.indexOf( clause.value );

        }

        return val === clause.value;

    }

    function seekInObject( json, remainingMatchers, isSeekAll, found ) {

        var currentMatcher = remainingMatchers[ 0 ];
        if ( currentMatcher.where ) {

            // if the current matcher is a 'where' evaluate against the json itself
            if ( testObjectMatches( json, currentMatcher ) ) {

                if ( remainingMatchers.length === 1 ) { found.push( json ); }
                else { seek( json, remainingMatchers.slice( 1 ), isSeekAll, found ); }

            }

        } else {

            // if the current matcher is a 'path' then evaluate against the fields of the json
            for( var prop in json ) {

                var propValue = json[ prop ];
                if ( prop === currentMatcher.path ) {

                    if ( remainingMatchers.length === 1 ) { found.push( propValue ); }
                    else { seek( propValue, remainingMatchers.slice( 1 ), isSeekAll, found ); }

                } else if ( remainingMatchers.length ) {

                    seek( propValue, remainingMatchers, isSeekAll, found );

                }

            }

        }

    }

    function seek( json, remainingMatchers, isSeekAll, found ) {

        if ( !isSeekAll && found.length ) { return; }
        if ( isArray( json ) ) {

            for( var index = 0; index < json.length; index++ ) {

                seek( json[ index ], remainingMatchers, isSeekAll, found );

            }

        } else if ( typeof json === "object" ) {

            seekInObject( json, remainingMatchers, isSeekAll, found );

        }

    }

    function createMatchersFromPath( path ) {

        var matchers = [];
        var remainder = path;
        // parse paths and clauses as separate objects from the path supplied
        while ( remainder.length > 0 ) {

            // try and extract an [@attribute=value] part from the remainder of the string
            var where = /^\[(.+?)=(.+?)\](.*)/.exec( remainder );
            if ( where ) {

                matchers.push( { where : where[ 1 ].trim(), value: expand( where[ 2 ].trim() ) } );
                remainder = ( where[ 3 ] || "" ).trim();

            } else {

                // if no 'where' found, extract a path from the remainder of the string
                var path = /^(.+?)( .*|\[.*)/.exec( remainder );
                matchers.push( { path: expand( path && path[ 1 ] || remainder ) } );
                remainder = path && path[ 2 ] && path[ 2 ].trim() || "";

            }

        }

        return matchers;

    }

    // select json for this path
    function select( json, path, isSelectAll ) {

        var matchers = createMatchersFromPath( path.trim() );
        if ( !matchers.length ) { return { json: null }; }

        var lastStep = matchers[ matchers.length - 1 ].path;
        var noMatch = isSelectAll ? [] : null;
        var found = [];
        seek( json, matchers, isSelectAll, found );
        found = isSelectAll ? found : found[ 0 ];
        return {

            json: found,
            isFinal: ( found === noMatch ) || !!~[ "@id", "@index", "@value" ].indexOf( lastStep )

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
        var selections = select( this.json(), path, true );
        // if the result is "final" (e.g. @value), return an array of the raw json
        return selections.isFinal ? selections.json : selections.json.map( buildQueryNode );

    };

    if ( asFactory ) {

        // if one parameter was supplied, return the factory function
        return function( dataContext ) {

            return new QueryNode( dataContext );

        }

    } else {

        // if two parameters were supplied, return the QueryNode directly
        return new QueryNode( contextOrData );

    }

} ) );
