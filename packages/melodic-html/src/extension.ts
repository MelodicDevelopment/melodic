import * as vscode from 'vscode';
import * as ts from 'typescript';
import { getLanguageService as getHtmlLanguageService } from 'vscode-html-languageservice';
import { getCSSLanguageService } from 'vscode-css-languageservice';
import { TextDocument } from 'vscode-languageserver-textdocument';

type TemplateTag = 'html' | 'css';

interface TemplateSegment {
	start: number;
	end: number;
	virtualStart: number;
}

interface TemplateRegion {
	tag: TemplateTag;
	segments: TemplateSegment[];
	virtualText: string;
}

interface TemplateMatch {
	region: TemplateRegion;
	virtualOffset: number;
}

const htmlService = getHtmlLanguageService();
const cssService = getCSSLanguageService();
const supportedLanguages = new Set(['typescript', 'typescriptreact', 'javascript', 'javascriptreact']);
const templatePlaceholder = ' ';

export function activate(context: vscode.ExtensionContext): void {
	const provider = vscode.languages.registerCompletionItemProvider(
		['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
		new MelodicTemplateCompletionProvider(),
		'<', ' ', '@', '.', ':', '/', '=', '"', "'", '\n', '\t'
	);

	context.subscriptions.push(provider);
}

export function deactivate(): void {
	// No-op
}

class MelodicTemplateCompletionProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position
	): vscode.CompletionList | vscode.CompletionItem[] | undefined {
		if (!supportedLanguages.has(document.languageId)) {
			return;
		}

		const match = findTemplateMatch(document.getText(), document.languageId, document.offsetAt(position));
		if (!match) {
			return;
		}

		const { region, virtualOffset } = match;
		const virtualDoc = TextDocument.create(
			'inmemory://melodic-template',
			region.tag === 'css' ? 'css' : 'html',
			1,
			region.virtualText
		);
		const virtualPosition = virtualDoc.positionAt(virtualOffset);

		if (region.tag === 'css') {
			const stylesheet = cssService.parseStylesheet(virtualDoc);
			const list = cssService.doComplete(virtualDoc, virtualPosition, stylesheet);
			return toVscodeCompletionList(document, position, list.items);
		}

		const htmlDocument = htmlService.parseHTMLDocument(virtualDoc);
		const list = htmlService.doComplete(virtualDoc, virtualPosition, htmlDocument);
		const prefix = getAttributePrefix(document, position);
		return toVscodeCompletionList(document, position, list.items, prefix);
	}
}

function findTemplateMatch(text: string, languageId: string, offset: number): TemplateMatch | null {
	const scriptKind = getScriptKind(languageId);
	const sourceFile = ts.createSourceFile('template.ts', text, ts.ScriptTarget.Latest, true, scriptKind);
	let match: TemplateMatch | null = null;

	const visit = (node: ts.Node): void => {
		if (match) {
			return;
		}

		if (ts.isTaggedTemplateExpression(node)) {
			const tag = getTagName(node.tag, sourceFile);
			if (tag === 'html' || tag === 'css') {
				const region = buildTemplateRegion(tag, node.template, sourceFile, text);
				const virtualOffset = region ? getVirtualOffset(region, offset) : null;
				if (region && virtualOffset !== null) {
					match = { region, virtualOffset };
					return;
				}
			}
		}

		ts.forEachChild(node, visit);
	};

	visit(sourceFile);
	return match;
}

function getScriptKind(languageId: string): ts.ScriptKind {
	switch (languageId) {
		case 'javascript':
			return ts.ScriptKind.JS;
		case 'javascriptreact':
			return ts.ScriptKind.JSX;
		case 'typescriptreact':
			return ts.ScriptKind.TSX;
		default:
			return ts.ScriptKind.TS;
	}
}

function getTagName(tag: ts.LeftHandSideExpression, sourceFile: ts.SourceFile): string | null {
	if (ts.isIdentifier(tag)) {
		return tag.getText(sourceFile);
	}

	return null;
}

function buildTemplateRegion(
	tag: TemplateTag,
	template: ts.TemplateLiteral,
	sourceFile: ts.SourceFile,
	sourceText: string
): TemplateRegion | null {
	const segments: TemplateSegment[] = [];
	let virtualText = '';

	const addSegment = (start: number, end: number): void => {
		const safeStart = Math.max(0, start);
		const safeEnd = Math.max(safeStart, end);
		const segmentText = sourceText.slice(safeStart, safeEnd);
		segments.push({ start: safeStart, end: safeEnd, virtualStart: virtualText.length });
		virtualText += segmentText;
	};

	if (ts.isNoSubstitutionTemplateLiteral(template)) {
		const range = getLiteralRange(template, sourceFile, true);
		addSegment(range.start, range.end);
		return { tag, segments, virtualText };
	}

	const headRange = getLiteralRange(template.head, sourceFile, false);
	addSegment(headRange.start, headRange.end);
	virtualText += templatePlaceholder;

	for (let i = 0; i < template.templateSpans.length; i++) {
		const span = template.templateSpans[i];
		const isTail = span.literal.kind === ts.SyntaxKind.TemplateTail;
		const spanRange = getLiteralRange(span.literal, sourceFile, isTail);
		addSegment(spanRange.start, spanRange.end);
		if (!isTail) {
			virtualText += templatePlaceholder;
		}
	}

	return { tag, segments, virtualText };
}

function getLiteralRange(
	literal: ts.TemplateLiteralLikeNode,
	sourceFile: ts.SourceFile,
	isTailOrSolo: boolean
): { start: number; end: number } {
	const start = literal.getStart(sourceFile) + 1;
	const end = literal.getEnd() - (isTailOrSolo ? 1 : 2);
	return { start, end: Math.max(start, end) };
}

function getVirtualOffset(region: TemplateRegion, offset: number): number | null {
	for (const segment of region.segments) {
		if (offset >= segment.start && offset <= segment.end) {
			return segment.virtualStart + (offset - segment.start);
		}
	}

	return null;
}

function getAttributePrefix(document: vscode.TextDocument, position: vscode.Position): string | null {
	const line = document.lineAt(position.line).text;
	const prefixText = line.slice(0, position.character);
	const match = /([@:.])[\w-]*$/.exec(prefixText);
	return match ? match[1] : null;
}

function toVscodeCompletionList(
	document: vscode.TextDocument,
	position: vscode.Position,
	items: Array<{ label: string; kind?: number; detail?: string; documentation?: unknown; insertText?: string }>,
	prefix?: string | null
): vscode.CompletionList {
	const range = getReplaceRange(document, position);
	const completionItems: vscode.CompletionItem[] = [];

	for (const item of items) {
		const mapped = mapCompletionItem(item, prefix);
		if (!mapped) {
			continue;
		}

		const completion = new vscode.CompletionItem(
			mapped.label,
			mapCompletionKind(item.kind)
		);
		completion.insertText = mapped.insertText;
		completion.range = range;
		completion.detail = item.detail;
		completion.documentation = formatDocumentation(item.documentation);
		completionItems.push(completion);
	}

	return new vscode.CompletionList(completionItems, false);
}

function mapCompletionItem(
	item: { label: string; insertText?: string },
	prefix?: string | null
): { label: string; insertText: string } | null {
	const baseLabel = item.label;
	const baseInsert = item.insertText ?? baseLabel;

	if (prefix === '@') {
		if (!baseLabel.startsWith('on')) {
			return null;
		}
		const eventName = baseLabel.slice(2);
		const label = `@${eventName}`;
		return { label, insertText: `@${baseInsert.slice(2)}` };
	}

	if (prefix === '.' || prefix === ':') {
		const label = `${prefix}${baseLabel}`;
		return { label, insertText: `${prefix}${baseInsert}` };
	}

	return { label: baseLabel, insertText: baseInsert };
}

function getReplaceRange(document: vscode.TextDocument, position: vscode.Position): vscode.Range {
	const line = document.lineAt(position.line).text;
	const prefix = line.slice(0, position.character);
	const match = /[@:.]?[A-Za-z0-9_-]*$/.exec(prefix);
	const startCharacter = match ? position.character - match[0].length : position.character;
	return new vscode.Range(position.line, startCharacter, position.line, position.character);
}

function mapCompletionKind(kind?: number): vscode.CompletionItemKind {
	if (!kind) {
		return vscode.CompletionItemKind.Text;
	}

	const mapping: Record<number, vscode.CompletionItemKind> = {
		1: vscode.CompletionItemKind.Text,
		2: vscode.CompletionItemKind.Method,
		3: vscode.CompletionItemKind.Function,
		4: vscode.CompletionItemKind.Constructor,
		5: vscode.CompletionItemKind.Field,
		6: vscode.CompletionItemKind.Variable,
		7: vscode.CompletionItemKind.Class,
		8: vscode.CompletionItemKind.Interface,
		9: vscode.CompletionItemKind.Module,
		10: vscode.CompletionItemKind.Property,
		11: vscode.CompletionItemKind.Unit,
		12: vscode.CompletionItemKind.Value,
		13: vscode.CompletionItemKind.Enum,
		14: vscode.CompletionItemKind.Keyword,
		15: vscode.CompletionItemKind.Snippet,
		16: vscode.CompletionItemKind.Color,
		17: vscode.CompletionItemKind.File,
		18: vscode.CompletionItemKind.Reference,
		19: vscode.CompletionItemKind.Folder,
		20: vscode.CompletionItemKind.EnumMember,
		21: vscode.CompletionItemKind.Constant,
		22: vscode.CompletionItemKind.Struct,
		23: vscode.CompletionItemKind.Event,
		24: vscode.CompletionItemKind.Operator,
		25: vscode.CompletionItemKind.TypeParameter
	};

	return mapping[kind] ?? vscode.CompletionItemKind.Text;
}

function formatDocumentation(documentation: unknown): vscode.MarkdownString | string | undefined {
	if (!documentation) {
		return;
	}

	if (typeof documentation === 'string') {
		return documentation;
	}

	if (typeof documentation === 'object' && documentation && 'value' in documentation) {
		const value = (documentation as { value: string }).value;
		return new vscode.MarkdownString(value);
	}

	return;
}
