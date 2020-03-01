export function assetContentsJSON(images, properties) {
	return {
		images,
		"info": {
			"version": 1,
			"author": "xcode"
		},
		properties
	}
}

export function assetsGroupContentsJSON(namespace) {
	return {
		"info": {
			"version": 1,
			"author": "xcode"
		},
		"properties": {
			"provides-namespace": namespace
		}
	}
}

export function assetsRootContentsJSON() {
	return {
		"info": {
			"version": 1,
			"author": "xcode"
		}
	}
}

export function assetsFileName(name) {
	return `${name}Images.xcassets`
}

export function contentsJSONFileName() {
	return `Contents.json`
}
