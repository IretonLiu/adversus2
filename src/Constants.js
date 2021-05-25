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
  MINIMAP_DISCOVER_THRESHOLD: 0.65,

  // map size
  MAP_SIZE: 10,

  // percentage of walls removed
  PROBABILITY_WALLS_REMOVED: 0.5,

  // blockiness of visuals
  BLOCKINESS: 6,
  WALL_SEGMENTS: 1,

  PLAYER_MOVE_SPEED: 25,

  // monster controls
  MONSTER_SPEED_INVERSE: 50,

  //Fog
  FOG_FAR: 100,
  FOG_NEAR: 1,

  ANTIALIAS: false
};

export default Constants;
