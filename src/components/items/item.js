'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { Toolbar } = require('../toolbar')
const { Tab, Tabs } = require('../tabs')
const { NoteToolbar, NoteList } = require('../note')
const { PanelGroup, Panel } = require('../panel')
const { Resizable } = require('../resizable')
const { PhotoToolbar, PhotoList, PhotoGrid } = require('../photo')
const { IconMetadata, IconTag } = require('../icons')
const { Viewer } = require('../viewer')
const { Fields } = require('../metadata')
const { getSelectedItems } = require('../../selectors/items')
const { frameless } = ARGS
const { seq, mapcat } = require('transducers.js')
const act = require('../../actions')


class Item extends Component {

  get item() {
    const { items } = this.props
    return items.length === 1 ? items[0] : null
  }

  get isDisabled() {
    const { item } = this
    return !(item && !item.deleted)
  }

  handleMetadataTabSelect = () => {
    if (this.props.panel.tab !== 'metadata') {
      this.props.onTabSelect('metadata')
    }
  }

  handleTagsTabSelect = () => {
    if (this.props.panel.tab !== 'tags') {
      this.props.onTabSelect('tags')
    }
  }

  handlePhotoCreate = (event) => {
    const { onPhotoCreate } = this.props
    const { item } = this

    event.stopPropagation()
    onPhotoCreate({ item: item.id })
  }

  handleNoteCreate = (event) => {
    event.stopPropagation()
  }


  renderItemTabs() {
    const { panel, selection } = this.props

    return (
      <Tabs justified>
        <Tab
          active={panel.tab === 'metadata'}
          disabled={!selection.length}
          onActivate={this.handleMetadataTabSelect}>
          <IconMetadata/>
          <FormattedMessage id="panel.metadata"/>
        </Tab>
        <Tab
          active={panel.tab === 'tags'}
          disabled={!selection.length}
          onActivate={this.handleTagsTabSelect}>
          <IconTag/>
          <FormattedMessage id="panel.tags"/>
        </Tab>
      </Tabs>
    )
  }

  renderItemPanel() {
    const { selection, panel } = this.props

    switch (selection.length) {
      case 0:
        return <span>No items selected</span>

      case 1:
        switch (panel.tab) {
          case 'metadata':
            return this.renderMetadataPanel()
          case 'tags':
            return this.renderTagsPanel()
          default:
            return null
        }

      default:
        return <span>{selection.length} items selected</span>
    }
  }

  renderMetadataPanel() {
    const { photo } = this.props
    const { item, isDisabled } = this

    return (
      <div>
        {photo &&
          <Fields
            id={photo}
            disabled={isDisabled}
            template="photo"/>}
        {item &&
          <Fields
            id={item.id}
            disabled={isDisabled}
            template="core"/>}
      </div>
    )
  }

  renderTagsPanel() {
    const { item } = this

    return (
      <ul>
        {item && item.tags.map(tag => <li key={tag}>{tag}</li>)}
      </ul>
    )
  }

  renderPhotoToolbar() {
    const { panel, onPhotoZoomChange } = this.props

    return (
      <PhotoToolbar
        zoom={panel.photoZoom}
        onZoomChange={onPhotoZoomChange}
        hasCreateButton={!this.isDisabled}
        onCreate={this.handlePhotoCreate}/>
    )
  }

  renderPhotoPanel() {
    const { items, photo, panel } = this.props
    const photos = seq(items, mapcat(i => i && i.photos || []))

    if (panel.photoZoom) {
      return (
        <PhotoGrid
          photos={photos}
          selected={photo}
          isDisabled={this.isDisabled}/>
      )
    }

    return (
      <PhotoList
        photos={photos}
        selected={photo}
        isDisabled={this.isDisabled}/>
    )
  }

  renderNoteToolbar() {
    return (
      <NoteToolbar
        hasCreateButton={false}
        onCreate={this.handleNoteCreate}/>
    )
  }

  renderNotePanel() {
    const { note } = this.props
    const { item } = this

    return item && (
      <NoteList
        notes={item.notes || []}
        selected={note}
        isDisabled={this.isDisabled}/>
    )
  }

  renderToolbar() {
    return (
      <Toolbar draggable={frameless}/>
    )
  }

  render() {
    return (
      <section id="item">
        <Resizable edge="left" value={320}>
          <PanelGroup header={this.renderToolbar()}>
            <Panel header={this.renderItemTabs()}>
              {this.renderItemPanel()}
            </Panel>

            <Panel header={this.renderPhotoToolbar()}>
              {this.renderPhotoPanel()}
            </Panel>

            <Panel header={this.renderNoteToolbar()}>
              {this.renderNotePanel()}
            </Panel>
          </PanelGroup>
        </Resizable>

        <Viewer/>
      </section>
    )
  }

  static propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        tags: PropTypes.arrayOf(PropTypes.number).isRequired,
        deleted: PropTypes.bool
      })
    ),

    panel: PropTypes.shape({
      tab: PropTypes.oneOf(['metadata', 'tags']).isRequired,
      photoZoom: PropTypes.number.isRequired
    }).isRequired,

    photo: PropTypes.number,
    note: PropTypes.number,
    selection: PropTypes.arrayOf(PropTypes.number),

    onTabSelect: PropTypes.func,
    onPhotoCreate: PropTypes.func,
    onPhotoZoomChange: PropTypes.func
  }
}


module.exports = {
  Item: connect(
    (state) => ({
      items: getSelectedItems(state),
      photo: state.nav.photo,
      note: state.nav.note,
      selection: state.nav.items,
      panel: state.nav.panel
    }),

    (dispatch) => ({
      onTabSelect(tab) {
        dispatch(act.nav.panel.update({ tab }))
      },

      onPhotoCreate(...args) {
        dispatch(act.photo.create(...args))
      },

      onPhotoZoomChange(photoZoom) {
        dispatch(act.nav.panel.update({ photoZoom }))
      }
    })
  )(Item)
}
