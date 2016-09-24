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

    function addAttributesToPath( json, path ) {

        if ( typeof json === "object" ) {

            for( var prop in json ) {

                if ( prop.charAt( 0 ) === "@" ) { path[ prop ] = json[ prop ]; }

            }

        }

    }

    function seek( json, assessPath, isSeekAll, path ) {

        var acc = isSeekAll ? [] : null;
        path = path || [];
        if ( !json ) { return acc; }
        addAttributesToPath( json, path[ path.length - 1 ] );
        if ( assessPath( path ) ) {

            if ( !isSeekAll ) { return json; }
            acc.push( json );


        } else if ( isArray( json ) ) {

            for( var i = 0; i < json.length; i++ ) {

                var found = seek( json[ i ], assessPath, isSeekAll, [].concat( path ) )
                if ( found ) {

                    if ( !isSeekAll ) { return found; }
                    acc = acc.concat( found );

                }

            }

        } else if ( typeof json === "object" ) {

            for( var prop in json ) {

                var propPath = path.concat( { path: prop } );
                var found = seek( json[ prop ], assessPath, isSeekAll, propPath )
                if ( found ) {

                    if( !isSeekAll ) { return found; }
                    acc = acc.concat( found );

                }

            }

        }
        return acc;

    }

    function testClauses( nodePathEntry, clauses ) {

        return clauses.every( function( clause ) {

            var entry = nodePathEntry[ clause.where ];
            if ( isArray( entry ) ) {

                return ~entry.indexOf( clause.value );

            }
            return entry === clause.value;

        } );

    }

    function assessPathForSteps( steps ) {

        return function assessPath( nodePath ) {

            var bookmark = 0;
            var direct = false;
            if ( !nodePath ) { return false; }
            var pathParts = nodePath.map( function( nodePathItem ) { return nodePathItem.path; } );
            return steps.every( function( step ) {

                if ( step.path ) {

                    // find the next step starting from the bookmarked offset
                    var found = pathParts.indexOf( step.path, bookmark );
                    if ( direct ) {

                        if ( bookmark + 1 !== found) { return false; }
                        direct = false;
                    }
                    bookmark = found;
                    if ( ~bookmark ) {

                        // the test passes if the step was found
                        // TODO this is only testing the first child; should pass for any child
                        return step.clauses ? testClauses( nodePath[ bookmark ], step.clauses ) : true;

                    }
                    return false;

                } else if ( step.direct ) {

                    direct = true;
                    return true;

                }

            } );

        };

    }

    function extractStep( path, steps ) {

        // try and extract an [@attribute=value] part from the start of the string
        var wherePart = /^\[(.+?)=(.+?)\](.*)/.exec( path );
        if ( wherePart ) {

            steps.push( { where : wherePart[ 1 ].trim(), value: expand( wherePart[ 2 ].trim() ) } );
            return ( wherePart[ 3 ] || "" ).trim();

        }
        // try and extract a > part from the start of the string
        var directPart = /^>(.*)/.exec( path );
        if ( directPart ) {

            steps.push( { direct: true } );
            return directPart[ 1 ].trim();

        }
        // try and extract a path from the start of the string
        var pathPart = /^(.+?)( .*|\[.*)/.exec( path );
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
        // process the extracted steps, to combine 'where' steps into a 'clauses' entry of path steps.
        var steps = [ { path: "node" } ];
        separatedSteps.forEach( function( step ) {

            if ( step.where ) {

                var lastStep = steps[ steps.length - 1 ];
                var clauses = lastStep.clauses = lastStep.clauses || [];
                clauses.push( step );

            } else {

                steps.push( step );

            }

        } );

        return steps;

    }

    // select json for this path
    function select( json, path, isSelectAll  ) {

        var steps = getSteps( path );
        if ( !steps.length ) { return { json: null }; }
        var found = seek( json, assessPathForSteps( steps ), isSelectAll, [ { path: "node" } ] );
        var lastStep = steps[ steps.length - 1 ].path;
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
