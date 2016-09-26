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

    // given a nodePath 'path' entry, store any values of the object starting with an @ against it
    function addObjectAttributesToPath( json, path ) {

        if ( typeof json === "object" ) {

            for( var prop in json ) {

                if ( prop.charAt( 0 ) === "@" ) { path[ prop ] = ( path[ prop ] || [] ).concat( json[ prop ] ); }

            }

        }

    }

    function seekInObject( obj, assessPath, isSeekAll, path ) {

        var acc = isSeekAll ? [] : null;
        for( var prop in obj ) {

            var propPath = [ { path: prop } ].concat( path );
            var found = seek( obj[ prop ], assessPath, isSeekAll, propPath );
            if ( found ) {

                if( !isSeekAll ) { return found; }
                acc = acc.concat( found );

            }

        }
        return acc;

    }

    function seekInArray( array, assessPath, isSeekAll, path ) {

        var acc = isSeekAll ? [] : null;
        for( var i = 0; i < array.length; i++ ) {

            // when recursing through an array, make sure the most recent path entry is cloned
            // since it is mutated by 'addObjectAttributesToPath'
            var pathClone = [].concat( path );
            pathClone[ 0 ] = { path: pathClone[ 0 ].path };
            var found = seek( array[ i ], assessPath, isSeekAll, pathClone );
            if ( found ) {

                if ( !isSeekAll ) { return found; }
                acc = acc.concat( found );

            }

        }
        return acc;

    }

    function seek( json, assessPath, isSeekAll, path ) {

        var found;
        path = path || [];
        if ( !json ) { return acc; }
        addObjectAttributesToPath( json, path[ 0 ] );

        if ( assessPath( path ) ) {

            found = json;

        } else if ( isArray( json ) ) {

            found = seekInArray( json, assessPath, isSeekAll, path );

        } else if ( typeof json === "object" ) {

            found = seekInObject( json, assessPath, isSeekAll, path );

        }

        return found;

    }

    function testPathKey( nodePathEntry, stepKey, stepValue ) {

        var pathValue = nodePathEntry[ stepKey ];
        if ( !pathValue ) { return false; }
        if ( isArray( stepValue ) ) {

            return stepValue.every( function( value ) {

                return ~[].concat( pathValue ).indexOf( value );

            } );

        }
        return pathValue === stepValue;

    }

    function findNextPathMatch( nodePath, start, step ) {

        // start at the previous bookmarked position in the nodePath
        for ( var i = start; i < nodePath.length; i++ ) {

            // check whether all keys in step ( path & @attributes ) match
            var test = Object.keys( step ).every( function( key ) {

                return testPathKey( nodePath[ i ], key, step[ key ] );

            } );
            if ( test ) { return i; }

        }
        return -1;

    }

    function assessPathForSteps( steps ) {

        return function assessPath( nodePath ) {

            var bookmark = 0;
            var direct = false;
            if ( !nodePath ) { return false; }
            return steps.every( function( step ) {

                if ( step.path ) {

                    // find the next step starting from the bookmarked offset
                    var found = findNextPathMatch( nodePath, bookmark, step );
                    // if the direct flag is set, only pass if the found is beside the last bookmark...
                    if ( direct ) {

                        if ( bookmark + 1 !== found) { return false; }
                        direct = false;

                    }
                    bookmark = found;
                    // ...otherwise any match is fine
                    return ~bookmark;

                } else if ( step.direct ) {

                    direct = true;
                    return true;

                }

            } );

        };

    }

    function extractStep( path, steps ) {

        // try and extract a 'where' [@attribute=value] part from the start of the string
        var wherePart = /^\[(.+?)=(.+?)\](.*)/.exec( path );
        if ( wherePart ) {

            steps.push( { key : wherePart[ 1 ].trim(), value: expand( wherePart[ 2 ].trim() ) } );
            return ( wherePart[ 3 ] || "" ).trim();

        }
        // try and extract a > part from the start of the string
        var directPart = /^>(.*)/.exec( path );
        if ( directPart ) {

            steps.push( { direct: true } );
            return directPart[ 1 ].trim();

        }
        // try and extract a path from the start of the string
        var pathPart = /^(.+?)( .*|\[.*|>.*)/.exec( path );
        if ( pathPart ) {

            steps.push( { path: expand( pathPart[ 1 ] ) } );
            return pathPart[ 2 ].trim();

        }
        // assume whatever is left is a path
        steps.push( { path: expand( path ) } );
        return "";

    }

    function getSteps( path ) {

        // cut the path up into separate pieces;
        var separatedSteps = [];
        var remainder = path;
        while ( remainder.length > 0 ) {

            remainder = extractStep( remainder, separatedSteps );

        }

        // create an path alias '#document' to represent the root of the current QueryNode json
        var steps = [ { path: "#document" } ];
        // process the extracted steps, to combine 'where' steps into keys on path steps.
        separatedSteps.forEach( function( step ) {

            if ( step.key ) {

                var lastStep = steps[ 0 ];
                lastStep[ step.key ] = ( lastStep[ step.key ] || [] ).concat( step.value );

            } else {

                // store steps for right-to-left matching
                steps.unshift( step );

            }

        } );

        return steps;

    }

    // select json for this path
    function select( json, path, isSeekAll ) {

        var steps = getSteps( path );
        if ( !steps.length ) { return { json: null }; }
        var found = seek( json, assessPathForSteps( steps ), isSeekAll, [ { path: "#document" } ] );
        var lastStep = steps[ 0 ].path;
        return {

            json: found,
            isFinal: ( found === null ) || !!~[ "@id", "@index", "@value" ].indexOf( lastStep )

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
