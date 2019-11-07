'use strict'

const React = require('react')
const { IconPhoto } = require('../icons')
const { Cache } = require('../../common/cache')
const { bool, func, number, string } = require('prop-types')
const { ICON } = require('../../constants/sass')
const { exifRotation } = require('../../common/iiif')

const variant = (size) =>
  size > ICON.SIZE ? ICON.MAX : ICON.SIZE

class Thumbnail extends React.Component {
  state = {
    rotation: '0',
    src: null,
    style: null
  }

  static getDerivedStateFromProps(props) {
    let src = Cache.url(props.cache, variant(props.size), props)
    let rot = exifRotation(props.orientation).add(props)
    let [x, y] = rot.ratio(props)

    return {
      src,
      rotation: rot.format('x'),
      style: {
        '--x': x,
        '--y': y,
        'backgroundColor': props.color
      }
    }
  }

  handleError = () => {
    if (this.props.onError != null && !this.props.broken) {
      this.props.onError(this.props.id)
    }
  }

  handleLoad = (e) => {
    let img = e.target

    // Check aspect ratio to detect pre 1.6 thumbnails!
    let actual = Math.round((img.naturalWidth / img.naturalHeight) * 100)
    let expected = Math.round((this.props.width / this.props.height) * 100)

    if (expected !== actual)
      this.props.onError(this.props.id)
  }

  render() {
    return (
      <figure
        className="thumbnail"
        style={this.state.style}
        onClick={this.props.onClick}
        onContextMenu={this.props.onContextMenu}
        onDoubleClick={this.props.onDoubleClick}
        onMouseDown={this.props.onMouseDown}>
        {!this.state.src ? <IconPhoto/> : (
          <div className={`rotation-container iiif rot-${this.state.rotation}`}>
            <img
              decoding="async"
              loading="lazy"
              src={this.state.src}
              onError={this.handleError}
              onLoad={this.handleLoad}/>
          </div>)}
      </figure>
    )
  }

  static propTypes = {
    angle: number,
    broken: bool,
    cache: string.isRequired,
    color: string,
    consolidated: number,
    height: number,
    id: number,
    mimetype: string,
    mirror: bool,
    orientation: number,
    size: number.isRequired,
    width: number,
    onClick: func,
    onContextMenu: func,
    onDoubleClick: func,
    onError: func,
    onMouseDown: func
  }

  static defaultProps = {
    size: ICON.SIZE
  }

  static keys = Object.keys(this.propTypes)
}

module.exports = {
  Thumbnail
}
