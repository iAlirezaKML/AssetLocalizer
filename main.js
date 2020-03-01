import path from 'path'
import _ from 'lodash'

import ImageGenerator from './src/ImageGenerator'
import { readJSONFile, removeFiles } from './src/Utils'

const inputPath = 'inputFiles'
const outputPath = 'outputFiles'

String.prototype.capitalize = function () { return _.capitalize(this) }
String.prototype.camelCase = function () { return _.camelCase(this) }

readJSONFile(path.join(inputPath, 'source.json'))
	.then(source => {
		const imageGenerator = new ImageGenerator(source, inputPath, outputPath)
		removeFiles(outputPath)
		imageGenerator.generate()
	})
