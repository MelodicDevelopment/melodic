export type FileUploadStatus = 'idle' | 'uploading' | 'complete' | 'error';

export type FileIconColor = 'red' | 'green' | 'blue' | 'purple' | 'amber' | 'gray';

export interface FileValidationError {
	type: 'accept' | 'max-size' | 'max-files';
	file?: File;
	message: string;
}

const extensionColorMap: Record<string, FileIconColor> = {
	pdf: 'red',
	doc: 'blue',
	docx: 'blue',
	xls: 'green',
	xlsx: 'green',
	csv: 'green',
	ppt: 'amber',
	pptx: 'amber',
	jpg: 'green',
	jpeg: 'green',
	png: 'green',
	gif: 'green',
	svg: 'green',
	webp: 'green',
	mp4: 'blue',
	mov: 'blue',
	avi: 'blue',
	webm: 'blue',
	mp3: 'purple',
	wav: 'purple',
	flac: 'purple',
	ogg: 'purple',
	zip: 'amber',
	rar: 'amber',
	'7z': 'amber',
	tar: 'amber',
	gz: 'amber',
	js: 'amber',
	ts: 'blue',
	html: 'red',
	css: 'blue',
	json: 'amber',
	xml: 'red',
	txt: 'gray',
	md: 'gray'
};

export function getColorForExtension(ext: string): FileIconColor {
	return extensionColorMap[ext.toLowerCase()] ?? 'gray';
}
