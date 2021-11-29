const experimental = {};
export { COORDINATE_SYSTEM, Deck, Layer, CompositeLayer, View, MapView, FirstPersonView, ThirdPersonView, OrbitView, PerspectiveView, OrthographicView, Viewport, WebMercatorViewport, Controller, MapController, AttributeManager, project, project64, LayerManager, DeckRenderer, log, _OrbitController, _FirstPersonController, TRANSITION_EVENTS, LinearInterpolator, FlyToInterpolator, Effect, LightingEffect, PostProcessEffect, AmbientLight, PointLight, DirectionalLight } from 'kepler-outdated-deck.gl-core';
import { experimental as CoreExperimental } from 'kepler-outdated-deck.gl-core';
import { experimental as AggregationExperimental } from 'kepler-outdated-deck.gl-aggregation-layers';
const count = CoreExperimental.count,
      flattenVertices = CoreExperimental.flattenVertices,
      fillArray = CoreExperimental.fillArray;
const BinSorter = AggregationExperimental.BinSorter,
      linearScale = AggregationExperimental.linearScale,
      getLinearScale = AggregationExperimental.getLinearScale,
      quantizeScale = AggregationExperimental.quantizeScale,
      getQuantizeScale = AggregationExperimental.getQuantizeScale,
      defaultColorRange = AggregationExperimental.defaultColorRange;
Object.assign(experimental, {
  BinSorter,
  linearScale,
  getLinearScale,
  quantizeScale,
  getQuantizeScale,
  defaultColorRange,
  count,
  flattenVertices,
  fillArray
});
export { ArcLayer, BitmapLayer, IconLayer, LineLayer, PointCloudLayer, ScatterplotLayer, GridCellLayer, ColumnLayer, PathLayer, PolygonLayer, SolidPolygonLayer, GeoJsonLayer, TextLayer } from 'kepler-outdated-deck.gl-layers';
export { ScreenGridLayer, CPUGridLayer, HexagonLayer, ContourLayer, GridLayer, GPUGridLayer } from 'kepler-outdated-deck.gl-aggregation-layers';
export { GreatCircleLayer, S2Layer, H3ClusterLayer, H3HexagonLayer, TileLayer, TripsLayer } from 'kepler-outdated-deck.gl-geo-layers';
export { SimpleMeshLayer, ScenegraphLayer } from 'kepler-outdated-deck.gl-mesh-layers';
export { default, DeckGL } from 'kepler-outdated-deck.gl-react';
export { experimental };
//# sourceMappingURL=index.js.map