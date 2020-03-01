export function importUIKit() {
	return `import UIKit`
}

export function importFoundation() {
	return `import Foundation`
}

export function importZSWTaggedStringSwift() {
	return `import ZSWTaggedStringSwift`
}

export function enumSyntax(name, content) {
	return `\
public enum ${name} {
	${content}
}`
}

export function uiImageFunc(name, imageName) {
	return `\
public static func ${name}() -> UIImage? {
	return UIImage(named: "${imageName}")
}`
}

export function singleStringFunc(name, args, key, comment, vars) {
	return `\
public static func ${name}(${args}) -> String {
	return String(
		format: NSLocalizedString(
			"${key}",
			comment: "${comment}"
		)${vars}
	)
}`
}

export function attributedStringFunc(name, args, key, comment, vars) {
	return `\
public static func ${name}(${args}) -> NSAttributedString? {
	return try? ZSWTaggedString(
		format: NSLocalizedString(
			"${key}",
			comment: "${comment}"
		)${vars}
	).attributedString()
}`
}

export function arrayStringFunc(name, key, comment) {
	return `\
public static func ${name}() -> [String] {
	return parseItems(
		NSLocalizedString(
			"${key}",
			comment: "${comment}"
		)
	)
}`
}

export function fileName(name) {
	return `${name}.generated.swift`
}

export function swiftComment(comment) {
	return !!comment ? `/// ${comment}` : ''
}
