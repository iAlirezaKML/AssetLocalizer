import fs from 'fs-extra'
import path from 'path'

const inputSourceJSONPath = path.join(__dirname, '..', 'input', 'source.json')
const outputDirPath = path.join(__dirname, '..', 'output')
const outputContentsJSONPath = (subpath) => path.join(outputDirPath, subpath, 'Contents.json')

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

		if (type === 'single') {
			images.push({
				"idiom": "universal",
				filename,
				...attributes
			})
			properties["preserves-vector-representation"] = vector
		} else if (type === 'set') {
			const [basename, ext] = filename.split('.', 2)
			const filenames = ['', '_@2x', '_@3x'].map((el, idx) => ({
				filename: `${basename}${el}.${ext}`,
				scale: `${idx + 1}x`
			}))
			filenames.forEach(el => {
				images.push({
					"idiom": "universal",
					...el
				})
			})
			console.log(filenames);

		}

		const contentJSON = {
			images,
			"info": {
				"version": 1,
				"author": "xcode"
			},
			properties
		}

		const assetsName = `${parentName}/${name}.imageset`
		saveContentJSON(assetsName, clearEmpties(contentJSON), 'asset json')
	}
}

function groupExtractor(parentName) {
	return (group) => {
		const { namespace = true, name, assets = [] } = group
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
		assets.forEach(assetExtractor(assetsName))
	}
}

function extractAssetFromSource(source) {
	const { name, groups = [], assets = [] } = source
	const assetsName = `${name}.xcassets`
	const contentJSON = {
		"info": {
			"version": 1,
			"author": "xcode"
		}
	}
	fs.emptyDirSync(outputDirPath)
	saveContentJSON(assetsName, contentJSON, 'assets json')
	groups.forEach(groupExtractor(assetsName))
	assets.forEach(assetExtractor(assetsName))
}

function extractFromSourceJSON() {
	fs.readFile(inputSourceJSONPath, 'utf8', (err, data) => {
		const sourceJSON = JSON.parse(data)

		sourceJSON.forEach(extractAssetFromSource)
	})
}

extractFromSourceJSON()
