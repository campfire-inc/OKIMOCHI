
module.exports.failTest = () => {
  throw new Error('Expect Promise to be rejected but its fullfilled!')
}
