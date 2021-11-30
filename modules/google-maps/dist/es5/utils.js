"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDeckInstance = createDeckInstance;
exports.destroyDeckInstance = destroyDeckInstance;
exports.getViewState = getViewState;

var _keplerOutdatedDeck = require("kepler-outdated-deck.gl-core");

function createDeckInstance(map, overlay, deck) {
  if (deck) {
    if (deck.props.userData._googleMap === map) {
      return deck;
    }

    destroyDeckInstance(deck);
  }

  const eventListeners = {
    click: null,
    mousemove: null,
    mouseout: null
  };
  deck = new _keplerOutdatedDeck.Deck({
    canvas: createDeckCanvas(overlay),
    initialViewState: {
      longitude: 0,
      latitude: 0,
      zoom: 1
    },
    controller: false,
    userData: {
      _googleMap: map,
      _eventListeners: eventListeners
    }
  });

  for (const eventType in eventListeners) {
    eventListeners[eventType] = map.addListener(eventType, evt => handleMouseEvent(deck, eventType, evt));
  }

  return deck;
}

function createDeckCanvas(overlay) {
  const container = overlay.getPanes().overlayLayer;
  const deckCanvas = document.createElement('canvas');
  Object.assign(deckCanvas.style, {
    position: 'absolute'
  });
  container.appendChild(deckCanvas);
  return deckCanvas;
}

function destroyDeckInstance(deck) {
  const {
    _eventListeners: eventListeners
  } = deck.props.userData;

  for (const eventType in eventListeners) {
    eventListeners[eventType].remove();
  }

  deck.finalize();
  deck.canvas.parentNode.removeChild(deck.canvas);
}

function getViewState(map, overlay) {
  const container = map.getDiv();
  const width = container.offsetWidth;
  const height = container.offsetHeight;
  const projection = overlay.getProjection();
  const bounds = map.getBounds();
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const topRight = projection.fromLatLngToDivPixel(ne);
  const bottomLeft = projection.fromLatLngToDivPixel(sw);
  const nwContainerPx = new google.maps.Point(0, 0);
  const nw = projection.fromContainerPixelToLatLng(nwContainerPx);
  const nwDivPx = projection.fromLatLngToDivPixel(nw);
  const scale = (topRight.x - bottomLeft.x) / width;
  const zoom = Math.log2(scale) + map.getZoom() - 1;
  const centerPx = new google.maps.Point(width / 2, height / 2);
  const centerContainer = projection.fromContainerPixelToLatLng(centerPx);
  const latitude = centerContainer.lat();
  const longitude = centerContainer.lng();
  return {
    width,
    height,
    left: nwDivPx.x,
    top: nwDivPx.y,
    zoom,
    pitch: map.getTilt(),
    latitude,
    longitude
  };
}

function handleMouseEvent(deck, type, event) {
  let callback;

  switch (type) {
    case 'click':
      deck._lastPointerDownInfo = deck.pickObject({
        x: event.pixel.x,
        y: event.pixel.y
      });
      callback = deck._onEvent;
      break;

    case 'mousemove':
      callback = deck._onPointerMove;
      break;

    case 'mouseout':
      callback = deck._onPointerLeave;
      break;

    default:
      return;
  }

  callback({
    type,
    offsetCenter: event.pixel,
    srcEvent: event
  });
}
//# sourceMappingURL=utils.js.map