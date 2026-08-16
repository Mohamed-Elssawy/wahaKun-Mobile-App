// The svg transformer only runs in Metro, so under Jest an .svg is an unrenderable object.
const SvgMock = 'Svg';

module.exports = SvgMock;
module.exports.default = SvgMock;
module.exports.__esModule = true;
