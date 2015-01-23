/**
 * A structure for static configuration options.
 *
 * @module Core
 * @class Config
 */
define( 'core/Config',[],
    function () {
        

        function Config() {}

        /**
         * Define if Errors are logged using errorception.
         *
         * @final
         * @static
         * @property LOG_ERRORS
         * @default true
         *
         */
        Config.LOG_ERRORS = true;

        /**
         * Very small number considered non-zero by WebAudio.
         *
         * @final
         * @static
         * @property ZERO
         * @default 1e-37
         *
         */
        Config.ZERO = parseFloat( '1e-37' );

        /**
         * Maximum number of voices supported
         *
         * @final
         * @static
         * @property MAX_VOICES
         * @default 8
         *
         */
        Config.MAX_VOICES = 8;

        /**
         * Default nominal refresh rate (Hz) for SoundQueue.
         *
         * @final
         * @static
         * @property NOMINAL_REFRESH_RATE
         * @default 60
         *
         */
        Config.NOMINAL_REFRESH_RATE = 60;

        /**
         * Default window length for window and add functionality
         *
         * @final
         * @static
         * @property NOMINAL_REFRESH_RATE
         * @default 512
         *
         */
        Config.WINDOW_LENGTH = 512;

        /**
         * Default Chunk Length for ScriptNodes.
         *
         * @final
         * @static
         * @property CHUNK_LENGTH
         * @default 256
         *
         */
        Config.CHUNK_LENGTH = 256;

        /**
         * Default smoothing constant.
         *
         * @final
         * @static
         * @property CHUNK_LENGTH
         * @default 0.05
         *
         */
        Config.DEFAULT_SMOOTHING_CONSTANT = 0.05;

        return Config;
    } );

/**
 * @module Core
 *
 * @class WebAudioDispatch
 * @static
 */
define( 'core/WebAudioDispatch',[],
    function () {
        
        /**
         * Helper class to dispatch manual syncronized calls to for WebAudioAPI. This is to be used for API calls which can't don't take in a time argument and hence are inherently Syncronized.
         *
         *
         * @method WebAudioDispatch
         * @param {Function} Function to be called at a specific time in the future.
         * @param {Number} TimeStamp at which the above function is to be called.
         * @param {String} audioContext AudioContext to be used for timing.
         */

        function WebAudioDispatch( functionCall, time, audioContext ) {
            if ( !audioContext ) {
                console.warn( "No AudioContext provided" );
                return;
            }
            var currentTime = audioContext.currentTime;
            // Dispatch anything that's scheduled for anything before current time, current time and the next 5 msecs
            if ( currentTime >= time || time - currentTime < 0.005 ) {
                //console.log( "Dispatching now" );
                functionCall();
            } else {
                //console.log( "Dispatching in ", ( time - currentTime ) * 1000 );
                window.setTimeout( function () {
                    //console.log( "Diff at dispatch ", ( time - audioContext.currentTime ) * 1000 );
                    functionCall();
                }, ( time - currentTime ) * 1000 );
            }
        }

        return WebAudioDispatch;
    }
);

/**
 *
 *
 * @module Core
 *
 */
define(
    'core/AudioContextMonkeyPatch',[],function () {
        

        /*
         *  MonkeyPatch for AudioContext. Normalizes AudioContext across browsers and implementations.
         *
         * @class AudioContextMonkeyPatch
         */

        function fixSetTarget( param ) {
            if ( !param ) { // if NYI, just return
                return;
            }
            if ( !param.setTargetAtTime ) {
                param.setTargetAtTime = param.setTargetValueAtTime;
            }
        }
        if ( window.hasOwnProperty( 'webkitAudioContext' ) && !window.hasOwnProperty( 'AudioContext' ) ) {
            window.AudioContext = webkitAudioContext;
            if ( !AudioContext.prototype.hasOwnProperty( 'createGain' ) ) {
                AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
            }
            if ( !AudioContext.prototype.hasOwnProperty( 'createDelay' ) ) {
                AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
            }
            if ( !AudioContext.prototype.hasOwnProperty( 'createScriptProcessor' ) ) {
                AudioContext.prototype.createScriptProcessor = AudioContext.prototype.createJavaScriptNode;
            }
            AudioContext.prototype.internal_createGain = AudioContext.prototype.createGain;
            AudioContext.prototype.createGain = function () {
                var node = this.internal_createGain();
                fixSetTarget( node.gain );
                return node;
            };
            AudioContext.prototype.internal_createDelay = AudioContext.prototype.createDelay;
            AudioContext.prototype.createDelay = function ( maxDelayTime ) {
                var node = maxDelayTime ? this.internal_createDelay( maxDelayTime ) : this.internal_createDelay();
                fixSetTarget( node.delayTime );
                return node;
            };
            AudioContext.prototype.internal_createBufferSource = AudioContext.prototype.createBufferSource;
            AudioContext.prototype.createBufferSource = function () {
                var node = this.internal_createBufferSource();
                if ( !node.start ) {
                    node.start = function ( when, offset, duration ) {
                        if ( offset || duration ) {
                            this.noteGrainOn( when, offset, duration );
                        } else {
                            this.noteOn( when );
                        }
                    };
                }
                if ( !node.stop ) {
                    node.stop = node.noteOff;
                }
                fixSetTarget( node.playbackRate );
                return node;
            };
            AudioContext.prototype.internal_createDynamicsCompressor = AudioContext.prototype.createDynamicsCompressor;
            AudioContext.prototype.createDynamicsCompressor = function () {
                var node = this.internal_createDynamicsCompressor();
                fixSetTarget( node.threshold );
                fixSetTarget( node.knee );
                fixSetTarget( node.ratio );
                fixSetTarget( node.reduction );
                fixSetTarget( node.attack );
                fixSetTarget( node.release );
                return node;
            };
            AudioContext.prototype.internal_createBiquadFilter = AudioContext.prototype.createBiquadFilter;
            AudioContext.prototype.createBiquadFilter = function () {
                var node = this.internal_createBiquadFilter();
                fixSetTarget( node.frequency );
                fixSetTarget( node.detune );
                fixSetTarget( node.Q );
                fixSetTarget( node.gain );
                return node;
            };
            if ( AudioContext.prototype.hasOwnProperty( 'createOscillator' ) ) {
                AudioContext.prototype.internal_createOscillator = AudioContext.prototype.createOscillator;
                AudioContext.prototype.createOscillator = function () {
                    var node = this.internal_createOscillator();
                    if ( !node.start ) {
                        node.start = node.noteOn;
                    }
                    if ( !node.stop ) {
                        node.stop = node.noteOff;
                    }
                    fixSetTarget( node.frequency );
                    fixSetTarget( node.detune );
                    return node;
                };
            }
        }
    } );

/**
 * @module Core
 */
define( 'core/BaseSound',[ 'core/WebAudioDispatch', 'core/AudioContextMonkeyPatch' ], function ( webAudioDispatch ) {
    

    /**
     * Pseudo AudioNode class the encapsulates basic functionality of an Audio Node. To be extended by all other Sound Models
     *
     * @class BaseSound
     * @constructor
     * @requires AudioContextMonkeyPatch
     * @param {AudioContext} [context] AudioContext in which this Sound is defined.
     */
    function BaseSound( context ) {
        /**
         * Web Audio API's AudioContext. If the context passed to the constructor is an AudioContext, a new one is created here.
         *
         * @property audioContext
         * @type AudioContext
         */
        if ( context === undefined || context === null ) {
            console.log( 'Making a new AudioContext' );
            this.audioContext = new AudioContext();
        } else {
            this.audioContext = context;
        }

        bootAudioContext( this.audioContext );

        /**
         * Number of inputs
         *
         * @property numberOfInputs
         * @type Number
         * @default 0
         */
        this.numberOfInputs = 0;

        /**
         * Number of outputs
         *
         * @property numberOfOutputs
         * @type Number
         * @default 0
         */
        Object.defineProperty( this, 'numberOfOutputs', {
            enumerable: true,
            configurable: false,
            get: function () {
                return this.releaseGainNode.numberOfOutputs;
            }
        } );

        /**
         *Maximum number of sources that can be given to this Sound
         *
         * @property maxSources
         * @type Number
         * @default 0
         */
        var maxSources_ = 0;
        Object.defineProperty( this, 'maxSources', {
            enumerable: true,
            configurable: false,
            set: function ( max ) {
                if ( max < 0 ) {
                    max = 0;
                }
                maxSources_ = Math.round( max );
            },
            get: function () {
                return maxSources_;
            }
        } );

        /**
         *Minimum number of sources that can be given to this Sound
         *
         * @property minSources
         * @type Number
         * @default 0
         */
        var minSources_ = 0;
        Object.defineProperty( this, 'minSources', {
            enumerable: true,
            configurable: false,
            set: function ( max ) {
                if ( max < 0 ) {
                    max = 0;
                }
                minSources_ = Math.round( max );
            },
            get: function () {
                return minSources_;
            }
        } );

        /**
         * Release Gain Node
         *
         * @property releaseGainNode
         * @type GainNode
         * @default Internal GainNode
         * @final
         */
        this.releaseGainNode = this.audioContext.createGain();

        /**
         *  If Sound is currently playing.
         *
         * @property isPlaying
         * @type Boolean
         * @default false
         */
        this.isPlaying = false;

        /**
         *  If Sound is currently initialized.
         *
         * @property isInitialized
         * @type Boolean
         * @default false
         */
        this.isInitialized = false;

        /**
         * The input node that the output node will be connected to. <br />
         * Set this value to null if no connection can be made on the input node
         *
         * @property inputNode
         * @type Object
         * @default null
         **/
        this.inputNode = null;

        /**
         * Set of nodes the output of this sound is currently connected to.
         *
         * @property destinations
         * @type Array
         * @default
         **/
        this.destinations = [];

        /**
         * String name of the model.
         *
         * @property modelName
         * @type String
         * @default "Model"
         **/
        this.modelName = 'Model';

        /**
         * Callback for handling progress events thrown during loading of audio files.
         *
         * @property onLoadProgress
         * @type Function
         * @default null
         */
        this.onLoadProgress = null;

        /**
         * Callback for when loading of audio files is done and the the model is initalized.
         *
         * @property onLoadComplete
         * @type Function
         * @default null
         */
        this.onLoadComplete = null;

        /**
         * Callback for when the audio is about to start playing.
         *
         * @property onAudioStart
         * @type Function
         * @default null
         */
        this.onAudioStart = null;

        /**
         * Callback for the audio is about to stop playing.
         *
         * @property onAudioEnd
         * @type Function
         * @default null
         */
        this.onAudioEnd = null;

        this.parameterList_ = [];

        this.connect( this.audioContext.destination );

        function bootAudioContext( context ) {

            var iOS = /(iPad|iPhone|iPod)/g.test( navigator.userAgent );

            function createDummyOsc() {
                //console.log( "Booting ", context );
                bootOsc.start( 0 );
                bootOsc.stop( context.currentTime + 0.0001 );
                window.liveAudioContexts.push( context );
                window.removeEventListener( 'touchstart', createDummyOsc );
            }

            if ( iOS ) {
                if ( !window.liveAudioContexts ) {
                    window.liveAudioContexts = [];
                }
                if ( window.liveAudioContexts.indexOf( context ) < 0 ) {
                    var bootOsc = context.createOscillator();
                    var bootGain = context.createGain();
                    bootGain.gain.value = 0;
                    bootOsc.connect( bootGain );
                    bootGain.connect( context.destination );
                    window.addEventListener( 'touchstart', createDummyOsc );
                }
            }
        }
    }

    /**
     * If the parameter `output` is an AudioNode, it connects to the releaseGainNode.
     * If the output is a BaseSound, it will connect BaseSound's releaseGainNode to the output's inputNode.
     *
     * @method connect
     * @param {AudioNode} destination AudioNode to connect to.
     * @param {Number} [output] Index describing which output of the AudioNode from which to connect.
     * @param {Number} [input] Index describing which input of the destination AudioNode to connect to.
     */
    BaseSound.prototype.connect = function ( destination, output, input ) {
        if ( destination instanceof AudioNode ) {
            this.releaseGainNode.connect( destination, output, input );
            this.destinations.push( {
                'destination': destination,
                'output': output,
                'input': input
            } );
        } else if ( destination.inputNode instanceof AudioNode ) {
            this.releaseGainNode.connect( destination.inputNode, output, input );
            this.destinations.push( {
                'destination': destination.inputNode,
                'output': output,
                'input': input
            } );
        } else {
            console.error( "No Input Connection - Attempts to connect " + ( typeof output ) + " to " + ( typeof this ) );
        }
    };

    /**
     * Disconnects the Sound from the AudioNode Chain.
     *
     * @method disconnect
     * @param {Number} [outputIndex] Index describing which output of the AudioNode to disconnect.
     **/
    BaseSound.prototype.disconnect = function ( outputIndex ) {
        this.releaseGainNode.disconnect( outputIndex );
        this.destinations = [];
    };

    /**
     * Start the AudioNode. Abstract method. Override this method when a Node is defined.
     *
     * @method start
     * @param {Number} when Time (in seconds) when the sound should start playing.
     * @param {Number} [offset] The starting position of the playhead
     * @param {Number} [duration] Duration of the portion (in seconds) to be played
     * @param {Number} [attackDuration] Duration (in seconds) of attack ramp of the envelope.
     */
    BaseSound.prototype.start = function ( when, offset, duration, attackDuration ) {
        if ( typeof when === 'undefined' || when < this.audioContext.currentTime ) {
            when = this.audioContext.currentTime;
        }

        this.releaseGainNode.gain.cancelScheduledValues( when );
        if ( typeof attackDuration !== 'undefined' ) {
            //console.log( "Ramping from " + offset + "  in " + attackDuration );
            this.releaseGainNode.gain.setValueAtTime( 0, when );
            this.releaseGainNode.gain.linearRampToValueAtTime( 1, when + attackDuration );
        } else {
            this.releaseGainNode.gain.setValueAtTime( 1, when );
        }

        var self = this;
        webAudioDispatch( function () {
            self.isPlaying = true;
        }, when, this.audioContext );
    };

    /**
     * Stop the AudioNode. Abstract method. Override this method when a Node is defined.
     *
     * @method stop
     * @param {Number} [when] Time (in seconds) the sound should stop playing
     */
    BaseSound.prototype.stop = function ( when ) {
        if ( typeof when === 'undefined' || when < this.audioContext.currentTime ) {
            when = this.audioContext.currentTime;
        }

        var self = this;
        webAudioDispatch( function () {
            self.isPlaying = false;
        }, when, this.audioContext );

        // cancel all scheduled ramps on this releaseGainNode
        this.releaseGainNode.gain.cancelScheduledValues( when );
    };

    /**
     * Linearly ramp down the gain of the audio in time (seconds) to 0.
     *
     * @method release
     * @param {Number} [when] Time (in seconds) at which the Envelope will release.
     * @param {Number} [fadeTime] Amount of time (seconds) it takes for linear ramp down to happen.
     * @param {Boolean} [resetOnRelease] Boolean to define if release stops (resets) the playback or just pauses it.
     */
    BaseSound.prototype.release = function ( when, fadeTime, resetOnRelease ) {

        if ( this.isPlaying ) {
            var FADE_TIME = 0.5;
            //var FADE_TIME_PAD = 1 / this.audioContext.sampleRate;

            if ( typeof when === 'undefined' || when < this.audioContext.currentTime ) {
                when = this.audioContext.currentTime;
            }

            fadeTime = fadeTime || FADE_TIME;
            // Clamp the current gain value at this point of time to prevent sudden jumps.
            this.releaseGainNode.gain.setValueAtTime( this.releaseGainNode.gain.value, when );

            // Now there won't be any glitch and there is a smooth ramp down.
            this.releaseGainNode.gain.linearRampToValueAtTime( 0, when + fadeTime );

            // Pause the sound after currentTime + fadeTime + FADE_TIME_PAD
            if ( !resetOnRelease ) {
                var self = this;
                webAudioDispatch( function () {
                    self.pause();
                }, when + fadeTime, this.audioContext );
            }
        }
    };

    /**
     * Reinitializes the model and sets it's sources.
     *
     * @method setSources
     * @param {Array/AudioBuffer/String/File} sources Single or Array of either URLs or AudioBuffers or File Objects of the audio sources.
     * @param {Function} [onLoadProgress] Callback when the audio file is being downloaded.
     * @param {Function} [onLoadComplete] Callback when all sources have finished loading.
     */
    BaseSound.prototype.setSources = function ( sources, onLoadProgress, onLoadComplete ) {
        this.isInitialized = false;

        if ( typeof onLoadProgress === 'function' ) {
            this.onLoadProgress = onLoadProgress;
        }

        if ( typeof onLoadComplete === 'function' ) {
            this.onLoadComplete = onLoadComplete;
        }
    };

    /**
     * Play sound. Abstract method. Override this method when a Node is defined.
     *
     * @method play
     */
    BaseSound.prototype.play = function () {
        this.start( 0 );
    };

    /**
     * Pause sound. Abstract method. Override this method when a Node is defined.
     *
     * @method pause
     */
    BaseSound.prototype.pause = function () {
        this.isPlaying = false;
    };

    /**
     * Registers a Parameter to the model. This ensures that the Parameter is unwritable and allows
     * to lock in the configurability of the object.
     *
     * @param  {SPAudioParam} audioParam
     */
    BaseSound.prototype.registerParameter = function ( audioParam, configurable ) {

        if ( configurable === undefined || configurable === null ) {
            configurable = false;
        }

        Object.defineProperty( this, audioParam.name, {
            enumerable: true,
            configurable: configurable,
            value: audioParam
        } );

        var self = this;
        var replaced = false;
        this.parameterList_.forEach( function ( thisParam, paramIndex ) {
            if ( thisParam.name === audioParam.name ) {
                self.parameterList_.splice( paramIndex, 1, audioParam );
                replaced = true;
            }
        } );

        if ( !replaced ) {
            this.parameterList_.push( audioParam );
        }
    };

    /**
     * List all SPAudioParams this Sound exposes
     *
     * @method listParams
     * @param {Array} [paramArray] Array of all the SPAudioParams this Sound exposes.
     */
    BaseSound.prototype.listParams = function () {
        return this.parameterList_;
    };

    // Return constructor function
    return BaseSound;
} );

/*
 ** @module Core
 */
define(
    'core/SPAudioParam',[ 'core/WebAudioDispatch', 'core/Config' ],
    function ( webAudioDispatch, Config ) {
        
        /**
         * Mock AudioParam used to create Parameters for Sonoport Sound Models. The SPAudioParam supports either a AudioParam backed parameter, or a completely Javascript mocked up Parameter, which supports a rough version of parameter automation.
         *
         *
         * @class SPAudioParam
         * @constructor
         * @param {BaseSound} baseSound A reference to the BaseSound which exposes this parameter.
         * @param {String} [name] The name of the parameter.
         * @param {Number} [minValue] The minimum value of the parameter.
         * @param {Number} [maxValue] The maximum value of the parameter.
         * @param {Number} [defaultValue] The default and starting value of the parameter.
         * @param {AudioParam/Array} [aParams] A WebAudio parameter which will be set/get when this parameter is changed.
         * @param {Function} [mappingFunction] A mapping function to map values between the mapped SPAudioParam and the underlying WebAudio AudioParam.
         * @param {Function} [setter] A setter function which can be used to set the underlying audioParam. If this function is undefined, then the parameter is set directly.
         */
        function SPAudioParam( baseSound, name, minValue, maxValue, defaultValue, aParams, mappingFunction, setter ) {
            // Min diff between set and actual
            // values to stop updates.
            var MIN_DIFF = 0.0001;
            var UPDATE_INTERVAL_MS = 500;
            var intervalID_;

            var value_ = 0;

            /**
             * Initial value for the value attribute.
             *
             * @property defaultValue
             * @type Number/Boolean
             * @default 0
             */
            this.defaultValue = null;

            /**
             *  Maximum value which the value attribute can be set to.
             *
             *
             * @property maxValue
             * @type Number/Boolean
             * @default 0
             */
            this.maxValue = 0;

            /**
             * Minimum value which the value attribute can be set to.
             *
             * @property minValue
             * @type Number/Boolean
             * @default 0
             */

            this.minValue = 0;

            /**
             * Name of the Parameter.
             *
             * @property name
             * @type String
             * @default ""
             */

            this.name = "";

            /**
             * The parameter's value. This attribute is initialized to the defaultValue. If value is set during a time when there are any automation events scheduled then it will be ignored and no exception will be thrown.
             *
             *
             * @property value
             * @type Number/Boolean
             * @default 0
             */
            Object.defineProperty( this, 'value', {
                enumerable: true,
                configurable: false,
                set: function ( value ) {
                    //console.log( "setting", name );
                    // Sanitize the value with min/max
                    // bounds first.
                    if ( typeof value !== typeof defaultValue ) {
                        console.error( "Attempt to set a " + ( typeof defaultValue ) + " parameter to a " + ( typeof value ) + " value" );
                        return;
                    }
                    // Sanitize the value with min/max
                    // bounds first.
                    if ( typeof value === "number" ) {
                        if ( value > maxValue ) {
                            console.warn( this.name + ' clamping to max' );
                            value = maxValue;
                        } else if ( value < minValue ) {
                            console.warn( this.name + ' clamping to min' );
                            value = minValue;
                        }
                    }

                    // Map the value first
                    if ( typeof mappingFunction === 'function' ) {
                        // Map if mappingFunction is defined
                        value = mappingFunction( value );
                    }

                    // If setter exists, use that
                    if ( typeof setter === 'function' && baseSound.audioContext ) {
                        setter( aParams, value, baseSound.audioContext );
                    } else if ( aParams ) {
                        // else if param is defined, set directly
                        if ( aParams instanceof AudioParam ) {
                            var array = [];
                            array.push( aParams );
                            aParams = array;
                        }
                        aParams.forEach( function ( thisParam ) {
                            if ( baseSound.isPlaying ) {
                                //dezipper if already playing
                                thisParam.setTargetAtTime( value, baseSound.audioContext.currentTime, Config.DEFAULT_SMOOTHING_CONSTANT );
                            } else {
                                //set directly if not playing
                                //console.log( "setting directly" );
                                thisParam.setValueAtTime( value, baseSound.audioContext.currentTime );
                            }
                        } );
                    } else {
                        // Else if Psuedo param
                        window.clearInterval( intervalID_ );
                    }

                    // Set the value_ anyway.
                    value_ = value;
                },
                get: function () {
                    if ( aParams ) {
                        if ( aParams instanceof AudioParam ) {
                            return aParams.value;
                        } else if ( aParams instanceof Array ) {
                            // use a nominal Parameter to populate
                            return aParams[ 0 ].value;
                        } else {
                            return value_;
                        }
                    }
                    return value_;
                }
            } );
            if ( aParams && ( aParams instanceof AudioParam || aParams instanceof Array ) ) {
                // Use a nominal Parameter to populate the values.
                var aParam = aParams[ 0 ] || aParams;
                this.defaultValue = aParam.defaultValue;
                this.minValue = aParam.minValue;
                this.maxValue = aParam.maxValue;
                this.value = aParam.defaultValue;
                this.name = aParam.name;
            }

            if ( name ) {
                this.name = name;
            }

            if ( typeof defaultValue !== 'undefined' ) {
                this.defaultValue = defaultValue;
                this.value = defaultValue;
            }

            if ( typeof minValue !== 'undefined' ) {
                this.minValue = minValue;
            }

            if ( typeof maxValue !== 'undefined' ) {
                this.maxValue = maxValue;
            }

            /**
             * Schedules a parameter value change at the given time.
             *
             * @method setValueAtTime
             * @param {Number} value The value parameter is the value the parameter will change to at the given time.
             * @param {Number} startTime The startTime parameter is the time in the same time coordinate system as AudioContext.currentTime.
             */
            this.setValueAtTime = function ( value, startTime ) {
                //console.log( "setting value " + value + " at time " + startTime + " for " + aParams );

                if ( typeof mappingFunction === 'function' ) {
                    value = mappingFunction( value );
                }
                if ( aParams ) {
                    if ( aParams instanceof AudioParam ) {
                        aParams.setValueAtTime( value, startTime );
                    } else if ( aParams instanceof Array ) {
                        aParams.forEach( function ( thisParam ) {
                            thisParam.setValueAtTime( value, startTime );
                        } );
                    }
                } else {
                    // Horrible hack for the case we don't have access to
                    // a real AudioParam.
                    var self = this;
                    webAudioDispatch( function () {
                        self.value = value;
                    }, startTime, baseSound.audioContext );
                }
            };

            /**
             * Start exponentially approaching the target value at the given time with a rate having the given time constant.
             *
             * During the time interval: T0 <= t < T1, where T0 is the startTime parameter and T1 represents the time of the event following this event (or infinity if there are no following events):
             *     v(t) = V1 + (V0 - V1) * exp(-(t - T0) / timeConstant)
             *
             * @method setTargetAtTime
             * @param {Number} target The target parameter is the value the parameter will start changing to at the given time.
             * @param {Number} startTime The startTime parameter is the time in the same time coordinate system as AudioContext.currentTime.
             * @param {Number} timeConstant The timeConstant parameter is the time-constant value of first-order filter (exponential) approach to the target value. The larger this value is, the slower the transition will be.
             */
            this.setTargetAtTime = function ( target, startTime, timeConstant ) {
                if ( typeof mappingFunction === 'function' ) {
                    target = mappingFunction( target );
                }
                if ( aParams ) {
                    if ( aParams instanceof AudioParam ) {
                        aParams.setTargetAtTime( target, startTime, timeConstant );
                    } else if ( aParams instanceof Array ) {
                        aParams.forEach( function ( thisParam ) {
                            thisParam.setTargetAtTime( target, startTime, timeConstant );
                        } );
                    }
                } else {
                    // Horrible hack for the case we don't have access to
                    // a real AudioParam.
                    var self = this;
                    var initValue_ = self.value;
                    var initTime_ = baseSound.audioContext.currentTime;
                    intervalID_ = window.setInterval( function () {
                        if ( baseSound.audioContext.currentTime >= startTime ) {
                            self.value = target + ( initValue_ - target ) * Math.exp( -( baseSound.audioContext.currentTime - initTime_ ) / timeConstant );
                            if ( Math.abs( self.value - target ) < MIN_DIFF ) {
                                window.clearInterval( intervalID_ );
                            }
                        }
                    }, UPDATE_INTERVAL_MS );
                }
            };
            /**
             * Sets an array of arbitrary parameter values starting at the given time for the given duration. The number of values will be scaled to fit into the desired duration.

             * During the time interval: startTime <= t < startTime + duration, values will be calculated:
             *
             *   v(t) = values[N * (t - startTime) / duration], where N is the length of the values array.
             *
             * @method setValueCurveAtTime
             * @param {Float32Array} values The values parameter is a Float32Array representing a parameter value curve. These values will apply starting at the given time and lasting for the given duration.
             * @param {Number} startTime The startTime parameter is the time in the same time coordinate system as AudioContext.currentTime.
             * @param {Number} duration The duration parameter is the amount of time in seconds (after the startTime parameter) where values will be calculated according to the values parameter.
             */
            this.setValueCurveAtTime = function ( values, startTime, duration ) {
                if ( typeof mappingFunction === 'function' ) {
                    for ( var index = 0; index < values.length; index++ ) {
                        values[ index ] = mappingFunction( values[ index ] );
                    }
                }
                if ( aParams ) {
                    if ( aParams instanceof AudioParam ) {
                        aParams.setValueCurveAtTime( values, startTime, duration );
                    } else if ( aParams instanceof Array ) {
                        aParams.forEach( function ( thisParam ) {
                            thisParam.setValueCurveAtTime( values, startTime, duration );
                        } );
                    }
                } else {
                    var self = this;
                    var initTime_ = baseSound.audioContext.currentTime;
                    intervalID_ = window.setInterval( function () {
                        if ( baseSound.audioContext.currentTime >= startTime ) {
                            var index = Math.floor( values.length * ( baseSound.audioContext.currentTime - initTime_ ) / duration );
                            if ( index < values.length ) {
                                self.value = values[ index ];
                            } else {
                                window.clearInterval( intervalID_ );
                            }
                        }
                    }, UPDATE_INTERVAL_MS );
                }
            };

            /**
             * Schedules an exponential continuous change in parameter value from the previous scheduled parameter value to the given value.
             *
             * v(t) = V0 * (V1 / V0) ^ ((t - T0) / (T1 - T0))
             *
             * @method exponentialRampToValueAtTime
             * @param {Number} value The value parameter is the value the parameter will exponentially ramp to at the given time.
             * @param {Number} endTime The endTime parameter is the time in the same time coordinate system as AudioContext.currentTime.
             */
            this.exponentialRampToValueAtTime = function ( value, endTime ) {
                if ( typeof mappingFunction === 'function' ) {
                    value = mappingFunction( value );
                }
                if ( aParams ) {
                    if ( aParams instanceof AudioParam ) {
                        aParams.exponentialRampToValueAtTime( value, endTime );
                    } else if ( aParams instanceof Array ) {
                        aParams.forEach( function ( thisParam ) {
                            thisParam.exponentialRampToValueAtTime( value, endTime );
                        } );
                    }
                } else {
                    var self = this;
                    var initValue_ = self.value;
                    var initTime_ = baseSound.audioContext.currentTime;
                    if ( initValue_ === 0 ) {
                        initValue_ = 0.001;
                    }
                    intervalID_ = window.setInterval( function () {
                        var timeRatio = ( baseSound.audioContext.currentTime - initTime_ ) / ( endTime - initTime_ );
                        self.value = initValue_ * Math.pow( value / initValue_, timeRatio );
                        if ( baseSound.audioContext.currentTime >= endTime ) {
                            window.clearInterval( intervalID_ );
                        }
                    }, UPDATE_INTERVAL_MS );
                }
            };

            /**
             *Schedules a linear continuous change in parameter value from the previous scheduled parameter value to the given value.
             *
             * @method linearRampToValueAtTime
             * @param {Float32Array} value The value parameter is the value the parameter will exponentially ramp to at the given time.
             * @param {Number} endTime The endTime parameter is the time in the same time coordinate system as AudioContext.currentTime.
             */
            this.linearRampToValueAtTime = function ( value, endTime ) {
                if ( typeof mappingFunction === 'function' ) {
                    value = mappingFunction( value );
                }
                if ( aParams ) {
                    if ( aParams instanceof AudioParam ) {
                        aParams.linearRampToValueAtTime( value, endTime );
                    } else if ( aParams instanceof Array ) {
                        aParams.forEach( function ( thisParam ) {
                            thisParam.linearRampToValueAtTime( value, endTime );
                        } );
                    }
                } else {
                    var self = this;
                    var initValue_ = self.value;
                    var initTime_ = baseSound.audioContext.currentTime;
                    intervalID_ = window.setInterval( function () {
                        var timeRatio = ( baseSound.audioContext.currentTime - initTime_ ) / ( endTime - initTime_ );
                        self.value = initValue_ + ( ( value - initValue_ ) * timeRatio );
                        if ( baseSound.audioContext.currentTime >= endTime ) {
                            window.clearInterval( intervalID_ );
                        }
                    }, UPDATE_INTERVAL_MS );
                }
            };

            /**
             * Schedules a linear continuous change in parameter value from the previous scheduled parameter value to the given value.
             *
             * @method cancelScheduledValues
             * @param {Number} startTime The startTime parameter is the starting time at and after which any previously scheduled parameter changes will be cancelled.
             */
            this.cancelScheduledValues = function ( startTime ) {
                if ( aParams ) {
                    if ( aParams instanceof AudioParam ) {
                        aParams.cancelScheduledValues( startTime );
                    } else if ( aParams instanceof Array ) {
                        aParams.forEach( function ( thisParam ) {
                            thisParam.cancelScheduledValues( startTime );
                        } );
                    }
                } else {
                    window.clearInterval( intervalID_ );
                }
            };
        }

        /**
         * Static helper method to create Psuedo parameters which are not connected to
        any WebAudio AudioParams.
         *
         * @method createPsuedoParam
         * @static
         * @return  SPAudioParam
         * @param {BaseSound} baseSound A reference to the BaseSound which exposes this parameter.
         * @param {String} name The name of the parameter..
         * @param {Number} minValue The minimum value of the parameter.
         * @param {Number} maxValue The maximum value of the parameter.
         * @param {Number} defaultValue The default and starting value of the parameter.
         */
        SPAudioParam.createPsuedoParam = function ( baseSound, name, minValue, maxValue, defaultValue ) {
            return new SPAudioParam( baseSound, name, minValue, maxValue, defaultValue, null, null, null );
        };

        return SPAudioParam;
    } );

/**
 * @module Core
 */
define( 'core/SPPlaybackRateParam',[ 'core/Config' ],
    function ( Config ) {
        

        /**
         * Wrapper around AudioParam playbackRate of SPAudioBufferSourceNode to help calculate the playbackPosition of the AudioBufferSourceNode.
         *
         * @class SPPlaybackRateParam
         * @constructor
         * @param {SPAudioBufferSourceNode} bufferSourceNode Reference to the parent SPAudioBufferSourceNode.
         * @param {AudioParam} audioParam The playbackRate of a source AudioBufferSourceNode.
         * @param {AudioParam} counterParam The playbackRate of counter AudioBufferSourceNode.
         */
        function SPPlaybackRateParam( bufferSourceNode, audioParam, counterParam ) {
            this.defaultValue = audioParam.defaultValue;
            this.maxValue = audioParam.maxValue;
            this.minValue = audioParam.minValue;
            this.name = audioParam.name;
            this.units = audioParam.units;

            Object.defineProperty( this, 'value', {
                enumerable: true,
                configurable: false,
                set: function ( rate ) {
                    if ( bufferSourceNode.playbackState === bufferSourceNode.PLAYING_STATE ) {
                        audioParam.setTargetAtTime( rate, bufferSourceNode.audioContext.currentTime, Config.DEFAULT_SMOOTHING_CONSTANT );
                        counterParam.setTargetAtTime( rate, bufferSourceNode.audioContext.currentTime, Config.DEFAULT_SMOOTHING_CONSTANT );
                    } else {
                        audioParam.setValueAtTime( rate, bufferSourceNode.audioContext.currentTime );
                        counterParam.setValueAtTime( rate, bufferSourceNode.audioContext.currentTime );
                    }

                },
                get: function () {
                    return audioParam.value;
                }
            } );

            audioParam.value = audioParam.value;
            counterParam.value = audioParam.value;

            this.linearRampToValueAtTime = function ( value, endTime ) {
                audioParam.linearRampToValueAtTime( value, endTime );
                counterParam.linearRampToValueAtTime( value, endTime );
            };

            this.exponentialRampToValueAtTime = function ( value, endTime ) {
                audioParam.exponentialRampToValueAtTime( value, endTime );
                counterParam.exponentialRampToValueAtTime( value, endTime );

            };

            this.setValueCurveAtTime = function ( values, startTime, duration ) {
                audioParam.setValueCurveAtTime( values, startTime, duration );
                counterParam.setValueCurveAtTime( values, startTime, duration );
            };

            this.setTargetAtTime = function ( target, startTime, timeConstant ) {
                audioParam.setTargetAtTime( target, startTime, timeConstant );
                counterParam.setTargetAtTime( target, startTime, timeConstant );

            };

            this.setValueAtTime = function ( value, time ) {
                audioParam.setValueAtTime( value, time );
                counterParam.setValueAtTime( value, time );
            };

            this.cancelScheduledValues = function ( time ) {
                audioParam.cancelScheduledValues( time );
                counterParam.cancelScheduledValues( time );
            };
        }
        return SPPlaybackRateParam;
    } );

/**
 * @module Core
 */
define( 'core/SPAudioBuffer',[],
    function () {
        
        /**
         * Wrapper around AudioBuffer to support audio source caching and allowing clipping of audiobuffers to various lengths.
         *
         * @class SPAudioBuffer
         * @constructor
         * @param {AudioContext} audioContext WebAudio Context.
         * @param {String/AudioBuffer/File} URL The source URL or File object or an AudioBuffer to encapsulate.
         * @param {Number} startPoint The startPoint of the AudioBuffer in seconds.
         * @param {Number} endPoint The endPoint of the AudioBuffer in seconds.
         * @param [AudioBuffer] audioBuffer An AudioBuffer object incase the URL has already been downloaded and decoded.
         */
        function SPAudioBuffer( audioContext, URL, startPoint, endPoint, audioBuffer ) {

            // new SPAudioBuffer("http://example.com", 0.8,1.0)
            // new SPAudioBuffer("http://example.com", 0.8,1.0, [object AudioBuffer])
            // new SPAudioBuffer([object File], 0.8,1.0)
            // new SPAudioBuffer([object AudioBuffer], 0.8,1.0)

            if ( !( audioContext instanceof AudioContext ) ) {
                console.error( 'First argument to SPAudioBuffer must be a valid AudioContext' );
                return;
            }

            // Private Variables
            var buffer_;
            var rawBuffer_;
            var startPoint_;
            var endPoint_;

            this.audioContext = audioContext;

            // Variables exposed by AudioBuffer

            this.duration = null;

            /**
             * The number of discrete audio channels.
             *
             * @property numberOfChannels
             * @type Number
             * @readOnly
             */
            Object.defineProperty( this, 'numberOfChannels', {
                get: function () {
                    return this.buffer ? this.buffer.numberOfChannels : 0;
                }
            } );

            /**
             * The sample-rate for the PCM audio data in samples per second.
             *
             * @property sampleRate
             * @type Number
             * @readOnly
             */
            Object.defineProperty( this, 'sampleRate', {
                get: function () {
                    return this.buffer ? this.buffer.sampleRate : 0;
                }
            } );

            /**
             * Returns the Float32Array representing the PCM audio data for the specific channel.
             *
             * @method getChannelData
             * @param {Number} channel This parameter is an index representing the particular channel to get data for. An index value of 0 represents the first channel.
             *
             */
            this.getChannelData = function ( channel ) {
                if ( !this.buffer ) {
                    return null;
                } else {
                    return this.buffer.getChannelData( channel );
                }
            };

            // New Interfaces.

            /**
             * The actual AudioBuffer that this SPAudioBuffer object is wrapping around. The getter of this property returns a clipped AudioBuffer based on the startPoint and endPoint properties.
             *
             * @property buffer
             * @type AudioBuffer
             * @default null
             */
            Object.defineProperty( this, 'buffer', {
                set: function ( buffer ) {

                    if ( startPoint_ === null ) {
                        this.startPoint = 0;
                    } else if ( startPoint_ > buffer.length / buffer.sampleRate ) {
                        console.error( "SPAudioBuffer : startPoint cannot be greater than buffer length" );
                        return;
                    }
                    if ( endPoint_ === null ) {
                        this.endPoint = this.rawBuffer_.length;
                    } else if ( endPoint_ > buffer.length / buffer.sampleRate ) {
                        console.error( "SPAudioBuffer : endPoint cannot be greater than buffer length" );
                        return;
                    }

                    rawBuffer_ = buffer;
                    this.updateBuffer();
                }.bind( this ),
                get: function () {
                    return buffer_;
                }
            } );

            /**
             * URL or File object that is the source of the sound in the buffer. This property can be used for indexing and caching decoded sound buffers.
             *
             * @property sourceURL
             * @type String/File
             * @default null
             */
            this.sourceURL = null;

            /**
             * The starting point of the buffer in seconds. This, along with the {{#crossLink "SPAudioBuffer/endPoint:property"}}endPoint{{/crossLink}} property, decides which part of the original buffer is clipped and returned by the getter of the {{#crossLink "SPAudioBuffer/buffer:property"}}buffer{{/crossLink}} property.
             *
             * @property startPoint
             * @type Number
             * @default null
             * @minvalue 0
             */
            Object.defineProperty( this, 'startPoint', {
                set: function ( startPoint ) {
                    if ( endPoint_ !== undefined && startPoint >= endPoint_ ) {
                        console.error( "SPAudioBuffer : startPoint cannot be greater than endPoint" );
                        return;
                    }

                    if ( rawBuffer_ && ( startPoint * rawBuffer_.sampleRate ) >= rawBuffer_.length ) {
                        console.error( "SPAudioBuffer : startPoint cannot be greater than or equal to buffer length" );
                        return;
                    }

                    startPoint_ = startPoint;
                    this.updateBuffer();
                }.bind( this ),
                get: function () {
                    return startPoint_;
                }
            } );

            /**
             * The ending point of the buffer in seconds. This, along with the {{#crossLink "SPAudioBuffer/startPoint:property"}}startPoint{{/crossLink}} property, decides which part of the original buffer is clipped and returned by the getter of the {{#crossLink "SPAudioBuffer/buffer:property"}}buffer{{/crossLink}} property.
             *
             * @property endPoint
             * @type Number
             * @default null
             * @minvalue 0
             */
            Object.defineProperty( this, 'endPoint', {
                set: function ( endPoint ) {
                    if ( startPoint_ !== undefined && endPoint <= startPoint_ ) {
                        console.error( "SPAudioBuffer : endPoint cannot be lesser than startPoint" );
                        return;
                    }

                    if ( rawBuffer_ && ( endPoint * rawBuffer_.sampleRate ) >= rawBuffer_.length ) {
                        console.error( "SPAudioBuffer : endPoint cannot be greater than buffer or equal to length" );
                        return;
                    }

                    endPoint_ = endPoint;
                    this.updateBuffer();
                }.bind( this ),
                get: function () {
                    return endPoint_;
                }
            } );

            this.updateBuffer = function () {
                if ( !rawBuffer_ ) {
                    this.duration = 0;
                } else {
                    if ( startPoint_ === null || startPoint_ === undefined ) {
                        startPoint_ = 0;
                    }
                    if ( endPoint_ === null || endPoint_ === undefined ) {
                        endPoint_ = rawBuffer_.duration;
                    }

                    this.duration = endPoint_ - startPoint_;
                    this.length = Math.ceil( rawBuffer_.sampleRate * this.duration ) + 1;

                    if ( this.length > 0 ) {
                        // Start trimming
                        if ( !buffer_ ||
                            buffer_.length != this.length ||
                            buffer_.numberOfChannels != rawBuffer_.numberOfChannels ||
                            buffer_.sampleRate != rawBuffer_.sampleRate
                        ) {
                            buffer_ = this.audioContext.createBuffer( rawBuffer_.numberOfChannels, this.length, rawBuffer_.sampleRate );
                        }

                        var startIndex = Math.floor( startPoint_ * rawBuffer_.sampleRate );
                        var endIndex = Math.ceil( endPoint_ * rawBuffer_.sampleRate );

                        for ( var i = 0; i < rawBuffer_.numberOfChannels; i++ ) {
                            var aData = new Float32Array( rawBuffer_.getChannelData( i ) );
                            buffer_.getChannelData( i )
                                .set( aData.subarray( startIndex, endIndex ) );
                        }
                    }
                }
            };

            var urlType = Object.prototype.toString.call( URL );
            var startPointType = Object.prototype.toString.call( startPoint );
            var endPointType = Object.prototype.toString.call( endPoint );
            var bufferType = Object.prototype.toString.call( audioBuffer );

            if ( urlType === "[object String]" || urlType === "[object File]" ) {
                this.sourceURL = URL;
            } else if ( urlType === "[object AudioBuffer]" ) {
                this.buffer = URL;
            } else {
                console.warn( "Incorrect Parameter Type. url can only be a String, File or an AudioBuffer" );
            }

            if ( startPointType === "[object Number]" ) {
                this.startPoint = parseFloat( startPoint );
            } else {
                if ( startPointType !== "[object Undefined]" ) {
                    console.warn( "Incorrect Parameter Type. startPoint should be a Number" );
                }
            }

            if ( endPointType === "[object Number]" ) {
                this.endPoint = parseFloat( endPoint );
            } else {
                if ( startPointType !== "[object Undefined]" ) {
                    console.warn( "Incorrect Parameter Type. endPoint should be a Number" );
                }
            }

            if ( bufferType === "[object AudioBuffer]" && !this.buffer ) {
                this.buffer = audioBuffer;
            }
        }
        return SPAudioBuffer;
    } );

/**
 * @module Core
 */
define( 'core/SPAudioBufferSourceNode',[ 'core/SPPlaybackRateParam', 'core/SPAudioBuffer', 'core/WebAudioDispatch' ],
    function ( SPPlaybackRateParam, SPAudioBuffer, webAudioDispatch ) {
        

        /**
         * A wrapper around the AudioBufferSourceNode to be able to track the current playPosition of a AudioBufferSourceNode.
         *
         * @class SPAudioBufferSourceNode
         * @constructor
         * @param {AudioContext} AudioContext to be used in timing the parameter automation events
         */
        function SPAudioBufferSourceNode( audioContext ) {
            var bufferSourceNode_ = audioContext.createBufferSource();
            var counterNode_ = audioContext.createBufferSource();

            var scopeNode_ = audioContext.createScriptProcessor( 256, 1, 1 );
            var trackGainNode_ = audioContext.createGain();
            var lastPos = 0;

            this.audioContext = audioContext;
            this.channelCount = bufferSourceNode_.channelCount;
            this.channelCountMode = bufferSourceNode_.channelCountMode;
            this.channelInterpretation = bufferSourceNode_.channelInterpretation;
            this.numberOfInputs = bufferSourceNode_.numberOfInputs;
            this.numberOfOutputs = bufferSourceNode_.numberOfOutputs;
            this.playbackState = 0;

            /**
             * Playback States Constant.
             *
             * @property UNSCHEDULED_STATE
             * @type Number
             * @default "Model"
             **/
            this.UNSCHEDULED_STATE = 0;

            /**
             * Playback States Constant.
             *
             * @property SCHEDULED_STATE
             * @type Number
             * @default "1"
             **/
            this.SCHEDULED_STATE = 1;

            /**
             * Playback States Constant.
             *
             * @property PLAYING_STATE
             * @type Number
             * @default "2"
             **/
            this.PLAYING_STATE = 2;

            /**
             * Playback States Constant.
             *
             * @property FINISHED_STATE
             * @type Number
             * @default "3"
             **/
            this.FINISHED_STATE = 3;

            /**
             * The speed at which to render the audio stream. Its default value is 1. This parameter is a-rate.
             *
             * @property playbackRate
             * @type AudioParam
             * @default 1
             *
             */
            this.playbackRate = new SPPlaybackRateParam( this, bufferSourceNode_.playbackRate, counterNode_.playbackRate );

            /**
             * An optional value in seconds where looping should end if the loop attribute is true.
             *
             * @property loopEnd
             * @type Number
             * @default 0
             *
             */
            Object.defineProperty( this, 'loopEnd', {
                enumerable: true,
                configurable: false,
                set: function ( loopEnd ) {
                    bufferSourceNode_.loopEnd = loopEnd;
                    counterNode_.loopEnd = loopEnd;
                },
                get: function () {
                    return bufferSourceNode_.loopEnd;
                }
            } );

            /**
             * An optional value in seconds where looping should begin if the loop attribute is true.
             *
             * @property loopStart
             * @type Number
             * @default 0
             *
             */
            Object.defineProperty( this, 'loopStart', {
                enumerable: true,
                configurable: false,
                set: function ( loopStart ) {
                    bufferSourceNode_.loopStart = loopStart;
                    counterNode_.loopStart = loopStart;
                },
                get: function () {
                    return bufferSourceNode_.loopStart;
                }
            } );

            /**
             * A property used to set the EventHandler for the ended event that is dispatched to AudioBufferSourceNode node types
             *
             * @property onended
             * @type Function
             * @default null
             *
             */
            Object.defineProperty( this, 'onended', {
                enumerable: true,
                configurable: false,
                set: function ( onended ) {
                    bufferSourceNode_.onended = wrapAroundOnEnded( this, onended );
                },
                get: function () {
                    return bufferSourceNode_.onended;
                }
            } );

            /**
             * Indicates if the audio data should play in a loop.
             *
             * @property loop
             * @type Boolean
             * @default false
             *
             */
            Object.defineProperty( this, 'loop', {
                enumerable: true,
                configurable: false,
                set: function ( loop ) {
                    bufferSourceNode_.loop = loop;
                    counterNode_.loop = loop;
                },
                get: function () {
                    return bufferSourceNode_.loop;
                }
            } );

            /**
             * Position (in seconds) of the last frame played back by the AudioContext
             *
             * @property playbackPosition
             * @type Number
             * @default 0
             *
             */
            Object.defineProperty( this, 'playbackPosition', {
                enumerable: true,
                configurable: false,
                get: function () {
                    return lastPos;
                }
            } );

            /**
             * Represents the audio asset to be played.
             *
             * @property buffer
             * @type AudioBuffer
             * @default null
             *
             */
            Object.defineProperty( this, 'buffer', {
                enumerable: true,
                configurable: false,
                set: function ( buffer ) {
                    if ( buffer instanceof SPAudioBuffer ) {
                        bufferSourceNode_.buffer = buffer.buffer;
                        counterNode_.buffer = createCounterBuffer( buffer.buffer );
                    } else if ( buffer instanceof AudioBuffer ) {
                        bufferSourceNode_.buffer = buffer;
                        counterNode_.buffer = createCounterBuffer( buffer );
                    }

                },
                get: function () {
                    return bufferSourceNode_.buffer;
                }
            } );

            /**
             * Track gain for this specific buffer.
             *
             * @property buffer
             * @type AudioBuffer
             * @default null
             *
             */
            Object.defineProperty( this, 'gain', {
                enumerable: true,
                configurable: false,
                get: function () {
                    return trackGainNode_.gain;
                }
            } );

            /**
             * Connects the AudioNode to the input of another AudioNode.
             *
             * @method connect
             * @param {AudioNode} destination AudioNode to connect to.
             * @param {Number} [output] Index describing which output of the AudioNode from which to connect.
             * @param {Number} [input] Index describing which input of the destination AudioNode to connect to.
             *
             */
            this.connect = function ( destination, output, input ) {
                trackGainNode_.connect( destination, output, input );
            };

            /**
             * Disconnects the AudioNode from the input of another AudioNode.
             *
             * @method disconnect
             * @param {Number} [output] Index describing which output of the AudioNode to disconnect.
             *
             */
            this.disconnect = function ( output ) {
                trackGainNode_.disconnect( output );
            };

            /**
             * Schedules a sound to playback at an exact time.
             *
             * @method start
             * @param {Number} when Time (in seconds) when the sound should start playing.
             * @param {Number} [offset] Offset time in the buffer (in seconds) where playback will begin
             * @param {Number} [duration] Duration of the portion (in seconds) to be played
             *
             */
            this.start = function ( when, offset, duration ) {
                if ( typeof duration == 'undefined' ) {
                    duration = bufferSourceNode_.buffer.duration;
                }

                if ( typeof offset == 'undefined' ) {
                    offset = 0;
                }

                if ( this.playbackState === this.UNSCHEDULED_STATE ) {
                    bufferSourceNode_.start( when, offset, duration );
                    counterNode_.start( when, offset, duration );
                    this.playbackState = this.SCHEDULED_STATE;
                }

                var self = this;
                webAudioDispatch( function () {
                    self.playbackState = self.PLAYING_STATE;
                }, when, this.audioContext );
            };

            /**
             * Schedules a sound to stop playback at an exact time.
             *
             * @method stop
             * @param {Number} when Time (in seconds) when the sound should stop playing.
             *
             */
            this.stop = function ( when ) {
                if ( this.playbackState === this.PLAYING_STATE || this.playbackState === this.SCHEDULED_STATE ) {
                    bufferSourceNode_.stop( when );
                    counterNode_.stop( when );
                }
            };

            /**
             * Resets the SP Buffer Source with a fresh BufferSource.
             *
             * @method resetBufferSource
             * @param {Number} when Time (in seconds) when the Buffer source should be reset.
             * @param {AudioNode} output The output to which the BufferSource is to be connected.
             *
             */
            this.resetBufferSource = function ( when, output ) {

                var self = this;
                webAudioDispatch( function () {
                    //console.log( 'resetting' );
                    // Disconnect source(s) from output.
                    // self.disconnect( );

                    // Disconnect scope node from trackGain
                    scopeNode_.disconnect();

                    var newTrackGain = self.audioContext.createGain();
                    newTrackGain.gain.value = trackGainNode_.gain.value;
                    trackGainNode_ = newTrackGain;

                    // Create new sources and copy all the parameters over.
                    var newSource = self.audioContext.createBufferSource();
                    newSource.buffer = bufferSourceNode_.buffer;
                    newSource.loopStart = bufferSourceNode_.loopStart;
                    newSource.loopEnd = bufferSourceNode_.loopEnd;
                    newSource.onended = wrapAroundOnEnded( self, bufferSourceNode_.onended );

                    // Remove onended callback from old buffer
                    bufferSourceNode_.onended = null;

                    // Throw away the counter node;
                    counterNode_.disconnect();

                    var newCounterNode = audioContext.createBufferSource();
                    newCounterNode.buffer = counterNode_.buffer;

                    // Assign the new local variables to new sources
                    bufferSourceNode_ = newSource;
                    counterNode_ = newCounterNode;

                    // Create new parameters for rate parameter
                    var playBackRateVal = self.playbackRate.value;
                    self.playbackRate = new SPPlaybackRateParam( self, bufferSourceNode_.playbackRate, counterNode_.playbackRate );
                    self.playbackRate.setValueAtTime( playBackRateVal, 0 );

                    // Reconnect to output.
                    counterNode_.connect( scopeNode_ );
                    bufferSourceNode_.connect( trackGainNode_ );
                    scopeNode_.connect( trackGainNode_ );
                    self.connect( output );
                    self.playbackState = self.UNSCHEDULED_STATE;
                }, when, this.audioContext );
            };

            // Private Methods

            function createCounterBuffer( buffer ) {
                var array = new Float32Array( buffer.length );
                var audioBuf = audioContext.createBuffer( 1, buffer.length, 44100 );

                for ( var index = 0; index < buffer.length; index++ ) {
                    array[ index ] = index;
                }

                audioBuf.getChannelData( 0 )
                    .set( array );
                return audioBuf;
            }

            function init() {
                counterNode_.connect( scopeNode_ );
                bufferSourceNode_.connect( trackGainNode_ );
                scopeNode_.connect( trackGainNode_ );
                scopeNode_.onaudioprocess = savePosition;
            }

            function savePosition( processEvent ) {
                var inputBuffer = processEvent.inputBuffer.getChannelData( 0 );
                lastPos = inputBuffer[ inputBuffer.length - 1 ] || 0;
            }

            function wrapAroundOnEnded( node, onended ) {
                return function ( event ) {
                    node.playbackState = node.FINISHED_STATE;
                    if ( typeof onended === 'function' ) {
                        onended( event );
                    }
                };
            }

            init();

        }
        return SPAudioBufferSourceNode;
    } );

/**
 * @module Core
 */
define( 'core/DetectLoopMarkers',[],function () {
    

    /**
     * @class DetectLoopMarkers
     * @static
     */

    /**
    /**
     *Detector for Loop Marker or Silence. This method helps to detect and trim given AudioBuffer based on Sonoport Loop Markers or based on silence detection.
     *
     *
     * @class DetectLoopMarkers
     * @param {AudioBuffer} buffer A buffer to be trimmed to Loop Markers or Silence.
     * @return {Object} An object with `start` and `end` properties containing the index of the detected start and end points.
     */
    function DetectLoopMarkers( buffer ) {

        var nLoopStart_ = 0;
        var nLoopEnd_ = 0;
        var nMarked_ = true;

        /*
         * Length of PRE and POSTFIX Silence used in Loop Marking
         */
        var PREPOSTFIX_LEN = 5000;

        /*
         * Length of PRE and POSTFIX Silence used in Loop Marking
         */
        var DEFAULT_SAMPLING_RATE = 44100;

        /*
         * Threshold for Spike Detection in Loop Marking
         */
        var SPIKE_THRESH = 0.5;

        /*
         * Index bounds for searching for Loop Markers and Silence.
         */
        var MAX_MP3_SILENCE = 20000;

        /*
         * Threshold for Silence Detection
         */
        var SILENCE_THRESH = 0.01;

        /*
         * Length for which the channel has to be empty
         */
        var EMPTY_CHECK_LENGTH = 1024;

        /*
         * Length samples to ignore after the spike
         */
        var IGNORE_LENGTH = 16;

        /*
         * Array of all Channel Data
         */
        var channels_ = [];

        /*
         * Number of samples in the buffer
         */
        var numSamples_ = 0;

        /**
         * A helper method to help find the silence in across multiple channels
         *
         * @private
         * @method silenceCheckGenerator_
         * @param {Number} testIndex The index of the sample which is being checked.
         * @return {Function} A function which can check if the specific sample is beyond the silence threshold
         */
        var isChannelEmptyAfter = function ( channel, position ) {
            //console.log( "checking at " + position );
            var sum = 0;
            for ( var sIndex = position + IGNORE_LENGTH; sIndex < position + IGNORE_LENGTH + EMPTY_CHECK_LENGTH; ++sIndex ) {
                sum += Math.abs( channel[ sIndex ] );
            }

            return ( sum / EMPTY_CHECK_LENGTH ) < SILENCE_THRESH;
        };

        /**
         * A helper method to help find the spikes in across multiple channels
         *
         * @private
         * @method silenceCheckGenerator_
         * @param {Number} testIndex The index of the sample which is being checked.
         * @return {Function} A function which can check if the specific sample is beyond the spike threshold
         */
        var thresholdCheckGenerator_ = function ( testIndex ) {
            return function ( prev, thisChannel, index ) {
                var isSpike;
                if ( index % 2 === 0 ) {
                    isSpike = thisChannel[ testIndex ] > SPIKE_THRESH;
                } else {
                    isSpike = thisChannel[ testIndex ] < -SPIKE_THRESH;
                }
                return prev && isSpike;
            };
        };

        /**
         * A helper method to help find the markers in an Array of Float32Arrays made from an AudioBuffer.
         *
         * @private
         * @method findSilence_
         * @param {Array} channels An array of buffer data in Float32Arrays within which markers needs to be detected.
         * @return {Boolean} If Loop Markers were found.
         */
        var findMarkers_ = function ( channels ) {
            var startSpikePos = null;
            var endSpikePos = null;

            nLoopStart_ = 0;
            nLoopEnd_ = numSamples_;

            // Find marker near start of file
            var pos = 0;

            while ( startSpikePos === null && pos < numSamples_ && pos < MAX_MP3_SILENCE ) {
                if ( channels.reduce( thresholdCheckGenerator_( pos ), true ) &&
                    ( channels.length !== 1 || isChannelEmptyAfter( channels[ 0 ], pos ) ) ) {
                    // Only check for emptiness at the start to ensure that it's indeed marked
                    startSpikePos = pos;
                    break;
                } else {
                    pos++;
                }
            }

            // Find marker near end of file
            pos = numSamples_;

            while ( endSpikePos === null && pos > 0 && numSamples_ - pos < MAX_MP3_SILENCE ) {
                if ( channels.reduce( thresholdCheckGenerator_( pos ), true ) ) {
                    endSpikePos = pos;
                    break;
                } else {
                    pos--;
                }
            }
            // If both markers found
            var correctedPostfixLen = Math.round( ( PREPOSTFIX_LEN / 2 ) * buffer.sampleRate / DEFAULT_SAMPLING_RATE );
            if ( startSpikePos !== null && endSpikePos !== null && endSpikePos > startSpikePos + correctedPostfixLen ) {
                // Compute loop start and length
                nLoopStart_ = startSpikePos + correctedPostfixLen;
                nLoopEnd_ = endSpikePos - correctedPostfixLen;
                //console.log( "Found loop between " + nLoopStart_ + " - " + nLoopEnd_ );
                //console.log( "Spikes at  " + startSpikePos + " - " + endSpikePos );
                return true;
            } else {
                // Spikes not found!
                //console.log( "No loop found" );
                return false;
            }
        };

        /**
         * A helper method to help find the silence in across multiple channels
         *
         * @private
         * @method silenceCheckGenerator_
         * @param {Number} testIndex The index of the sample which is being checked.
         * @return {Function} A function which can check if the specific sample is beyond the silence threshold
         */
        var silenceCheckGenerator_ = function ( testIndex ) {
            return function ( prev, thisChannel ) {
                return prev && ( Math.abs( thisChannel[ testIndex ] ) < SILENCE_THRESH );
            };
        };

        /**
         * A helper method to help find the silence in an AudioBuffer. Used of Loop Markers are not
         * found in the AudioBuffer. Updates nLoopStart_ and nLoopEnd_ directly.
         *
         * @private
         * @method findSilence_
         * @param {Array} channels channel An array of buffer data in Float32Arrays within which silence needs to be detected.
         */
        var findSilence_ = function ( channels ) {

            var allChannelsSilent = true;

            nLoopStart_ = 0;
            while ( nLoopStart_ < MAX_MP3_SILENCE && nLoopStart_ < numSamples_ ) {

                allChannelsSilent = channels.reduce( silenceCheckGenerator_( nLoopStart_ ), true );

                if ( allChannelsSilent ) {
                    nLoopStart_++;
                } else {
                    break;
                }
            }

            nLoopEnd_ = numSamples_;
            while ( numSamples_ - nLoopEnd_ < MAX_MP3_SILENCE &&
                nLoopEnd_ > 0 ) {

                allChannelsSilent = channels.reduce( silenceCheckGenerator_( nLoopEnd_ ), true );

                if ( allChannelsSilent ) {
                    nLoopEnd_--;
                } else {
                    break;
                }
            }

            if ( nLoopEnd_ < nLoopStart_ ) {
                nLoopStart_ = 0;
            }
        };

        numSamples_ = buffer.length;
        for ( var index = 0; index < buffer.numberOfChannels; index++ ) {
            channels_.push( new Float32Array( buffer.getChannelData( index ) ) );
        }

        if ( ( !findMarkers_( channels_ ) ) ) {
            findSilence_( channels_ );
            nMarked_ = false;
        }

        // return the markers which were found
        return {
            marked: nMarked_,
            start: nLoopStart_,
            end: nLoopEnd_
        };
    }

    return DetectLoopMarkers;
} );

/**
 * @module Core
 */
define( 'core/FileLoader',[ 'core/DetectLoopMarkers' ],
    function ( detectLoopMarkers ) {
        

        /**
         * Load a single file from a URL or a File object.
         *
         * @class FileLoader
         * @constructor
         * @param {String/File} URL URL of the file to be Loaded
         * @param {String} context AudioContext to be used in decoding the file
         * @param {Function} [onloadCallback] Callback function to be called when the file loading is
         * @param {Function} [onProgressCallback] Callback function to access the progress of the file loading.
         */
        function FileLoader( URL, context, onloadCallback, onProgressCallback ) {
            if ( !( this instanceof FileLoader ) ) {
                throw new TypeError( "FileLoader constructor cannot be called as a function." );
            }
            var rawBuffer_;
            var loopStart_ = 0;
            var loopEnd_ = 0;

            var isSoundLoaded_ = false;

            // Private functions

            /**
             * Check if a value is an integer.
             * @method isInt_
             * @private
             * @param {Object} value
             * @return {Boolean} Result of test.
             */
            var isInt_ = function ( value ) {
                var er = /^[0-9]+$/;
                if ( er.test( value ) ) {
                    return true;
                }
                return false;
            };

            /**
             * Get a buffer based on the start and end markers.
             * @private
             * @method sliceBuffer
             * @param {Number} start The start of the buffer to load.
             * @param {Number} end The end of the buffer to load.
             * @return {AudioBuffer} The requested sliced buffer.
             */
            var sliceBuffer_ = function ( start, end ) {

                // Set end if it is missing
                if ( typeof end == 'undefined' ) {
                    end = rawBuffer_.length;
                }
                // Verify parameters
                if ( !isInt_( start ) ) {
                    start = Number.isNan( start ) ? 0 : Math.round( Number( start ) );
                    console.warn( "Incorrect parameter Type - FileLoader getBuffer start parameter is not an integer. Coercing it to an Integer - start" );
                } else if ( !isInt_( end ) ) {
                    console.warn( "Incorrect parameter Type - FileLoader getBuffer end parameter is not an integer" );
                    end = Number.isNan( end ) ? 0 : Math.round( Number( end ) );
                }
                // Check if start is smaller than end
                if ( start > end ) {
                    console.error( "Incorrect parameter Type - FileLoader getBuffer start parameter " + start + " should be smaller than end parameter " + end + " . Setting them to the same value " + start );
                    end = start;
                }
                // Check if start is within the buffer size
                if ( start > loopEnd_ || start < loopStart_ ) {
                    console.error( "Incorrect parameter Type - FileLoader getBuffer start parameter should be within the buffer size : 0-" + rawBuffer_.length + " . Setting start to " + loopStart_ );
                    start = loopStart_;
                }

                // Check if end is within the buffer size
                if ( end > loopEnd_ || end < loopStart_ ) {
                    console.error( "Incorrect parameter Type - FileLoader getBuffer start parameter should be within the buffer size : 0-" + rawBuffer_.length + " . Setting start to " + loopEnd_ );
                    end = loopEnd_;
                }

                var length = end - start;

                if ( !rawBuffer_ ) {
                    console.error( "No Buffer Found - Buffer loading has not completed or has failed." );
                    return null;
                }

                // Create the new buffer
                var newBuffer = context.createBuffer( rawBuffer_.numberOfChannels, length, rawBuffer_.sampleRate );

                // Start trimming
                for ( var i = 0; i < rawBuffer_.numberOfChannels; i++ ) {
                    var aData = new Float32Array( rawBuffer_.getChannelData( i ) );
                    newBuffer.getChannelData( i )
                        .set( aData.subarray( start, end ) );
                }

                return newBuffer;
            };

            function init() {
                var parameterType = Object.prototype.toString.call( URL );
                var fileExtension = /[^.]+$/.exec( URL );
                if ( parameterType === '[object String]' ) {
                    var request = new XMLHttpRequest();
                    request.open( 'GET', URL, true );
                    request.responseType = 'arraybuffer';
                    request.addEventListener( 'progress', onProgressCallback, false );
                    request.onload = function () {
                        decodeAudio( request.response, fileExtension );
                    };
                    request.send();
                } else if ( parameterType === '[object File]' || parameterType === '[object Blob]' ) {
                    var reader = new FileReader();
                    reader.addEventListener( 'progress', onProgressCallback, false );
                    reader.onload = function () {
                        decodeAudio( reader.result, fileExtension );
                    };
                    reader.readAsArrayBuffer( URL );
                }

            }

            function decodeAudio( result, fileExt ) {
                context.decodeAudioData( result, function ( buffer ) {
                    isSoundLoaded_ = true;
                    rawBuffer_ = buffer;
                    // Do trimming if it is not a wave file
                    loopStart_ = 0;
                    loopEnd_ = rawBuffer_.length;
                    if ( fileExt[ 0 ] !== 'wav' ) {
                        // Trim Buffer based on Markers
                        var markers = detectLoopMarkers( rawBuffer_ );
                        if ( markers ) {
                            loopStart_ = markers.start;
                            loopEnd_ = markers.end;
                        }
                    }
                    if ( onloadCallback && typeof onloadCallback === 'function' ) {
                        onloadCallback( true );
                    }
                }, function () {
                    console.warn( "Error Decoding " + URL );
                    if ( onloadCallback && typeof onloadCallback === 'function' ) {
                        onloadCallback( false );
                    }
                } );
            }

            // Public functions
            /**
             * Get the current buffer.
             * @method getBuffer
             * @param {Number} start The start index
             * @param {Number} end The end index
             * @return {AudioBuffer} The AudioBuffer that was marked then trimmed if it is not a wav file.
             */
            this.getBuffer = function ( start, end ) {
                // Set start if it is missing
                if ( typeof start == 'undefined' ) {
                    start = 0;
                }
                // Set end if it is missing
                if ( typeof end == 'undefined' ) {
                    end = loopEnd_ - loopStart_;
                }

                return sliceBuffer_( loopStart_ + start, loopStart_ + end );
            };

            /**
             * Get the original buffer.
             * @method getRawBuffer
             * @return {AudioBuffer} The original AudioBuffer.
             */
            this.getRawBuffer = function () {
                if ( !isSoundLoaded_ ) {
                    console.error( "No Buffer Found - Buffer loading has not completed or has failed." );
                    return null;
                }
                return rawBuffer_;
            };

            /**
             * Check if sound is already loaded.
             * @method isLoaded
             * @return {Boolean} True if file is loaded. Flase if file is not yeat loaded.
             */
            this.isLoaded = function () {
                return isSoundLoaded_;
            };

            // Make a request
            init();
        }

        return FileLoader;
    } );

/**
 * @module Core
 *
 * @class MuliFileLoader
 * @static
 */
define( 'core/MultiFileLoader',[ 'core/FileLoader', 'core/SPAudioBuffer' ],
    function ( FileLoader, SPAudioBuffer ) {
        

        /**
         * Helper class to loader multiple sources from URL String, File or AudioBuffer or SPAudioBuffer Objects.
         *
         *
         * @method MuliFileLoader
         * @param {Array/String/File} sources Array of or Individual String, AudioBuffer or File Objects which define the sounds to be loaded
         * @param {String} audioContext AudioContext to be used in decoding the file
         * @param {String} [onLoadProgress] Callback function to access the progress of the file loading.
         * @param {String} [onLoadComplete] Callback function to be called when all sources are loaded
         */
        function MultiFileLoader( sources, audioContext, onLoadProgress, onLoadComplete ) {

            //Private variables
            var self = this;
            this.audioContext = audioContext;
            var sourcesToLoad_ = 0;
            var loadedAudioBuffers_ = [];

            //Private functions
            function init() {

                // If not defined, set empty sources.
                if ( !sources ) {
                    console.log( "Setting empty source. No sound may be heard" );
                    onLoadComplete( false, loadedAudioBuffers_ );
                    return;
                }

                // Convert to array.
                if ( !( sources instanceof Array ) ) {
                    var sourceArray = [];
                    sourceArray.push( sources );
                    sources = sourceArray;
                }

                // If beyond size limits, log error and callback with false.
                if ( sources.length < self.minSources || sources.length > self.maxSources ) {
                    console.error( "Unsupported number of Sources. " + self.modelName + " only supports a minimum of " + self.minSources + " and a maximum of " + self.maxSources + " sources. Trying to load " + sources.length + "." );
                    onLoadComplete( false, loadedAudioBuffers_ );
                    return;
                }

                // Load each of the sources
                sourcesToLoad_ = sources.length;
                loadedAudioBuffers_ = new Array( sourcesToLoad_ );
                sources.forEach( function ( thisSound, index ) {
                    loadSingleSound( thisSound, onSingleLoadAt( index ) );
                } );
            }

            function loadSingleSound( source, onSingleLoad ) {
                var sourceType = Object.prototype.toString.call( source );
                var audioBuffer;
                if ( sourceType === '[object AudioBuffer]' ) {
                    audioBuffer = new SPAudioBuffer( self.audioContext, source );
                    onSingleLoad( true, audioBuffer );
                } else if ( source instanceof SPAudioBuffer && source.buffer ) {
                    onSingleLoad( true, source );
                } else if ( sourceType === '[object String]' ||
                    sourceType === '[object File]' ||
                    ( source instanceof SPAudioBuffer && source.sourceURL ) ) {

                    var sourceURL;
                    if ( source instanceof SPAudioBuffer && source.sourceURL ) {
                        sourceURL = source.sourceURL;
                        audioBuffer = source;
                    } else {
                        sourceURL = source;
                        audioBuffer = new SPAudioBuffer( self.audioContext, sourceURL );
                    }

                    var fileLoader = new FileLoader( sourceURL, self.audioContext, function ( status ) {
                        if ( status ) {
                            audioBuffer.buffer = fileLoader.getBuffer();
                            onSingleLoad( status, audioBuffer );
                        } else {
                            onSingleLoad( status );
                        }
                    }, function ( progressEvent ) {
                        if ( onLoadProgress && typeof onLoadProgress === 'function' ) {
                            onLoadProgress( progressEvent, audioBuffer );
                        }
                    } );
                } else {
                    console.error( "Incorrect Parameter Type - Source is not a URL, File or AudioBuffer or doesn't have sourceURL or buffer" );
                    onSingleLoad( false, {} );
                }
            }

            function onSingleLoadAt( index ) {
                return function ( status, loadedSound ) {
                    if ( status ) {
                        //console.log( "Loaded ", index, "successfully" );
                        loadedAudioBuffers_[ index ] = loadedSound;
                    }
                    sourcesToLoad_--;
                    if ( sourcesToLoad_ === 0 ) {
                        var allStatus = true;
                        for ( var bIndex = 0; bIndex < loadedAudioBuffers_.length; ++bIndex ) {
                            if ( !loadedAudioBuffers_[ bIndex ] ) {
                                allStatus = false;
                                break;
                            }
                        }
                        onLoadComplete( allStatus, loadedAudioBuffers_ );
                    }
                };
            }
            init();
        }

        return MultiFileLoader;
    } );

/**
 * @module Models
 */
define( 'models/Looper',[ 'core/Config', 'core/BaseSound', 'core/SPAudioParam', 'core/SPAudioBufferSourceNode', 'core/MultiFileLoader', 'core/WebAudioDispatch' ],
    function ( Config, BaseSound, SPAudioParam, SPAudioBufferSourceNode, multiFileLoader, webAudioDispatch ) {
        

        /**
         *
         * A model which loads one or more sources and allows them to be looped continuously at variable speed.
         * @class Looper
         * @constructor
         * @extends BaseSound
         * @param {AudioContext} [context] AudioContext to be used.
         * @param {Array/String/AudioBuffer/SPAudioBuffer/File} [sources] Single or Array of either URLs or AudioBuffers or File Object of the audio source.
         * @param {Function} [onLoadProgress] Callback when the audio file is being downloaded.
         * @param {Function} [onLoadComplete] Callback when all sources have finished loading.
         * @param {Function} [onAudioStart] Callback when the audio is about to start playing.
         * @param {Function} [onAudioEnd] Callback when the audio has finished playing.
         * @param {Function} [onTrackEnd] Callback when an individual track has finished playing.
         */
        function Looper( context, sources, onLoadProgress, onLoadComplete, onAudioStart, onAudioEnd, onTrackEnd ) {
            if ( !( this instanceof Looper ) ) {
                throw new TypeError( "Looper constructor cannot be called as a function." );
            }
            // Call superclass constructor
            BaseSound.call( this, context );
            this.maxSources = Config.MAX_VOICES;
            this.minSources = 1;
            this.modelName = 'Looper';

            this.onLoadProgress = onLoadProgress;
            this.onLoadComplete = onLoadComplete;
            this.onAudioStart = onAudioStart;
            this.onAudioEnd = onAudioEnd;

            // Private vars
            var self = this;

            var sourceBufferNodes_ = [];
            var lastStopPosition_ = [];
            var rateArray_ = [];

            var onLoadAll = function ( status, arrayOfBuffers ) {
                self.multiTrackGain.length = arrayOfBuffers.length;
                arrayOfBuffers.forEach( function ( thisBuffer, trackIndex ) {
                    lastStopPosition_.push( 0 );
                    insertBufferSource( thisBuffer, trackIndex, arrayOfBuffers.length );
                } );

                if ( rateArray_ && rateArray_.length > 0 ) {
                    self.registerParameter( new SPAudioParam( self, 'playSpeed', 0.0, 10, 1, rateArray_, null, playSpeedSetter_ ), true );
                }

                if ( status ) {
                    self.isInitialized = true;
                }

                if ( typeof self.onLoadComplete === 'function' ) {
                    self.onLoadComplete( status, arrayOfBuffers );
                }
            };

            var insertBufferSource = function ( audioBuffer, trackIndex, totalTracks ) {
                var source;
                if ( !( sourceBufferNodes_[ trackIndex ] instanceof SPAudioBufferSourceNode ) ) {
                    source = new SPAudioBufferSourceNode( self.audioContext );
                } else {
                    source = sourceBufferNodes_[ trackIndex ];
                }

                source.buffer = audioBuffer;
                source.loopEnd = audioBuffer.duration;
                source.onended = function ( event ) {
                    onSourceEnd( event, trackIndex, source );
                };

                if ( totalTracks > 1 ) {
                    var multiChannelGainParam = new SPAudioParam( self, 'track-' + trackIndex + '-gain', 0.0, 1, 1, source.gain, null, null );
                    self.multiTrackGain.splice( trackIndex, 1, multiChannelGainParam );
                }

                source.connect( self.releaseGainNode );

                sourceBufferNodes_.splice( trackIndex, 1, source );
                rateArray_.push( source.playbackRate );
            };

            var onSourceEnd = function ( event, trackIndex, source ) {
                var cTime = self.audioContext.currentTime;
                // Create a new source since SourceNodes can't play again.
                source.resetBufferSource( cTime, self.releaseGainNode );

                if ( self.multiTrackGain.length > 1 ) {
                    var multiChannelGainParam = new SPAudioParam( self, 'track-' + trackIndex + '-gain' + trackIndex, 0.0, 1, 1, source.gain, null, null );
                    self.multiTrackGain.splice( trackIndex, 1, multiChannelGainParam );
                }

                if ( typeof self.onTrackEnd === 'function' ) {
                    onTrackEnd( self, trackIndex );
                }

                var allSourcesEnded = sourceBufferNodes_.reduce( function ( prevState, thisSource ) {
                    return prevState && ( thisSource.playbackState === thisSource.FINISHED_STATE ||
                        thisSource.playbackState === thisSource.UNSCHEDULED_STATE );
                }, true );

                if ( allSourcesEnded && self.isPlaying ) {
                    self.isPlaying = false;
                    if ( typeof self.onAudioEnd === 'function' ) {
                        self.onAudioEnd();
                    }
                }
            };

            var playSpeedSetter_ = function ( aParam, value, audioContext ) {
                if ( self.isInitialized ) {
                    /* 0.001 - 60dB Drop
                        e(-n) = 0.001; - Decay Rate of setTargetAtTime.
                        n = 6.90776;
                        */
                    var t60multiplier = 6.90776;

                    var currentSpeed = sourceBufferNodes_[ 0 ] ? sourceBufferNodes_[ 0 ].playbackRate.value : 1;

                    if ( self.isPlaying ) {
                        // console.log( "easingIn/Out" );
                        // easeIn/Out
                        if ( value > currentSpeed ) {
                            sourceBufferNodes_.forEach( function ( thisSource ) {
                                thisSource.playbackRate.cancelScheduledValues( audioContext.currentTime );
                                thisSource.playbackRate.setTargetAtTime( value, audioContext.currentTime, self.easeIn.value / t60multiplier );
                            } );
                        } else if ( value < currentSpeed ) {
                            sourceBufferNodes_.forEach( function ( thisSource ) {
                                thisSource.playbackRate.cancelScheduledValues( audioContext.currentTime );
                                thisSource.playbackRate.setTargetAtTime( value, audioContext.currentTime, self.easeOut.value / t60multiplier );
                            } );
                        }
                    } else {
                        // console.log( "changing directly" );
                        sourceBufferNodes_.forEach( function ( thisSource ) {
                            thisSource.playbackRate.cancelScheduledValues( audioContext.currentTime );
                            thisSource.playbackRate.setValueAtTime( value, audioContext.currentTime );
                        } );
                    }
                }
            };

            function init( sources ) {
                rateArray_ = [];
                sourceBufferNodes_.forEach( function ( thisSource ) {
                    thisSource.disconnect();
                } );
                self.multiTrackGain.length = 0;
                multiFileLoader.call( self, sources, self.audioContext, self.onLoadProgress, onLoadAll );
            }

            // Public Properties

            /**
             * Event Handler or Callback for ending of a individual track.
             *
             * @property onTrackEnd
             * @type Function
             * @default null
             */
            this.onTrackEnd = onTrackEnd;

            /**
             * Speed of playback of the source. Affects both pitch and tempo.
             *
             * @property playSpeed
             * @type SPAudioParam
             * @default 1.0
             * @minvalue 0.0
             * @maxvalue 10.0
             */
            this.registerParameter( new SPAudioParam( this, 'playSpeed', 0.0, 10, 1.005, null, null, playSpeedSetter_ ), true );

            /**
             * Rate of increase of Play Speed. It is the time-constant value of first-order filter (exponential) which approaches the target speed set by the {{#crossLink "Looper/playSpeed:property"}}{{/crossLink}} property.
             *
             * @property easeIn
             * @type SPAudioParam
             * @default 0.05
             * @minvalue 0.05
             * @maxvalue 10.0
             */

            this.registerParameter( SPAudioParam.createPsuedoParam( this, 'easeIn', 0.05, 10.0, 0.05 ) );

            /**
             * Rate of decrease of Play Speed. It is the time-constant value of first-order filter (exponential) which approaches the target speed set by the {{#crossLink "Looper/playSpeed:property"}}{{/crossLink}} property.
             *
             * @property easeOut
             * @type SPAudioParam
             * @default 0.05
             * @minvalue 0.05
             * @maxvalue 10.0
             */
            this.registerParameter( SPAudioParam.createPsuedoParam( this, 'easeOut', 0.05, 10.0, 0.05 ) );

            /**
             * The volume (loudness) for each individual track if multiple sources are used. Works even if a single source is used.
             *
             *
             * @property multiTrackGain
             * @type Array of SPAudioParams
             * @default 1.0
             * @minvalue 0.0
             * @maxvalue 1.0
             */
            var multiTrackGainArray = [];
            multiTrackGainArray.name = 'multiTrackGain';
            this.registerParameter( multiTrackGainArray, false );

            /**
             * The maximum number time the source will be looped before stopping. Currently only supports -1 (loop indefinitely), and 1 (only play the track once, ie. no looping).
             *
             * @property maxLoops
             * @type SPAudioParam
             * @default -1 (Infinite)
             * @minvalue -1 (Infinite)
             * @maxvalue 1
             */
            this.registerParameter( SPAudioParam.createPsuedoParam( this, 'maxLoops', -1, 1, -1 ) );

            /**
             * Reinitializes a Looper and sets it's sources.
             *
             * @method setSources
             * @param {Array/AudioBuffer/String/File} sources Single or Array of either URLs or AudioBuffers of sources.
             * @param {Function} [onLoadProgress] Callback when the audio file is being downloaded.
             * @param {Function} [onLoadComplete] Callback when all sources have finished loading.
             */
            this.setSources = function ( sources, onLoadProgress, onLoadComplete ) {
                BaseSound.prototype.setSources.call( this, sources, onLoadProgress, onLoadComplete );
                init( sources );
            };

            /**
             * Plays the model immediately. If the model is paused, the model will be played back from the same position as it was paused at.
             *
             * @method play
             *
             */
            this.play = function () {

                if ( !this.isInitialized ) {
                    throw new Error( this.modelName, "hasn't finished Initializing yet. Please wait before calling start/play" );
                }

                var now = this.audioContext.currentTime;

                if ( !this.isPlaying ) {
                    sourceBufferNodes_.forEach( function ( thisSource, index ) {
                        var offset = ( lastStopPosition_ && lastStopPosition_[ index ] ) ? lastStopPosition_[ index ] : thisSource.loopStart;
                        thisSource.loop = ( self.maxLoops.value !== 1 );
                        thisSource.start( now, offset );
                    } );
                    BaseSound.prototype.start.call( this, now );
                    webAudioDispatch( function () {
                        if ( typeof self.onAudioStart === 'function' ) {
                            self.onAudioStart();
                        }
                    }, now, this.audioContext );
                }
            };

            /**
             * Start playing after specific time and from a specific offset.
             *
             * @method start
             * @param {Number} when Time (in seconds) when the sound should start playing.
             * @param {Number} [offset] The starting position of the playhead in seconds
             * @param {Number} [duration] Duration of the portion (in seconds) to be played
             * @param {Number} [attackDuration] Duration (in seconds) of attack ramp of the envelope.
             */
            this.start = function ( when, offset, duration, attackDuration ) {
                if ( !this.isInitialized ) {
                    console.error( this.modelName, " hasn't finished Initializing yet. Please wait before calling start/play" );
                    return;
                }

                if ( !this.isPlaying ) {
                    sourceBufferNodes_.forEach( function ( thisSource ) {

                        offset = thisSource.loopStart + parseFloat( offset ) || 0;

                        if ( typeof duration == 'undefined' || duration === null ) {
                            duration = thisSource.buffer.duration;
                        }
                        thisSource.loop = ( self.maxLoops.value !== 1 );
                        thisSource.start( when, offset, duration );
                    } );

                    BaseSound.prototype.start.call( this, when, offset, duration, attackDuration );
                    webAudioDispatch( function () {
                        if ( typeof self.onAudioStart === 'function' ) {
                            self.onAudioStart();
                        }
                    }, when, this.audioContext );
                }
            };

            /**
             * Stops the model and resets play head to 0.
             * @method stop
             * @param {Number} when Time offset to stop
             */
            this.stop = function ( when ) {
                if ( self.isPlaying ) {
                    sourceBufferNodes_.forEach( function ( thisSource, index ) {
                        thisSource.stop( when );
                        lastStopPosition_[ index ] = 0;
                    } );

                    BaseSound.prototype.stop.call( this, when );
                    webAudioDispatch( function () {
                        if ( typeof self.onAudioEnd === 'function' && self.isPlaying === false ) {
                            self.onAudioEnd();
                        }
                    }, when, this.audioContext );
                }
            };

            /**
             * Pause the currently playing model at the current position.
             *
             * @method pause
             */
            this.pause = function () {
                if ( self.isPlaying ) {

                    sourceBufferNodes_.forEach( function ( thisSource, index ) {
                        thisSource.stop( 0 );
                        lastStopPosition_[ index ] = thisSource.playbackPosition / thisSource.buffer.sampleRate;
                    } );

                    BaseSound.prototype.stop.call( this, 0 );
                    webAudioDispatch( function () {
                        if ( typeof self.onAudioEnd === 'function' ) {
                            self.onAudioEnd();
                        }
                    }, 0, this.audioContext );
                }
            };

            /**
             * Linearly ramp down the gain of the audio in time (seconds) to 0.
             *
             * @method release
             * @param {Number} [when] Time (in seconds) at which the Envelope will release.
             * @param {Number} [fadeTime] Amount of time (seconds) it takes for linear ramp down to happen.
             * @param {Boolean} [resetOnRelease] Boolean to define if release resets (stops) the playback or just pauses it.
             */
            this.release = function ( when, fadeTime, resetOnRelease ) {
                if ( typeof when === 'undefined' || when < this.audioContext.currentTime ) {
                    when = this.audioContext.currentTime;
                }

                var FADE_TIME = 0.5;
                fadeTime = fadeTime || FADE_TIME;

                BaseSound.prototype.release.call( this, when, fadeTime, resetOnRelease );
                // Pause the sound after currentTime + fadeTime + FADE_TIME_PAD

                if ( resetOnRelease ) {
                    // Create new releaseGain Node
                    this.releaseGainNode = this.audioContext.createGain();
                    this.destinations.forEach( function ( dest ) {
                        self.releaseGainNode.connect( dest.destination, dest.output, dest.input );
                    } );

                    // Disconnect and rewire each source
                    sourceBufferNodes_.forEach( function ( thisSource, trackIndex ) {
                        thisSource.stop( when + fadeTime );
                        lastStopPosition_[ trackIndex ] = 0;

                        thisSource.resetBufferSource( when, self.releaseGainNode );
                        var multiChannelGainParam = new SPAudioParam( self, 'gain-' + trackIndex, 0.0, 1, 1, thisSource.gain, null, null );
                        self.multiTrackGain.splice( trackIndex, 1, multiChannelGainParam );
                    } );

                    // Set playing to false and end audio after given time.
                    this.isPlaying = false;
                    webAudioDispatch( function () {
                        if ( typeof self.onAudioEnd === 'function' && self.isPlaying === false ) {
                            self.onAudioEnd();
                        }
                    }, when + fadeTime, this.audioContext );
                }
            };

            // Initialize the sources.
            window.setTimeout( function () {
                init( sources );
            }, 0 );
        }

        Looper.prototype = Object.create( BaseSound.prototype );

        return Looper;
    } );

/**
 * @module Core
 */
define( 'core/SoundQueue',[ 'core/Config', 'models/Looper', 'core/FileLoader', 'core/WebAudioDispatch' ],
    function ( Config, Looper, FileLoader, webaudioDispatch ) {
        

        /**
         * A primitive which allows events on other Sound Models to be queued based on time of execution and executed at the appropriate time. Enables polyphony.
         *
         * Currently supports these types of events. </br>
         * ["QESTOP", "QESTART", "QESETPARAM", "QESETSRC", "QERELEASE" ]
         *
         * @class SoundQueue
         * @constructor
         * @param {AudioContext} context AudioContext to be used in running the queue.
         * @param {Function} [onAudioStart] Callback when the audio is about to start playing.
         * @param {Function} [onAudioEnd] Callback when the audio has finished playing.
         * @param {Number} [numberOfVoices] Number of polyphonic voices the Queue can have.
         *
         */
        function SoundQueue( context, onAudioStart, onAudioEnd, numberOfVoices ) {
            if ( !( this instanceof SoundQueue ) ) {
                throw new TypeError( "SoundQueue constructor cannot be called as a function." );
            }

            if ( typeof numberOfVoices === 'undefined' ) {
                numberOfVoices = Config.MAX_VOICES;
            }

            // Private Variables
            var self = this;

            this.onAudioEnd = onAudioEnd;
            this.onAudioStart = onAudioStart;

            var eventQueue_ = [];
            var busyVoices_ = [];
            var freeVoices_ = [];

            var vIndex;

            // Private Functions

            function soundQueueCallback() {
                processEventsTill( context.currentTime + 1 / Config.NOMINAL_REFRESH_RATE );
                window.requestAnimationFrame( soundQueueCallback );
            }

            function init() {
                for ( var i = 0; i < numberOfVoices; i++ ) {
                    freeVoices_[ i ] = new Looper( context, null, null, null, null, null, onVoiceEnded );
                    freeVoices_[ i ].disconnect();
                    freeVoices_[ i ].maxLoops.value = 1;
                    freeVoices_[ i ].voiceIndex = i;
                }

                window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

                window.requestAnimationFrame( soundQueueCallback );

            }

            function onVoiceEnded( endedVoice ) {
                //console.log( "freeing " + endedVoice.voiceIndex );
                freeVoices_.push( endedVoice );
                busyVoices_.splice( busyVoices_.indexOf( endedVoice ), 1 );

                var noPlayableEvents = eventQueue_.reduce( function ( prev, thisEvent ) {
                    return prev || thisEvent.type !== 'QESTART';
                }, ( eventQueue_.length === 0 ) );

                if ( self.isPlaying && busyVoices_.length === 0 && noPlayableEvents ) {
                    self.isPlaying = false;
                    if ( typeof self.onAudioEnd === 'function' ) {
                        self.onAudioEnd();
                    }
                }
            }

            function findVoiceWithID( eventID ) {
                for ( vIndex = 0; vIndex < busyVoices_.length; vIndex++ ) {
                    if ( busyVoices_[ vIndex ].eventID == eventID ) {
                        return busyVoices_[ vIndex ];
                    }
                }
                return null;
            }

            function dequeueEventsHavingID( eventID ) {
                for ( var eventIndex = 0; eventIndex < eventQueue_.length; eventIndex++ ) {
                    var thisEvent = eventQueue_[ eventIndex ];
                    if ( thisEvent.eventID === eventID ) {
                        eventQueue_.splice( eventIndex, 1 );
                        eventIndex--;
                    }
                }
            }

            function getFreeVoice( eventID, eventTime ) {
                var newVoice;
                if ( freeVoices_.length < 1 ) {
                    console.warn( "No free voices left. Stealing the oldest" );
                    newVoice = busyVoices_.shift();
                    dequeueEventsHavingID( newVoice.eventID );
                    newVoice.eventID = eventID;
                    newVoice.release( context.currentTime, eventTime - context.currentTime, true );
                    busyVoices_.push( newVoice );
                } else {
                    newVoice = freeVoices_.shift();
                    newVoice.eventID = eventID;
                    busyVoices_.push( newVoice );
                }

                return newVoice;
            }

            function processSingleEvent( thisEvent ) {
                var selectedVoice = findVoiceWithID( thisEvent.eventID );

                if ( ( thisEvent.type == 'QESTART' || thisEvent.type == 'QESETPARAM' || thisEvent.type == 'QESETSRC' ) && selectedVoice === null ) {
                    selectedVoice = getFreeVoice( thisEvent.eventID, thisEvent.time );
                }

                // If voice is still null/defined, then skip the event
                if ( !selectedVoice ) {
                    return;
                }

                //console.log( "Processing " + thisEvent.type + " : " + thisEvent.eventID + " at " + thisEvent.time + " on " + selectedVoice.voiceIndex );

                if ( thisEvent.type == 'QESTART' ) {
                    //console.log( "starting " + selectedVoice.voiceIndex );
                    selectedVoice.start( thisEvent.time, thisEvent.offset, null, thisEvent.attackDuration );
                    webaudioDispatch( function () {
                        if ( !self.isPlaying ) {
                            self.isPlaying = true;
                            if ( typeof self.onAudioStart === 'function' ) {
                                self.onAudioStart();
                            }
                        }
                    }, thisEvent.time, context );
                } else if ( thisEvent.type == 'QESETPARAM' ) {
                    if ( selectedVoice[ thisEvent.paramName ] ) {
                        selectedVoice[ thisEvent.paramName ].setValueAtTime( thisEvent.paramValue, thisEvent.time );
                    }
                } else if ( thisEvent.type == 'QESETSRC' ) {
                    selectedVoice.setSources( thisEvent.sourceBuffer );
                } else if ( thisEvent.type == 'QERELEASE' ) {
                    //console.log( "releasing " + selectedVoice.voiceIndex );
                    selectedVoice.release( thisEvent.time, thisEvent.releaseDuration );
                } else if ( thisEvent.type == 'QESTOP' ) {
                    selectedVoice.pause( thisEvent.time );
                    webaudioDispatch( function () {
                        freeVoices_.push( selectedVoice );
                        busyVoices_.splice( busyVoices_.indexOf( selectedVoice ), 1 );
                    }, thisEvent.time, context );
                } else {
                    console.warn( "Unknown Event Type : " + thisEvent );
                }
            }

            function processEventsTill( maxTime ) {
                for ( var eventIndex = 0; eventIndex < eventQueue_.length; eventIndex++ ) {
                    var thisEvent = eventQueue_[ eventIndex ];
                    if ( thisEvent.time <= maxTime ) {
                        processSingleEvent( thisEvent );
                        eventQueue_.splice( eventIndex, 1 );
                        eventIndex--;
                    }
                }
            }

            // Public Properties
            this.isPlaying = false;

            // Public Functions

            /**
             * Enqueue a Start event.
             *
             * @method queueStart
             * @param {Number} time Time (in seconds) at which the voice will start.
             * @param {Number} eventID Arbitary ID which is common for all related events.
             * @param {Number} [offset] The starting in seconds position of the playhead.
             * @param {Number} [attackDuration] Attack Duration (in seconds) for attack envelope during start.
             */
            this.queueStart = function ( time, eventID, offset, attackDuration ) {
                eventQueue_.push( {
                    'type': 'QESTART',
                    'time': time,
                    'eventID': eventID,
                    'offset': offset,
                    'attackDuration': attackDuration
                } );
            };

            /**
             * Enqueue a Release event.
             *
             * @method queueRelease
             * @param {Number} time Time (in seconds) at which the voice will release.
             * @param {Number} eventID Arbitary ID which is common for all related events.
             * @param {Number} releaseDuration Time (in seconds) on the length of the release
             */
            this.queueRelease = function ( time, eventID, releaseDuration ) {
                eventQueue_.push( {
                    'type': 'QERELEASE',
                    'time': time,
                    'eventID': eventID,
                    'releaseDuration': releaseDuration
                } );
            };

            /**
             * Enqueue a Stop event.
             *
             * @method queueStop
             * @param {Number} time Time (in seconds) at which the voice will stop.
             * @param {Number} eventID Arbitary ID which is common for all related events.
             */
            this.queueStop = function ( time, eventID ) {
                eventQueue_.push( {
                    'type': 'QESTOP',
                    'time': time,
                    'eventID': eventID
                } );
            };

            /**
             * Enqueue a Set Parameter event.
             *
             * @method queueSetParameter
             * @param {Number} time Time (in seconds) at which the voice parameter will be set.
             * @param {Number} eventID Arbitary ID which is common for all related events.
             * @param {String} paramName Name of the parameter to be set.
             * @param {Boolean/Number} paramValue Value for the Parameter to be set.

             */
            this.queueSetParameter = function ( time, eventID, paramName, paramValue ) {
                eventQueue_.push( {
                    'type': 'QESETPARAM',
                    'time': time,
                    'eventID': eventID,
                    'paramName': paramName,
                    'paramValue': paramValue
                } );
            };

            /**
             * Enqueue a Set Source event.
             *
             * @method queueSetSource
             * @param {Number} time Time (in seconds) at which the voice source will be set.
             * @param {Number} eventID Arbitary ID which is common for all related events.
             * @param {AudioBuffer} sourceBuffer AudioBuffer to be set as source for a voice.
             */
            this.queueSetSource = function ( time, eventID, sourceBuffer ) {
                eventQueue_.push( {
                    'type': 'QESETSRC',
                    'time': time,
                    'eventID': eventID,
                    'sourceBuffer': sourceBuffer
                } );
            };

            /**
             * Updates the Queued Event(s).
             *
             * @method queueUpdate
             * @param {String} Type of the event to be updated.
             * @param {Number} eventID ID of the event to be updated. Null for all events of this type.
             * @param {String} propertyName Name of the property to be updated.
             * @param {Boolean/Number} propertyValue Value for the property to be updated
             */
            this.queueUpdate = function ( eventType, eventID, propertyName, propertyValue ) {
                for ( var eventIndex = 0; eventIndex < eventQueue_.length; eventIndex++ ) {
                    var thisEvent = eventQueue_[ eventIndex ];
                    if ( thisEvent.type === eventType && ( !eventID || thisEvent.eventID == eventID ) ) {
                        if ( thisEvent.hasOwnProperty( propertyName ) ) {
                            thisEvent[ propertyName ] = propertyValue;
                        }
                    }
                }
            };

            /**
             * Pauses the SoundQueue. All queued voices are stopped and released.
             *
             * @method clear
             */
            this.pause = function () {
                this.stop( 0 );
            };

            /**
             * Clears the SoundQueue. All queued voices are stopped and released.
             *
             * @method clear
             * @param {Number} [when] A timestamp describing when to clear the SoundQueue
             */
            this.stop = function ( when ) {
                processEventsTill( when );
                eventQueue_ = [];
                busyVoices_.forEach( function ( thisVoice ) {
                    thisVoice.release( when );
                } );
                freeVoices_.forEach( function ( thisVoice ) {
                    thisVoice.stop( when );
                } );
            };

            /**
             * Connect the SoundQueue to an output. Connects all the internal voices to the output.
             *
             * @method connect
             * @param {AudioNode} destination AudioNode to connect to.
             * @param {Number} [output] Index describing which output of the AudioNode from which to connect.
             * @param {Number} [input] Index describing which input of the destination AudioNode to connect to.
             */
            this.connect = function ( destination, output, input ) {
                freeVoices_.forEach( function ( thisVoice ) {
                    thisVoice.connect( destination, output, input );
                } );

                busyVoices_.forEach( function ( thisVoice ) {
                    thisVoice.connect( destination, output, input );
                } );
            };

            /**
             * Disconnects the Sound from the AudioNode Chain.
             *
             * @method disconnect
             * @param {Number} [outputIndex] Index describing which output of the AudioNode to disconnect.
             */
            this.disconnect = function ( outputIndex ) {
                freeVoices_.forEach( function ( thisVoice ) {
                    thisVoice.disconnect( outputIndex );
                } );

                busyVoices_.forEach( function ( thisVoice ) {
                    thisVoice.disconnect( outputIndex );
                } );
            };

            init();
        }

        return SoundQueue;

    } );

/**
 * @module Core
 */
define( 'core/Converter',[],
    function () {
        

        /**
         * Helper class to convert between various ratios and musical values.
         *
         * @class Converter
         * @static
         */
        function Converter() {}

        /**
         * Helper method to convert a value in semitones to a value in ratio.
         *
         *
         * @method semitonesToRatio
         * @static
         * @param {Number} semiTones Value in semitones to be converted to ratio.
         *
         */
        Converter.semitonesToRatio = function ( semiTones ) {
            return Math.pow( 2.0, semiTones / 12.0 );
        };

        return Converter;

    } );

/**
 * @module Models
 */
define( 'models/MultiTrigger',[ 'core/Config', 'core/BaseSound', 'core/SoundQueue', 'core/SPAudioParam', 'core/MultiFileLoader', 'core/Converter', 'core/WebAudioDispatch' ],
    function ( Config, BaseSound, SoundQueue, SPAudioParam, multiFileLoader, Converter, webAudioDispatch ) {
        

        /**
         * A model which triggers a single or multiple sources with multiple voices (polyphony)
         * repeatedly.
         *
         *
         * @class MultiTrigger
         * @constructor
         * @extends BaseSound
         * @extends BaseSound
         * @param {AudioContext} [context] AudioContext to be used.
         * @param {Array/String/AudioBuffer/File} [sources] Single or Array of either URLs or AudioBuffers or File Object of the audio source.
         * @param {Function} [onLoadProgress] Callback when the audio file is being downloaded.
         * @param {Function} [onLoadComplete] Callback when all sources have finished loading.
         * @param {Function} [onAudioStart] Callback when the audio is about to start playing.
         * @param {Function} [onAudioEnd] Callback when the audio has finished playing.
         */
        function MultiTrigger( context, sources, onLoadProgress, onLoadComplete, onAudioStart, onAudioEnd ) {
            if ( !( this instanceof MultiTrigger ) ) {
                throw new TypeError( "MultiTrigger constructor cannot be called as a function." );
            }

            // Call superclass constructor
            BaseSound.call( this, context );

            var self = this;
            this.maxSources = Config.MAX_VOICES;
            this.minSources = 1;
            this.modelName = 'MultiTrigger';

            this.onLoadProgress = onLoadProgress;
            this.onLoadComplete = onLoadComplete;

            var onAudioStart_ = onAudioStart;
            var onAudioEnd_ = onAudioEnd;

            Object.defineProperty( this, 'onAudioStart', {
                enumerable: true,
                configurable: false,
                set: function ( startCallback ) {
                    if ( soundQueue_ ) {
                        onAudioStart_ = startCallback;
                        soundQueue_.onAudioStart = startCallback;
                    }
                },
                get: function () {
                    return onAudioStart_;
                }
            } );

            Object.defineProperty( this, 'onAudioEnd', {
                enumerable: true,
                configurable: false,
                set: function ( endCallback ) {
                    onAudioEnd_ = endCallback;
                    if ( soundQueue_ ) {
                        soundQueue_.onAudioEnd = endCallback;
                    }
                },
                get: function () {
                    return onAudioEnd_;
                }
            } );

            var lastEventTime_ = 0;
            var timeToNextEvent_ = 0;

            // Private Variables
            var sourceBuffers_ = [];
            var soundQueue_;
            var currentEventID_ = 0;
            var currentSourceID_ = 0;

            var wasPlaying_ = false;
            // Private Functions
            function init( sources ) {
                multiFileLoader.call( self, sources, self.audioContext, self.onLoadProgress, onLoadAll );
            }

            var onLoadAll = function ( status, audioBufferArray ) {
                sourceBuffers_ = audioBufferArray;
                timeToNextEvent_ = updateTimeToNextEvent( self.eventRate.value );
                soundQueue_.connect( self.releaseGainNode );

                if ( status ) {
                    self.isInitialized = true;
                }
                if ( typeof self.onLoadComplete === 'function' ) {
                    self.onLoadComplete( status, audioBufferArray );
                }
            };

            function triggerOnce( eventTime ) {

                // Release Older Sounds

                if ( currentEventID_ >= self.maxSources - 2 ) {
                    var releaseID = currentEventID_ - ( self.maxSources - 2 );
                    var releaseDur = eventTime - lastEventTime_;
                    soundQueue_.queueRelease( eventTime, releaseID, releaseDur );
                }

                var length = sourceBuffers_.length;

                if ( self.eventRand.value ) {
                    if ( length > 2 ) {
                        currentSourceID_ = ( currentSourceID_ + Math.floor( Math.random() * ( length - 1 ) ) ) % length;
                    } else {
                        currentSourceID_ = Math.floor( Math.random() * ( length - 1 ) );
                    }
                } else {
                    currentSourceID_ = currentSourceID_ % length;
                }

                var timeStamp = eventTime;
                var playSpeed = Converter.semitonesToRatio( self.pitchShift.value + Math.random() * self.pitchRand.value );

                soundQueue_.queueSetSource( timeStamp, currentEventID_, sourceBuffers_[ currentSourceID_ ] );
                soundQueue_.queueSetParameter( timeStamp, currentEventID_, 'playSpeed', playSpeed );
                soundQueue_.queueStart( timeStamp, currentEventID_ );
                currentEventID_++;
                currentSourceID_++;

            }

            function multiTiggerCallback() {

                var currentTime = context.currentTime;
                var endTime = currentTime + 1 / Config.NOMINAL_REFRESH_RATE;

                while ( lastEventTime_ + timeToNextEvent_ < endTime ) {
                    var eventTime = Math.max( currentTime, lastEventTime_ + timeToNextEvent_ );
                    triggerOnce( eventTime );
                    lastEventTime_ = eventTime;
                    timeToNextEvent_ = updateTimeToNextEvent( self.eventRate.value );
                }

                // Keep making callback request if model is still playing.
                if ( self.isPlaying ) {
                    window.requestAnimationFrame( multiTiggerCallback );
                }
            }

            function updateTimeToNextEvent( eventRate ) {
                var period = 1.0 / eventRate;
                var randomness = Math.random() - 0.5;
                var jitterRand = ( 1.0 + 2.0 * self.eventJitter.value * randomness );

                var updateTime = period * jitterRand;

                if ( isFinite( updateTime ) ) {
                    //Update releaseDur of Loopers being released
                    var releaseDur = Math.max( 0.99 * period * ( 1 - self.eventJitter.value ), 0.01 );
                    soundQueue_.queueUpdate( 'QERELEASE', null, 'releaseDuration', releaseDur );
                } else {
                    // 1  year in seconds.
                    updateTime = 365 * 24 * 3600;
                }

                return updateTime;
            }

            function eventRateSetter_( aParam, value ) {
                if ( value === 0 ) {
                    if ( self.isPlaying ) {
                        wasPlaying_ = true;
                        soundQueue_.pause();
                        BaseSound.prototype.pause.call( self );
                    }
                } else {
                    if ( self.isInitialized && !self.isPlaying && wasPlaying_ ) {
                        self.play();
                    }
                    if ( self.isInitialized ) {
                        timeToNextEvent_ = updateTimeToNextEvent( value );
                    }
                }

            }

            // Public Properties

            /**
             * Pitch shift of the triggered voices in semitones.
             *
             * @property pitchShift
             * @type SPAudioParam
             * @default 0
             * @minvalue -60.0
             * @maxvalue 60.0
             */
            this.registerParameter( SPAudioParam.createPsuedoParam( this, 'pitchShift', -60.0, 60.0, 0 ) );

            /**
             * Maximum value for random pitch shift of the triggered voices in semitones.
             *
             * @property pitchRand
             * @type SPAudioParam
             * @default 0.0
             * @minvalue 0.0
             * @maxvalue 24.0
             */
            this.registerParameter( SPAudioParam.createPsuedoParam( this, 'pitchRand', 0.0, 24.0, 0.0 ) );

            /**
             * Enable randomness in the order of sources which are triggered.
             *
             * @property eventRand
             * @type SPAudioParam
             * @default false
             * @minvalue true
             * @maxvalue false
             */
            this.registerParameter( SPAudioParam.createPsuedoParam( this, 'eventRand', true, false, false ) );

            /**
             * Trigger rate for playing the model in Hz.
             *
             * @property eventRate
             * @type SPAudioParam
             * @default 10.0
             * @minvalue 0.0
             * @maxvalue 60.0
             */
            this.registerParameter( new SPAudioParam( this, 'eventRate', 0, 60.0, 10.0, null, null, eventRateSetter_ ) );
            /**
             * Maximum deviation from the regular trigger interval (as a factor of 1).
             *
             * @property eventJitter
             * @type SPAudioParam
             * @default 0.0
             * @minvalue 0.0
             * @maxvalue 0.99
             */
            this.registerParameter( SPAudioParam.createPsuedoParam( this, 'eventJitter', 0, 0.99, 0 ) );

            // Public Functions

            /**
             * Start repeated triggering.
             *
             * @method start
             * @param {Number} when The delay in seconds before playing the model
             * @param {Number} [offset] The starting position of the playhead
             * @param {Number} [duration] Duration of the portion (in seconds) to be played
             * @param {Number} [attackDuration] Duration (in seconds) of attack ramp of the envelope.
             *
             */
            this.start = function ( when, offset, duration, attackDuration ) {
                if ( !this.isInitialized ) {
                    console.error( this.modelName, " hasn't finished Initializing yet. Please wait before calling start/play" );
                    return;
                }
                BaseSound.prototype.start.call( this, when, offset, duration, attackDuration );
                webAudioDispatch( multiTiggerCallback, when, this.audioContext );
            };

            /**
             * Start repeated triggering immediately
             *
             * @method play
             *
             */
            this.play = function () {
                this.start( 0 );
            };

            /**
             * Stops playing all voices.
             *
             * @method stop
             *
             */
            this.stop = function ( when ) {
                soundQueue_.stop( when );
                wasPlaying_ = false;
                BaseSound.prototype.stop.call( this, when );
            };

            /**
             * Pauses playing all voices.
             *
             * @method pause
             *
             */
            this.pause = function () {
                soundQueue_.pause();
                wasPlaying_ = false;
                BaseSound.prototype.pause.call( this );
            };

            /**
             * Reinitializes a MultiTrigger and sets it's sources.
             *
             * @method setSources
             * @param {Array/AudioBuffer/String/File} sources Single or Array of either URLs or AudioBuffers or File Objects of audio sources.
             * @param {Function} [onLoadProgress] Callback when the audio file is being downloaded.
             * @param {Function} [onLoadComplete] Callback when all sources have finished loading.
             */
            this.setSources = function ( sources, onLoadProgress, onLoadComplete ) {
                BaseSound.prototype.setSources.call( this, sources, onLoadProgress, onLoadComplete );
                init( sources );
            };
            // SoundQueue based model.
            soundQueue_ = new SoundQueue( this.audioContext, this.onAudioStart, this.onAudioEnd );

            window.setTimeout( function () {
                init( sources );
            }, 0 );

        }

        MultiTrigger.prototype = Object.create( BaseSound.prototype );

        return MultiTrigger;

    } );

