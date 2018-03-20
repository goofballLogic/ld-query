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

    /*

        Bare property names are ones which aren't qualified with an alias or namespace
        For example, the following are considered qualified:
            ex:friendCount
            http://schema.org/name
        And the following are considered not qualified:
            name
            author

    */
    var barePropertyNamePattern = /^([^:]+)$/;

    /*

        Non-expandable property names are ones which shouldn't be expanded by replacing aliases and pre-pending @vocab
        For example, the following are non-expandable property names:
            @list
            @id
        And the folowing are expandable property names:
            ex:friendCount
            name

    */
    var nonExpandablePropertyNames = /@.*/;

    /*
        Non-expandable value property names are the names of properties whose values should not be expanded by replacing aliases or prepending with @vocab
        For example, the following are non-expandable value property names:
            @list
            @index
        And the following are expandable value property names:
            @id
            @type
            ex:friendCount
            http://schema.org/name

    */
    var nonExpandableValuePropNamePattern = /@(?!type|id).*/;

    var stepCache = {};

    // this builds a set of nested functions which are capable of expanding namespace alises to full prefixes
    // if two parameters are provided then use the second parameter, otherwise use the first parameter.
    var expanders = Object.keys( context )

        // for each alias (e.g. "so"), create a function to add to our chain
        .reduce( function( ret, maybeAlias ) {

            var isVocab = maybeAlias === "@vocab";

            // create a regex for this alias or @vocab
            var pattern = isVocab
                ? barePropertyNamePattern // look for bare properties
                : new RegExp( "^" + maybeAlias + ":", "g" ); // look for the alias

            // what to replace it with
            var replacement = isVocab
                ? context[ "@vocab" ] + "$1" // just prepend the @vocab
                : context[ maybeAlias ]; // this replaces the alias part

            // return a new function to process the property name
            ret.push( function( propName ) {

                // return the result of de-aliasing this alias
                return ( propName || "" ).replace( pattern, replacement );

            });

            return ret;

        }, [] );

    var expand = function( propName ) {

        // if it shouldn't be expanded, bail out
        if ( nonExpandablePropertyNames.test( propName ) ) {

            return propName;

        }

        // Otherwise apply prefix expansions in order
        for ( var ii = 0; ii < expanders.length; ii++ ) {

            propName = expanders[ ii ]( propName );

        }

        return propName;
    };

    function arrayRange( arr ) {

        var len = arr.length;

        var list = [];

        if ( 0 < len ) {

            while ( len-- ) {

                list.push(len);

            }

        }

        return list;
    }

    function StackFrame( parent, key, ctx ) {

        var ret;
        if ( isArray( ctx ) ) {

            if ( "@type" === key ) {

                ret = {
                    type: "leaf",
                    context: ctx,
                    index: -1,
                    key: key,
                    items: []
                };

            } else {

                ret = {
                    type: "array",
                    context: ctx,
                    index: -1,
                    key: key,
                    items: arrayRange(ctx)
                };

            }

        } else if ( "object" === typeof ctx ) {

            var keys = Object.keys(ctx);
            keys.reverse();
            ret = {
                type: "object",
                context: ctx,
                index: -1,
                key: key,
                items: keys
            };

        } else {

            ret = {
                type: "leaf",
                context: ctx,
                index: -1,
                key: key,
                items: []
            }

        }

        if ( "array" === parent.type ) {

            ret.index = key;
            ret.key = parent.key;

        }

        return ret;
    }

    function walk(doc, state, stepf) {
        var stopped = false;
        var stop = function( v ) {

            stopped = true;
            return v;

        };

        var stack = [ StackFrame( {}, "#document", doc ) ];
        var stepId = 0;
        var path = [{
            id: stepId++,
            type: "object",
            context: undefined,
            key: "#document",
            value: doc
        }];

        while ( 0 < stack.length ) {

            var frame = stack[ stack.length - 1 ];
            var items = frame.items;

            if ( 0 === items.length ) {

                if ( "array" !== frame.type ) { path.pop(); }
                stack.pop();
                continue;

            }

            var item = items.pop();
            var value = frame.context[ item ];
            var newFrame = StackFrame( frame, item, value );

            if ( "array" === newFrame.type ) {

                stack.push( newFrame );
                continue;

            }

            path.push({
                id: stepId++,
                type: newFrame.type,
                context: frame.context,
                key: newFrame.key,
                index: newFrame.index,
                value: value
            });

            state = stepf( state, path, stop );

            if ( stopped ) {

                break;

            } else if ( "leaf" === newFrame.type ) {

                path.pop();

            } else {

                stack.push( newFrame );

            }
        }

        return state;
    }

    function cachedWalk( paths, state, stepf ) {

        var stopped = false;
        var stop = function( v ) {

            stopped = true;
            return v;

        };

        var path;
        for ( var ii = 0; ii < paths.length; ii++ ) {

            state = stepf( state, paths[ ii ], stop );
            if ( stopped ) { break; }

        }
        return state;

    }

    function testPathKey( nodePathEntry, stepKey, stepValue ) {

        var pathValue = nodePathEntry[ stepKey ];
        if ( !pathValue ) { return false; }
        if ( isArray( stepValue ) ) {

            var pathValueArray = isArray(pathValue) ? pathValue : [pathValue];
            for ( var i = 0; i < stepValue.length; i++ ) {

                if (-1 === pathValueArray.indexOf( stepValue[ i ] ) ) {

                    return false;

                }

            }
            return true;

        }
        else if ( isArray( pathValue ) ) {

            return ~pathValue.indexOf(stepValue)

        }
        return pathValue === stepValue;

    }

    function findNextPathMatch( nodePath, start, step ) {

        var i = start;
        for ( var i = start; -1 < i; i-- ) {

            var node = nodePath[ i ];
            var nodeVal = node.value;
            var stepPath = step.path;
            // check whether all keys in step ( path & @attributes ) match
            var match = false;

            if ( "undefined" === typeof stepPath || stepPath === node.key ) {

                match = true;

                var tests = step.tests;
                for ( var t = 0; t < tests.length; t++ ) {

                    var test = tests[ t ];
                    if ( !testPathKey( nodeVal, test.key, test.expected ) ) {

                        match = false;
                        break;

                    }

                }

            }

            if ( match ) { break; }

        }

        return i;

    }

    function assessPathForSteps( steps ) {
        steps = steps || [];

        return function assessPath( nodePath ) {
            if ( !nodePath ) { return false; }

            var bookmark = nodePath.length;
            var directChild = false;
            var first = true;

            for ( var i = 0; i < steps.length; i++ ) {

                var step = steps[ i ];

                if ( step.directChild ) {

                    directChild = true;
                    continue;

                } else {

                    var start = bookmark - 1;
                    // find the next step starting after the bookmarked offset
                    var found = findNextPathMatch( nodePath, start, step );
                    if ( first ) {

                        if ( found !== start ) {

                            return false;

                        }

                        first = false;

                    }

                    // if the directChild flag is set, only pass if the found is beside the last bookmark...
                    if ( directChild ) {

                        if ( bookmark !== found + 1 ) { return false; }
                        directChild = false;

                    }

                    bookmark = found;

                    // ...otherwise any match is fine
                    if ( -1 === bookmark ) { return false; }

                }

            }

            return true;

        };

    }

    function selectStep( steps, isSeekAll ) {

        var assess = assessPathForSteps( steps );
        return function( result, path, stop ) {

            if ( assess( path ) ) {

                var found;
                if ( steps[0].path === "@type" ) {

                    found = path[ path.length - 2 ].value["@type"];

                } else {

                    found = path[ path.length - 1 ].value;

                }

                if ( !isSeekAll ) {

                    return stop(found);

                }
                result.push( found );

            }

            return result;

        };

    }

    function collectPaths( json ) {

        return walk( json, [], function( state, path ) {

            state.push( [].concat( path ) );
            return state;

        } );

    }

    function extractStep( path, steps ) {

        // try and extract a 'where' [@attribute=value] part from the start of the string
        var wherePart = /^(\s*\*?)\[(.+?)=(.+?)\](.*)/.exec( path );
        if ( wherePart ) {

            if ( wherePart[ 1 ] ) {

                steps.push( { id: -1, path: undefined, directChild: false, tests: []} );

            }
            var step = { key : wherePart[ 2 ].trim(), value: wherePart[ 3 ].trim() };
            if ( !nonExpandableValuePropNamePattern.test( step.key ) ) {

                step.value = expand( step.value );

            }
            steps.push( step );
            return ( wherePart[ 4 ] || "" );

        }
        // try and extract a > part from the start of the string
        var directChildPart = /^\s*>\s*(.*)/.exec( path );
        if ( directChildPart ) {

            steps.push( { id: -1, path: undefined, directChild: true, tests: [] } );
            return directChildPart[ 1 ];

        }
        // try and extract a path from the start of the string
        var pathPart = /^(.+?)( .*|\[.*|>.*)/.exec( path );
        if ( pathPart ) {

            steps.push( {
                id: -1,
                path: expand( pathPart[ 1 ].trim()),
                directChild: false,
                tests: []
            } );
            return pathPart[ 2 ];

        }
        // assume whatever is left is a path
        steps.push( {
            id: -1,
            path: expand( path.trim() ),
            directChild: false,
            tests: []
        } );
        return "";

    }

    function getSteps( state, path ) {

        var steps;
        var shouldCache = state.cacheSteps;

        if ( shouldCache ) {

            steps = stepCache[path];
            if (steps) { return steps; }

        }

        // cut the path up into separate pieces;
        var separatedSteps = [];
        var remainder = path.trim();
        while ( remainder.length > 0 ) {

            remainder = extractStep( remainder, separatedSteps );

        }

        // create an path alias '#document' to represent the root of the current QueryNode json
        var stepId = 0;
        steps = [ { id: stepId++, path: "#document", directChild: false, tests: [] } ];
        // process the extracted steps, to combine 'where' steps into keys on path steps.
        separatedSteps.forEach( function( step ) {

            if ( step.key ) {

                steps[ 0 ].tests.push({ key: step.key, expected: step.value });

            } else {

                // store steps for right-to-left matching
                step.id = stepId++;
                steps.unshift( step );

            }

        } );

        if ( shouldCache ) {

            stepCache[path] = steps;

        }

        return steps;

    }

    function getCachedPaths( state, json ) {

        if ( !state.cachePaths ) {

            return null;

        }

        var paths = state.paths;
        if ( !paths ) {

            paths = state.paths = collectPaths( json );

        }

        return paths;

    }

    // select json for this path

    function select( state, json, path, isSeekAll ) {

        var steps = getSteps( state, path );
        if ( !steps.length ) { return { json: null }; }

        var paths = getCachedPaths( state, json );
        var walker = !!paths ? cachedWalk : walk;
        var found = walker( paths || json,
                            isSeekAll ? [] : null,
                            selectStep( steps, isSeekAll ) );

        var lastStep = steps[ 0 ].path;
        return {

            json: found,
            isFinal: ( isSeekAll ? found.length === 0 : found === null ) ||
                !!~[ "@id", "@index", "@value", "@type" ].indexOf( lastStep )

        };

    }

    function findIn( parent, self ) {

        var pathToSelf = parent._state.paths.filter( function( path ) {

            return path[ path.length - 1 ].value === self;

        } )[ 0 ];
        return pathToSelf ? pathToSelf[ pathToSelf.length - 2 ] : null;

    }

    function QueryNode( jsonData, parent ) {

        this.json = function() { return jsonData; };
        var state = this._state = { cachePaths: true, paths: null };
        this.parent = function() {

            var found = findIn( parent, jsonData );
            if( found === parent.json() ) return parent;
            if( found ) { return new QueryNode( found.value, parent ); }

        }
        if ( parent ) {

            var pstate = parent._state;

            state.cachePaths = pstate.cachePaths;

        }
    }

    function buildQueryNode( parent ) {

        return function( json ) { return new QueryNode( json, parent ); }

    }

    QueryNode.prototype.withPathCaching = function( cache ) {
        cache = !!cache;
        this._state.cachePaths = cache;
        cache || ( this._state.paths = null );
        return this;

    }

    QueryNode.prototype.query = function( selector ) {

        // select the json targetted by this selector
        var selection = select( this._state, this.json(), selector );
        // if the result is "final" (e.g. @value), just return the json raw
        return selection.isFinal ? selection.json : new QueryNode( selection.json, this);

    };
    QueryNode.prototype.queryAll = function( selector ) {

        // select the json targetted by this selector
        var selections = select( this._state, this.json(), selector, true );

        // if the result is "final" (e.g. @value), return an array of the raw json
        return selections.isFinal ? selections.json
            : selections.json.map( buildQueryNode( this ) );

    };

    if ( asFactory ) {

        // if one parameter was supplied, return the factory function
        return function( dataContext ) {

            return new QueryNode( dataContext );

        };

    } else {

        // if two parameters were supplied, return the QueryNode directly
        return new QueryNode( contextOrData );

    }

} ) );
