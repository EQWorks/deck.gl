function loadCss(url) {
  const link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = url;
  document.getElementsByTagName('head')[0].appendChild(link);
}

function createWidgetDiv(idName) {
  let width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;
  let height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 500;
  const div = document.createElement('div');
  div.style.width = "".concat(width, "px");
  div.style.height = "".concat(height, "px");
  div.id = idName;
  return div;
}

function createCanvas(idName) {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    width: '100%',
    height: '100%',
    position: 'absolute',
    'z-index': 2
  });
  canvas.id = idName;
  return canvas;
}

function createMapDiv(idName) {
  const div = document.createElement('div');
  Object.assign(div.style, {
    'pointer-events': 'none',
    height: '100%',
    width: '100%',
    position: 'absolute',
    'z-index': 1
  });
  div.id = idName;
  return div;
}

function hideMapboxCSSWarning() {
  const missingCssWarning = document.getElementsByClassName('mapboxgl-missing-css')[0];

  if (missingCssWarning) {
    missingCssWarning.style.display = 'none';
  }
}

function createDeckScaffold(rootElement, uid) {
  let width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 500;
  let height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 500;
  const mapNode = createMapDiv("map-".concat(uid));
  const canvasNode = createCanvas("deck-map-container-".concat(uid));
  const mapWrapperNode = createWidgetDiv("deck-map-wrapper-".concat(uid), width, height);
  mapWrapperNode.appendChild(canvasNode);
  mapWrapperNode.appendChild(mapNode);
  rootElement.appendChild(createWidgetDiv("deck-container-".concat(uid), width, height)).appendChild(mapWrapperNode);
}

function waitForElementToDisplay(selector, time, cb) {
  if (document.querySelector(selector) !== null) {
    cb();
    return;
  }

  setTimeout(() => {
    waitForElementToDisplay(selector, time, cb);
  }, time);
}

function setMapProps(map, props) {
  if ('viewState' in props && props.viewState.longitude && props.viewState.latitude) {
    const {
      viewState
    } = props;
    map.jumpTo({
      center: [viewState.longitude, viewState.latitude],
      zoom: Number.isFinite(viewState.zoom) ? viewState.zoom : 10,
      bearing: viewState.bearing || 0,
      pitch: viewState.pitch || 0
    });
  }

  if (props.map && 'style' in props.map) {
    if (props.map.style !== map.deckStyle) {
      map.setStyle(props.map.style);
      map.deckStyle = props.map.style;
    }
  }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}

export { createDeckScaffold, loadCss, hideMapboxCSSWarning, setMapProps, waitForElementToDisplay, uuidv4 };
//# sourceMappingURL=utils.js.map