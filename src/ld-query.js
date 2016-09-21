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

    var hasChildren = function( entry ) {

        return typeof entry === "object" || isArray( entry );

    };

    // recursive seek method
    function seek( json, remainingMatchers, isSeekAll, matches ) {

        matches = matches || [];
        var currentMatcher = remainingMatchers[ 0 ];

        if ( isArray( json ) ) {

            for( var i = 0; i < json.length; i++ ) {

                seek( json[ i ], remainingMatchers, isSeekAll, matches );

            }

        } else if ( typeof json === "object" ) {

            if ( currentMatcher( null, json ) ) {

                if ( remainingMatchers.length === 1 ) {

                    matches.push( json );

                } else {

                    seek( json, remainingMatchers.slice( 1 ), isSeekAll, matches );

                }

            }

            for( var prop in json ) {

                var propValue = json[ prop ];
                if ( currentMatcher( prop, propValue ) ) {

                    if ( remainingMatchers.length === 1 ) {

                        matches.push( propValue );

                    } else if ( hasChildren( propValue ) ) {

                        seek( propValue, remainingMatchers.slice( 1 ), isSeekAll, matches);

                    }

                } else if ( hasChildren( propValue ) ) {

                    seek( propValue, remainingMatchers, isSeekAll, matches );

                }

            }

        }

        return isSeekAll ? matches : matches[ 0 ];

    }

    function pathMatcher( entry ) {

        var expandedEntry = expand( entry );
        return function( prop ) { return prop === expandedEntry; };

    }

    function whereMatcher( entry ) {

        var innerQueryParts = /^\[(.*)\]$/.exec( entry )[ 1 ].split( "=" );
        var attribute = innerQueryParts[ 0 ].trim();
        var value = ( innerQueryParts[ 1 ] || "" ).trim();

        return function( prop, propValue ) {

            var found = select( propValue, attribute + " @value", true ).json;
            if ( !value ) { return found.length; }
            return found.indexOf( value ) >= 0;

        };

    }

    function matchersForPathElements( pathElements ) {

        return pathElements.map( function( element ) {

            return element.startsWith( "[" ) ? whereMatcher( element ): pathMatcher( element );

        } );

    }

    function splitPath( path ) {

        var pieces = [];
        var remainder = path;
        while ( remainder.length > 0 ) {

            var where = /^(\[.+?\])(.*)/.exec( remainder );
            if ( where ) {

                pieces.push( where[ 1 ] );
                remainder = ( where[ 2 ] || "" ).trim();

            } else {

                var splitAt = remainder.search( / |\[/ );
                pieces.push( splitAt < 0 ? remainder : remainder.substring( 0, splitAt ) );
                remainder = splitAt < 0 ? "" : remainder.slice( splitAt ).trim();

            }

        }
        return pieces;

    }

    function select( json, path, isSelectAll ) {

        var noMatch = isSelectAll ? [] : null;
        var pathElements = splitPath( path );
        var matchers = matchersForPathElements( pathElements );
        if ( !matchers.length ) { return { json: null }; }
        var found = seek( json, matchers, isSelectAll );
        var lastStep = pathElements[ pathElements.length - 1 ];
        return {

            json: found,
            isFinal: ( found === noMatch ) || lastStep === "@value"

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
    return new QueryNode( dataContext );

} ) );
