import path from 'path'

import {
	localizedStringItem,
	localizedString,
	localizedComment,
	stringsFileName
} from './StringsTemplates'
import {
	singleStringFunc,
	attributedStringFunc,
	arrayStringFunc,
	swiftComment,
	fileName,
	importFoundation,
	importZSWTaggedStringSwift,
	enumSyntax
} from './SwiftTemplates'
import { saveToFile } from './utils'

class LocalizedString {
	constructor(source) {
		const { key, comment, type = 'single', variables, values } = source

		Object.assign(this, {
			key,
			comment,
			type,
			variables,
			values,
		})
	}

	localizable(lang) {
		const { key, comment, type, values } = this
		const _value = values[lang]
		if (!_value) {
			return ''
		}
		let value = ''
		if (type === 'single' || type === 'attributed') {
			value = _value.escapeQuotes()
		} else if (type === 'array' && typeof _value === 'object') {
			value = _value.map(el => el.escapeQuotes()).map(localizedStringItem).join()
		}
		return `${localizedComment(comment)}\n${localizedString(key, value)}\n\n`
	}

	get swiftCode() {
		const { key: _key, type, comment: _comment = '', variables } = this
		const name = _key.camelCase()
		const key = _key.escapeQuotes()
		const comment = _comment.escapeQuotes()
		let args = ''
		let vars = ''
		if (!!variables && variables.length > 0) {
			args = variables.map(({ name, type }) => `${name}: ${type}`).join(',')
			vars = variables.map(({ name }) => `,\n${name}`).join('')
		}
		let result = ''
		if (type === 'single') {
			result = singleStringFunc(name, args, key, comment, vars)
		} else if (type === 'attributed') {
			result = attributedStringFunc(name, args, key, comment, vars)
		} else if (type === 'array') {
			result = arrayStringFunc(name, key, comment)
		} else {
			return ''
		}
		return `${swiftComment(comment)}\n${result}`
	}
}

export default class StringGenerator {
	constructor(_strings, outputPath) {
		const strings = _strings.map(el => new LocalizedString(el))
		const langs = [...new Set(
			_strings.map(({ values }) => Object.keys(values)).flat()
		)]

		Object.assign(this, {
			langs,
			strings,
			outputPath,
		})
	}

	swiftCode(name) {
		const codes = this.strings.map(el => el.swiftCode).join('\n')
		const code = enumSyntax(name, codes)
		return `${importFoundation()}\n${importZSWTaggedStringSwift()}\n\n${code}`
	}

	generate() {
		const { langs, strings, outputPath } = this

		// generate .strings files
		langs.forEach(lang => {
			const localizedStrings = strings.map(el => el.localizable(lang)).join('')
			saveToFile(path.join(outputPath, stringsFileName(lang)), localizedStrings)
		})

		// generate swift code
		const name = 'LocalizedStrings'
		saveToFile(
			path.join(outputPath, fileName(name)),
			this.swiftCode(name)
		)
	}
}
