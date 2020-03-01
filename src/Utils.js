import fs from 'fs-extra'

export function readFromFile(path) {
	return new Promise((res, rej) => {
		fs.readFile(path, 'utf8', (err, data) => {
			if (err) {
				rej(err)
			}
			res(data)
		})
	})
}

export function readJSONFile(path) {
	return readFromFile(path)
		.then(data => JSON.parse(data))
}

export function saveToFile(path, content, msg) {
	return new Promise((res, rej) => {
		fs.outputFile(path, content, err => {
			// throws an error, you could also catch it here
			if (err) {
				rej(err)
			}
			// success case, the file was saved
			msg && console.log(`${msg} saved!`)
			res()
		})
	})
}

export function saveJSONFile(path, content, msg) {
	saveToFile(
		path,
		typeof content === 'string' ? content : JSON.stringify(content, null, 2),
		msg
	)
}

export function removeFiles(path) {
	fs.emptyDirSync(path)
}

export function copyFiles(fromPath, toPath) {
	fs.copySync(fromPath, toPath)
}

export function clearEmpties(o) {
	for (var k in o) {
		if (!o[k] || typeof o[k] !== 'object') {
			continue // If null or not an object, skip to the next iteration
		}

		// The property is an object
		clearEmpties(o[k]) // <-- Make a recursive call on the nested object
		if (Object.keys(o[k]).length === 0) {
			delete o[k] // The object had no properties, so delete that property
		}
	}
	return o
}

export function escapeQuotes(string) {
	return string.replace(/[\""]/g, '\\"') // escape "
}
