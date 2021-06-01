let Constants = {
  // path directions
  NORTH: "0",
  SOUTH: "1",
  WEST: "2",
  EAST: "3",

  // Wall sizes
  WALL_SIZE: 30,
  WALL_SIZE_MINIMAP: 15,

  PLAYER_SIZE_MINIMAP: 10,

  MINIMAP_SIDE_LENGTH: 256,

  //The percentage to take up of the shortest side of the viewport
  MINIMAP_FULLSCREEN_PERC: 0.9,
  PLAYER_MIN_SIZE_MINIMAP_FULLSCREEN: 12,
  MINIMAP_DISCOVER_THRESHOLD: 0.8,

  // map size
  MAP1_SIZE: 15,
  MAP2_SIZE: 10,
  MAP3_SIZE: 15,

  // percentage of walls removed
  PROBABILITY_WALLS_REMOVED: 0.075,

  // blockiness of visuals
  BLOCKINESS: 4,
  WALL_SEGMENTS: 1,

  // player constants
  PLAYER_MOVE_SPEED: 35,
  PLAYER_MOVE_SPEED_DEV: 100,
  PLAYER_INITIAL_POS: {
    x: 30,
    y: 10,
    z: 30,
  },

  TORCH_DEPLETION_RATE: 10,

  // monster controls
  MONSTER_SPEED: 40,
  MONSTER_RADIUS: 7.5,

  //Fog
  FOG_FAR: 150,
  FOG_NEAR: 1,

  CAMERA_FAR: 10000,
  AMBIENT_INTENSITY: 0.02,
  //AMBIENT_INTENSITY: 1,

  ANTIALIAS: false,
};

export default Constants;
