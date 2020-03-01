import path from 'path'
import _ from 'lodash'

import ImageGenerator from './src/ImageGenerator'
import { readJSONFile, removeFiles, escapeQuotes } from './src/Utils'
import StringGenerator from './src/StringGenerator'

const inputPath = 'inputFiles'
const outputPath = 'outputFiles'

String.prototype.capitalize = function () { return _.capitalize(this) }
String.prototype.camelCase = function () { return _.camelCase(this) }
String.prototype.escapeQuotes = function () { return escapeQuotes(this) }

// cleanup old outputs
removeFiles(outputPath)

// generate images
readJSONFile(path.join(inputPath, 'imageSource.json'))
	.then(source => {
		const imageGenerator = new ImageGenerator(source, inputPath, outputPath)
		imageGenerator.generate()
	})

// generate strings
readJSONFile(path.join(inputPath, 'stringSource.json'))
	.then(source => {
		const stringGenerator = new StringGenerator(source, outputPath)
		stringGenerator.generate()
	})
