export function localizedString(key, value) {
	return `"${key}" = "${value}";`
}

export function localizedStringItem(item) {
	return `<item>${item}</item>`
}

export function localizedComment(comment) {
	return !!comment ? `/* ${comment} */` : ''
}

export function stringsFileName(lang) {
	return `${lang}.lproj/Localizable.strings`
}
