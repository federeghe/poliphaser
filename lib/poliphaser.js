// TODO List:
// - Physics
// - Rectangles and other simple shapes

/************* HELPER FUNCTIONS *************/

const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString();
};

/************* MAIN OBJECTS *************/

/**
 * The main namespace of FunPhaser.
 * @namespace
 */
let PP = {};

/**
 * The namespace containing the main functions of the game engine.
 * @namespace
 * @memberof PP
 */
PP.game   = {};

/**
 * The namespace containing functions for the scene management.
 * @namespace
 * @memberof PP
 */
PP.scenes = {};

/**
 * The namespace containing functions to load and manage assets
 * @namespace
 * @memberof PP
 */
PP.assets = {
    list_images_id : [],
};

/**
 * The namespace containing functions to load and manage image assets
 * @namespace
 * @memberof PP
 */
PP.assets.image  = {};

/**
 * The namespace containing functions to load and manage sprite assets
 * @namespace
 * @memberof PP
 */
PP.assets.sprite = {};


/**
 * The namespace containing functions for the mouse and keyboard management.
 * @namespace
 * @memberof PP
 */
PP.interactive = {
    mouse : {}
};


PP.debug = {
    assert : function(condition, message) {
        if (!condition) {
            throw new Error("Assertion failed: " + message);
        }
    }
}

/************* GAME FUNCTIONS *************/

/**
 * Create the game object and initialize the Phaser framework.  This function must be called before PP.game.start is executed.
 * @function create
 * @memberof PP.game
 * @param config The object containing the game configuration.
 * @param {number} config.canvas_width     The width  of the canvas where the game will be rendered.
 * @param {number} config.canvas_height    The height of the canvas where the game will be rendered.
 * @param {string} config.canvas_id        The id of the HTML element containing the canvas.
 * @param {number} config.background_color Default background color used when no background is drawn, in RGB HEX format (for example 0x000000).
 * @return A game object. The user should not directly manipulate it, but pass it to other functions.
 */
PP.game.create = function (config) {
    PP.debug.assert(typeof config.canvas_width  === "number", "Parameter error: config.canvas_width is not a number.");
    PP.debug.assert(typeof config.canvas_height === "number", "Parameter error: config.canvas_height is not a number.");
    PP.debug.assert(typeof config.canvas_id     === "string", "Parameter error: config.canvas_id is not a string.");

    PP.debug.assert(config.canvas_width > 0, "Parameter error: config.canvas_width is not a positive number.");
    
    PP.debug.assert(PP.scenes.list, "You need to add at least one scene!");

    PP.game.config = config;    // Save config for future use

    // Let's create the Phaser config and Phase Game object.
    const phaser_config = {
        type: Phaser.AUTO,
        width: config.canvas_width,
        height: config.canvas_height,
        backgroundColor: config.background_color,
        scene: PP.scenes.list,
        pixelArt: true,
        parent: config.canvas_id
    };
    
    PP.game.ph_obj = new Phaser.Game(phaser_config);
}

/**
 * Start the game.  This function must be called after the creation of the game (PP.game.create) and the addition of the scenes.
 * @function start
 * @memberof PP.game
 * @param {string} scene_name The name of initial scene where to start the game.
 */
PP.game.start = function (scene_name) {
    PP.debug.assert(typeof scene_name === "string", "Parameter error: scene_name is not a string.");

    PP.debug.assert(PP.scenes.list_names.includes(scene_name), "Trying to start a non-existent scene: " + scene_name);

    PP.game.ph_obj.scene.start(scene_name);
}

/**
 * Add a new scene to the game. This function must be called before PP.game.start is executed.
 * @function add
 * @memberof PP.scenes
 * @param {string}   scene_name       A unique name for the scene to be created. It can be an arbitrary string.
 * @param {function} preload_function The function executed at the beginning, when the scene is loaded. It should contain the loading of the assets (images, sounds, etc.) and initialization stuff.
 * @param {function} create_function  The function executed at the beginning, when the scene is created.
 * @param {function} update_function  The function executed at each frame.
 * @param {function} destroy_function The function executed when the scene is destroyed.
 */
PP.scenes.add = function(scene_name, preload_function, create_function, update_function, destroy_function) {

    PP.debug.assert(typeof scene_name === "string", "Parameter error: scene_name is not a string.");

    PP.debug.assert(typeof preload_function === "function", "Parameter error: load_function is not a function.");
    PP.debug.assert(typeof create_function  === "function", "Parameter error: create_function is not a function.");
    PP.debug.assert(typeof update_function  === "function", "Parameter error: update_function is not a function.");
    PP.debug.assert(typeof destroy_function === "function", "Parameter error: destroy_function is not a function.");

    if (PP.scenes.list === undefined) {
        PP.scenes.list = [];
        PP.scenes.list_names = [];
    }

    // Check that the name of the scene is not duplicated
    PP.debug.assert(!PP.scenes.list_names.includes(scene_name), "Duplicated scene name: " + scene_name);

    // If not, add the name to the list of names
    PP.scenes.list_names.push(scene_name);

    // Now it's time to create the Phaser scene object
    let scene = new Phaser.Scene(scene_name);
    scene.preload = ()=>{preload_function(scene);};
    scene.create  = ()=>{create_function(scene);};
    scene.update  = ()=>{update_function(scene);};
    scene.destroy = ()=>{destroy_function(scene);};

    PP.scenes.list.push(scene);

}

/**
 * Stop the current scene (if any) and start a new one. This function is also used to start the whole game.
 * @function start
 * @memberof PP.scenes
 * @param {string}   scene_name       A unique name for the scene to be created. It can be an arbitrary string.
 */
PP.scenes.start = function(scene_name) {
    PP.debug.assert(typeof scene_name === "string", "Parameter error: scene_name is not a string.");

    PP.debug.assert(PP.scenes.list_names.includes(scene_name), "No scene named '"+ scene_name+"' exist.");

    PP.game.current_main_scene_name = scene_name; // TODO: should we also save the scene object?

    // Let's start the new scene
    // TODO: Check whether Phaser actually stop the previous scene.
    PP.game.ph_obj.scene.start(scene_name);

}

/**
 * Stop the current scene.
 * @function stop
 * @memberof PP.scenes
 */
PP.scenes.stop = function() {
    PP.debug.assert(PP.game.current_scene_name, "Well, you should start a scene before stopping it!");
    PP.game.ph_obj.scene.stop();
}

/**
 * Start a new one as overlay of the current one. This function pauses (but not stop) the current scene.
 * Multiple overlays are not allowed, only one overlay at a time can be started.
 * @function start_overlay
 * @memberof PP.scenes
 * @param {string}   scene_name       A unique name for the scene to be created. It can be an arbitrary string.
 */
PP.scenes.start_overlay = function(scene_name) {
    PP.debug.assert(typeof scene_name === "string", "Parameter error: scene_name is not a string.");
    PP.debug.assert(PP.scenes.list_names.includes(scene_name), "No scene named '"+ scene_name+"' exist.");
    PP.debug.assert(PP.game.current_scene_name, "A non-overlay scene must be previously started.");
    PP.debug.assert(PP.scenes.in_overlay_mode, "Multiple overlays are not allowed, you must stop the previous one.");

    PP.scenes.in_overlay_mode = true;

    // Let's launch the new scene
    PP.game.ph_obj.scene.launch(scene_name);

}

/**
 * Remove the overlay and resume the main scene. It must be called within overlay scene functions.
 * @function stop_overlay
 * @memberof PP.scenes
 */
PP.scenes.stop_overlay = function() {
    PP.debug.assert(PP.game.current_scene_name, "This should not occur: the main scene name does not exist.");

    PP.scenes.in_overlay_mode = false;

    // Let's launch the new scene
    PP.game.ph_obj.scene.resume(PP.game.current_scene_name);
    PP.game.ph_obj.scene.stop();
}


/************* IMAGES *************/


/**
 * Load a new image.
 * @function load
 * @memberof PP.assets.image
 * @param {string}   image_path       A path of the image to load. It can be relative to the current page or a full URL.
 * @return An image object representing the image file itself.
 */
PP.assets.image.load = function(scene, image_path) {
    PP.debug.assert(typeof scene      === "object", "Parameter error: scene should be a scene object.");
    PP.debug.assert(typeof image_path === "string", "Parameter error: image_path should be a string.");

    let url_hash = cyrb53(image_path);  // This is used as ID

    if(PP.assets.list_images_id.includes(url_hash)) {
        console.warn('WARNING: you are trying to load multiple times the same image/spritesheet ('+image_path+'). Aborting this load request.');
        return {id: url_hash, type: "image"};
    }

    PP.assets.list_images_id.push(url_hash);

    scene.load.image(url_hash, image_path);
    return {id: url_hash, type: "image"};
}


/**
 * Add and position a new image into the scene.
 * @function add
 * @memberof PP.assets.image
 * @param {object}   scene       The scene object where to add the image.
 * @param {object}   image       The object of an image returned by PP.assets.image.load
 * @param {number}   x           The horizontal initial position in pixels of the image.
 * @param {number}   y           The vertical initial position in pixels of the image.
 * @param {number}   pivot_x     The pivot X position **in percentage ** from 0 to 1.
 * @param {number}   pivot_y     The pivot Y position **in percentage ** from 0 to 1.
 * @return An image object representing the specific image added to the scene.
 */
PP.assets.image.add = function(scene, image, x, y, pivot_x, pivot_y) {
    PP.debug.assert(typeof scene === "object", "Parameter error: scene should be a scene object.");
    PP.debug.assert(typeof image === "object", "Parameter error: image should be an object.");
    PP.debug.assert(typeof image.id === "string", "Parameter error: image is not a valid image object.");
    PP.debug.assert(image.type === "image", "Parameter error: image is an object but not an image.");
    PP.debug.assert(typeof x === "number", "Parameter error: x should be a number.");
    PP.debug.assert(typeof y === "number", "Parameter error: y should be a number.");
    PP.debug.assert(typeof pivot_x === "number", "Parameter error: pivot_x should be a number.");
    PP.debug.assert(typeof pivot_y === "number", "Parameter error: pivot_y should be a number.");

    PP.debug.assert(pivot_x >= 0 && pivot_x <= 1, "Parameter error: pivot_x must be between 0 and 1.");
    PP.debug.assert(pivot_y >= 0 && pivot_y <= 1, "Parameter error: pivot_y must be between 0 and 1.");


    let temp_image = scene.add.image(x, y, image.id);
    temp_image.setOrigin(pivot_x,pivot_y);

    return {ph_obj: temp_image, orig_image : image};
}

/************* SPRITES *************/

/**
 * Load a new spritesheet.
 * @function load_spritesheet
 * @memberof PP.assets.sprite
 * @param {string}   image_path       A path of the image containing the spritesheet to load. It can be relative to the current page or a full URL.
 * @return An object representing the spritesheet image file.
 */
PP.assets.sprite.load_spritesheet = function(scene, image_path, frame_width, frame_height, start_frame, end_frame) {
    PP.debug.assert(typeof scene        === "object", "Parameter error: scene should be a scene object.");
    PP.debug.assert(typeof image_path   === "string", "Parameter error: image_path should be a string.");
    PP.debug.assert(typeof frame_width  === "number", "Parameter error: frame_width should be a number.");
    PP.debug.assert(typeof frame_height === "number", "Parameter error: frame_height should be a number.");
    PP.debug.assert(typeof start_frame  === "number", "Parameter error: start_frame should be a number.");
    PP.debug.assert(typeof end_frame    === "number", "Parameter error: end_frame should be a number.");

    let url_hash = cyrb53(image_path);  // This is used as ID

    if(PP.assets.list_images_id.includes(url_hash)) {
        console.warn('WARNING: you are trying to load multiple times the same image/spritesheet ('+image_path+'). Aborting this load request.');
        return {id: url_hash, type: "sprite"};
    }

    PP.assets.list_images_id.push(url_hash);

    scene.load.spritesheet(url_hash, image_path, { frameWidth: frame_width, frameHeight: frame_height, startFrame: start_frame, endFrame: end_frame });
    return {id: url_hash, type: "sprite"};
}

/**
 * Add and position a new sprite into the scene.
 * @function add
 * @memberof PP.assets.sprite
 * @param {object}   scene       The scene object where to add the image.
 * @param {object}   sprite       The object of a sprite as returned by PP.assets.sprite.load
 * @param {number}   x           The horizontal initial position in pixels of the image.
 * @param {number}   y           The vertical initial position in pixels of the image.
 * @param {number}   pivot_x     The pivot X position **in percentage ** from 0 to 1.
 * @param {number}   pivot_y     The pivot Y position **in percentage ** from 0 to 1.
 * @return An sprite instance object representing the specific sprite added to the scene.
 */
PP.assets.sprite.add = function(scene, sprite, x, y, pivot_x, pivot_y) {
    PP.debug.assert(typeof scene === "object", "Parameter error: scene should be a scene object.");
    PP.debug.assert(typeof sprite === "object", "Parameter error: sprite should be an object.");
    PP.debug.assert(typeof sprite.id === "string", "Parameter error: sprite is not a valid sprite object.");
    PP.debug.assert(sprite.type === "sprite", "Parameter error: sprite is an object but not a sprite.");
    PP.debug.assert(typeof x === "number", "Parameter error: x should be a number.");
    PP.debug.assert(typeof y === "number", "Parameter error: y should be a number.");
    PP.debug.assert(typeof pivot_x === "number", "Parameter error: pivot_x should be a number.");
    PP.debug.assert(typeof pivot_y === "number", "Parameter error: pivot_y should be a number.");

    let temp_image = scene.add.sprite(x, y, sprite.id);
    temp_image.setOrigin(pivot_x,pivot_y);

    return {ph_obj: temp_image, orig_sprite : sprite, list_of_animations : []};
}

/**
 * Add a new animation to a given sprite.
 * @function animation_add
 * @memberof PP.assets.sprite
 * @param {object}   sprite_instance  The object of a sprite instance as returned by PP.assets.sprite.add
 * @param {string}   animation_name   A unique name (in the current sprite instance) for this animation.
 * @param {number}   frame_start_nr   The starting frame number (counting from top-left, horizontal first) of the spritesheet.
 * @param {number}   frame_end_nr     The ending frame number (counting from top-left, horizontal first) of the spritesheet.
 * @param {number}   frame_rate       The speed of the frame rate of the spritesheet. TODO: check measurement unit.
 * @param {number}   repeat           The number of time the animation should repeat. Use -1 for infinite.
 */

PP.assets.sprite.animation_add = function(sprite_instance, animation_name, frame_start_nr, frame_end_nr, frame_rate, repeat) {
    PP.debug.assert(typeof sprite_instance             === "object", "Parameter error: sprite should be an object.");
    PP.debug.assert(typeof sprite_instance.ph_obj      === "object", "Parameter error: sprite is not a valid sprite instance.");
    PP.debug.assert(typeof sprite_instance.orig_sprite === "object", "Parameter error: sprite is not a valid sprite instance.");

    PP.debug.assert(typeof frame_start_nr === "number", "Parameter error: frame_start_nr should be a number.");
    PP.debug.assert(typeof frame_end_nr   === "number", "Parameter error: frame_end_nr should be a number.");
    PP.debug.assert(typeof frame_rate     === "number", "Parameter error: frame_rate should be a number.");
    PP.debug.assert(typeof repeat         === "number", "Parameter error: repeat should be a number.");

    PP.debug.assert(typeof animation_name === "string", "Parameter error: animation_name is not a string.");
    PP.debug.assert(!sprite_instance.list_of_animations.includes(animation_name), "Duplicated animation name!");


    PP.debug.assert(frame_start_nr >= 0, "Parameter error: frame_start_nr invalid number (<0).");
    PP.debug.assert(frame_end_nr >= 0, "Parameter error: frame_end_nr invalid number (<0).");
    PP.debug.assert(frame_rate > 0, "Parameter error: frame_rate invalid number (<=0).");
    PP.debug.assert(repeat >= -1, "Parameter error: repeat invalid number (<-1).");

    sprite_instance.ph_obj.anims.create({
        key: animation_name,
        frames: sprite_instance.ph_obj.anims.generateFrameNumbers(sprite_instance.orig_sprite.id, {
            start: frame_start_nr,
            end: frame_end_nr,
        }),
        frameRate: frame_rate,
        repeat: repeat
    });

    sprite_instance.list_of_animations.push(animation_name);
}

/**
 * Play the requested animation of the sprite instance passed as parameter. The animation must have been
 * previously added via PP.assets.sprite.animation_add
 * @function animation_splay
 * @memberof PP.assets.sprite
 * @param {object}           sprite_instance      The object of the sprite instance returned by PP.assets.sprite.add.
 * @param {string}           animation_name       The name of the animation.
 */
PP.assets.sprite.animation_play = function(sprite_instance, animation_name) {
    PP.debug.assert(typeof sprite_instance             === "object", "Parameter error: sprite should be an object.");
    PP.debug.assert(typeof sprite_instance.ph_obj      === "object", "Parameter error: sprite is not a valid sprite instance.");
    PP.debug.assert(typeof sprite_instance.orig_sprite === "object", "Parameter error: sprite is not a valid sprite instance.");

    PP.debug.assert(typeof animation_name === "string", "Parameter error: animation_name is not a string.");
    PP.debug.assert(sprite_instance.list_of_animations.includes(animation_name), "Animation does not exist!");

    sprite_instance.ph_obj.anims.play(animation_name);

}

/**
 * Stop the current animation of the sprite instance passed as parameter
 * @function animation_stop
 * @memberof PP.assets.sprite
 * @param {object}           sprite_instance       The object of the sprite instance returned by PP.assets.sprite.add.
 */
PP.assets.sprite.animation_stop = function(sprite_instance) {
    sprite_instance.ph_obj.anims.stop();
}


/************* INTERACTIVE *************/
/**
 * Add a new interaction with an object
 * @function add
 * @memberof PP.interactive.mouse
 * @param {object}           obj       The object onto the interaction will be enabled.
 * @param {type_of_event}    string    Identify the type of interaction. It can be: "pointerdown", ... TODO check phaser
 * @param {function_to_call} function  Callback function to call when an event occurred. The function must accept one parameter: the current scene.
 */
PP.interactive.mouse.add = function(obj, type_of_event, function_to_call) {
    PP.debug.assert(typeof obj === "object",               "Parameter error: obj should be an object.");
    PP.debug.assert(typeof obj.ph_obj === "object",        "Parameter error: obj is an object but it is not a valid object.");
    PP.debug.assert(typeof type_of_event === "string",     "Parameter error: type_of_event should be a string.");
    PP.debug.assert(typeof function_to_call === "function","Parameter error: function_to_call should be a function.");

    let valid_events = ["pointerdown"]; // TODO
    PP.debug.assert(valid_events.includes(type_of_event), "Parameter error: type_of_event is invalid.");

    obj.ph_obj.setInteractive();
    obj.ph_obj.on(type_of_event, () => { function_to_call(this.game.ph_obj.scene); });
}

