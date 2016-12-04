/* TO DO:
    - Add gems;
    - Add scoring;
    - Add levels that increase difficulty by:
        - letting enemies come from the left and the right,
        - letting enemies bounce off eachother when coming from different directions,
        - allowing for more enemies at a time,
        - randomly generating more enemies;
*/

// Constants
// Coordinate offsets are used to calculate top left corner of sprite bounding boxes.
var MAP_WIDTH = 505;
var MAP_HEIGHT = 606;
var TILE_WIDTH = 101;
var TILE_HEIGHT = 83;
var PLAYER_START_X = 101 * 2;
var PLAYER_START_Y = 84 * 5 - 30;
var PLAYER_BOX_X_OFFSET = 22;
var PLAYER_BOX_Y_OFFSET = 85;
var PLAYER_BOX_WIDTH = 58;
var PLAYER_BOX_HEIGHT = 58;
var BUG_BOX_X_OFFSET = 15;
var BUG_BOX_Y_OFFSET = 80;
var BUG_BOX_WIDTH = 80;
var BUG_BOX_HEIGHT = 64;
var GEM_BOX_X_OFFSET = 0;
var GEM_BOX_Y_OFFSET = 60;
var GEM_BOX_WIDTH = 100;
var GEM_BOX_HEIGHT = 100;

var level = 1;
var score = 0;

// Global functions
// Set player character back to start position and remove all other objects.
var restart = function() {
    player.x = PLAYER_START_X;
    player.y = PLAYER_START_Y;
    allGems = [];
};

var advanceLevel = function() {
    // TO DO: Advance to next level logic.
    level ++;
}

var increaseScore = function(ammount) {
    // TO DO: Display score on HUD. For log to console.
    score += ammount;
    console.log('Score: ' + score);
}

// TO DO: Create HUD to display life and gems of player.
var Hud = function() {};
Hud.prototype.displayHearts = function() {};
Hud.prototype.displayGems = function() {};

// Two random number generators. Possibly move into separate library later.
// Source: MDN, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
// A: Get a floating point number between two values (excluding max value).
function getRandomArbitrary (min, max) {return Math.random() * (max - min) + min;}

// B: Get an integer between and including two values.
function getRandomIntInclusive (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Define primal game object that has base properties.
var GameObject = function(x, y, xoffset, yoffset, width, height) {
    this.x = x;
    this.y = y;
    this.x_offset = xoffset;
    this.y_offset = yoffset;
    this.width = width;
    this.height = height;
};

// Increase score and remove gem once touched.
GameObject.prototype.collectGem = function(theGem, variant) {
    var i = allGems.indexOf(theGem);
    if (i !== -1) {
        allGems.splice(i, 1);
    }
    if (variant === "Blue") {
        increaseScore(1);
    }
};

// Rendering for ALL game objects (children of GameObject) happens here.
GameObject.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);

    // DEBUG CODE: Draw rectangles around objects for collision debugging. Uncomment to show.
    // ctx.beginPath();
    // ctx.rect(this.x + this.x_offset, this.y + this.y_offset, this.width, this.height);
    // ctx.lineWidth = 3;
    // ctx.strokeStyle = 'red';
    // ctx.stroke();
};

GameObject.prototype.update = function() {
    // Complete level condition.
    if (player.y < TILE_HEIGHT * 0) {
        window.setTimeout(player.winLevel, 1000);
    }
};

// Prototypal object for all objects that move over the road.
var RoadRunner = function() {
    GameObject.call(this, x, y, xoffset, yoffset, width, height);
};

RoadRunner.prototype = Object.create(GameObject.prototype);

// RoadRunners start randomly at either one of three lanes on the y-axis.
RoadRunner.prototype.randomLane = function(min, max) {
    var randomRow = getRandomIntInclusive(min, max);
    return randomRow;
};

RoadRunner.prototype.laneLogic = function() {
    this.lane = RoadRunner.prototype.randomLane(1, 3); // Decide starting lane randomly.
    var startLane = TILE_HEIGHT * this.lane - 20;
    return startLane;
}

RoadRunner.prototype.laneDir = function(dt) {
    switch (this.dir) {
    case 'ltr':
        this.x = this.x + (this.speed * dt);
        return this.x;
        break;
    case 'rtl':
        this.x = this.x - (this.speed * dt);
        return this.x;
        break;
    default:
        this.x = this.x + (this.speed * dt);
        return this.x;
    }
}

RoadRunner.prototype.checkCollision = function(playerObj) {
    if ((playerObj.x + playerObj.x_offset) < (this.x + this.x_offset) + this.width &&
        (playerObj.x + playerObj.x_offset) + player.width > (this.x + this.x_offset) &&
        (playerObj.y + playerObj.y_offset) < (this.y + this.y_offset) + this.height &&
        player.width + (playerObj.y + playerObj.y_offset) > (this.y + this.y_offset)) {
            if (this.type === "Bug") {
                player.hurt(1);
            } else if (this.type === "Gem") {
                GameObject.prototype.collectGem(this, this.variant);
            }
    }
};

// Remove RoadRunners like enemy bugs and gems from the array once outside of map.
RoadRunner.prototype.purge = function(typeOfRunner) {
    if (this.x > 100 * 6 || this.x < -101) {
        var i = typeOfRunner.indexOf(this);
        if (i !== -1) {
            typeOfRunner.splice(i, 1);
        }
    }
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
RoadRunner.prototype.update = function(dt, playerObj) {
    this.checkCollision(player);
    this.purge(allEnemies);
    this.purge(allGems);
    this.laneDir(dt);
};

// Enemies our player must avoid. A sub class of RoadRunner.
var Enemy = function(type, variant, x, y, xoffset, yoffset, width, height, dir) {
    GameObject.call(this, x, y, xoffset, yoffset, width, height);
    this.type = type;
    this.variant = variant;
    this.dir = dir;
    this.speed = this.speedCalc(); // 1, 1.5 or 2
    this.sprite = 'images/enemy-bug.png';
};

Enemy.prototype = Object.create(RoadRunner.prototype);

// On level 1 bug speed is either 100 x 1, 1.5 or 2 depending on the lane.
Enemy.prototype.speedCalc = function() {
    switch (this.lane) {
    case 1:
        this.speed = (1.5) * 100;
        return this.speed;
        break;
    case 2:
        this.speed = (2) * 100;
        return this.speed;
        break;
    case 3:
        this.speed = (1) * 100;
        return this.speed;
        break;
    default:
        this.speed = 100;
        return this.speed;
    }
}

var Gem = function(type, variant, x, y, xoffset, yoffset, width, height, dir) {
    // Decide starting lane randomly for each gem.
    this.type = type;
    this.variant = variant;
    GameObject.call(this, x, y, xoffset, yoffset, width, height);
    this.dir = dir;
    this.speed = 200;
    this.sprite = 'images/Gem Blue.png';
};

Gem.prototype = Object.create(RoadRunner.prototype);

// Player object
var Player = function(x, y, xoffset, yoffset, width, height) {
    GameObject.call(this, x, y, xoffset, yoffset, width, height);
    this.sprite = 'images/char-boy.png';
    this.maxHearts = 3;
    this.hearts = this.maxHearts;
};

Player.prototype = Object.create(GameObject.prototype);

Player.prototype.handleInput = function(input) {
    if (input === 'up' && this.y > 0) {
        var goUp = this.y -= TILE_HEIGHT;
        return goUp;
    }
    if (input === 'right' && this.x < TILE_WIDTH * 4) {
        var goRight = this.x += TILE_WIDTH;
        return goRight;
    }
    if (input === 'down' && this.y < TILE_HEIGHT * 4) {
        var goDown = this.y += TILE_HEIGHT;
        return goDown;
    }
    if (input === 'left' && this.x > 0) {
        var goLeft = this.x -= TILE_WIDTH;
        return goLeft;
    }
};

Player.prototype.hurt = function(damage) {
    player.hearts -= damage;
    console.log('Hearts: ' + player.hearts);
    if (player.hearts <= 0) {
        player.die();
    } else {
        restart();
    }
};

Player.prototype.die = function() {
    console.log('Vlogger has been killed in action. Watich it now on Live Stream!\n\nScore reset.');
    score = 0;
    this.hearts = this.maxHearts;
    restart(); // TO DO: Show GAME OVER screen.
};

Player.prototype.winLevel = function() {
    console.log('Vlogger reached the river!')
    this.hearts = this.maxHearts;
    restart(); // TO DO: Advance to next level.
};

// Instantiate all game objects.
var allEnemies = [];
var allGems = [];
var player = new Player(
    PLAYER_START_X,
    PLAYER_START_Y,
    PLAYER_BOX_X_OFFSET,
    PLAYER_BOX_Y_OFFSET,
    PLAYER_BOX_WIDTH,
    PLAYER_BOX_HEIGHT
);

// Produce new enemy and gem instances periodically up to a maximum number.
(function() {
    // Spawn 3 bugs randomly on the roads at start to prevent player rushing.
    for (var e = 0; e < 3; e++) {
        var spawnX = window.getRandomArbitrary(0, 401);
        var spawnY = Enemy.prototype.laneLogic();
        var enemy = new Enemy(
            'Bug',
            'Red',
            spawnX,
            spawnY,
            BUG_BOX_X_OFFSET,
            BUG_BOX_Y_OFFSET,
            BUG_BOX_WIDTH,
            BUG_BOX_HEIGHT,
            'ltr'
        );
        allEnemies.push(enemy);
    }

    var maxEnemyCount = Math.round(5 + (1 / 2)); // TO DO: replace "1" with level variable.
    var maxGemCount = 2;

    window.setInterval(newEnemyInstance, 800);
    window.setInterval(newGemInstance, 2000);

    function newEnemyInstance () {
        if (allEnemies.length < maxEnemyCount) {
            var enemy = new Enemy(
                'Bug',
                'Red',
                -101,
                RoadRunner.prototype.laneLogic(),
                BUG_BOX_X_OFFSET,
                BUG_BOX_Y_OFFSET,
                BUG_BOX_WIDTH,
                BUG_BOX_HEIGHT,
                'ltr'
            );
            allEnemies.push(enemy);
            // console.log('Enemies on map: ' + allEnemies.length);
        }
    }

    function newGemInstance () {
        // There is a 1 in 3 chance that a new gem appears every 3 seconds.
        var gemChance = getRandomIntInclusive(1, 4);
        if (allGems.length < maxGemCount && gemChance === 1) {
            var gem = new Gem(
                'Gem',
                'Blue',
                MAP_WIDTH,
                RoadRunner.prototype.laneLogic(),
                GEM_BOX_X_OFFSET,
                GEM_BOX_Y_OFFSET,
                GEM_BOX_WIDTH,
                GEM_BOX_HEIGHT,
                'rtl'
            );
            allGems.push(gem);
            // console.log('Gems on map: ' + allGems.length);
        }
    }
}());

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
