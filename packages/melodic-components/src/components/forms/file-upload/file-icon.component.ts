import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import type { FileIconColor } from './file-upload.types.js';
import { getColorForExtension } from './file-upload.types.js';
import { fileIconTemplate } from './file-icon.template.js';
import { fileIconStyles } from './file-icon.styles.js';

@MelodicComponent({
	selector: 'ml-file-icon',
	template: fileIconTemplate,
	styles: fileIconStyles,
	attributes: ['extension', 'color', 'size']
})
export class FileIconComponent implements IElementRef {
	elementRef!: HTMLElement;

	extension = '';
	color: FileIconColor | '' = '';
	size: Size = 'md';

	get resolvedColor(): FileIconColor {
		if (this.color) return this.color;
		return this.extension ? getColorForExtension(this.extension) : 'gray';
	}

	get displayExtension(): string {
		return this.extension.toUpperCase();
	}
}
