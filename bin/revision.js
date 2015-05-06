#!/usr/bin/env node

var program = require('commander')
var co = require('co')
var pkg = require('../package.json')
var revision = require('..')

program
  .version(pkg.version)
  .usage('[options] <files ...>')
  .option('-m, --manifest <path>', 'set path of manifest.json')
  .parse(process.argv)

if (program.manifest) {
  revision.setManifestPath(program.manifest)
}

co(function* () {
  yield revision.processFiles.apply(null, program.args)
})
.catch(function (err) {
  console.error(err)
})
