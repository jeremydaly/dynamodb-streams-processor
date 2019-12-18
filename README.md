# DynamoDB Streams Processor

[![Build Status](https://travis-ci.org/jeremydaly/dynamodb-streams-processor.svg?branch=master)](https://travis-ci.org/jeremydaly/dynamodb-streams-processor)
[![npm](https://img.shields.io/npm/v/dynamodb-streams-processor.svg)](https://www.npmjs.com/package/dynamodb-streams-processor)
[![npm](https://img.shields.io/npm/l/dynamodb-streams-processor.svg)](https://www.npmjs.com/package/dynamodb-streams-processor)
[![Coverage Status](https://coveralls.io/repos/github/jeremydaly/dynamodb-streams-processor/badge.svg?branch=master)](https://coveralls.io/github/jeremydaly/dynamodb-streams-processor?branch=master)

The **DynamoDB Streams Processor** is a simple tool that makes working with [DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html) super easy. It uses the
[DynamoDB Converter](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/Converter.html) utility to unmarshall the items, plus does some other cool magic (like unwrapping `Set`s and performing diffs) so you don't need to.

## It's not really magic... 🧙
Take a look at the code (index.js) and you'll see that it's not an overly complex script. However, I found myself writing the same thing over and over again for different projects, so I decided to create something that made my life easier. If you find it useful for your projects, that's cool too.

## Installation
Via npm or yarn:
```
npm i dynamodb-streams-processor
```
```
yarn add dynamodb-streams-processor
```

## Usage

The dynamodb-streams-processor takes the `Records` array from a DynamoDB Streams event and returns an array with the `Keys`, `NewImage` and `OldImage` objects unmarshalled to native JavaScript types. By default, it will also unwrap `Set`s and return their values as an array.

```javascript
const processor = require('dynamodb-streams-processor')

exports.handler = async event => {
  let records = processor(event.Records)
  // do something with the records
}
```

This will convert something like this:

```javascript
[
  {
    "eventID": "fe98111ed30435a4e546c0ecdc2f68f7",
    "eventName": "MODIFY",
    "eventVersion": "1.1",
    "eventSource": "aws:dynamodb",
    "awsRegion": "us-east-1",
    "dynamodb": {
        "ApproximateCreationDateTime": 1576516897,
        "Keys": {
            "sk": {
                "S": "sortKey"
            },
            "pk": {
                "S": "partitionKey"
            }
        },
        "NewImage": {
          "sk": {
            "S": "sortKey"
          },
          "pk": {
            "S": "partitionKey"
          },
          "Boolean": {
            "BOOL": false
          },
          "List": {
            "L": [
              {
                "S": "Cats"
              },
              {
                "S": "Dogs"
              },
              {
                "N": "123"
              }
            ]
          },
          "Map": {
            "M": {
              "Name": {
                "S": "Jane"
              },
              "Age": {
                "N": "30"
              }
            }
          },
          "IntegerNumber": {
            "N": "123"
          },
          "String": {
            "S": "String Test"
          },
          "StringSet": {
            "SS": [
              "Test1",
              "Test2"
            ]
          }
        },
        "SequenceNumber": "125319600000000012510796858",
        "SizeBytes": 884,
        "StreamViewType": "NEW_IMAGE"
    },
    "eventSourceARN": "arn:aws:dynamodb:us-east-1:1234567890:table/my-table/stream/2019-12-16T00:00:00.000"
  }
]
```

Into this:

```javascript
[
  {
    "eventID": "fe98111ed30435a4e546c0ecdc2f68f7",
    "eventName": "MODIFY",
    "eventVersion": "1.1",
    "eventSource": "aws:dynamodb",
    "awsRegion": "us-east-1",
    "dynamodb": {
        "ApproximateCreationDateTime": 1576516897,
        "Keys": {
          "sk": "sortKey",
          "pk": "partitionKey"
        },
        "NewImage": {
          "sk": "sortKey",
          "pk": "partitionKey",
          "Boolean": false
          "List": [ "Cats", "Dogs", 123 ],
          "Map": {
            "Name": "Jane",
            "Age": 30
          },
          "IntegerNumber": 123,
          "String": "String Test",
          "StringSet": [ "Test1", "Test2" ]
        },
        "SequenceNumber": "125319600000000012510796858",
        "SizeBytes": 884,
        "StreamViewType": "NEW_IMAGE"
    },
    "eventSourceARN": "arn:aws:dynamodb:us-east-1:1234567890:table/my-table/stream/2019-12-16T00:00:00.000"
  }
]
```

### Calculating diffs

If you are using the `NEW_AND_OLD_IMAGES` stream view type, then it's often useful to compare the `OldImage` and the `NewImage`. This library bakes in the [deep-object-diff](https://github.com/mattphillips/deep-object-diff) library to let you perform a number of supported diff operations.

Pass in `true` as the second parameter for a standard diff, or pass a string value of `added`, `deleted`, `updated`, or `detailed` for more specific diff operations. The diff will be returned as an object using the property name `Diff` under the `dynamodb` property.

Example truncated for clarity:
```javascript
[
  {
    ...
    "dynamodb": {
        "ApproximateCreationDateTime": 1576516897,
        "Keys": {
          "sk": "sortKey",
          "pk": "partitionKey"
        },
        "NewImage": {
          "sk": "sortKey",
          "pk": "partitionKey",
          ...
        },
        "OldImage": {
          "sk": "sortKey",
          "pk": "partitionKey",
          ...
        },
        "Diff": {
          "add": "added",
          "Boolean": false,
          "List": {
            "1": "Fish"
          },
          "Map": {
            "Age": 35
          }
        },
        ...
        "StreamViewType": "NEW_AND_OLD_IMAGES"
    },
    "eventSourceARN": "arn:aws:dynamodb:us-east-1:1234567890:table/my-table/stream/2019-12-16T00:00:00.000"
  }
]
```

### Passing additional options
The [DynamoDB Converter](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/Converter.html) supports additional options when unmarshalling data. The only one that might makes sense to use, is the boolean `wrapNumbers` option. This will return numbers as a NumberValue object instead of converting them to native JavaScript numbers. This allows for the safe round-trip transport of numbers of arbitrary size.

To pass this option, send it an object as the third parameter:

```javascript
exports.handler = async event => {
  let records = processor(event.Records, false, { wrapNumbers: true })
  // do something with the records
}
```

This library automatically unwraps `Set`s (which the unmarshaller does not do). If you would like to return wrapped `Set`s, pass `{ wrapSets: true }` as the third parameter.

## Contributions and Feedback
Contributions, ideas and bug reports are welcome and greatly appreciated. Please add [issues](https://github.com/jeremydaly/dynamodb-streams-processor/issues) for suggestions and bug reports or create a pull request. You can also contact me on Twitter: [@jeremy_daly](https://twitter.com/jeremy_daly).
