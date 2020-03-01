import path from 'path'

import {
	assetContentsJSON,
	assetsGroupContentsJSON,
	assetsFileName,
	assetsRootContentsJSON,
	contentsJSONFileName
} from './JSONTemplates'
import {
	uiImageFunc,
	enumSyntax,
	importUIKit,
	fileName
} from './SwiftTemplates'
import {
	saveToFile,
	saveJSONFile,
	copyFiles
} from './Utils'

class ImageAsset {
	constructor(asset) {
		const {
			type = 'single',
			vector = true,
			name,
			filename,
			attributes = {}
		} = asset
		const images = []
		const properties = {}
		const resources = []

		if (type === 'single') {
			images.push({
				"idiom": "universal",
				filename,
				...attributes
			})
			properties["preserves-vector-representation"] = vector
			resources.push(filename)
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
				resources.push(el.filename)
			})
		}

		Object.assign(this, {
			name,
			resources,
			contents: assetContentsJSON(images, properties)
		})
	}

	swiftCode(namespace) {
		const { name } = this
		const prefix = !!namespace ? `${namespace}/` : ''
		const imageName = `${prefix}${name}`
		return uiImageFunc(name.camelCase(), imageName)
	}
}

class ImageAssetGroup {
	constructor(group) {
		const { namespace = true, name: _name, assets: _assets = [] } = group
		const name = _name.capitalize()
		const assets = _assets.map(el => new ImageAsset(el))

		Object.assign(this, {
			name,
			assets,
			contents: assetsGroupContentsJSON(namespace)
		})
	}

	get swiftCode() {
		const { name, assets } = this
		const codes = assets.map(el => el.swiftCode(name))
		return enumSyntax(name, codes)
	}
}

class ImageAssets {
	constructor(source) {
		const { name: _name, groups: _groups = [], assets: _assets = [] } = source
		const name = _name.capitalize()
		const groups = _groups.map(el => new ImageAssetGroup(el))
		const assets = _assets.map(el => new ImageAsset(el))

		Object.assign(this, {
			name,
			groups,
			assets,
			contents: assetsRootContentsJSON()
		})
	}

	get swiftCode() {
		const { name, groups, assets } = this
		const groupsSwiftCodes = groups.map(el => el.swiftCode).join('\n')
		const assetsSwiftCodes = assets.map(el => el.swiftCode(name)).join('\n')
		const codes = `${groupsSwiftCodes}\n${assetsSwiftCodes}`
		return `${importUIKit()}\n\n${enumSyntax(name, codes)}`
	}
}

export default class ImageGenerator {
	constructor(_imageAssets, inputPath, outputPath) {
		const imageAssets = _imageAssets.map(el => new ImageAssets(el))

		Object.assign(this, {
			imageAssets,
			inputPath,
			outputPath,
		})
	}

	saveContentJSON(subpath, content, msg) {
		const { outputPath } = this

		saveJSONFile(
			path.join(outputPath, subpath, contentsJSONFileName()),
			content,
			msg
		)
	}

	copyResource(resourcePath, name) {
		const { inputPath, outputPath } = this
		copyFiles(
			path.join(inputPath, 'resources', name),
			path.join(outputPath, resourcePath, name)
		)
	}

	generateAsset(asset, parentPath) {
		const { name, resources, contents } = asset
		const assetPath = path.join(parentPath, `${name}.imageset`)
		// generate image asset json file
		this.saveContentJSON(assetPath, contents)
		// copy image asset image files
		resources.forEach(filename => this.copyResource(assetPath, filename))
	}

	generate() {
		const { imageAssets, outputPath } = this

		imageAssets.forEach((el) => {
			const { name, groups, assets, contents } = el
			const rootPath = assetsFileName(name)
			// generate .xcassets json files and copy images
			// generate assets json file
			this.saveContentJSON(rootPath, contents)
			groups.forEach((group) => {
				const { name, assets, contents } = group
				const groupPath = path.join(rootPath, name)
				// generate group json file
				this.saveContentJSON(groupPath, contents)
				assets.forEach(el => this.generateAsset(el, groupPath))
			})
			assets.forEach(el => this.generateAsset(el, rootPath))

			// generate swift code
			saveToFile(
				path.join(outputPath, fileName(name)),
				el.swiftCode
			)
		})
	}
}
