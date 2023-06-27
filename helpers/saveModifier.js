module.exports = async function save(object) {
  try {
    await object?.save()
  } catch (err) {
    if (err.code === 11000)
      console.log('Attempted to save duplicate, operation ignored', object)
    else console.error('An error occurred: ', object, err)
  }
}
