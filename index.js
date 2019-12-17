'use strict'

/**
 * DynamoDB Streams Processor: A simple tool for working with DynamoDB Streams
 * @author Jeremy Daly <jeremy@jeremydaly.com>
 * @license MIT
 */

// Require the DynamoDB library and Converter
require('aws-sdk/clients/dynamodb')
const converter = require('aws-sdk/lib/dynamodb/converter')

// Require Set for instanceof comparison
const Set = require('aws-sdk/lib/dynamodb/set')

// Require deep-object-diff library for comparing records
const { diff, addedDiff, deletedDiff, detailedDiff, updatedDiff } = require('deep-object-diff')

// Export main function
module.exports = (records,diffType=false,options={}) => {
  if (Array.isArray(records)) {
    return records.map(rec => {
      // unmarshall dynamodb items if they exist
      let Keys = rec.dynamodb && rec.dynamodb.Keys ? unmarshall(rec.dynamodb.Keys,options) : {}
      let NewImage = rec.dynamodb && rec.dynamodb.NewImage ? unmarshall(rec.dynamodb.NewImage,options) : {}
      let OldImage = rec.dynamodb && rec.dynamodb.OldImage ? unmarshall(rec.dynamodb.OldImage,options) : {}

      // return new record with unmarshalled items
      return Object.assign(
        {},
        rec,
        rec.dynamodb ? {
          dynamodb: Object.assign(
            {},
            rec.dynamodb,
            { Keys }, // should always be there
            rec.dynamodb.NewImage ? { NewImage } : {},
            rec.dynamodb.OldImage ? { OldImage } : {},
            diffType ? { Diff: compare(OldImage,NewImage,diffType) } : {}
          )
        } : {}
      )
    })
  } else {
    throw 'records must be an array'
  }
}

// unmarshalls the object and converts sets into arrays
const unmarshall = (obj,options) => {
  // unmarshall the object
  let item = converter.unmarshall(obj,options)
  // check each top level key for sets and convert appropriately
  return options.wrapSets ? item
    : Object.keys(item).reduce((acc,key) => {
      return Object.assign(acc,{
        [key]: item[key] instanceof Set ? item[key].values : item[key]
      })
    },{})
}


// Use deep-object-diff to compare records
const compare = (OldImage,NewImage,diffType) => {
  switch(diffType) {
    case 'added':
      return addedDiff(OldImage,NewImage)
    case 'deleted':
      return deletedDiff(OldImage,NewImage)
    case 'updated':
      return updatedDiff(OldImage,NewImage)
    case 'detailed':
      return detailedDiff(OldImage,NewImage)
    default:
      return diff(OldImage,NewImage)
  }
}
