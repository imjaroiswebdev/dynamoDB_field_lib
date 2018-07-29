const dynamoose = require('dynamoose')
const R = require('ramda')
const uuid = require('uuid/v1')
require('dotenv').config()

console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
console.log('Dynamoose update nested attributes capabilities practice\n\n')

const modelOptions = {
  create: true, // Create table in DB, if it does not exist,
  update: false, // Update remote indexes if they do not match local index structure
  waitForActive: true, // Wait for table to be created before trying to use it
  waitForActiveTimeout: 180000 // wait 3 minutes for table to activate,
}

const catSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true
  },
  name: {
    type: String,
    rangeKey: true,
    index: true
  },
  friends: {
    cats: [String],
    dogs: [String],
    birds: [String]
  },
  bathFreq: {
    weekly: Boolean,
    monthly: Boolean
  },
  isAFatCat: Boolean
}, {
  // For levering the responsability of defining, validating and
  // creating the bathFreq of type Object attribute or any other
  // of type Object, one can use the schema level option "saveUnkown"
  // and directly assign the attribute in an object literal way
  // and it will be saved as a Map or Set depending on the case.
  // saveUnknown: ['bathFreq'],
  timestamps: true,
  useDocumentTypes: true,
  useNativeBooleans: true
})

const catVariations = [
  'Oscar',
  'Max',
  'Tiger',
  'Sam',
  'Misty',
  'Simba',
  'Coco',
  'Chloe',
  'Lucy',
  'Missy',
  'Molly',
  'Tigger',
  'Smokey',
  'Milo',
  'Cleo'
]

const catNameIndex = Math.floor(Math.random() * catVariations.length)

const Cat = dynamoose.model('cats_test_table', catSchema, modelOptions)
const catId = uuid()

const keyOf = cat => ({
  id: cat.id,
  name: cat.name
})

const catUpdate = (cat, update) =>
  Cat.update(keyOf(cat), update, {
    returnValues: 'ALL_NEW'
  })

// Create a new cat object
const someFatCat = new Cat({
  id: catId,
  name: catVariations[catNameIndex],
  isAFatCat: true,
  bathFreq: {
    weekly: true,
    monthly: false
  }
})

someFatCat.save()
  .then(cat => Cat.get(keyOf(cat)))
  .then(cat => {
    console.log('Cat:', cat)
    console.log('Really is a Cat?', cat instanceof Cat)
    console.log('\n')

    const catFriends = {
      cats: ['Oliver', 'Milo'],
      dogs: ['Max', 'Buddy', 'Charlie'],
      birds: ['Skittles']
    }

    return Cat.update(keyOf(cat), { friends: catFriends }, {
      returnValues: 'ALL_NEW'
    })
  })
  .then(catWithFriends => {
    console.log(catWithFriends.name + ' friends:', catWithFriends.friends)
    console.log('\n')

    console.time('Update took')
    return Cat.get(keyOf(catWithFriends))
  })
  .then(cat => {
    const {
      friends: prevCatFriends
    } = cat

    const friends = {
      ...prevCatFriends,
      birds: R.append('Sunny', prevCatFriends.birds)
    }

    return catUpdate(cat, { friends })
  })
  .then(catWithNewFriends => {
    console.timeEnd('Update took')

    console.log('\nNew bird friends of ' + catWithNewFriends.name + ':', catWithNewFriends.friends.birds)
    console.log('\n')

    const {
      friends: prevCatFriends
    } = catWithNewFriends

    const friends = {
      ...prevCatFriends,
      birds: R.append('Charlie', prevCatFriends.birds)
    }

    console.time('Update with local data took')
    return catUpdate(catWithNewFriends, { friends })
  })
  .then(cat => {
    console.timeEnd('Update with local data took')

    console.log('\nMore new bird friends of ' + cat.name + ':', cat.friends.birds)
    console.log('\n')

    const {
      bathFreq: prevBathFreq
    } = cat

    const bathFreq = {
      weekly: !prevBathFreq.weekly,
      monthly: !prevBathFreq.monthly
    }

    console.time('Bath frequency update took')

    return catUpdate(cat, { bathFreq })
  })
  .then(cat => {
    console.timeEnd('Bath frequency update took')

    console.log(`${cat.name} takes a bath every ${cat.bathFreq.monthly ? 'month' : 'week'}`)
    console.log('\n')
  })
