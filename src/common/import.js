'use strict'

const ex = require('./export')
const { expand, open } = require('./json')
const { rdfs, tropy } = require('./ns')
const { URI, any, array, map, morph, omit, get } = require('./util')

// Expand JSON-LD and ungroup item graph for backwards compatibility!
const normalize = async (json) =>
  array(await expand(json))
    .flatMap(g =>
      g['@graph'].map(item =>
        (tropy.template in item) ? item : {
          [tropy.template]: g[tropy.template],
          ...item
        }))

const flatten = (node) =>
  array(node)
    .flatMap(container => container['@list'] || container)

const toValue = (node) =>
  node['@id'] ?
    { type: rdfs.Class, text: node['@id'] } :
    { type: node['@type'], text: node['@value'] }

const toFirstValue = (_, values) =>
  toValue(values[0])

const getMetadata = (data, type) =>
  map(omit(data, props[type]), toFirstValue)

const getProps = (data, type) =>
  morph(data, (img, prop, values) => {
    let value = any(values[0], '@value', '@id')
    if (value === undefined)
      return
    if (props[type].skip.includes(prop))
      return
    if (!props[type].includes(prop))
      return

    img[URI.split(prop)[1]] = value
  })

const getPhoto = (data) => ({
  data: getMetadata(data, 'photo'),
  id: get(data, ['@id', 0]),
  image: getProps(data, 'photo'),
  selections: flatten(data[tropy.selection]).map(getSelection),
  template: get(data, [tropy.template, 0, '@id']),
  type: get(data, ['@type', 0])
})

const getSelection = (data) => ({
  data: getMetadata(data, 'selection'),
  id: get(data, ['@id', 0]),
  type: get(data, ['@type', 0]),
  ...getProps(data, 'selection')
})

function *eachItem(graph) {
  for (let data of graph) {
    yield ({
      data: getMetadata(data, 'item'),
      id: get(data, ['@id', 0]),
      // lists: (data[tropy.list] || []).map(literal),
      photos: flatten(data[tropy.photo]).map(getPhoto),
      tags: (data[tropy.tag] || []).map(n => n['@value']),
      template: get(data, [tropy.template, 0, '@id']),
      type: get(data, ['@type', 0])
    })

  }
}

const props = {
  item: [
    '@id',
    '@type',
    tropy.list,
    tropy.photo,
    tropy.tag,
    ...ex.props.item.map(prop => tropy[prop])
  ],
  photo: [
    '@id',
    '@type',
    tropy.note,
    tropy.selection,
    ...ex.props.photo.map(prop => tropy[prop]),
    ...ex.props.image.map(prop => tropy[prop])
  ],
  selection: [
    '@id',
    '@type',
    tropy.note,
    ...ex.props.selection.map(prop => tropy[prop]),
    ...ex.props.image.map(prop => tropy[prop])
  ]
}

props.photo.skip = [
  '@id', '@type', tropy.template, tropy.selection, tropy.note
]

props.selection.skip = [
  '@id', '@type', tropy.note
]

module.exports = {
  eachItem,
  normalize,

  async open(...args) {
    return normalize(await open(...args))
  }
}
