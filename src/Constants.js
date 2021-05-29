let Constants = {
  // path directions
  NORTH: "0",
  SOUTH: "1",
  WEST: "2",
  EAST: "3",

  // Wall sizes
  WALL_SIZE: 20,
  WALL_SIZE_MINIMAP: 15,

  PLAYER_SIZE_MINIMAP: 10,

  MINIMAP_SIDE_LENGTH: 256,

  //The percentage to take up of the shortest side of the viewport
  MINIMAP_FULLSCREEN_PERC: 0.9,
  PLAYER_MIN_SIZE_MINIMAP_FULLSCREEN: 12,
  MINIMAP_DISCOVER_THRESHOLD: 0.8,

  // map size
  MAP1_SIZE: 5,
  MAP2_SIZE: 10,
  MAP3_SIZE: 15,

  // percentage of walls removed
  PROBABILITY_WALLS_REMOVED: 0.075,

  // blockiness of visuals
  BLOCKINESS: 4,
  WALL_SEGMENTS: 1,

  PLAYER_MOVE_SPEED: 25,
  PLAYER_MOVE_SPEED_DEV: 100,

  // monster controls
  MONSTER_SPEED_INVERSE: 50,

  //Fog
  FOG_FAR: 100,
  FOG_NEAR: 1,

  CAMERA_FAR: 200,

  ANTIALIAS: true,
};

export default Constants;
