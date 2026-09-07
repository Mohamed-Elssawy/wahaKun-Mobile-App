/** The basemap. MapLibre draws whatever it is pointed at, so the map's look is decided here. */

import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

/** F-05 needs satellite imagery: Siwa is fields and canals, and a street basemap renders empty. */
// Esri's terms cover tracing, not app basemaps. Fine for a demo; swap to OpenFreeMap to ship.
export const SATELLITE_TILE_URL =
  'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

/** MIT, unlimited and unambiguous, but streets only. The fallback if the terms matter. */
export const STREET_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Required by Esri's terms and shown over the map, as MapLibre draws no attribution itself. */
export const TILE_ATTRIBUTION = 'Esri, Maxar, Earthstar Geographics';

/** World Imagery has no tiles past 19, and requesting them returns blank rather than 404. */
export const MAX_ZOOM = 19;

/** Raster tiles are 256px square; MapLibre needs telling, since it assumes 512. */
export const TILE_SIZE = 256;

const SOURCE_ID = 'satellite';

/** MapLibre takes a whole style, not a tile URL, so the basemap is one source and one layer here. */
export const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    [SOURCE_ID]: {
      type: 'raster',
      tiles: [SATELLITE_TILE_URL],
      tileSize: TILE_SIZE,
      maxzoom: MAX_ZOOM,
      attribution: TILE_ATTRIBUTION,
    },
  },
  layers: [
    {
      id: SOURCE_ID,
      type: 'raster',
      source: SOURCE_ID,
    },
  ],
};
