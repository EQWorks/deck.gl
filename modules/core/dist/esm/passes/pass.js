export default class Pass {
  constructor(gl) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    const {
      id = 'pass'
    } = props;
    this.id = id;
    this.gl = gl;
    this.props = {};
    Object.assign(this.props, props);
  }

  setProps(props) {
    Object.assign(this.props, props);
  }

  render() {}

  cleanup() {}

}
//# sourceMappingURL=pass.js.map