'use strict'

const processor = require('../index')

// Require NumberValue for instanceof comparison
const NumberValue = require('aws-sdk/lib/dynamodb/numberValue')

// Require Set for instanceof comparison
const Set = require('aws-sdk/lib/dynamodb/set')

describe('Error states and defaults',() => {

  it('should error with invalid record set',() => {
    let result = () => processor({})
    expect(result).toThrow('records must be an array')
  })

  it('should bypass empty `dynamodb` field',() => {
    let result = processor([{ test: true }])
    expect(result[0].test).toBe(true)
  })

})

describe('NEW_AND_OLD_IMAGES',() => {

  it('should unmarshall & check diff',() => {

    let event = require('./events/new-and-old.json')
    let result = processor(event.Records,true)

    // console.log(JSON.stringify(result,null,2));

    expect(result[0].dynamodb.NewImage.add).toBe('added')
    expect(result[0].dynamodb.NewImage.sk).toBe('sortKey')
    expect(result[0].dynamodb.NewImage.pk).toBe('partitionKey')
    expect(result[0].dynamodb.NewImage.Binary).toEqual(Buffer.from('AAEqQQ=='))
    expect(result[0].dynamodb.NewImage.Boolean).toBe(false)
    expect(result[0].dynamodb.NewImage.BinarySet[0]).toEqual(Buffer.from('AAEqQQ=='))
    expect(result[0].dynamodb.NewImage.BinarySet[1]).toEqual(Buffer.from('AAEqQQ=='))
    expect(result[0].dynamodb.NewImage.List).toEqual(['Cats','Fish',3.14159])
    expect(result[0].dynamodb.NewImage.Map).toEqual({ Name: 'Jane', Age: 36})
    expect(result[0].dynamodb.NewImage.FloatNumber).toBe(123.45)
    expect(result[0].dynamodb.NewImage.IntegerNumber).toBe(123)
    expect(result[0].dynamodb.NewImage.NumberSet).toEqual([123,456])
    expect(result[0].dynamodb.NewImage.Null).toBe(null)
    expect(result[0].dynamodb.NewImage.String).toBe('String Test')
    expect(result[0].dynamodb.NewImage.StringSet[0]).toBe('Test1')
    expect(result[0].dynamodb.NewImage.StringSet[1]).toBe('Test2')

    expect(result[0].dynamodb.OldImage.sk).toBe('sortKey')
    expect(result[0].dynamodb.OldImage.pk).toBe('partitionKey')
    expect(result[0].dynamodb.OldImage.Binary).toEqual(Buffer.from('AAEqQQ=='))
    expect(result[0].dynamodb.OldImage.Boolean).toBe(true)
    expect(result[0].dynamodb.OldImage.BinarySet[0]).toEqual(Buffer.from('AAEqQQ=='))
    expect(result[0].dynamodb.OldImage.BinarySet[1]).toEqual(Buffer.from('AAEqQQ=='))
    expect(result[0].dynamodb.OldImage.List).toEqual(['Cats','Dogs',3.14159])
    expect(result[0].dynamodb.OldImage.Map).toEqual({ Name: 'Jane', Age: 35})
    expect(result[0].dynamodb.OldImage.FloatNumber).toBe(123.45)
    expect(result[0].dynamodb.OldImage.IntegerNumber).toBe(123)
    expect(result[0].dynamodb.OldImage.NumberSet).toEqual([123,456])
    expect(result[0].dynamodb.OldImage.Null).toBe(null)
    expect(result[0].dynamodb.OldImage.String).toBe('String Test')
    expect(result[0].dynamodb.OldImage.StringSet[0]).toBe('Test1')
    expect(result[0].dynamodb.OldImage.StringSet[1]).toBe('Test2')

    expect(result[0].dynamodb.Diff.add).toBe('added')
    expect(result[0].dynamodb.Diff.Boolean).toBe(false)
    expect(result[0].dynamodb.Diff.List).toEqual({ 1: 'Fish' })
    expect(result[0].dynamodb.Diff.Map).toEqual({ Age: 36 })
  })

  it('should unmarshall & check additions',() => {
    let event = require('./events/new-and-old.json')
    let result = processor(event.Records,'added')

    expect(result[0].dynamodb.Diff.add).toBe('added')
  })

  it('should unmarshall & check updates',() => {
    let event = require('./events/new-and-old.json')
    let result = processor(event.Records,'updated')

    expect(result[0].dynamodb.Diff.Boolean).toBe(false)
    expect(result[0].dynamodb.Diff.List).toEqual({ 1: 'Fish' })
    expect(result[0].dynamodb.Diff.Map).toEqual({ Age: 36 })
  })

  it('should unmarshall & check deletions',() => {
    let event = require('./events/new-and-old.json')
    let result = processor(event.Records,'deleted')

    expect(result[0].dynamodb.Diff.delete).toBeUndefined()
  })

  it('should unmarshall & calc detailed diff',() => {
    let event = require('./events/new-and-old.json')
    let result = processor(event.Records,'detailed')

    expect(result[0].dynamodb.Diff.added).toEqual({ add: 'added' })
    expect(result[0].dynamodb.Diff.deleted.delete).toBeUndefined()
    expect(result[0].dynamodb.Diff.updated.Boolean).toBe(false)
    expect(result[0].dynamodb.Diff.updated.List).toEqual({ 1: 'Fish' })
    expect(result[0].dynamodb.Diff.updated.Map).toEqual({ Age: 36 })
  })

  it('should unmarshall & do not check diff',() => {
    let event = require('./events/new-and-old.json')
    let result = processor(event.Records)

    expect(result[0].dynamodb).not.toHaveProperty('Diff')
  })

  it('should unmarshall with wrapNumbers options',() => {
    let event = require('./events/new-and-old.json')
    let result = processor(event.Records,false,{ wrapNumbers: true })

    expect(result[0].dynamodb.NewImage.FloatNumber).toBeInstanceOf(NumberValue)
    expect(result[0].dynamodb.NewImage.IntegerNumber).toBeInstanceOf(NumberValue)
    expect(result[0].dynamodb.NewImage.List[2]).toBeInstanceOf(NumberValue)
    expect(result[0].dynamodb.NewImage.NumberSet[0]).toBeInstanceOf(NumberValue)
  })

  it('should unmarshall with wrapSets options',() => {
    let event = require('./events/new-and-old.json')
    let result = processor(event.Records,false,{ wrapSets: true })

    expect(result[0].dynamodb.NewImage.BinarySet).toBeInstanceOf(Set)
    expect(result[0].dynamodb.NewImage.NumberSet).toBeInstanceOf(Set)
    expect(result[0].dynamodb.NewImage.StringSet).toBeInstanceOf(Set)
  })

}) // end NEW_AND_OLD_IMAGES

describe('NEW_IMAGE',() => {
  it('unmarshall & check diff (equals NewImage)',() => {
    let event = require('./events/new.json')
    let result = processor(event.Records,true)

    expect(result[0].dynamodb).not.toHaveProperty('OldImage')

    expect(result[0].dynamodb.NewImage.sk).toBe('sortKey')
    expect(result[0].dynamodb.NewImage.pk).toBe('partitionKey')
    expect(result[0].dynamodb.NewImage.Binary).toEqual(Buffer.from('AAEqQQ=='))
    expect(result[0].dynamodb.NewImage.Boolean).toBe(false)
    expect(result[0].dynamodb.NewImage.BinarySet[0]).toEqual(Buffer.from('AAEqQQ=='))
    expect(result[0].dynamodb.NewImage.BinarySet[1]).toEqual(Buffer.from('AAEqQQ=='))
    expect(result[0].dynamodb.NewImage.List).toEqual(['Cats','Fish',3.14159])
    expect(result[0].dynamodb.NewImage.Map).toEqual({ Name: 'Jane', Age: 36})
    expect(result[0].dynamodb.NewImage.FloatNumber).toBe(123.45)
    expect(result[0].dynamodb.NewImage.IntegerNumber).toBe(123)
    expect(result[0].dynamodb.NewImage.NumberSet).toEqual([123,456])
    expect(result[0].dynamodb.NewImage.Null).toBe(null)
    expect(result[0].dynamodb.NewImage.String).toBe('String Test')
    expect(result[0].dynamodb.NewImage.StringSet[0]).toBe('Test1')
    expect(result[0].dynamodb.NewImage.StringSet[1]).toBe('Test2')

    expect(result[0].dynamodb.Diff).toEqual(result[0].dynamodb.NewImage)
  })

  it('unmarshall & do not check diff',() => {
    let event = require('./events/new.json')
    let result = processor(event.Records,false)

    expect(result[0].dynamodb).not.toHaveProperty('OldImage')
    expect(result[0].dynamodb).not.toHaveProperty('Diff')
  })

}) // end NEW_IMAGE

describe('OLD_IMAGE',() => {
  it('unmarshall & check diff (empty object)',() => {

    let event = require('./events/old.json')
    let result = processor(event.Records,true)

    expect(result[0].dynamodb).not.toHaveProperty('NewImage')

    expect(result[0].dynamodb.OldImage.sk).toBe('sortKey')
    expect(result[0].dynamodb.OldImage.pk).toBe('partitionKey')
    expect(result[0].dynamodb.OldImage.Binary).toEqual(Buffer.from('AAEqQQ=='))
    expect(result[0].dynamodb.OldImage.Boolean).toBe(false)
    expect(result[0].dynamodb.OldImage.BinarySet[0]).toEqual(Buffer.from('AAEqQQ=='))
    expect(result[0].dynamodb.OldImage.BinarySet[1]).toEqual(Buffer.from('AAEqQQ=='))
    expect(result[0].dynamodb.OldImage.List).toEqual(['Cats','Fish',3.14159])
    expect(result[0].dynamodb.OldImage.Map).toEqual({ Name: 'Jane', Age: 36})
    expect(result[0].dynamodb.OldImage.FloatNumber).toBe(123.45)
    expect(result[0].dynamodb.OldImage.IntegerNumber).toBe(123)
    expect(result[0].dynamodb.OldImage.NumberSet).toEqual([123,456])
    expect(result[0].dynamodb.OldImage.Null).toBe(null)
    expect(result[0].dynamodb.OldImage.String).toBe('String Test')
    expect(result[0].dynamodb.OldImage.StringSet[0]).toBe('Test1')
    expect(result[0].dynamodb.OldImage.StringSet[1]).toBe('Test2')

    expect(result[0].dynamodb.Diff).toEqual({})
  })

  it('unmarshall & do not check diff',() => {
    let event = require('./events/old.json')
    let result = processor(event.Records)

    expect(result[0].dynamodb).not.toHaveProperty('NewImage')
    expect(result[0].dynamodb).not.toHaveProperty('Diff')
  })

}) // end OLD_IMAGE

describe('KEYS_ONLY',() => {
  it('unmarshall & check diff (empty object)',() => {

    let event = require('./events/keys-only.json')
    let result = processor(event.Records,true)

    expect(result[0].dynamodb).not.toHaveProperty('OldImage')
    expect(result[0].dynamodb).not.toHaveProperty('NewImage')

    expect(result[0].dynamodb.Keys.sk).toBe('sortKey')
    expect(result[0].dynamodb.Keys.pk).toBe('partitionKey')

    expect(result[0].dynamodb.Diff).toEqual({})
  })

  it('unmarshall & do not check diff',() => {
    let event = require('./events/keys-only.json')
    let result = processor(event.Records)

    expect(result[0].dynamodb).not.toHaveProperty('NewImage')
    expect(result[0].dynamodb).not.toHaveProperty('OldImage')
    expect(result[0].dynamodb).not.toHaveProperty('Diff')
  })

}) // end KEYS_ONLY

describe('Multiple Records',() => {

  it('unmarshalls & checks diffs for multiple records',() => {
    let event = require('./events/multiple-records.json')
    let result = processor(event.Records,true)

    expect(result[0].dynamodb).toHaveProperty('NewImage')
    expect(result[0].dynamodb).toHaveProperty('OldImage')
    expect(result[0].dynamodb).toHaveProperty('Diff')
    expect(result[0].dynamodb.NewImage.pk).toBe('partitionKey')
    expect(result[1].dynamodb).not.toHaveProperty('NewImage')
    expect(result[1].dynamodb).not.toHaveProperty('OldImage')
    expect(result[1].dynamodb).toHaveProperty('Diff')
    expect(result[2].dynamodb).toHaveProperty('NewImage')
    expect(result[2].dynamodb).not.toHaveProperty('OldImage')
    expect(result[2].dynamodb).toHaveProperty('Diff')
    expect(result[3].dynamodb).not.toHaveProperty('NewImage')
    expect(result[3].dynamodb).toHaveProperty('OldImage')
    expect(result[3].dynamodb).toHaveProperty('Diff')
  })
})
