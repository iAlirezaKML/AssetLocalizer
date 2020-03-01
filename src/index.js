import fs from 'fs-extra'
import path from 'path'
import _ from 'lodash'

const inputPath = path.join(__dirname, '..', 'input')
const inputSourceJSONPath = path.join(inputPath, 'source.json')
const inputResourcesPath = (name) => path.join(inputPath, 'resources', name)

const outputDirPath = path.join(__dirname, '..', 'output')
const outputResourcePath = (subpath, name) => path.join(outputDirPath, subpath, name)
const outputContentsJSONPath = (subpath) => outputResourcePath(subpath, 'Contents.json')

function saveToFile(path, content, msg) {
	return fs.outputFile(path, content, err => {
		// throws an error, you could also catch it here
		if (err) throw err
		// success case, the file was saved
		console.log(`${msg} saved!`)
	})
}

function saveContentJSON(path, content, msg) {
	saveToFile(
		outputContentsJSONPath(path),
		JSON.stringify(content, null, 2),
		msg
	)
}

function copyResource(path, name) {
	fs.copySync(inputResourcesPath(name), outputResourcePath(path, name));
}

function clearEmpties(o) {
	for (var k in o) {
		if (!o[k] || typeof o[k] !== "object") {
			continue // If null or not an object, skip to the next iteration
		}

		// The property is an object
		clearEmpties(o[k]); // <-- Make a recursive call on the nested object
		if (Object.keys(o[k]).length === 0) {
			delete o[k]; // The object had no properties, so delete that property
		}
	}
	return o
}

function assetExtractor(parentName) {
	return (asset) => {
		const {
			type = 'single',
			vector = true,
			name,
			filename,
			attributes = {}
		} = asset
		const images = []
		const properties = {}
		const resourcePath = `${parentName}/${name}.imageset`

		if (type === 'single') {
			images.push({
				"idiom": "universal",
				filename,
				...attributes
			})
			properties["preserves-vector-representation"] = vector
			copyResource(resourcePath, filename)
		} else if (type === 'set') {
			const [basename, ext] = filename.split('.', 2)
			const filenames = ['', '@2x', '@3x'].map((el, idx) => ({
				filename: `${basename}${el}.${ext}`,
				scale: `${idx + 1}x`
			}))
			filenames.forEach(el => {
				images.push({
					"idiom": "universal",
					...el
				})
				copyResource(resourcePath, el.filename)
			})
		}

		const contentJSON = {
			images,
			"info": {
				"version": 1,
				"author": "xcode"
			},
			properties
		}

		saveContentJSON(resourcePath, clearEmpties(contentJSON), 'asset json')

		return (namespace) => {
			const prefix = !!namespace ? `${namespace}/` : ''
			const imageName = `${prefix}${name}`
			return `\
		static func ${_.camelCase(name)}() -> UIImage? {
			return UIImage(named: "${imageName}")
		}
		`}
	}
}

function groupExtractor(parentName) {
	return (group) => {
		const { namespace = true, name: _name, assets = [] } = group
		const name = _.capitalize(_name)
		const contentJSON = {
			"info": {
				"version": 1,
				"author": "xcode"
			},
			"properties": {
				"provides-namespace": namespace
			}
		}
		const assetsName = `${parentName}/${name}`
		saveContentJSON(assetsName, contentJSON, 'group json')
		const swiftCodeBuilders = assets.map(assetExtractor(assetsName))
		const swiftCodes = swiftCodeBuilders.map(el => el(name)).join('\n')
		return `\
	public enum ${name} {
		${swiftCodes}
	}`
	}
}

function extractAssetFromSource(source) {
	const { name: _name, groups = [], assets = [] } = source
	const name = _.capitalize(_name)
	const assetsName = `${name}Images.xcassets`
	const contentJSON = {
		"info": {
			"version": 1,
			"author": "xcode"
		}
	}
	fs.emptyDirSync(outputDirPath)
	saveContentJSON(assetsName, contentJSON, 'assets json')
	const groupsSwiftCodes = groups.map(groupExtractor(assetsName))
	const assetsSwiftCodeBuilders = assets.map(assetExtractor(assetsName))
	const assetsSwiftCodes = assetsSwiftCodeBuilders.map(el => el()).join('\n')
	const swiftCode = `\
import UIKit

public enum ${name}Images {
${groupsSwiftCodes}
${assetsSwiftCodes}
}
`
	saveToFile(outputResourcePath('', `${name}Images.generated.swift`), swiftCode, 'swift file')
}

function extractFromSourceJSON() {
	fs.readFile(inputSourceJSONPath, 'utf8', (err, data) => {
		const sourceJSON = JSON.parse(data)

		sourceJSON.forEach(extractAssetFromSource)
	})
}

extractFromSourceJSON()
