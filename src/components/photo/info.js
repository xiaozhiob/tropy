'use strict'

const React = require('react')
const { PureComponent } = React
const { StaticField } = require('../metadata/field')
const { func, object } = require('prop-types')
const { basename } = require('path')
const { number, bytes } = require('../../format')


class PhotoInfo extends PureComponent {
  get file() {
    return basename(this.props.photo.path)
  }

  get size() {
    const { width, height, size } = this.props.photo
    return `${number(width)}×${number(height)}, ${bytes(size)}`
  }

  handleFileClick = () => {
    this.props.onOpenInFolder(this.props.photo.path)
  }

  render() {
    return (
      <ol className="photo-info metadata-fields">
        <StaticField
          label="photo.file"
          value={this.file}
          onClick={this.handleFileClick}/>
        <StaticField
          label="photo.size"
          value={this.size}/>
      </ol>
    )
  }

  static propTypes = {
    photo: object.isRequired,
    onOpenInFolder: func.isRequired
  }
}

module.exports = {
  PhotoInfo
}
