<p class="badges">
  <img src="https://img.shields.io/badge/geopspatial-no-lightgrey.svg?style=flat-square" alt="geospatial" />
</p>

# PerspectiveView Class (Experimental)

The [`PerspectiveView`] class is a subclass of [View](/docs/api-reference/view.md) that creates a perspective view using classic "3D camera" view state parameters.

To render, `PerspectiveView` needs to be used together with a `viewState` with the following parameters:

* `eye` (`Number[3]`) - The eye position in world coordinates.
* `lookAt` (`Number[3]`) - The position being looked at.
* `up` (`Number[3]`) - The up direction.

For more information on using `View` classes, consult the [Views](/docs/developer-guide/views.md) article.


## Constructor

```js
new PerspectiveView({..., fov: 45});
```

`PerspectiveView` takes the same parameters as the [View](/docs/api-reference/view.md) superclass constructor.

## Methods

Inherits all [View methods](/docs/api-reference/view.md#methods).


## Source

[modules/core/src/views/perspective-view.js](https://github.com/uber/deck.gl/tree/7.1-release/modules/core/src/views/perspective-view.js)
